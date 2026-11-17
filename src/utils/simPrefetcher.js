/**
 * simPrefetcher.js
 * While the user is on the landing page, prefetch simulator chunks and
 * decode textures with createImageBitmap in idle time (no GPU work on landing).
 */

const SIM_TEXTURES = [
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

export function startLandingIdlePrefetch() {
  if (typeof window === 'undefined') return;
  if (window.__terraforgePrefetchStarted) return;
  window.__terraforgePrefetchStarted = true;

  if (!window.__terraforgeDecodedBitmaps) {
    window.__terraforgeDecodedBitmaps = new Map();
  }

  // 1. Prefetch heavy dynamic imports (EarthMapLibreViewer is only loaded if user opens surface mode)
  const prefetchChunks = () => {
    // Dynamic import of SolarSystemEngine components
    import('../components/cinematic/SolarSystemEngine').catch(() => {});
  };

  // 2. Decode textures in CPU memory using createImageBitmap (no WebGL GPU upload yet)
  let texIdx = 0;
  const decodeNextTexture = (deadline) => {
    while ((deadline.timeRemaining() > 1.5 || deadline.didTimeout) && texIdx < SIM_TEXTURES.length) {
      const url = SIM_TEXTURES[texIdx];
      texIdx++;

      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          if ('createImageBitmap' in window) {
            return createImageBitmap(blob);
          }
          return null;
        })
        .then((bitmap) => {
          if (bitmap) {
            window.__terraforgeDecodedBitmaps.set(url, bitmap);
          }
          const progress = texIdx / SIM_TEXTURES.length;
          window.__terraforgeWarmupProgress = Math.max(
            window.__terraforgeWarmupProgress || 0,
            0.1 + progress * 0.85
          );
        })
        .catch(() => {});
    }

    if (texIdx < SIM_TEXTURES.length) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(decodeNextTexture, { timeout: 1500 });
      } else {
        setTimeout(() => decodeNextTexture({ timeRemaining: () => 4, didTimeout: false }), 30);
      }
    } else {
      window.__terraforgeWarmupProgress = 1.0;
    }
  };

  // Start after hero reveal (500ms delay)
  setTimeout(() => {
    prefetchChunks();
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(decodeNextTexture, { timeout: 2000 });
    } else {
      setTimeout(() => decodeNextTexture({ timeRemaining: () => 4, didTimeout: false }), 100);
    }
  }, 500);
}
