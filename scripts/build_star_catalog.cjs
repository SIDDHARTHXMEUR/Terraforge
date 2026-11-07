const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

// Ensure destination directories exist
const dataDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v38.csv.gz';
const OUTPUT_BIN = path.join(dataDir, 'hyg_stars.bin');
const OUTPUT_JSON = path.join(dataDir, 'hyg_bright_stars.json');

// Earth's axial obliquity (J2000): 23.4392911 degrees
const EPSILON = (23.4392911 * Math.PI) / 180.0;
const COS_EPS = Math.cos(EPSILON);
const SIN_EPS = Math.sin(EPSILON);

function bvToRgb(bv) {
  if (isNaN(bv) || bv === null) bv = 0.65;
  let T = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  T = Math.max(2200, Math.min(32000, T));

  const temp = T / 100;
  let r, g, b;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    if (r < 0) r = 0;
    if (r > 255) r = 255;
  }

  // Green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    if (g < 0) g = 0;
    if (g > 255) g = 255;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    if (g < 0) g = 0;
    if (g > 255) g = 255;
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    if (b < 0) b = 0;
    if (b > 255) b = 255;
  }

  // Slightly desaturate to avoid overly cartoonish neon stars
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = 0.75;
  r = Math.round(gray + (r - gray) * sat);
  g = Math.round(gray + (g - gray) * sat);
  b = Math.round(gray + (b - gray) * sat);

  return [r / 255, g / 255, b / 255];
}

console.log('Downloading and streaming HYG Database v3.8 from:', HYG_URL);

https.get(HYG_URL, res => {
  if (res.statusCode !== 200) {
    console.error('Failed to download HYG catalog, status:', res.statusCode);
    process.exit(1);
  }

  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: res.pipe(gunzip) });

  let headerIndices = null;
  const stars = [];
  const brightStars = [];
  let totalProcessed = 0;

  rl.on('line', line => {
    if (!headerIndices) {
      // Parse header line
      const headers = line.split(',').map(h => h.replace(/^"|"$/g, '').trim());
      headerIndices = {
        id: headers.indexOf('id'),
        proper: headers.indexOf('proper'),
        ra: headers.indexOf('ra'),
        dec: headers.indexOf('dec'),
        rarad: headers.indexOf('rarad'),
        decrad: headers.indexOf('decrad'),
        mag: headers.indexOf('mag'),
        ci: headers.indexOf('ci')
      };
      return;
    }

    totalProcessed++;
    // Basic CSV splitting (quotes handling for simple fields)
    const cols = line.split(',');
    const id = cols[headerIndices.id];
    if (id === '0') return; // Skip Sol

    const magStr = cols[headerIndices.mag];
    if (!magStr) return;
    const mag = parseFloat(magStr);
    if (isNaN(mag) || mag > 7.7) return; // Cutoff ~7.7 yields ~30,000 stars

    // Parse coordinates
    let rarad = parseFloat(cols[headerIndices.rarad]);
    let decrad = parseFloat(cols[headerIndices.decrad]);

    if (isNaN(rarad) || isNaN(decrad)) {
      const raHours = parseFloat(cols[headerIndices.ra]);
      const decDeg = parseFloat(cols[headerIndices.dec]);
      if (isNaN(raHours) || isNaN(decDeg)) return;
      rarad = (raHours * 2 * Math.PI) / 24.0;
      decrad = (decDeg * Math.PI) / 180.0;
    }

    const ciVal = parseFloat(cols[headerIndices.ci]);
    const ci = isNaN(ciVal) ? 0.65 : ciVal;
    const proper = cols[headerIndices.proper] ? cols[headerIndices.proper].replace(/^"|"$/g, '').trim() : '';

    // Equatorial cartesian coordinates (unit vector)
    const cosDec = Math.cos(decrad);
    const xEq = cosDec * Math.cos(rarad);
    const yEq = cosDec * Math.sin(rarad);
    const zEq = Math.sin(decrad);

    // Rotate by axial obliquity EPSILON around X-axis into Ecliptic coordinates:
    // xEcl = xEq
    // yEcl = yEq * cos(eps) + zEq * sin(eps)
    // zEcl = -yEq * sin(eps) + zEq * cos(eps)
    const xEcl = xEq;
    const yEcl = yEq * COS_EPS + zEq * SIN_EPS;
    const zEcl = -yEq * SIN_EPS + zEq * COS_EPS;

    // Map into Three.js coordinate system where:
    // Orbital plane is X-Z plane, +Y is Ecliptic North Pole
    const threeX = xEcl;
    const threeY = zEcl;
    const threeZ = -yEcl;

    // Color from B-V index
    const [cr, cg, cb] = bvToRgb(ci);

    // Visual flux: 10^(-0.4 * mag)
    // Normalized so mag 0 = 1.0, mag 6 = 0.00398, mag -1.46 (Sirius) = 3.84
    const flux = Math.pow(10, -0.4 * mag);

    // Is this one of the 20 brightest stars? (mag < 1.3)
    const isBright = mag < 1.3 ? 1.0 : 0.0;

    stars.push({
      x: threeX,
      y: threeY,
      z: threeZ,
      r: cr,
      g: cg,
      b: cb,
      mag: mag,
      flux: flux,
      isBright: isBright,
      proper: proper
    });

    if (mag <= 2.0 && proper) {
      brightStars.push({ name: proper, mag, ci, pos: [threeX, threeY, threeZ] });
    }
  });

  rl.on('close', () => {
    console.log(`Stream complete. Total rows scanned: ${totalProcessed}`);
    console.log(`Selected stars (Vmag <= 7.7): ${stars.length}`);

    // Sort descending by brightness (brightest first)
    stars.sort((a, b) => a.mag - b.mag);

    // Write compact binary Float32Array
    // Format: 8 floats per star: [x, y, z, r, g, b, flux, isBright]
    const buffer = new Float32Array(stars.length * 8);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const base = i * 8;
      buffer[base + 0] = s.x;
      buffer[base + 1] = s.y;
      buffer[base + 2] = s.z;
      buffer[base + 3] = s.r;
      buffer[base + 4] = s.g;
      buffer[base + 5] = s.b;
      buffer[base + 6] = s.flux;
      buffer[base + 7] = s.isBright;
    }

    fs.writeFileSync(OUTPUT_BIN, Buffer.from(buffer.buffer));
    const sizeKB = Math.round(buffer.byteLength / 1024);
    console.log(`Saved binary star catalog to ${OUTPUT_BIN} (${sizeKB} KB)`);

    // Also write JSON catalog with top named stars
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({
      count: stars.length,
      limitingMagnitude: 7.7,
      epoch: 'J2000',
      coordinateFrame: 'Ecliptic (Obliquity 23.4392911°)',
      brightNamedStars: brightStars
    }, null, 2));
    console.log(`Saved bright star metadata to ${OUTPUT_JSON}`);
  });
}).on('error', err => {
  console.error('Error streaming HYG catalog:', err);
});
