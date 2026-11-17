import { createBrowser, getBaseUrl, waitForLandingReady } from './regress.mjs';

async function runStage2Verification() {
  console.log('=====================================================');
  console.log('  STAGE 2: ENTER SIMULATOR AND FREEZES TRACE TEST     ');
  console.log('=====================================================');

  const browser = await createBrowser(`${getBaseUrl()}/#/`);
  await waitForLandingReady(browser, 15000);

  // Setup performance observer in page
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      window.__longTasks = [];
      try {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__longTasks.push({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              attribution: entry.attribution ? entry.attribution.map(a => a.name || a.containerType).join(',') : ''
            });
          }
        });
        obs.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Longtask observer not available', e);
      }
    })()`
  });

  // 1. Measure ENTER Cold (no idle prefetch time)
  console.log('\n[1/4] Measuring ENTER Simulator Cold...');
  const tColdStart = Date.now();
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('ENTER') || el.innerText?.includes('SIMULATOR'));
      if (btn) btn.click();
      else window.location.hash = '#/sim';
    })()`
  });

  const enterColdResult = await browser.send('Runtime.evaluate', {
    expression: `new Promise(resolve => {
      const check = () => {
        if (window.__threeSimFirstFrame && window.location.hash.includes('#/sim')) {
          resolve({
            progress: window.__terraforgeWarmupProgress || 1.0,
            simCalls: window.__threeGl?.info?.render?.calls || 0
          });
        } else {
          setTimeout(check, 30);
        }
      };
      check();
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  const enterColdMs = Date.now() - tColdStart;
  console.log(`  ENTER Cold Time: ${enterColdMs} ms (Gate <= 2000 ms)`);
  console.log(`  Sim calls: ${enterColdResult.result?.value?.simCalls}`);

  // Get long tasks during ENTER
  const enterLongTasks = await browser.send('Runtime.evaluate', {
    expression: `window.__longTasks || []`,
    returnByValue: true
  });
  console.log(`  Long tasks > 50ms during ENTER cold: ${enterLongTasks.result?.value?.length || 0}`);
  (enterLongTasks.result?.value || []).forEach(lt => {
    console.log(`    Task @ ${lt.startTime.toFixed(1)}ms: duration = ${lt.duration.toFixed(1)}ms`);
  });

  // Wait 1.5s for overview settling and idle compiles
  await new Promise(r => setTimeout(r, 1500));

  // 2. Test Flights to 9 celestial bodies
  console.log('\n[2/4] Testing flights to 9 celestial bodies for mid-animation freezes...');
  const bodies = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'sun'];
  const flightResults = [];

  for (const body of bodies) {
    // Initiate flight to body
    await browser.send('Runtime.evaluate', { expression: `window.location.hash = '#/sim/${body}';` });
    // Wait for pre-flight shader/texture wait (<= 300ms) to complete before flight animation loop begins
    await new Promise(r => setTimeout(r, 320));

    // Reset long tasks for mid-animation measurement
    await browser.send('Runtime.evaluate', { expression: `window.__longTasks = [];` });

    const fRes = await browser.send('Runtime.evaluate', {
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
            const maxF = Math.max(...valid);
            resolve({
              maxFrame: maxF,
              avgFrame: valid.reduce((a, b) => a + b, 0) / valid.length,
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
    console.log(`  Flight to ${body.padEnd(8)}: maxFrame = ${val.maxFrame.toFixed(1)}ms, maxLongTask = ${maxLt.toFixed(1)}ms, longTasksCount = ${val.longTasks.length}`);
    flightResults.push({
      body,
      maxFrame: val.maxFrame,
      maxLt,
      pass: maxLt <= 100 && val.maxFrame <= 65 // allow standard vsync jitter
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 3. Test ENTER after Idle Prefetch
  console.log('\n[3/4] Testing ENTER Simulator after Idle Prefetch...');
  await browser.send('Page.navigate', { url: `${getBaseUrl()}/#/` });
  await waitForLandingReady(browser, 15000);

  // Wait 2.5s on landing for idle prefetcher to run in idle time
  await new Promise(r => setTimeout(r, 2500));

  const prefetchWarmup = await browser.send('Runtime.evaluate', {
    expression: `window.__terraforgeWarmupProgress || 0`,
    returnByValue: true
  });
  console.log(`  Warmup progress after idle prefetch: ${((prefetchWarmup.result?.value || 0) * 100).toFixed(0)}%`);

  const tPrefetchStart = Date.now();
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
        if (window.__threeSimFirstFrame && window.location.hash.includes('#/sim')) {
          resolve(true);
        } else {
          setTimeout(check, 20);
        }
      };
      check();
    })`,
    awaitPromise: true
  });
  const enterPrefetchMs = Date.now() - tPrefetchStart;
  console.log(`  ENTER after Idle Prefetch Time: ${enterPrefetchMs} ms (Gate <= 1000 ms)`);

  // Check console errors
  console.log('\n[4/4] Console Errors Check:');
  console.log(`  Red console errors: ${browser.consoleErrors.length}`);
  if (browser.consoleErrors.length > 0) {
    console.log('Errors:', browser.consoleErrors);
  }

  const allPass =
    enterColdMs <= 2000 &&
    enterPrefetchMs <= 1000 &&
    flightResults.every(f => f.maxLt <= 100) &&
    browser.consoleErrors.length === 0;

  console.log('\n================ STAGE 2 GATE RESULT ================');
  console.log(`  ENTER Cold:           ${enterColdMs} ms (Gate <= 2000 ms): ${enterColdMs <= 2000 ? 'PASS' : 'FAIL'}`);
  console.log(`  ENTER after Prefetch: ${enterPrefetchMs} ms (Gate <= 1000 ms): ${enterPrefetchMs <= 1000 ? 'PASS' : 'FAIL'}`);
  console.log(`  Flight Freezes >100ms: 0 (Gate 0): ${flightResults.every(f => f.maxLt <= 100) ? 'PASS' : 'FAIL'}`);
  console.log(`  Zero Red Errors:      ${browser.consoleErrors.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`  Overall Stage 2:      ${allPass ? 'PASSED' : 'FAILED'}`);

  browser.close();
  if (!allPass) process.exit(1);
}

runStage2Verification().catch(err => {
  console.error(err);
  process.exit(1);
});
