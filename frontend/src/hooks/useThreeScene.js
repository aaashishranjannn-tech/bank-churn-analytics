import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function useThreeScene({ containerRef, onSetup, onAnimate, onResize }) {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Call setup callback
    let userCleanup = null;
    if (onSetup) {
      userCleanup = onSetup({ scene, camera, renderer, width, height });
    }
    cleanupRef.current = userCleanup;

    // Animation loop
    let frameId;
    let elapsed = 0;
    let lastTime = performance.now();

    function animate() {
      frameId = requestAnimationFrame(animate);
      animFrameRef.current = frameId;
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      elapsed += delta;

      if (onAnimate) {
        onAnimate({ scene, camera, renderer, elapsed, delta });
      }

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
      if (onResize) {
        onResize({ scene, camera, renderer, width: w, height: h });
      }
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { sceneRef, cameraRef, rendererRef };
}
