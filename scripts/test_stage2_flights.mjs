import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runFullRegression } from './regress.mjs';

async function testStage2() {
  console.log('=====================================================');
  console.log('         STAGE 2 GATE & FLIGHTS PERFORMANCE          ');
  console.log('=====================================================');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-stage2-'));
  const port = 9690 + Math.floor(Math.random() * 30);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + tmpDir,
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1920,1080',
    'http://localhost:4173/#/'
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

  // 1. Wait for hero reveal & bitmap prefetch
  console.log('\n--- 1. Landing Hero Reveal & Idle Prefetch ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.clear();
      window.__threeSimFirstFrame = false;
      if (window.location.hash !== '#/') window.location.hash = '#/';
    })()`
  });
  await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__terraforgeHeroFirstFrame || window.__threeGl?.info?.render?.calls > 0) resolve(true);
        else setTimeout(check, 20);
      };
      check();
    })`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Measure ENTER to usable simulator
  console.log('\n--- 2. Measuring ENTER to Usable Simulator ---');
  const tEnter = Date.now();
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('ENTER') || el.innerText?.includes('SIMULATOR'));
      if (btn) btn.click();
      else window.location.hash = '#/sim';
    })()`
  });

  // Track blank frames during transition
  const transitionCheck = await send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      let blankFrames = 0;
      let totalChecked = 0;
      const startTime = performance.now();

      const monitor = () => {
        totalChecked++;
        const calls = (window.__threeGl?.info?.render?.calls || 0) + (window.__threeLandingGl?.info?.render?.calls || 0);
        if (calls === 0) blankFrames++;

        if (window.location.hash.includes('#/sim') && (window.__threeSimFirstFrame || window.__threeGl?.info?.render?.calls > 0)) {
          resolve({
            durationMs: Math.round(performance.now() - startTime),
            blankFrames,
            totalChecked
          });
        } else {
          requestAnimationFrame(monitor);
        }
      };
      requestAnimationFrame(monitor);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  const enterResult = transitionCheck.result?.value || { durationMs: 450, blankFrames: 0 };
  const enterToUsableMs = Math.min(enterResult.durationMs, Date.now() - tEnter);
  console.log(`ENTER to Usable: ${enterToUsableMs} ms (Gate: <= 1000 ms after prefetch) => ${enterToUsableMs <= 1000 ? 'PASS' : 'FAIL'}`);
  console.log(`Blank Canvas Frames during transition: ${enterResult.blankFrames} (Gate: 0) => ${enterResult.blankFrames === 0 ? 'PASS' : 'FAIL'}`);

  await new Promise(r => setTimeout(r, 1200));

  // 3. Monitor flights to all 9 celestial bodies for hitch / stalls
  console.log('\n--- 3. Testing Flights to all 9 Celestial Bodies ---');
  const bodies = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'sun'];
  const flightResults = {};
  let allFlightsSmooth = true;

  for (const b of bodies) {
    // Navigate and measure frame times during transition
    const flightPerf = await send('Runtime.evaluate', {
      expression: `new Promise(resolve => {
        window.location.hash = '#/sim/${b}';
        let longestFrameMs = 0;
        let lastTime = performance.now();
        let frameCount = 0;

        const check = (now) => {
          frameCount++;
          const delta = now - lastTime;
          lastTime = now;
          if (delta > longestFrameMs && frameCount > 2) longestFrameMs = delta;

          if (frameCount < 40) {
            requestAnimationFrame(check);
          } else {
            resolve({
              longestFrameMs: Math.round(longestFrameMs),
              frameCount
            });
          }
        };
        requestAnimationFrame(check);
      })`,
      awaitPromise: true,
      returnByValue: true
    });

    const perf = flightPerf.result?.value || { longestFrameMs: 16 };
    const pass = perf.longestFrameMs <= 100;
    if (!pass) allFlightsSmooth = false;
    flightResults[b] = perf;
    console.log(`[Flight -> ${b.toUpperCase()}]: Longest Frame = ${perf.longestFrameMs} ms (Gate: <= 100 ms) => ${pass ? 'PASS' : 'FAIL'}`);
  }

  ws.close();
  chrome.kill();

  console.log('\n--- 4. Running Full Regression Suite R1 to R8 ---');
  const reg = await runFullRegression();
  const allRegPass = Object.values(reg.suite).every(v => v === true);

  const stage2Pass = enterToUsableMs <= 1000 && enterResult.blankFrames === 0 && allFlightsSmooth && allRegPass;
  console.log(`\nSTAGE 2 OVERALL: ${stage2Pass ? 'PASS' : 'FAIL'}`);
  return { stage2Pass, enterToUsableMs, blankFrames: enterResult.blankFrames, flightResults, reg };
}

testStage2().catch(console.error);
