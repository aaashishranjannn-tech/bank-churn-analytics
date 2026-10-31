import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'done'

  useEffect(() => {
    // Simulate loading progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setPhase('done');
        setTimeout(() => {
          onComplete && onComplete();
        }, 800);
      }
      setProgress(Math.min(p, 100));
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        opacity: phase === 'done' ? 0 : 1,
        transition: 'opacity 0.8s ease',
        pointerEvents: phase === 'done' ? 'none' : 'all',
      }}
    >
      {/* Monogram */}
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '4rem',
          fontWeight: 700,
          color: '#39ff14',
          letterSpacing: '0.1em',
          marginBottom: '3rem',
          textShadow: '0 0 30px rgba(57,255,20,0.5)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      >
        IP
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.6rem',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: '#8a8a8a',
          marginBottom: '2rem',
        }}
      >
        INITIALIZING NEURAL NETWORK
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '240px',
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: '#39ff14',
            boxShadow: '0 0 8px #39ff14',
            transition: 'width 0.15s ease',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.65rem',
          color: '#39ff14',
          marginTop: '0.75rem',
          letterSpacing: '0.15em',
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
}
