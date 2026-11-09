/**
 * Progressive Idle Asset Warmer
 * Chunks texture uploads and shader compilation in requestIdleCallback <= 4ms
 * Fail-safe: 5s timeout forces ready state on any error or delay
 */

const HERO_TEXTURES = [
  '/assets/planets/earth/earth_albedo.jpg',
  '/assets/planets/earth/earth_nightlights.jpg',
  '/assets/planets/earth/earth_clouds.png',
  '/assets/planets/sun/sun.jpg'
];

const SECONDARY_TEXTURES = [
  '/assets/planets/mercury/mercury.jpg',
  '/assets/planets/venus/venus.jpg',
  '/assets/planets/mars/mars.jpg',
  '/assets/planets/jupiter/jupiter.jpg',
  '/assets/planets/saturn/saturn.jpg',
  '/assets/planets/saturn/saturn_ring.png',
  '/assets/planets/uranus/uranus.jpg',
  '/assets/planets/neptune/neptune.jpg',
  '/assets/planets/moon/moon.jpg'
];

export function runProgressiveWarmup(gl, scene, camera, onProgress, onComplete) {
  let isDone = false;
  let loadedCount = HERO_TEXTURES.length;
  const totalCount = HERO_TEXTURES.length + SECONDARY_TEXTURES.length;

  const markComplete = () => {
    if (isDone) return;
    isDone = true;
    if (onProgress) onProgress(100);
    if (onComplete) onComplete();
  };

  // 5s fail-safe timeout
  const timeoutId = setTimeout(() => {
    markComplete();
  }, 5000);

  // Warm hero first
  if (onProgress) onProgress(Math.round((loadedCount / totalCount) * 100));

  let queue = [...SECONDARY_TEXTURES];

  const processNextChunk = (deadline) => {
    if (isDone || queue.length === 0) {
      clearTimeout(timeoutId);
      markComplete();
      return;
    }

    const start = performance.now();
    // Budget of <= 4ms per chunk
    while (queue.length > 0 && (performance.now() - start < 4) && (!deadline || deadline.timeRemaining() > 1)) {
      const url = queue.shift();
      try {
        fetch(url)
          .then(res => res.blob())
          .then(blob => createImageBitmap(blob))
          .then(bitmap => {
            loadedCount++;
            if (onProgress) onProgress(Math.round((loadedCount / totalCount) * 100));
            if (loadedCount >= totalCount) {
              clearTimeout(timeoutId);
              markComplete();
            }
          })
          .catch(() => {
            loadedCount++;
            if (loadedCount >= totalCount) {
              clearTimeout(timeoutId);
              markComplete();
            }
          });
      } catch (_) {
        loadedCount++;
      }
    }

    if (queue.length > 0) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(processNextChunk, { timeout: 1500 });
      } else {
        setTimeout(processNextChunk, 16);
      }
    } else {
      // Async shader compile
      if (gl && scene && camera && gl.compileAsync) {
        gl.compileAsync(scene, camera).catch(() => {}).finally(() => {
          clearTimeout(timeoutId);
          markComplete();
        });
      } else {
        clearTimeout(timeoutId);
        markComplete();
      }
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(processNextChunk, { timeout: 1500 });
  } else {
    setTimeout(processNextChunk, 16);
  }

  return () => {
    isDone = true;
    clearTimeout(timeoutId);
  };
}
