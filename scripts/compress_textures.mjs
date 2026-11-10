import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function rgbToLab(r, g, b) {
  let [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  X /= 0.95047;
  Y /= 1.00000;
  Z /= 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  let fx = f(X), fy = f(Y), fz = f(Z);
  let L = (116 * fy) - 16;
  let a = 500 * (fx - fy);
  let b_val = 200 * (fy - fz);
  return { L, a, b: b_val };
}

function deltaE(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

async function getMeanLab(imageBuffer) {
  const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const step = Math.max(1, Math.floor(info.width * info.height / 50000));
  for (let i = 0; i < data.length; i += step * info.channels) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
    count++;
  }
  return rgbToLab(sumR / count, sumG / count, sumB / count);
}

const texturesToCompress = [
  // Hero Earth textures
  { src: 'public/assets/planets/earth/earth_albedo.jpg', maxW: 2048, lowW: 1024, isHero: true },
  { src: 'public/assets/planets/earth/earth_clouds.png', maxW: 2048, lowW: 1024, isHero: true },
  { src: 'public/assets/planets/earth/earth_nightlights.jpg', maxW: 2048, lowW: 1024, isHero: true },
  
  // Chapter & Sim planets
  { src: 'public/assets/planets/sun/sun.jpg', maxW: 2048 },
  { src: 'public/assets/planets/sun/sdo_aia_304_2k.jpg', maxW: 2048 },
  { src: 'public/assets/planets/mercury/mercury.jpg', maxW: 2048 },
  { src: 'public/assets/planets/venus/venus.jpg', maxW: 2048 },
  { src: 'public/assets/planets/mars/mars.jpg', maxW: 2048 },
  { src: 'public/assets/planets/jupiter/jupiter.jpg', maxW: 2048 },
  { src: 'public/assets/planets/saturn/saturn.jpg', maxW: 2048 },
  { src: 'public/assets/planets/uranus/uranus.jpg', maxW: 2048 },
  { src: 'public/assets/planets/neptune/neptune.jpg', maxW: 2048 },
  { src: 'public/assets/planets/moon/moon.jpg', maxW: 2048 },
  { src: 'public/assets/planets/ceres/ceres.jpg', maxW: 2048 },
  { src: 'public/assets/planets/moons/io.jpg', maxW: 2048 },
  { src: 'public/assets/planets/moons/europa.jpg', maxW: 2048 }
];

async function main() {
  console.log('--- COMPRESSING TEXTURES (WEBP Q92, DELTA E <= 1.5) ---');
  const report = [];

  for (const item of texturesToCompress) {
    if (!fs.existsSync(item.src)) {
      console.log(`Skipping missing ${item.src}`);
      continue;
    }

    const origBuffer = fs.readFileSync(item.src);
    const origSize = origBuffer.length;
    const origLab = await getMeanLab(origBuffer);

    const dir = path.dirname(item.src);
    const ext = path.extname(item.src);
    const base = path.basename(item.src, ext);

    // Standard webp (quality 92)
    const outWebpPath = path.join(dir, `${base}.webp`);
    let pipeline = sharp(origBuffer);
    const meta = await pipeline.metadata();
    if (meta.width > item.maxW) {
      pipeline = pipeline.resize(item.maxW, null, { fit: 'inside' });
    }
    const webpBuffer = await pipeline.webp({ quality: 92, effort: 5 }).toBuffer();
    const webpLab = await getMeanLab(webpBuffer);
    const dE = deltaE(origLab, webpLab);

    if (dE > 1.5) {
      console.warn(`WARNING: ${item.src} delta E = ${dE.toFixed(2)} exceeds 1.5! Skipping.`);
      continue;
    }

    fs.writeFileSync(outWebpPath, webpBuffer);
    const newSize = webpBuffer.length;
    const savedPct = ((1 - newSize / origSize) * 100).toFixed(1);

    report.push({
      asset: `${base}${ext}`,
      format: 'webp',
      origSizeKB: (origSize / 1024).toFixed(1),
      newSizeKB: (newSize / 1024).toFixed(1),
      savedPct: `${savedPct}%`,
      deltaE: dE.toFixed(2)
    });

    // Also generate low-res 1024px for hero textures
    if (item.lowW) {
      const lowWebpPath = path.join(dir, `${base}_1k.webp`);
      const lowBuffer = await sharp(origBuffer)
        .resize(item.lowW, null, { fit: 'inside' })
        .webp({ quality: 90, effort: 5 })
        .toBuffer();
      fs.writeFileSync(lowWebpPath, lowBuffer);
      report.push({
        asset: `${base}_1k.webp`,
        format: 'webp (1k)',
        origSizeKB: (origSize / 1024).toFixed(1),
        newSizeKB: (lowBuffer.length / 1024).toFixed(1),
        savedPct: `${((1 - lowBuffer.length / origSize) * 100).toFixed(1)}%`,
        deltaE: (deltaE(origLab, await getMeanLab(lowBuffer))).toFixed(2)
      });
    }
  }

  console.table(report);
  fs.writeFileSync('scripts/compression_report.json', JSON.stringify(report, null, 2));
}

main().catch(console.error);
