import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GEOGRAPHY } from '../data/analyticsData';

const MAX_CUSTOMERS = 5014; // France is tallest

function getTowerHeight(customers) {
  return (customers / MAX_CUSTOMERS) * 8;
}

function getChurnColor(churnRate) {
  // Green (safe) to amber (warning) to red (danger)
  if (churnRate < 20) return 0x39ff14;
  if (churnRate < 28) return 0xd4a843;
  return 0xff6633;
}

function getChurnColorHex(churnRate) {
  if (churnRate < 20) return '#39ff14';
  if (churnRate < 28) return '#d4a843';
  return '#ff6633';
}

const GRI_LABELS = ['LOW', 'MEDIUM', 'HIGH'];
function getGRILabel(gri) {
  if (gri < 0.4) return 'LOW';
  if (gri < 0.7) return 'MEDIUM';
  return 'HIGH';
}

export default function Geography() {
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [labelPositions, setLabelPositions] = useState([]);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 6, 18);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Grid floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x222222, 0x111111);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Towers
    const towerPositions = [[-5, 0, 0], [0, 0, 0], [5, 0, 0]];
    const towerMeshes = [];
    const clickSpheres = [];

    GEOGRAPHY.forEach((geo, i) => {
      const height = getTowerHeight(geo.customers);
      const col = getChurnColor(geo.churnRate);
      const LAYERS = 12;
      const layerH = height / LAYERS;

      for (let li = 0; li < LAYERS; li++) {
        const alpha = 0.3 + (li / LAYERS) * 0.7;
        const layerGeo = new THREE.BoxGeometry(1.8, layerH * 0.85, 1.8);
        const layerMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.12 + alpha * 0.15,
        });
        const layer = new THREE.Mesh(layerGeo, layerMat);
        layer.position.set(
          towerPositions[i][0],
          layerH * li + layerH / 2,
          towerPositions[i][2]
        );
        scene.add(layer);

        // Edge wireframe
        const wireGeo = new THREE.EdgesGeometry(layerGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.6 });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        wire.position.copy(layer.position);
        scene.add(wire);
      }

      // Top glowing cap
      const capGeo = new THREE.BoxGeometry(1.85, 0.05, 1.85);
      const capMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(towerPositions[i][0], height, towerPositions[i][2]);
      scene.add(cap);

      // Invisible click box
      const clickGeo = new THREE.BoxGeometry(2.2, height, 2.2);
      const clickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.FrontSide });
      const clickBox = new THREE.Mesh(clickGeo, clickMat);
      clickBox.position.set(towerPositions[i][0], height / 2, towerPositions[i][2]);
      clickBox.userData = { geoIndex: i, clickable: true };
      scene.add(clickBox);
      clickSpheres.push(clickBox);
      towerMeshes.push({ height, col, pos: towerPositions[i] });
    });

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(e) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickSpheres);
      if (hits.length > 0) {
        setSelected(GEOGRAPHY[hits[0].object.userData.geoIndex]);
      } else {
        setSelected(null);
      }
    }
    renderer.domElement.addEventListener('click', onClick);

    // Auto-orbit camera
    let camTheta = 0;

    function updateLabels() {
      const labels = GEOGRAPHY.map((geo, i) => {
        const vec = new THREE.Vector3(towerPositions[i][0], towerMeshes[i].height + 0.5, towerPositions[i][2]);
        vec.project(camera);
        const x = ((vec.x + 1) / 2) * container.clientWidth;
        const y = ((-vec.y + 1) / 2) * container.clientHeight;
        return { x, y, geo, i };
      });
      setLabelPositions(labels);
    }

    let animId;
    let t = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.01;

      // Gentle camera orbit
      camTheta += 0.003;
      camera.position.x = Math.sin(camTheta) * 1.5;
      camera.position.z = 16 + Math.cos(camTheta) * 2;
      camera.lookAt(0, 3, 0);

      // Pulse tower top caps
      scene.children.forEach((child, idx) => {
        if (child.isMesh && child.geometry && child.geometry.parameters && child.geometry.parameters.height === 0.05) {
          child.material.opacity = 0.6 + Math.sin(t * 2 + idx) * 0.3;
        }
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
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Radial gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at bottom, transparent 40%, rgba(10,10,10,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Tower labels */}
      {labelPositions.map(({ x, y, geo }) => (
        <div
          key={geo.code}
          onClick={() => setSelected(geo)}
          style={{
            position: 'absolute',
            left: x,
            top: y - 20,
            transform: 'translateX(-50%)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            color: getChurnColorHex(geo.churnRate),
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textShadow: `0 0 12px ${getChurnColorHex(geo.churnRate)}88`,
            pointerEvents: 'auto',
            zIndex: 2,
          }}
        >
          {geo.country}
        </div>
      ))}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, padding: '7rem 2.5rem 0' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
          03 / GEOGRAPHY
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em' }}>
          Geographic Risk Towers
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8a8a8a', marginTop: '0.5rem' }}>
          Tower height = customer count · Color = churn risk
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2.5rem',
          zIndex: 2,
          display: 'flex',
          gap: '1.5rem',
        }}
      >
        {[{ label: 'Low Risk', color: '#39ff14' }, { label: 'Medium Risk', color: '#d4a843' }, { label: 'High Risk', color: '#ff6633' }].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: '#8a8a8a', letterSpacing: '0.1em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Info Panel */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 'min(340px, 90vw)',
            background: 'rgba(10,10,10,0.94)',
            borderLeft: '1px solid rgba(57,255,20,0.12)',
            padding: '7rem 2rem 2rem',
            zIndex: 10,
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#8a8a8a',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '0.7rem',
            }}
          >
            ✕
          </button>

          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.3em', color: getChurnColorHex(selected.churnRate), marginBottom: '0.75rem' }}>
            COUNTRY PROFILE
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#f5f0e8', marginBottom: '2rem' }}>
            {selected.country}
          </h2>

          {[
            { label: 'Total Customers', value: selected.customers.toLocaleString() },
            { label: 'Churned Customers', value: selected.churned.toLocaleString(), accent: true },
            { label: 'Retained Customers', value: selected.retained.toLocaleString() },
            { label: 'Churn Rate', value: `${selected.churnRate}%`, accent: true },
            { label: 'GRI (Geographic Risk Index)', value: `${selected.gri.toFixed(2)} — ${getGRILabel(selected.gri)}` },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: '#8a8a8a', letterSpacing: '0.15em', marginBottom: '0.3rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: accent ? getChurnColorHex(selected.churnRate) : '#f5f0e8' }}>
                {value}
              </div>
            </div>
          ))}

          {/* Churn bar */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: '#8a8a8a', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              CHURN RATE COMPARED TO AVERAGE (20.37%)
            </div>
            <div style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${selected.churnRate}%`, background: getChurnColorHex(selected.churnRate), borderRadius: '2px' }} />
              {/* Average marker */}
              <div style={{ position: 'absolute', top: '-4px', left: '20.37%', width: '1px', height: '12px', background: '#8a8a8a' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: getChurnColorHex(selected.churnRate) }}>{selected.churnRate}%</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: '#8a8a8a' }}>avg 20.37%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
