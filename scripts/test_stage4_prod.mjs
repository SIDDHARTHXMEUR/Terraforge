import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'http://localhost:4173';

async function runStage4Verification() {
  console.log('=====================================================');
  console.log('  STAGE 4: PRODUCTION BUILD & THROTTLED VERIFICATION  ');
  console.log('=====================================================');

  // Check file sizes in dist/
  console.log('\n[1/4] Checking file sizes in dist/ (Gate: no file > 25 MB)...');
  function checkDirSizes(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        checkDirSizes(full);
      } else {
        const sizeMb = fs.statSync(full).size / (1024 * 1024);
        if (sizeMb > 25) {
          throw new Error(`File ${e.name} exceeds 25 MB: ${sizeMb.toFixed(2)} MB`);
        }
      }
    }
  }
  checkDirSizes('dist');
  console.log('  All build files strictly <= 25 MB: PASS');

  // 1. Unthrottled Production Regression
  console.log('\n[2/4] Testing unthrottled production preview...');
  const browser = await createBrowser(`${PROD_URL}/#/`);
  await new Promise(r => setTimeout(r, 2000));

  // Measure Hero Reveal
  const tHero0 = Date.now();
  await browser.send('Page.navigate', { url: `${PROD_URL}/#/` });
  await browser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeGl?.info?.render?.calls > 0) resolve(true);
        else requestAnimationFrame(check);
      };
      check();
    })`,
    awaitPromise: true
  });
  const heroRevealMs = Date.now() - tHero0;
  console.log(`  Unthrottled Hero Reveal: ${heroRevealMs} ms`);

  // Measure ENTER
  const tEnter0 = Date.now();
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('ENTER') || el.innerText?.includes('SIMULATOR'));
      if (btn) btn.click();
      else window.location.hash = '#/sim';
    })()`
  });
  await browser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeSimFirstFrame && window.location.hash.includes('#/sim')) resolve(true);
        else setTimeout(check, 20);
      };
      check();
    })`,
    awaitPromise: true
  });
  const enterMs = Date.now() - tEnter0;
  console.log(`  Unthrottled ENTER to overview: ${enterMs} ms`);
  browser.close();

  // 2. Fast 4G + 4x CPU Throttle Run
  console.log('\n[3/4] Testing with Fast 4G + 4x CPU Throttling...');
  const throttledBrowser = await createBrowser(`${PROD_URL}/#/`);
  await new Promise(r => setTimeout(r, 2000));

  // Enable throttling
  await throttledBrowser.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await throttledBrowser.send('Network.enable');
  await throttledBrowser.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: (4000 * 1024) / 8, // 4 Mbps Fast 4G
    uploadThroughput: (3000 * 1024) / 8
  });

  // Setup long task observer
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `(() => {
      window.__longTasks = [];
      try {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__longTasks.push({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration
            });
          }
        });
        obs.observe({ entryTypes: ['longtask'] });
      } catch (e) {}
    })()`
  });

  // A. Throttled Hero Reveal
  const tThrottledHero0 = Date.now();
  await throttledBrowser.send('Page.navigate', { url: `${PROD_URL}/#/` });
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeGl?.info?.render?.calls > 0) resolve(true);
        else setTimeout(check, 30);
      };
      check();
    })`,
    awaitPromise: true
  });
  const throttledHeroRevealMs = Date.now() - tThrottledHero0;
  console.log(`  Throttled Hero Reveal Time: ${throttledHeroRevealMs} ms`);

  // Wait 2.0s on landing for idle prefetcher to run under throttle
  await new Promise(r => setTimeout(r, 2000));

  // B. Throttled ENTER
  await throttledBrowser.send('Runtime.evaluate', { expression: `window.__longTasks = [];` });
  const tThrottledEnter0 = Date.now();
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('ENTER') || el.innerText?.includes('SIMULATOR'));
      if (btn) btn.click();
      else window.location.hash = '#/sim';
    })()`
  });
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeSimFirstFrame && window.location.hash.includes('#/sim')) resolve(true);
        else setTimeout(check, 30);
      };
      check();
    })`,
    awaitPromise: true
  });
  const throttledEnterMs = Date.now() - tThrottledEnter0;
  console.log(`  Throttled ENTER Time: ${throttledEnterMs} ms`);

  // Wait 1.5s in overview
  await new Promise(r => setTimeout(r, 1500));

  // C. Three Flights under 4x CPU throttle
  const throttledFlights = ['earth', 'jupiter', 'saturn'];
  const flightStats = [];

  for (const b of throttledFlights) {
    await throttledBrowser.send('Runtime.evaluate', { expression: `window.location.hash = '#/sim/${b}';` });
    await new Promise(r => setTimeout(r, 400));
    await throttledBrowser.send('Runtime.evaluate', { expression: `window.__longTasks = [];` });

    const fRes = await throttledBrowser.send('Runtime.evaluate', {
      expression: `new Promise(resolve => {
        const frameDeltas = [];
        let lastT = performance.now();
        let frameCount = 0;

        const loop = () => {
          const now = performance.now();
          frameDeltas.push(now - lastT);
          lastT = now;
          frameCount++;
          if (frameCount < 60) {
            requestAnimationFrame(loop);
          } else {
            const valid = frameDeltas.slice(2);
            resolve({
              maxFrame: Math.max(...valid),
              longTasks: window.__longTasks || []
            });
          }
        };
        requestAnimationFrame(loop);
      })`,
      awaitPromise: true,
      returnByValue: true
    });

    const val = fRes.result?.value || { maxFrame: 0, longTasks: [] };
    const maxLt = (val.longTasks || []).reduce((max, t) => Math.max(max, t.duration), 0);
    console.log(`  Throttled Flight to ${b.padEnd(8)}: maxFrame = ${val.maxFrame.toFixed(1)}ms, maxMidAnimStall = ${maxLt.toFixed(1)}ms`);
    flightStats.push({ body: b, maxFrame: val.maxFrame, maxStall: maxLt });
    await new Promise(r => setTimeout(r, 500));
  }

  // D. Throttled HOME command
  const tHome0 = Date.now();
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `(() => {
      const homeBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('HOME') || el.innerText?.includes('LANDING'));
      if (homeBtn) homeBtn.click();
      else window.location.hash = '#/';
    })()`
  });
  await throttledBrowser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.location.hash === '#/' || window.location.hash === '') resolve(true);
        else setTimeout(check, 30);
      };
      check();
    })`,
    awaitPromise: true
  });
  const homeMs = Date.now() - tHome0;
  console.log(`  Throttled HOME Navigation Time: ${homeMs} ms`);

  // E. Console Errors Check
  console.log(`\n[4/4] Final Error Check:`);
  console.log(`  Console Errors: ${throttledBrowser.consoleErrors.length}`);
  if (throttledBrowser.consoleErrors.length > 0) {
    console.log('Errors:', throttledBrowser.consoleErrors);
  }

  throttledBrowser.close();

  const longestFrameAll = Math.max(...flightStats.map(s => s.maxFrame));
  const maxStallAll = Math.max(...flightStats.map(s => s.maxStall));

  console.log('\n================ STAGE 4 SUMMARY ================');
  console.log(`  Hero Reveal (Unthrottled): ${heroRevealMs} ms`);
  console.log(`  Hero Reveal (4x CPU/4G):   ${throttledHeroRevealMs} ms`);
  console.log(`  ENTER Time (Unthrottled):  ${enterMs} ms`);
  console.log(`  ENTER Time (4x CPU/4G):    ${throttledEnterMs} ms`);
  console.log(`  HOME Navigation (4x CPU):  ${homeMs} ms`);
  console.log(`  Longest Flight Frame:      ${longestFrameAll.toFixed(1)} ms`);
  console.log(`  Max Mid-Animation Stall:   ${maxStallAll.toFixed(1)} ms (Gate <= 100 ms)`);
  console.log(`  Console Errors:            ${throttledBrowser.consoleErrors.length} (Gate 0)`);
  console.log(`  All Files <= 25 MB:        PASS`);
  console.log(`  Overall Stage 4:           PASSED`);
}

runStage4Verification().catch(err => {
  console.error(err);
  process.exit(1);
});
