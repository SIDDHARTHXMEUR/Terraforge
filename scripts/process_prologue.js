import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const RAW_DIR = path.resolve('public/prologue/raw');
const OUT_DIR = path.resolve('public/prologue');
const MANIFEST_PATH = path.resolve('public/prologue/manifest.json');

if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('[Terraforge Prologue Transcoder] Using ffmpeg binary at:', ffmpegPath);

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('[Terraforge Prologue Transcoder] manifest.json not found at:', MANIFEST_PATH);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const requiredFiles = ['sun.mp4', 'earth-night.mp4', 'mars.mp4', 'jupiter.mp4', 'saturn.mp4'];
const missingFiles = [];

for (const f of requiredFiles) {
  const p = path.join(RAW_DIR, f);
  if (!fs.existsSync(p)) {
    missingFiles.push(f);
  }
}

if (missingFiles.length > 0) {
  console.warn('[Terraforge Prologue Transcoder] The following raw footage clips are missing from public/prologue/raw/:');
  missingFiles.forEach(f => console.warn('  - ' + f));
}

for (const clip of manifest.clips) {
  const rawFile = path.join(RAW_DIR, clip.file);
  if (!fs.existsSync(rawFile)) {
    console.log(`[Terraforge Prologue Transcoder] Skipping missing clip: ${clip.file}`);
    continue;
  }

  console.log(`[Terraforge Prologue Transcoder] Processing ${clip.file}...`);
  const out1080p = path.join(OUT_DIR, clip.file);
  const out720p = path.join(OUT_DIR, clip.file720 || clip.file.replace('.mp4', '_720p.mp4'));

  // Transcode 1080p: trimmed to 2.0s, muted, crf 23, maxrate 2.5M
  spawnSync(ffmpegPath, [
    '-y',
    '-i', rawFile,
    '-t', '2.0',
    '-an',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-maxrate', '2500k',
    '-bufsize', '5000k',
    '-movflags', '+faststart',
    out1080p
  ]);

  // Transcode 720p variant for mobile/saveData
  spawnSync(ffmpegPath, [
    '-y',
    '-i', rawFile,
    '-t', '2.0',
    '-an',
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '25',
    '-maxrate', '1200k',
    '-bufsize', '2400k',
    '-movflags', '+faststart',
    out720p
  ]);
}

console.log('[Terraforge Prologue Transcoder] Transcode processing completed.');
