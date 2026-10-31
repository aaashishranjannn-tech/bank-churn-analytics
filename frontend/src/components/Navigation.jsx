import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSound } from '../hooks/useSound';
import SoundControl from './SoundControl';

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/universe', label: 'UNIVERSE' },
  { to: '/geography', label: 'GEOGRAPHY' },
  { to: '/behavior', label: 'BEHAVIOR' },
  { to: '/churn', label: 'CHURN' },
  { to: '/ml', label: 'ML' },
  { to: '/explorer', label: 'EXPLORER' },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { playClick, playHover, playTransition } = useSound();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLinkClick = () => {
    playTransition();
    setMenuOpen(false);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(57,255,20,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <NavLink
        to="/"
        onClick={handleLinkClick}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#39ff14',
          letterSpacing: '0.05em',
          textShadow: '0 0 15px rgba(57,255,20,0.4)',
        }}
      >
        IP
      </NavLink>

      {/* Right controls: Desktop Links + SoundControl + Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '1.75rem',
            alignItems: 'center',
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleLinkClick}
              onMouseEnter={playHover}
              style={({ isActive }) => ({
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                fontWeight: 500,
                color: isActive ? '#39ff14' : '#8a8a8a',
                textDecoration: isActive ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                transition: 'color 0.2s ease',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <SoundControl />

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="hamburger"
          aria-label="Menu"
        >
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                display: 'block',
                width: '22px',
                height: '1px',
                background: '#39ff14',
                transition: 'all 0.2s ease',
                transform: menuOpen
                  ? i === 0 ? 'translateY(6px) rotate(45deg)' : i === 2 ? 'translateY(-6px) rotate(-45deg)' : 'scaleX(0)'
                  : 'none',
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            background: 'rgba(10,10,10,0.97)',
            borderBottom: '1px solid rgba(57,255,20,0.12)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            zIndex: 999,
          }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleLinkClick}
              onMouseEnter={playHover}
              style={({ isActive }) => ({
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
                color: isActive ? '#39ff14' : '#f5f0e8',
                fontWeight: 500,
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
