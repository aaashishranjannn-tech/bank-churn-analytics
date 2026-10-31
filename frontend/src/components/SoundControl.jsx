import React, { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';

export default function SoundControl() {
  const { getSoundEnabled, toggleSound, playHover } = useSound();
  const [enabled, setEnabled] = useState(false);

  // Subscribe to changes
  useEffect(() => {
    setEnabled(getSoundEnabled());
  }, [getSoundEnabled]);

  const handleToggle = () => {
    toggleSound();
    setEnabled(prev => !prev);
  };

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={playHover}
      title={enabled ? 'Disable sound' : 'Enable sound'}
      style={{
        background: 'none',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '2px',
        cursor: 'pointer',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: enabled ? '#39ff14' : '#8a8a8a',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '5px 10px',
        transition: 'all 0.2s ease',
      }}
    >
      <span>SOUND</span>
      <span
        style={{
          display: 'inline-block',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: enabled ? '#39ff14' : 'transparent',
          border: `1px solid ${enabled ? '#39ff14' : '#8a8a8a'}`,
          boxShadow: enabled ? '0 0 6px #39ff14' : 'none',
          transition: 'all 0.2s ease',
        }}
      />
    </button>
  );
}
