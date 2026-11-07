const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const CLIPS_CONFIG = [
  {
    id: 'sun',
    file: 'sun.mp4',
    file720: 'sun_720p.mp4',
    url: 'http://images-assets.nasa.gov/video/GSFC_20160426_SDO_m12224_SolarFlare/GSFC_20160426_SDO_m12224_SolarFlare~orig.mp4',
    title: 'SOL',
    credit: 'NASA / Goddard Space Flight Center / SDO AIA 304 Å',
    source: 'https://images.nasa.gov/details/GSFC_20160426_SDO_m12224_SolarFlare',
    seek: '00:00:12',
    filter1080: 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    filter720: 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
    start: 1.0,
    duration: 2.0
  },
  {
    id: 'earth',
    file: 'earth-night.mp4',
    file720: 'earth-night_720p.mp4',
    url: 'http://images-assets.nasa.gov/video/GSFC_20170412_Lights_m12573_EarthAtNight/GSFC_20170412_Lights_m12573_EarthAtNight~orig.mp4',
    title: 'EARTH',
    credit: 'NASA Earth Observatory / Suomi NPP VIIRS Day-Night Band',
    source: 'https://images.nasa.gov/details/GSFC_20170412_Lights_m12573_EarthAtNight',
    seek: '00:00:15',
    // 10% zoom crop eliminates the corner logo completely
    filter1080: 'crop=in_w*0.88:in_h*0.88:in_w*0.06:in_h*0.06,scale=1920:1080',
    filter720: 'crop=in_w*0.88:in_h*0.88:in_w*0.06:in_h*0.06,scale=1280:720',
    start: 3.0,
    duration: 2.0
  },
  {
    id: 'mars',
    file: 'mars.mp4',
    file720: 'mars_720p.mp4',
    url: 'http://images-assets.nasa.gov/video/GSFC_20150902_MAVEN_m11992_Mapping/GSFC_20150902_MAVEN_m11992_Mapping~orig.mp4',
    title: 'MARS',
    credit: 'NASA / Goddard Space Flight Center / MAVEN IUVS',
    source: 'https://images.nasa.gov/details/GSFC_20150902_MAVEN_m11992_Mapping',
    seek: '00:00:50',
    filter1080: 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    filter720: 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
    start: 5.0,
    duration: 2.0
  },
  {
    id: 'jupiter',
    file: 'jupiter.mp4',
    file720: 'jupiter_720p.mp4',
    url: 'http://images-assets.nasa.gov/video/GSFC_20180313_Jupiter_m12878_GreatRedSpot/GSFC_20180313_Jupiter_m12878_GreatRedSpot~orig.mp4',
    title: 'JUPITER',
    credit: 'NASA / ESA / Goddard Space Flight Center / Hubble Heritage Team',
    source: 'https://images.nasa.gov/details/GSFC_20180313_Jupiter_m12878_GreatRedSpot',
    seek: '00:00:08',
    filter1080: 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    filter720: 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
    start: 7.0,
    duration: 2.0
  },
  {
    id: 'saturn',
    file: 'saturn.mp4',
    file720: 'saturn_720p.mp4',
    url: 'http://images-assets.nasa.gov/video/GSFC_20121025_Saturn_m11038_Storm/GSFC_20121025_Saturn_m11038_Storm~medium.mp4',
    title: 'SATURN',
    credit: 'NASA / JPL-Caltech / Goddard Space Flight Center / Cassini CIRS',
    source: 'https://images.nasa.gov/details/GSFC_20121025_Saturn_m11038_Storm',
    seek: '00:00:06',
    filter1080: 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    filter720: 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
    start: 9.0,
    duration: 2.0
  }
];

const PROLOGUE_DIR = path.resolve(__dirname, '../public/prologue');
const RAW_DIR = path.join(PROLOGUE_DIR, 'raw');

if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

console.log('[Terraforge Prologue Transcoder] Starting NASA Video Transcode...');

for (const clip of CLIPS_CONFIG) {
  const rawPath = path.join(RAW_DIR, clip.file);
  const out1080 = path.join(PROLOGUE_DIR, clip.file);
  const out720 = path.join(PROLOGUE_DIR, clip.file720);

  console.log(`Processing ${clip.id.toUpperCase()}: ${clip.title}...`);

  // 1. Fetch raw segment into raw/
  try {
    execFileSync(ffmpegPath, [
      '-ss', clip.seek,
      '-i', clip.url,
      '-t', '3.5',
      '-c', 'copy',
      '-y',
      rawPath
    ], { stdio: 'ignore', timeout: 45000 });
  } catch (err) {
    console.warn(`  Warning: raw stream copy failed, encoding direct: ${err.message}`);
  }

  const inputSource = fs.existsSync(rawPath) ? rawPath : clip.url;
  const seekArg = fs.existsSync(rawPath) ? ['-ss', '00:00:00.2'] : ['-ss', clip.seek];

  // 2. Transcode 1080p
  execFileSync(ffmpegPath, [
    ...seekArg,
    '-i', inputSource,
    '-t', '2.0',
    '-an',
    '-vf', clip.filter1080,
    '-c:v', 'libx264',
    '-crf', '22',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y',
    out1080
  ], { stdio: 'ignore', timeout: 45000 });

  // 3. Transcode 720p
  execFileSync(ffmpegPath, [
    ...seekArg,
    '-i', inputSource,
    '-t', '2.0',
    '-an',
    '-vf', clip.filter720,
    '-c:v', 'libx264',
    '-crf', '24',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y',
    out720
  ], { stdio: 'ignore', timeout: 45000 });

  const s1080 = fs.statSync(out1080).size;
  const s720 = fs.statSync(out720).size;
  console.log(`  Finished ${clip.id}: 1080p=${(s1080 / 1024).toFixed(1)}KB, 720p=${(s720 / 1024).toFixed(1)}KB`);
}

// Write manifest.json
const manifest = {
  version: '2.0',
  totalDuration: 14.5,
  clips: CLIPS_CONFIG.map(({ id, file, file720, title, credit, source, start, duration }) => ({
    id,
    file,
    file720,
    title,
    credit,
    source,
    start,
    duration
  }))
};

fs.writeFileSync(path.join(PROLOGUE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('[Terraforge Prologue Transcoder] manifest.json updated successfully!');

let totalBytes = 0;
for (const f of fs.readdirSync(PROLOGUE_DIR)) {
  const p = path.join(PROLOGUE_DIR, f);
  if (fs.statSync(p).isFile()) totalBytes += fs.statSync(p).size;
}
console.log(`[Terraforge Prologue Transcoder] Total prologue directory size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
