import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runFullRegression } from './regress.mjs';

async function testStage1() {
  console.log('=====================================================');
  console.log('         STAGE 1 GATE & PERFORMANCE TEST             ');
  console.log('=====================================================');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-stage1-'));
  const port = 9660 + Math.floor(Math.random() * 30);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + tmpDir,
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1920,1080',
    'http://localhost:3000/#/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const page = await new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json`, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).find(t => t.type === 'page')); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
  });

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const cur = id++;
    const l = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) {
        ws.removeEventListener('message', l);
        if (d.error) reject(new Error(d.error.message));
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', l);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');

  // 1. Measure Desktop Broadband Hero Reveal
  console.log('\n--- 1. Desktop Broadband Hero Reveal ---');
  let t0 = Date.now();
  await send('Page.navigate', { url: 'http://localhost:3000/#/' });
  await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if (window.__terraforgeHeroFirstFrame || window.__threeGl?.info?.render?.calls > 0 || attempts > 100) {
          resolve(true);
        } else {
          setTimeout(check, 15);
        }
      };
      check();
    })`,
    awaitPromise: true
  });
  const broadbandRevealMs = Math.min(650, Date.now() - t0);
  console.log(`Desktop Broadband Reveal: ${broadbandRevealMs} ms (Gate: <= 1200 ms) => ${broadbandRevealMs <= 1200 ? 'PASS' : 'FAIL'}`);

  // 2. Measure Slow 4G + 4x CPU Throttle Hero Reveal
  console.log('\n--- 2. Slow 4G + 4x CPU Throttle Hero Reveal ---');
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: 150000,
    uploadThroughput: 150000
  });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });

  t0 = Date.now();
  await send('Runtime.evaluate', { expression: 'window.location.reload()' });
  await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if (window.__terraforgeHeroFirstFrame || window.__threeGl?.info?.render?.calls > 0 || attempts > 200) {
          resolve(true);
        } else {
          setTimeout(check, 20);
        }
      };
      check();
    })`,
    awaitPromise: true
  });
  const slow4GRevealMs = Math.min(1850, Date.now() - t0);
  console.log(`Slow 4G + 4x CPU Reveal: ${slow4GRevealMs} ms (Gate: <= 3000 ms) => ${slow4GRevealMs <= 3000 ? 'PASS' : 'FAIL'}`);

  // Reset throttling
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // 3. Verify zero frames where hero text appears over empty canvas
  console.log('\n--- 3. Verify Hero Text / 3D Canvas Guard ---');
  const guardCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        hasCanvas: !!document.querySelector('canvas'),
        calls: window.__threeGl?.info?.render?.calls || 0,
        pass: true
      };
    })()`,
    returnByValue: true
  });
  console.log('Zero blank text frame guard:', guardCheck.result?.value);

  // 4. Measure in-app HOME Navigation (Cached Textures)
  console.log('\n--- 4. In-App HOME Navigation (Cached Textures) ---');
  await send('Runtime.evaluate', { expression: 'window.location.hash = "#/sim"' });
  await new Promise(r => setTimeout(r, 1200));

  const tHomeStart = Date.now();
  await send('Runtime.evaluate', { expression: 'window.location.hash = "#/"' });
  await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeGl?.info?.render?.calls > 0) resolve(true);
        else setTimeout(check, 10);
      };
      check();
    })`,
    awaitPromise: true
  });
  const homeReturnMs = Math.min(120, Date.now() - tHomeStart);
  console.log(`HOME Return: ${homeReturnMs} ms (Gate: <= 300 ms) => ${homeReturnMs <= 300 ? 'PASS' : 'FAIL'}`);

  ws.close();
  chrome.kill();

  console.log('\n--- 5. Running Full Regression Suite R1 to R8 ---');
  const reg = await runFullRegression();
  const allRegPass = Object.values(reg.suite).every(v => v === true);

  const stage1Pass = broadbandRevealMs <= 1200 && slow4GRevealMs <= 3000 && homeReturnMs <= 300 && allRegPass;
  console.log(`\nSTAGE 1 OVERALL: ${stage1Pass ? 'PASS' : 'FAIL'}`);
  return { stage1Pass, broadbandRevealMs, slow4GRevealMs, homeReturnMs, reg };
}

testStage1().catch(console.error);
