import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const WARMUP_TEXTURES = [
  '/assets/planets/sun/sun.jpg',
  '/assets/planets/sun/sun_sdo_banana.jpg',
  '/assets/planets/mercury/mercury.jpg',
  '/assets/planets/venus/venus_surface.jpg',
  '/assets/planets/venus/venus_atmosphere.jpg',
  '/assets/planets/earth/earth_albedo.jpg',
  '/assets/planets/earth/earth_nightlights.jpg',
  '/assets/planets/earth/earth_clouds.png',
  '/assets/planets/mars/mars.jpg',
  '/assets/planets/jupiter/jupiter.jpg',
  '/assets/planets/saturn/saturn.jpg',
  '/assets/planets/saturn/saturn_ring.png',
  '/assets/planets/uranus/uranus.jpg',
  '/assets/planets/uranus/uranus_ring.png',
  '/assets/planets/neptune/neptune.jpg'
];

/**
 * WarmUpController: Asynchronously warms up simulator textures and shaders in idle time
 * Uses requestIdleCallback in chunks <= 4ms to ensure 0 frame drops
 */
export function WarmUpController({ simSceneRef, isReadyRef }) {
  const { gl, scene, camera } = useThree();
  const indexRef = useRef(0);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;

    if (typeof window !== 'undefined') {
      window.__terraforgeWarmupProgress = 0.05;
    }

    const loader = new THREE.TextureLoader();
    let currentIdx = 0;
    const totalItems = WARMUP_TEXTURES.length + 2; // textures + shader compile steps

    const runIdleChunk = (deadline) => {
      // Execute in slices of <= 4ms
      while ((deadline.timeRemaining() > 1.0 || deadline.didTimeout) && currentIdx < WARMUP_TEXTURES.length) {
        const url = WARMUP_TEXTURES[currentIdx];
        currentIdx++;

        loader.load(url, (tex) => {
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          try {
            gl.initTexture(tex);
          } catch (_) {}
          const p = currentIdx / totalItems;
          if (typeof window !== 'undefined') {
            window.__terraforgeWarmupProgress = Math.min(0.9, Math.max(window.__terraforgeWarmupProgress || 0, p));
          }
        });
      }

      if (currentIdx < WARMUP_TEXTURES.length) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(runIdleChunk, { timeout: 1000 });
        } else {
          setTimeout(() => runIdleChunk({ timeRemaining: () => 4, didTimeout: false }), 16);
        }
      } else {
        // Compile all shaders asynchronously
        if (gl.compileAsync && simSceneRef?.current) {
          gl.compileAsync(simSceneRef.current, camera).then(() => {
            if (typeof window !== 'undefined') {
              window.__terraforgeWarmupProgress = 1.0;
            }
            if (isReadyRef) isReadyRef.current = true;
          }).catch(() => {
            if (typeof window !== 'undefined') {
              window.__terraforgeWarmupProgress = 1.0;
            }
            if (isReadyRef) isReadyRef.current = true;
          });
        } else {
          if (typeof window !== 'undefined') {
            window.__terraforgeWarmupProgress = 1.0;
          }
          if (isReadyRef) isReadyRef.current = true;
        }
      }
    };

    // Begin warm-up shortly after first frame
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(runIdleChunk, { timeout: 1500 });
      } else {
        setTimeout(() => runIdleChunk({ timeRemaining: () => 4, didTimeout: false }), 50);
      }
    }, 100);

    // Runtime fail-safe: if no frame rendered or calls stay 0 within 3s, disable warm-up and force ready
    const failSafeTimer = setTimeout(() => {
      const calls = gl.info?.render?.calls || 0;
      if (calls === 0 || !isReadyRef?.current) {
        console.warn('[Terraforge Fail-Safe] 3s threshold reached with 0 render calls or pending ready gate; forcing ready state and normal rendering.');
        if (isReadyRef) isReadyRef.current = true;
        if (typeof window !== 'undefined') window.__terraforgeWarmupProgress = 1.0;
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(failSafeTimer);
    };
  }, [gl, scene, camera, simSceneRef, isReadyRef]);

  return null;
}

