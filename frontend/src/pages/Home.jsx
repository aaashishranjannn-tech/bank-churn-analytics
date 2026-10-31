import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useSound } from '../hooks/useSound';

const STATS = [
  { value: '10,000', label: 'CUSTOMERS ANALYZED' },
  { value: '20.37%', label: 'PORTFOLIO CHURN RATE' },
  { value: '3', label: 'CORE MARKETS (FR/DE/ES)' },
  { value: '86.47%', label: 'ML PREDICTIVE ACCURACY' },
];

function createLuminousTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(57, 255, 20, 0.9)');
  gradient.addColorStop(0.45, 'rgba(57, 255, 20, 0.25)');
  gradient.addColorStop(0.8, 'rgba(57, 255, 20, 0.04)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function createAmberLuminousTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(212, 168, 67, 0.9)');
  gradient.addColorStop(0.5, 'rgba(212, 168, 67, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export default function Home() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { playTransition, playSelect, playClick, playHover, playPulse } = useSound();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, clickRipple: 0 });
  const [pulseCount, setPulseCount] = useState(1042);

  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 2400);
    return () => clearInterval(pulseTimer);
  }, []);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.025);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.set(0, 0, 24); // Start zoomed out for dramatic glide-in

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a, 0);
    container.appendChild(renderer.domElement);

    const particleTexture = createLuminousTexture();
    const amberTexture = createAmberLuminousTexture();

    // --- 1. CORE SINGULARITY (PULSE ENGINE) ---
    const CORE_N = 600;
    const corePositions = new Float32Array(CORE_N * 3);
    const coreOriginalPositions = new Float32Array(CORE_N * 3);
    const corePhases = new Float32Array(CORE_N);

    for (let i = 0; i < CORE_N; i++) {
      const radius = 0.8 + Math.pow(Math.random(), 2) * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      corePositions[i * 3] = x;
      corePositions[i * 3 + 1] = y;
      corePositions[i * 3 + 2] = z;
      coreOriginalPositions[i * 3] = x;
      coreOriginalPositions[i * 3 + 1] = y;
      coreOriginalPositions[i * 3 + 2] = z;
      corePhases[i] = Math.random() * Math.PI * 2;
    }

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));

    const coreMat = new THREE.PointsMaterial({
      size: 0.18,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.95,
    });
    const corePoints = new THREE.Points(coreGeo, coreMat);
    scene.add(corePoints);

    // --- 2. GIMBAL DATA RINGS (ARCHITECTURAL ORBITALS) ---
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // Ring 1: Outer segmented ring
    const ring1Geo = new THREE.RingGeometry(5.2, 5.25, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ringGroup.add(ring1);

    // Ring 2: Tilted amber telemetry ring
    const ring2Geo = new THREE.RingGeometry(3.8, 3.84, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xd4a843,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ringGroup.add(ring2);

    // Ring 3: Inner fast gimbal ring
    const ring3Geo = new THREE.RingGeometry(2.4, 2.43, 36);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 4;
    ringGroup.add(ring3);

    // --- 3. EXPANDING PULSE SHOCKWAVE RINGS ---
    const SHOCKWAVE_COUNT = 3;
    const shockwaveMeshes = [];
    for (let s = 0; s < SHOCKWAVE_COUNT; s++) {
      const swGeo = new THREE.RingGeometry(0.1, 0.15, 64);
      const swMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const sw = new THREE.Mesh(swGeo, swMat);
      sw.userData = { age: s * 1.5, maxAge: 4.5, speed: 2.8 };
      scene.add(sw);
      shockwaveMeshes.push(sw);
    }

    // --- 4. THE 3,500 CUSTOMER SPIRAL CONSTELLATION ---
    const N = 3500;
    const positions = new Float32Array(N * 3);
    const originalPositions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const phases = new Float32Array(N);
    const speeds = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      // Create a double-arm galactic spiral structure mixed with spherical halo
      const isSpiral = Math.random() > 0.3;
      let x, y, z;

      if (isSpiral) {
        const arm = Math.random() > 0.5 ? 0 : Math.PI;
        const dist = 2.5 + Math.pow(Math.random(), 1.4) * 8.5;
        const angle = dist * 0.75 + arm + (Math.random() - 0.5) * 0.8;
        x = Math.cos(angle) * dist;
        y = (Math.random() - 0.5) * (1.2 + dist * 0.25);
        z = Math.sin(angle) * dist;
      } else {
        const r = 3.5 + Math.random() * 8.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color coding: ~20% churn risk (amber/coral), ~80% retained (emerald/acid green)
      const isAtRisk = Math.random() < 0.2037;
      if (isAtRisk) {
        // Muted amber to warning coral
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.65;
        colors[i * 3 + 2] = 0.22;
      } else {
        // Acid green / emerald
        colors[i * 3] = 0.22;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.12;
      }

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 0.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.14,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // --- 5. DYNAMIC NEURAL SYNAPSE CONNECTIONS ---
    const LINE_SEGMENTS = 180;
    const linePositions = new Float32Array(LINE_SEGMENTS * 6);
    const lineColors = new Float32Array(LINE_SEGMENTS * 6);

    // Initialize line positions with closest neighbors
    let lineIdx = 0;
    for (let i = 0; i < N && lineIdx < LINE_SEGMENTS; i += 18) {
      for (let j = i + 1; j < N && lineIdx < LINE_SEGMENTS; j += 12) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.8 && dist < 2.4) {
          linePositions[lineIdx * 6] = positions[i * 3];
          linePositions[lineIdx * 6 + 1] = positions[i * 3 + 1];
          linePositions[lineIdx * 6 + 2] = positions[i * 3 + 2];
          linePositions[lineIdx * 6 + 3] = positions[j * 3];
          linePositions[lineIdx * 6 + 4] = positions[j * 3 + 1];
          linePositions[lineIdx * 6 + 5] = positions[j * 3 + 2];

          // Subdued green & amber luminescence
          lineColors[lineIdx * 6] = 0.22;
          lineColors[lineIdx * 6 + 1] = 1.0;
          lineColors[lineIdx * 6 + 2] = 0.12;
          lineColors[lineIdx * 6 + 3] = 0.22;
          lineColors[lineIdx * 6 + 4] = 1.0;
          lineColors[lineIdx * 6 + 5] = 0.12;

          lineIdx++;
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // --- 6. MOUSE & CLICK INTERACTIONS ---
    function onMouseMove(e) {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    }

    function onPointerDown() {
      mouseRef.current.clickRipple = 1.0;
      playPulse();
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('pointerdown', onPointerDown);

    // --- 7. ANIMATION RENDER LOOP ---
    let animId;
    let clock = new THREE.Clock();
    let introTime = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera intro swoop (from z=24 down to z=12.5)
      if (introTime < 3.0) {
        introTime += delta;
        const tProgress = Math.min(introTime / 3.0, 1.0);
        const ease = 1 - Math.pow(1 - tProgress, 3);
        camera.position.z = 24 - ease * 11.5;
      }

      // Smooth mouse lerping with inertia
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.045;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.045;

      // Camera parallax drift
      camera.position.x = mouseRef.current.x * 2.2 + Math.sin(elapsedTime * 0.25) * 0.3;
      camera.position.y = mouseRef.current.y * 1.6 + Math.cos(elapsedTime * 0.2) * 0.25;
      camera.lookAt(0, 0, 0);

      // Core rotation & rhythmic breathing
      const corePulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.18 + mouseRef.current.clickRipple * 0.4;
      corePoints.scale.set(corePulse, corePulse, corePulse);
      corePoints.rotation.y = elapsedTime * 0.35;
      corePoints.rotation.x = Math.sin(elapsedTime * 0.15) * 0.2;

      // Gimbal orbital rings rotation
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.y = -elapsedTime * 0.25;
      ring3.rotation.x = elapsedTime * 0.35;

      // Expanding Shockwave Pulses
      shockwaveMeshes.forEach(sw => {
        sw.userData.age += delta;
        if (sw.userData.age > sw.userData.maxAge) {
          sw.userData.age = 0;
        }
        const progress = sw.userData.age / sw.userData.maxAge;
        const scale = 0.5 + progress * 16.0;
        sw.scale.set(scale, scale, scale);
        sw.material.opacity = Math.max(0, (1 - progress) * 0.35);
        sw.rotation.x = Math.PI / 2;
      });

      // Decay click ripple
      if (mouseRef.current.clickRipple > 0.01) {
        mouseRef.current.clickRipple *= 0.94;
      }

      // Galactic customer particles animation
      const pos = geo.attributes.position.array;
      const mouseRayX = mouseRef.current.x * 6;
      const mouseRayY = mouseRef.current.y * 4;

      for (let i = 0; i < N; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];
        const phase = phases[i];
        const spd = speeds[i];

        // Harmonic breath wave
        const breath = Math.sin(elapsedTime * spd + phase) * 0.18;

        // Subtle orbital rotation around center
        const angle = 0.0006 * spd;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = ox * cosA - oz * sinA;
        const rz = ox * sinA + oz * cosA;
        originalPositions[i * 3] = rx;
        originalPositions[i * 3 + 2] = rz;

        // Interactive mouse magnetic repulsion/wake
        const dx = rx - mouseRayX;
        const dy = oy - mouseRayY;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        let repelX = 0;
        let repelY = 0;
        if (distToMouse < 2.5) {
          const force = (1 - distToMouse / 2.5) * 0.85;
          repelX = (dx / distToMouse) * force;
          repelY = (dy / distToMouse) * force;
        }

        pos[i * 3] = rx + breath + repelX;
        pos[i * 3 + 1] = oy + breath * 0.8 + repelY;
        pos[i * 3 + 2] = rz + breath * 0.5;
      }
      geo.attributes.position.needsUpdate = true;

      // Update neural line connections position & gentle glow oscillation
      lineMesh.rotation.y = points.rotation.y;
      lineMat.opacity = 0.12 + Math.sin(elapsedTime * 1.8) * 0.06;

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
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
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [playSelect]);

  const handleEnter = () => {
    playTransition();
    navigate('/universe');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      {/* Three.js Canvas Container */}
      <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Atmospheric Radial Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.65) 60%, rgba(10,10,10,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Sci-Fi HUD Corner Elements */}
      <div
        style={{
          position: 'absolute',
          top: '5.5rem',
          left: '2rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.55rem',
          letterSpacing: '0.25em',
          color: '#8a8a8a',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          zIndex: 2,
        }}
        className="hud-telemetry"
      >
        <div>
          <span style={{ color: '#39ff14' }}>SYS_STATUS:</span> OPERATIONAL // NEURAL CORE ACTIVE
        </div>
        <div>
          <span style={{ color: '#39ff14' }}>PULSE_CYCLE:</span> #{pulseCount} // FREQ: 1.042 HZ
        </div>
        <div>
          <span style={{ color: '#d4a843' }}>COHORT_TELEMETRY:</span> 10,000 LIVE ACCOUNTS
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '5.5rem',
          right: '2rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.55rem',
          letterSpacing: '0.25em',
          color: '#8a8a8a',
          textAlign: 'right',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          zIndex: 2,
        }}
        className="hud-telemetry"
      >
        <div>
          <span style={{ color: '#39ff14' }}>GEO_CLUSTER:</span> FRANCE • GERMANY • SPAIN
        </div>
        <div>
          <span style={{ color: '#d4a843' }}>SECURITY_GRID:</span> BALANCED RANDOM FOREST [86.47%]
        </div>
        <div>
          INTERACTION: <span style={{ color: '#39ff14' }}>TACTILE FORCEFIELD ACTIVE</span>
        </div>
      </div>

      {/* Main Content Hero */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          padding: '2rem',
          pointerEvents: 'none',
        }}
      >
        {/* Eyebrow Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1.1rem',
            background: 'rgba(57, 255, 20, 0.04)',
            border: '1px solid rgba(57, 255, 20, 0.25)',
            borderRadius: '100px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#39ff14',
            marginBottom: '1.75rem',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.08)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#39ff14',
              boxShadow: '0 0 8px #39ff14',
              animation: 'pulse-glow 1.8s infinite',
            }}
          />
          BANKING INTELLIGENCE SYSTEM
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(3.2rem, 8.5vw, 8rem)',
            fontWeight: 800,
            color: '#f5f0e8',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            marginBottom: '1.5rem',
            textShadow: '0 0 80px rgba(57,255,20,0.12)',
            userSelect: 'none',
          }}
        >
          THE INVISIBLE
          <br />
          <span
            style={{
              color: '#39ff14',
              textShadow: '0 0 45px rgba(57,255,20,0.45)',
              display: 'inline-block',
              letterSpacing: '-0.02em',
            }}
          >
            PULSE
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
            color: '#a3a3a3',
            maxWidth: '540px',
            lineHeight: 1.7,
            marginBottom: '3rem',
            userSelect: 'none',
          }}
        >
          Explore the hidden gravitational currents behind 10,000 retail banking customers across Europe.
        </p>

        {/* Action Button */}
        <button
          onClick={handleEnter}
          style={{
            pointerEvents: 'auto',
            padding: '1.15rem 3.5rem',
            border: '1px solid #39ff14',
            background: 'rgba(57, 255, 20, 0.05)',
            color: '#39ff14',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.8rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 0 25px rgba(57, 255, 20, 0.12)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#39ff14';
            e.currentTarget.style.color = '#0a0a0a';
            e.currentTarget.style.boxShadow = '0 0 45px rgba(57, 255, 20, 0.5)';
            e.currentTarget.style.transform = 'scale(1.03)';
            playHover();
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(57, 255, 20, 0.05)';
            e.currentTarget.style.color = '#39ff14';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(57, 255, 20, 0.12)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ENTER EXPERIENCE
        </button>

        {/* Stats Strip */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1.5rem, 5vw, 4.5rem)',
            padding: '1.25rem 2rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(to top, rgba(10,10,10,0.8), transparent)',
            userSelect: 'none',
          }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(0.95rem, 2vw, 1.35rem)',
                  fontWeight: 700,
                  color: '#f5f0e8',
                  letterSpacing: '0.02em',
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.55rem',
                  letterSpacing: '0.22em',
                  color: '#8a8a8a',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
