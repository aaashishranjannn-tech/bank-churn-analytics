import { useRef, useCallback, useEffect } from 'react';

// Single shared Web Audio Context
let audioCtx = null;
let ambientEngine = null;
let _soundEnabled = false;
const listeners = new Set();

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Creates brown noise buffer for warm atmospheric background texture
 */
function createBrownNoiseBuffer(ctx, duration = 4.0) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5; // Scale to perceptible range
  }
  return buffer;
}

/**
 * Deep Organic Ambient Engine:
 * - Dual detuned warm sines (55Hz & 55.35Hz) creating an organic 0.35Hz binaural pulsation
 * - Resonant brown noise filtered below 200Hz simulating vast architectural airflow
 * - Soft tremolo LFO synced to the visual pulse
 */
function startAmbientEngine() {
  if (ambientEngine) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.024, ctx.currentTime + 3.0);
  masterGain.connect(ctx.destination);

  // Sub oscillator 1: 55Hz (A1)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(55, ctx.currentTime);

  // Sub oscillator 2: 55.35Hz (Binaural beating)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(55.35, ctx.currentTime);

  // Warm fifth harmonic: 82.5Hz (E2) very low
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(82.5, ctx.currentTime);
  const osc3Gain = ctx.createGain();
  osc3Gain.gain.setValueAtTime(0.25, ctx.currentTime);
  osc3.connect(osc3Gain);

  // Brown noise atmospheric bed
  let noiseNode = null;
  let noiseFilter = null;
  try {
    const noiseBuffer = createBrownNoiseBuffer(ctx, 4.0);
    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(160, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start();
  } catch (e) {}

  // LFO breathing tremolo (0.28Hz slow cycle)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.28, ctx.currentTime);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.007, ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);

  osc1.connect(masterGain);
  osc2.connect(masterGain);
  osc3Gain.connect(masterGain);

  osc1.start();
  osc2.start();
  osc3.start();
  lfo.start();

  ambientEngine = {
    masterGain,
    osc1,
    osc2,
    osc3,
    lfo,
    noiseNode,
    noiseFilter,
  };
}

function stopAmbientEngine() {
  if (!ambientEngine) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    ambientEngine.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    setTimeout(() => {
      try {
        ambientEngine.osc1.stop();
        ambientEngine.osc2.stop();
        ambientEngine.osc3.stop();
        ambientEngine.lfo.stop();
        if (ambientEngine.noiseNode) ambientEngine.noiseNode.stop();
      } catch (e) {}
      ambientEngine = null;
    }, 1300);
  } catch (e) {
    ambientEngine = null;
  }
}

/**
 * Procedural Haptic Micro-Click:
 * High-precision tactile mechanical/glass switch sound with bandpass filter.
 * Feels like touching a high-end audio console dial or tactile haptic trackpad.
 */
function playTactileClick(volume = 0.02) {
  if (!_soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(4.0, t);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.025);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.025);
  } catch (e) {}
}

/**
 * Micro-Hover Tick:
 * Ultra-subtle optical sensor feedback when sweeping across interactive elements.
 */
function playHoverTick(volume = 0.009) {
  if (!_soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.setValueAtTime(6.0, t);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.015);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.015);
  } catch (e) {}
}

/**
 * Harmonic Ethereal Bloom:
 * Rich cinematic multi-oscillator chord (A minor ninth: A3, C4, E4, B4)
 * with soft exponential attack and warm low-pass decay for section navigation.
 */
function playHarmonicTransition() {
  if (!_soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    // A minor 9 chord frequencies
    const chord = [220.0, 261.63, 329.63, 493.88];
    const duration = 0.85;

    const masterSwell = ctx.createGain();
    masterSwell.gain.setValueAtTime(0.0001, t);
    masterSwell.gain.linearRampToValueAtTime(0.028, t + 0.12);
    masterSwell.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(350, t + duration);

    masterSwell.connect(filter);
    filter.connect(ctx.destination);

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // Subtle pitch drift
      osc.frequency.linearRampToValueAtTime(freq * (1.002 + idx * 0.001), t + duration);
      osc.connect(masterSwell);
      osc.start(t);
      osc.stop(t + duration);
    });
  } catch (e) {}
}

/**
 * Crystal Node Inspection:
 * Harmonic resonance when selecting 3D clusters, country data towers, or running ML inference.
 * Resembles a clean acoustic glass harmonic ping.
 */
function playCrystalNode(pitch = 'mid') {
  if (!_soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const baseFreq = pitch === 'high' ? 880 : pitch === 'low' ? 330 : 587.33; // D5 / E4 / A5
    const duration = 0.45;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.026, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 1.5, t);
    filter.Q.setValueAtTime(3.5, t);

    // Fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, t);

    // Natural crystalline harmonic overtone (2.76x)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.76, t);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, t);
    osc2.connect(osc2Gain);

    osc1.connect(gain);
    osc2Gain.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  } catch (e) {}
}

/**
 * Deep Gravitational Pulse Wave:
 * Fired during 3D kinetic shockwave expansion.
 */
function playPulseWave() {
  if (!_soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.Q.setValueAtTime(2.0, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.65);
  } catch (e) {}
}

function setSoundEnabled(val) {
  _soundEnabled = val;
  listeners.forEach(fn => fn(val));
}

export function useSound() {
  const soundEnabledRef = useRef(_soundEnabled);

  useEffect(() => {
    const handler = (val) => { soundEnabledRef.current = val; };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !_soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    if (next) {
      startAmbientEngine();
      playHarmonicTransition();
    } else {
      stopAmbientEngine();
    }
  }, []);

  const playClick = useCallback(() => {
    playTactileClick();
  }, []);

  const playHover = useCallback(() => {
    playHoverTick();
  }, []);

  const playTransition = useCallback(() => {
    playHarmonicTransition();
  }, []);

  const playSelect = useCallback((pitch = 'mid') => {
    playCrystalNode(pitch);
  }, []);

  const playPulse = useCallback(() => {
    playPulseWave();
  }, []);

  const getSoundEnabled = useCallback(() => _soundEnabled, []);

  return {
    getSoundEnabled,
    toggleSound,
    playClick,
    playHover,
    playTransition,
    playSelect,
    playPulse,
  };
}
