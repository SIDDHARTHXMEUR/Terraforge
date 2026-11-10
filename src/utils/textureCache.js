import { useTexture } from '@react-three/drei';

/**
 * Texture Memory Cache for Instant Simulator Transitions
 * Preloads Three.js textures in idle time via useTexture.preload (zero Suspense stall, zero main thread jank)
 */
export const SIMULATOR_TEXTURE_URLS = [
  '/assets/planets/sun/sun.jpg',
  '/assets/planets/mercury/mercury.jpg',
  '/assets/planets/venus/venus_surface.jpg',
  '/assets/planets/earth/earth_albedo.jpg',
  '/assets/planets/earth/earth_clouds.png',
  '/assets/planets/earth/earth_nightlights.jpg',
  '/assets/planets/mars/mars.jpg',
  '/assets/planets/jupiter/jupiter.jpg',
  '/assets/planets/saturn/saturn.jpg',
  '/assets/planets/saturn/saturn_ring.png',
  '/assets/planets/uranus/uranus.jpg',
  '/assets/planets/neptune/neptune.jpg'
];

export function prefetchSimulatorBitmaps(onProgress) {
  if (typeof window === 'undefined') return;

  let loaded = 0;
  const total = SIMULATOR_TEXTURE_URLS.length;

  SIMULATOR_TEXTURE_URLS.forEach((url, index) => {
    const schedule = 'requestIdleCallback' in window ? window.requestIdleCallback : (fn) => setTimeout(fn, index * 60);

    schedule(() => {
      try {
        if (useTexture && useTexture.preload) {
          useTexture.preload(url);
        }
      } catch (_) {}

      loaded++;
      if (onProgress) onProgress(loaded / total);
      if (typeof window !== 'undefined') {
        window.__terraforgeWarmupProgress = loaded / total;
      }
    });
  });
}

export function getBitmap(url) {
  return bitmapCache.get(url);
}
