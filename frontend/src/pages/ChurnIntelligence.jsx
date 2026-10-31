import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INSIGHTS = [
  {
    id: 'germany',
    stat: '2×',
    title: 'Germany is 2× more likely to churn than France',
    body: 'At 32.44% churn rate, Germany represents the most volatile market. France maintains a healthy 16.15%. Focused retention programs for German customers could drastically reduce overall churn.',
    color: '#d4a843',
  },
  {
    id: 'age',
    stat: '51%',
    title: 'Age 46–60 is the churn epicenter',
    body: 'More than half of customers in the 46–60 age group exit — this single segment drives the majority of customer losses. Tailored financial products for this demographic are urgently needed.',
    color: '#ff6633',
  },
  {
    id: 'products',
    stat: '83%',
    title: '3+ products = 83% churn — the over-bundling paradox',
    body: 'Customers with 2 products churn at only 7.6%. But force-bundling 3 or more products backfires catastrophically. Over-selling creates friction, not loyalty.',
    color: '#ff4444',
  },
  {
    id: 'activity',
    stat: '1.9×',
    title: 'Inactive members churn 1.9× more than active members',
    body: 'Active members: 14.3% churn. Inactive members: 26.9% churn. Re-engagement campaigns targeting inactive accounts offer the highest ROI for retention spend.',
    color: '#d4a843',
  },
  {
    id: 'capital',
    stat: '$76K',
    title: 'Capital flight: churned customers take $76K average balance',
    body: `Each churned customer represents an average \$76,485.89 in assets leaving the bank. With 2,037 churned customers, that's approximately \$155.8M in potential capital outflow.`,
    color: '#39ff14',
  },
];

function AnimatedNumber({ target, suffix = '', prefix = '', color = '#39ff14' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // Parse the number from target string
    const numStr = target.replace(/[^0-9.×$K%]/g, '');
    const num = parseFloat(numStr) || 0;

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 80%',
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: num,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            if (ref.current) {
              ref.current.textContent = prefix + (num >= 100 ? Math.round(obj.val) : obj.val.toFixed(1)) + suffix;
            }
          },
        });
      },
    });
    return () => trigger.kill();
  }, [target, prefix, suffix]);

  return (
    <span ref={ref} style={{ color }}>
      {prefix}0{suffix}
    </span>
  );
}

export default function ChurnIntelligence() {
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const insightRefs = useRef([]);

  // Left: Retained orbit (green)
  useEffect(() => {
    const container = leftCanvasRef.current;
    if (!container) return;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const N = 400;
    const positions = new Float32Array(N * 3);
    const phases = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const r = 1.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * 0.8;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(theta) * 0.3 + tilt;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      phases[i] = theta;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));

    const mat = new THREE.PointsMaterial({ color: 0x39ff14, size: 0.06, transparent: true, opacity: 0.8, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let animId;
    let t = 0;
    const posArr = geo.attributes.position.array;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.004;
      for (let i = 0; i < N; i++) {
        const r = 1.5 + (i % 10) * 0.2;
        const theta = phases[i] + t * (0.3 + (i % 5) * 0.04);
        posArr[i * 3] = r * Math.cos(theta);
        posArr[i * 3 + 1] = r * Math.sin(theta) * 0.3 + Math.sin(t + i) * 0.1;
        posArr[i * 3 + 2] = Math.sin(t * 0.5 + i) * 0.3;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.z += 0.001;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // Right: Churned orbit (amber/red)
  useEffect(() => {
    const container = rightCanvasRef.current;
    if (!container) return;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const N = 200;
    const positions = new Float32Array(N * 3);
    const phases = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const r = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(theta) * 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      phases[i] = theta;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));

    const mat = new THREE.PointsMaterial({ color: 0xd4a843, size: 0.08, transparent: true, opacity: 0.9, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let animId;
    let t = 0;
    const posArr = geo.attributes.position.array;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.009;
      for (let i = 0; i < N; i++) {
        const r = 1.2 + (i % 8) * 0.18;
        const theta = phases[i] + t * (0.6 + (i % 4) * 0.05);
        posArr[i * 3] = r * Math.cos(theta);
        posArr[i * 3 + 1] = r * Math.sin(theta) * 0.3 + Math.sin(t * 1.5 + i) * 0.15;
        posArr[i * 3 + 2] = Math.cos(t * 0.7 + i) * 0.25;
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.z += 0.003;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // Scroll-triggered insight panels
  useEffect(() => {
    const triggers = [];
    insightRefs.current.forEach((el) => {
      if (!el) return;
      const t = ScrollTrigger.create({
        trigger: el,
        start: 'top 78%',
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }),
      });
      triggers.push(t);
    });
    return () => triggers.forEach(t => t.kill());
  }, []);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Hero split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          height: '100vh',
          position: 'relative',
        }}
      >
        {/* Retained side */}
        <div style={{ position: 'relative', borderRight: '1px solid rgba(57,255,20,0.1)' }}>
          <div ref={leftCanvasRef} style={{ position: 'absolute', inset: 0 }} />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '7rem 2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'flex-end',
              paddingBottom: '3rem',
              background: 'linear-gradient(to top, rgba(10,10,10,0.9) 30%, transparent)',
            }}
          >
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.75rem' }}>
              RETAINED
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 700, color: '#39ff14', lineHeight: 1 }}>
              7,963
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8a8a8a', marginTop: '0.5rem' }}>
              79.63% of customers stay
            </div>
          </div>
        </div>

        {/* Churned side */}
        <div style={{ position: 'relative' }}>
          <div ref={rightCanvasRef} style={{ position: 'absolute', inset: 0 }} />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '7rem 2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'flex-end',
              paddingBottom: '3rem',
              background: 'linear-gradient(to top, rgba(10,10,10,0.9) 30%, transparent)',
            }}
          >
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#d4a843', marginBottom: '0.75rem' }}>
              CHURNED
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 700, color: '#d4a843', lineHeight: 1 }}>
              2,037
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8a8a8a', marginTop: '0.5rem' }}>
              20.37% customer loss
            </div>
          </div>
        </div>

        {/* Center overlay */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
            05 / CHURN INTELLIGENCE
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Churn Intelligence
          </h1>
        </div>
      </div>

      {/* Insight panels */}
      <div style={{ padding: '4rem clamp(1.5rem, 8vw, 5rem)' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '3rem' }}>
          KEY INSIGHTS
        </div>

        {INSIGHTS.map((insight, i) => (
          <div
            key={insight.id}
            ref={(el) => { insightRefs.current[i] = el; }}
            style={{
              opacity: 0,
              transform: 'translateY(25px)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '3rem',
              marginBottom: '4rem',
              paddingBottom: '4rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              alignItems: 'start',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 700,
                color: insight.color,
                lineHeight: 1,
                minWidth: '120px',
                textShadow: `0 0 30px ${insight.color}44`,
              }}
            >
              {insight.stat}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 600, color: '#f5f0e8', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                {insight.title}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#8a8a8a', lineHeight: 1.75, maxWidth: '560px' }}>
                {insight.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
