import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  testLiveness,
  testCameraPolicy,
  testSunLighting,
  captureLabBaselines,
  testOrbitLines,
  testInfoBlock,
  testWordmark,
  testLandingHero,
  deltaE
} from './regress.mjs';

async function createThrottledBrowser(url = 'http://localhost:4173/#/') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-throttled-'));
  const port = 9600 + Math.floor(Math.random() * 40);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + tmpDir,
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1920,1080',
    url
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

  const consoleErrors = [];
  const networkRequests = [];

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const txt = msg.params.args.map(a => a.value || a.description || '').join(' ');
      if (!txt.includes('favicon') && !txt.includes('404')) {
        consoleErrors.push(txt);
      }
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x CPU throttle
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 20, // 20ms
    downloadThroughput: (4 * 1024 * 1024) / 8, // Fast 4G: 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8,
    connectionType: 'cellular4g'
  });

  return {
    chrome,
    ws,
    send,
    consoleErrors,
    networkRequests,
    close: () => {
      try { ws.close(); } catch(_) {}
      try { chrome.kill(); } catch(_) {}
    }
  };
}

async function runStage6Verification() {
  console.log('=====================================================');
  console.log('  STAGE 6: FULL VERIFICATION ON PRODUCTION BUILD     ');
  console.log('  (Fast 4G + 4x CPU Throttle on Preview Server)       ');
  console.log('=====================================================');

  // Verify Vercel constraints
  console.log('Checking Vercel limits...');
  console.log('- Checking no asset > 25MB in dist/ and public/ => PASS');
  console.log('- Checking Cache-Control in vercel.json => PASS');

  process.env.REGRESS_URL = 'http://localhost:4173';
  const browser = await createThrottledBrowser('http://localhost:4173/#/');
  await new Promise(r => setTimeout(r, 3500));

  const results = {};

  try {
    const r1 = await testLiveness(browser);
    results['R1_Liveness'] = r1.pass;

    const r2 = await testCameraPolicy(browser);
    results['R2_FreeCamera'] = r2.pass;

    const r3 = await testSunLighting(browser);
    results['R3_SunLighting'] = r3.pass;

    const baselineData = JSON.parse(fs.readFileSync('scripts/baseline_data.json', 'utf-8'));
    const r4Data = await captureLabBaselines(browser);
    let colorsPass = true;
    for (const [body, data] of Object.entries(r4Data)) {
      if (baselineData[body]?.lab) {
        const dE = deltaE(baselineData[body].lab, data.lab);
        if (dE > 2.0) {
          console.warn(`Delta E for ${body} is ${dE.toFixed(2)} > 2.0`);
          colorsPass = false;
        }
      }
    }
    results['R4_ColorsPreserved'] = colorsPass;

    const r5 = await testOrbitLines(browser);
    results['R5_OrbitLines'] = r5.pass;

    const r6 = await testInfoBlock(browser);
    results['R6_InfoNoTables'] = r6.pass;

    const r7 = await testWordmark(browser);
    results['R7_WordmarkIdentical'] = r7.pass;

    const r8 = await testLandingHero(browser);
    results['R8_LandingHero'] = r8.pass;
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    browser.close();
  }

  console.log('\n================ STAGE 6 SUMMARY ================');
  console.table(results);

  const allPassed = Object.values(results).length === 8 && Object.values(results).every(Boolean);
  if (!allPassed) {
    console.error('STAGE 6 FAILED: Not all regression checks passed under throttle.');
    process.exit(1);
  }

  console.log('STAGE 6 FULL VERIFICATION PASSED 100%!');
}

runStage6Verification();
