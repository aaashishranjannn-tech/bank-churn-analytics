import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useSound } from '../hooks/useSound';

const SEGMENTS = [
  {
    id: 'young',
    label: 'Young Low-Risk',
    desc: 'Under 30, predominantly retained',
    position: [-4, 2, 0],
    color: 0x39ff14,
    colorHex: '#39ff14',
    customers: 1200,
    churnRate: 7,
    avgBalance: '$18,400',
    avgCreditScore: 682,
  },
  {
    id: 'mid',
    label: 'Mid-Range Active',
    desc: '30–45, active members',
    position: [4, 1, -2],
    color: 0xd4a843,
    colorHex: '#d4a843',
    customers: 4500,
    churnRate: 10,
    avgBalance: '$62,100',
    avgCreditScore: 658,
  },
  {
    id: 'senior',
    label: 'Senior At-Risk',
    desc: '46–60, highest churn epicenter',
    position: [-2, -3, 2],
    color: 0xff6644,
    colorHex: '#ff6644',
    customers: 3100,
    churnRate: 51,
    avgBalance: '$98,700',
    avgCreditScore: 625,
  },
  {
    id: 'highvalue',
    label: 'High-Value Churners',
    desc: '3+ products, extreme churn risk',
    position: [3, -2, 3],
    color: 0xffffff,
    colorHex: '#f5f0e8',
    customers: 326,
    churnRate: 88,
    avgBalance: '$107,500',
    avgCreditScore: 601,
  },
];

export default function CustomerUniverse() {
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [labelPositions, setLabelPositions] = useState([]);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const { playSelect, playHover, playClick } = useSound();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const clusterMeshes = [];

    SEGMENTS.forEach((seg, si) => {
      const N = 200;
      const positions = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const r3 = new THREE.Color(seg.color);

      for (let i = 0; i < N; i++) {
        const r = Math.random() * 1.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = seg.position[0] + r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = seg.position[1] + r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = seg.position[2] + r * Math.cos(phi);
        const b = 0.6 + Math.random() * 0.4;
        colors[i * 3] = r3.r * b;
        colors[i * 3 + 1] = r3.g * b;
        colors[i * 3 + 2] = r3.b * b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      points.userData = { segIndex: si };
      scene.add(points);
      clusterMeshes.push(points);

      // Invisible click sphere
      const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.FrontSide });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(...seg.position);
      sphere.userData = { segIndex: si, clickable: true };
      scene.add(sphere);
    });

    // Grid floor
    const gridHelper = new THREE.GridHelper(20, 20, 0x39ff14, 0x1a1a1a);
    gridHelper.position.y = -5;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Raycaster for click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const allClickables = scene.children.filter(c => c.userData && c.userData.clickable);

    function onClick(e) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children.filter(c => c.userData.clickable));
      if (hits.length > 0) {
        setSelected(SEGMENTS[hits[0].object.userData.segIndex]);
        playSelect('high');
      } else {
        setSelected(null);
      }
    }
    renderer.domElement.addEventListener('click', onClick);

    // Drag to rotate
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotY = 0, rotX = 0;

    renderer.domElement.addEventListener('mousedown', e => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-0.8, Math.min(0.8, rotX));
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    let animId;
    let t = 0;

    function updateLabels() {
      const labels = SEGMENTS.map((seg, i) => {
        const vec = new THREE.Vector3(...seg.position);
        vec.project(camera);
        const x = ((vec.x + 1) / 2) * container.clientWidth;
        const y = ((-vec.y + 1) / 2) * container.clientHeight;
        return { x, y, seg, i };
      });
      setLabelPositions(labels);
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.008;

      scene.rotation.y += (rotY - scene.rotation.y) * 0.06;
      scene.rotation.x += (rotX - scene.rotation.x) * 0.06;

      // Pulse clusters
      clusterMeshes.forEach((pts, i) => {
        const scale = 1 + Math.sin(t + i * 1.2) * 0.03;
        pts.scale.setScalar(scale);
        pts.material.opacity = 0.7 + Math.sin(t * 1.5 + i) * 0.2;
      });

      updateLabels();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      {/* Canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Cluster HTML Labels */}
      {labelPositions.map(({ x, y, seg }) => (
        <div
          key={seg.id}
          onClick={() => { setSelected(seg); playSelect('high'); }}
          onMouseEnter={playHover}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            color: seg.colorHex,
            textTransform: 'uppercase',
            pointerEvents: 'auto',
            cursor: 'pointer',
            textShadow: `0 0 10px ${seg.colorHex}88`,
            whiteSpace: 'nowrap',
            marginTop: '-50px',
            userSelect: 'none',
          }}
        >
          {seg.label}
        </div>
      ))}

      {/* Page header */}
      <div style={{ position: 'relative', zIndex: 2, padding: '7rem 2.5rem 0' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
          02 / CUSTOMER UNIVERSE
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em' }}>
          Customer Segments
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8a8a8a', marginTop: '0.5rem', maxWidth: '350px' }}>
          Drag to rotate · Click a cluster to explore segment data
        </p>
      </div>

      {/* Info Panel */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 'min(360px, 90vw)',
            background: 'rgba(10,10,10,0.92)',
            borderLeft: '1px solid rgba(57,255,20,0.15)',
            padding: '7rem 2rem 2rem',
            zIndex: 10,
            backdropFilter: 'blur(12px)',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#8a8a8a',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.3em', color: selected.colorHex, marginBottom: '0.75rem' }}>
            SEGMENT PROFILE
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#f5f0e8', marginBottom: '0.4rem' }}>
            {selected.label}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: '#8a8a8a', marginBottom: '2rem' }}>
            {selected.desc}
          </p>

          {[
            { label: 'Customers', value: selected.customers.toLocaleString() },
            { label: 'Churn Rate', value: `${selected.churnRate}%`, accent: true },
            { label: 'Avg Balance', value: selected.avgBalance },
            { label: 'Avg Credit Score', value: selected.avgCreditScore },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: '#8a8a8a', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                {label}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 700,
                color: accent ? selected.colorHex : '#f5f0e8',
              }}>
                {value}
              </div>
            </div>
          ))}

          {/* Churn bar */}
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: '#8a8a8a', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>
              CHURN RISK LEVEL
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${selected.churnRate}%`,
                  background: selected.colorHex,
                  boxShadow: `0 0 8px ${selected.colorHex}`,
                  borderRadius: '2px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: selected.colorHex, marginTop: '0.4rem' }}>
              {selected.churnRate}% churn rate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
