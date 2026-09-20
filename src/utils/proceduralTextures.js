import * as THREE from 'three';

// Fast 2D Fast Noise for instant texture generation (<30ms)
function fastNoise(x, y) {
  const sin = Math.sin;
  const cos = Math.cos;
  let val = sin(x * 1.5) * cos(y * 1.5) +
            sin(x * 3.2 + 0.8) * cos(y * 2.8) * 0.5 +
            sin(x * 6.7) * cos(y * 6.3) * 0.25;
  return (val + 1.75) / 3.5; // Normalize 0..1
}

function isRealEarthLand(latDeg, lonDeg) {
  // 1. North America
  if (latDeg > 15 && latDeg < 72 && lonDeg > -168 && lonDeg < -52) {
    const cLat = (latDeg - 45) / 30; const cLon = (lonDeg + 105) / 55;
    if (cLat * cLat + cLon * cLon < 1.1) return true;
  }
  // 2. South America
  if (latDeg > -55 && latDeg < 13 && lonDeg > -82 && lonDeg < -34) {
    const cLat = (latDeg + 20) / 32; const cLon = (lonDeg + 58) / 24;
    if (cLat * cLat + cLon * cLon < 1.1) return true;
  }
  // 3. Eurasia
  if (latDeg > 8 && latDeg < 75 && lonDeg > -10 && lonDeg < 170) {
    const cLat = (latDeg - 45) / 32; const cLon = (lonDeg - 80) / 85;
    if (cLat * cLat + cLon * cLon < 1.2) return true;
  }
  // 4. Africa
  if (latDeg > -35 && latDeg < 37 && lonDeg > -18 && lonDeg < 52) {
    const cLat = (latDeg - 2) / 35; const cLon = (lonDeg - 18) / 32;
    if (cLat * cLat + cLon * cLon < 1.0) return true;
  }
  // 5. Australia
  if (latDeg > -42 && latDeg < -10 && lonDeg > 112 && lonDeg < 154) {
    const cLat = (latDeg + 25) / 15; const cLon = (lonDeg - 134) / 20;
    if (cLat * cLat + cLon * cLon < 0.9) return true;
  }
  // 6. Antarctica & Greenland
  if (latDeg < -62 || (latDeg > 60 && latDeg < 84 && lonDeg > -72 && lonDeg < -12)) return true;

  return false;
}

// 1. Fast Solar Smash Earth Texture Generator
export function createEarthMaps() {
  const width = 1024;
  const height = 512;

  const diffCanvas = document.createElement('canvas'); diffCanvas.width = width; diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d'); const diffImg = diffCtx.createImageData(width, height); const diffData = diffImg.data;

  const specCanvas = document.createElement('canvas'); specCanvas.width = width; specCanvas.height = height;
  const specCtx = specCanvas.getContext('2d'); const specImg = specCtx.createImageData(width, height); const specData = specImg.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const latDeg = (0.5 - v) * 180;
    const absLat = Math.abs(latDeg);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lonDeg = (u - 0.5) * 360;

      const nMacro = fastNoise(u * 8, v * 4);
      const nDetail = fastNoise(u * 20, v * 10);

      const inContinentBase = isRealEarthLand(latDeg, lonDeg);
      const landThreshold = inContinentBase ? 0.38 : 0.64;
      const isLand = (nMacro * 0.7 + nDetail * 0.3) > landThreshold;
      const isIceCap = absLat > 68 || (absLat > 60 && isLand && nDetail > 0.5);

      const idx = (y * width + x) * 4;

      if (isIceCap) {
        diffData[idx] = 250; diffData[idx+1] = 253; diffData[idx+2] = 255; diffData[idx+3] = 255;
        specData[idx] = 200; specData[idx+1] = 200; specData[idx+2] = 200; specData[idx+3] = 255;
      } else if (!isLand) {
        const depth = nMacro;
        diffData[idx] = Math.floor(4 + depth * 15);
        diffData[idx+1] = Math.floor(45 + depth * 65);
        diffData[idx+2] = Math.floor(130 + depth * 110);
        diffData[idx+3] = 255;

        specData[idx] = 255; specData[idx+1] = 255; specData[idx+2] = 255; specData[idx+3] = 255;
      } else {
        if (absLat < 23 && lonDeg > -20 && lonDeg < 55) {
          diffData[idx] = Math.floor(215 + nDetail * 35);
          diffData[idx+1] = Math.floor(155 + nDetail * 40);
          diffData[idx+2] = Math.floor(65 + nDetail * 30);
        } else if (absLat < 20) {
          diffData[idx] = Math.floor(25 + nDetail * 40);
          diffData[idx+1] = Math.floor(125 + nDetail * 60);
          diffData[idx+2] = Math.floor(35 + nDetail * 25);
        } else if (nDetail > 0.65) {
          diffData[idx] = Math.floor(140 + nDetail * 110);
          diffData[idx+1] = Math.floor(135 + nDetail * 110);
          diffData[idx+2] = Math.floor(125 + nDetail * 110);
        } else {
          diffData[idx] = Math.floor(55 + nDetail * 80);
          diffData[idx+1] = Math.floor(115 + nDetail * 40);
          diffData[idx+2] = Math.floor(40 + nDetail * 20);
        }
        diffData[idx+3] = 255;

        specData[idx] = 0; specData[idx+1] = 0; specData[idx+2] = 0; specData[idx+3] = 255;
      }
    }
  }

  diffCtx.putImageData(diffImg, 0, 0); specCtx.putImageData(specImg, 0, 0);

  const diffTex = new THREE.CanvasTexture(diffCanvas);
  const specTex = new THREE.CanvasTexture(specCanvas);

  [diffTex, specTex].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
  });

  return { diffuse: diffTex, specular: specTex };
}

// 2. Ice World Maps
export function createIceMaps() {
  const width = 512; const height = 256;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); const imgData = ctx.createImageData(width, height); const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const n = fastNoise(u * 10, v * 5);
      const idx = (y * width + x) * 4;

      if (n < 0.35) {
        data[idx] = 12; data[idx+1] = 60; data[idx+2] = 120;
      } else {
        const f = (n - 0.35) / 0.65;
        data[idx] = Math.floor(180 + f * 70);
        data[idx+1] = Math.floor(220 + f * 30);
        data[idx+2] = Math.floor(245 + f * 10);
      }
      data[idx+3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 3. Desert World Maps
export function createDesertMaps() {
  const width = 512; const height = 256;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); const imgData = ctx.createImageData(width, height); const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const n = fastNoise(u * 10, v * 5);
      const idx = (y * width + x) * 4;

      if (n < 0.35) {
        data[idx] = 115; data[idx+1] = 40; data[idx+2] = 18;
      } else if (n < 0.75) {
        const s = (n - 0.35) / 0.4;
        data[idx] = Math.floor(220 + s * 30);
        data[idx+1] = Math.floor(135 + s * 50);
        data[idx+2] = Math.floor(40 + s * 35);
      } else {
        data[idx] = 248; data[idx+1] = 215; data[idx+2] = 150;
      }
      data[idx+3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 4. Cloud Map
export function createCloudMap() {
  const width = 512; const height = 256;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); const imgData = ctx.createImageData(width, height); const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const cn = fastNoise(u * 12, v * 6);
      const idx = (y * width + x) * 4;

      data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255;
      const alpha = Math.pow(cn, 1.8) * 255;
      data[idx+3] = Math.floor(alpha);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 5. Normal Map
export function createNormalMap() {
  const width = 512; const height = 256;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); const imgData = ctx.createImageData(width, height); const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const hL = fastNoise((u - 0.01) * 10, v * 5);
      const hR = fastNoise((u + 0.01) * 10, v * 5);
      const hU = fastNoise(u * 10, (v - 0.01) * 5);
      const hD = fastNoise(u * 10, (v + 0.01) * 5);

      const dx = (hR - hL) * 3;
      const dy = (hD - hU) * 3;
      const dz = 1.0;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = dx / len; const ny = dy / len; const nz = dz / len;

      const idx = (y * width + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx+1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx+2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx+3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
