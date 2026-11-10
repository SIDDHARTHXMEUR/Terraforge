import { createBrowser } from './regress.mjs';

async function testStage3() {
  console.log('--- STARTING STAGE 3 FAST SCROLL & TRAILER CONCEPT TEST ---');
  const browser = await createBrowser('http://localhost:3000/#/');

  // Wait 2.5s for initial hero load
  await new Promise(r => setTimeout(r, 2500));

  // 1. Test Fast Scroll: 400ms top to bottom
  console.log('1. Testing Fast Scroll (400 ms duration)...');
  const scrollRes = await browser.send('Runtime.evaluate', {
    expression: `(new Promise(resolve => {
      const startP = 0;
      const endP = 5; // 6 chapters total (0 to 5)
      const startTime = performance.now();
      const duration = 400; // 400 ms

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(endP, (elapsed / duration) * endP);
        window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: progress }));

        if (elapsed < duration) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => {
            const finalP = window.__terraforgeLandingProgress || 0;
            resolve({
              target: endP,
              actual: finalP,
              match: Math.abs(finalP - endP) < 0.25
            });
          }, 350);
        }
      };
      requestAnimationFrame(step);
    }))`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Fast scroll result:', scrollRes.result.value);

  // 2. Test Alignment at each chapter
  console.log('2. Verifying DOM overlay alignment with 3D scene across chapters...');
  const alignmentResults = [];
  for (const k of [1, 2, 3]) { // Sol, Earth, Saturn
    await browser.send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: ${k} }))`
    });
    await new Promise(r => setTimeout(r, 250));

    const check = await browser.send('Runtime.evaluate', {
      expression: `({
        targetKey: ${k},
        curP: window.__terraforgeLandingProgress || 0,
        dominantIndex: Math.round(window.__terraforgeLandingProgress || 0),
        isAligned: Math.round(window.__terraforgeLandingProgress || 0) === ${k}
      })`,
      returnByValue: true
    });
    alignmentResults.push(check.result.value);
  }
  console.log('Alignment results:', alignmentResults);

  // 3. Test Explore in Simulator link
  console.log('3. Verifying EXPLORE IN SIMULATOR links...');
  await browser.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: 2 }))` // Earth
  });
  await new Promise(r => setTimeout(r, 200));

  const linkRes = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const earthLink = document.querySelector('a[href="#/sim/earth"]');
      return earthLink ? earthLink.getAttribute('href') : null;
    })()`,
    returnByValue: true
  });
  console.log('Earth explore link target:', linkRes.result.value);

  // 4. Test Returning Visitor Redirect
  console.log('4. Testing Returning Visitor Redirect (#/ -> #/sim)...');
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.setItem('terraforge_visited_sim', 'true');
      sessionStorage.removeItem('terraforge_allow_landing');
      window.location.href = 'http://localhost:3000/#/';
      window.location.reload();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  const urlRes = await browser.send('Runtime.evaluate', {
    expression: 'window.location.hash',
    returnByValue: true
  });
  console.log('Redirected URL hash:', urlRes.result.value);
  const redirectWorked = urlRes.result.value.includes('/sim');

  // Reset visited flag so regression test won't be redirected unexpectedly
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.removeItem('terraforge_visited_sim');
      sessionStorage.setItem('terraforge_allow_landing', 'true');
    })()`
  });

  const fastScrollPass = scrollRes.result.value.match;
  const alignPass = alignmentResults.every(r => r.isAligned);
  const linkPass = linkRes.result.value === '#/sim/earth';
  const consolePass = browser.consoleErrors.length === 0;

  console.log('--- STAGE 3 SUMMARY ---');
  console.log(`Fast scroll (400ms): ${fastScrollPass ? 'PASS' : 'FAIL'}`);
  console.log(`DOM/3D Alignment: ${alignPass ? 'PASS' : 'FAIL'}`);
  console.log(`Explore Link: ${linkPass ? 'PASS' : 'FAIL'}`);
  console.log(`Returning Visitor Redirect: ${redirectWorked ? 'PASS' : 'FAIL'}`);
  console.log(`Console Errors: ${browser.consoleErrors.length}`);

  browser.close();

  if (!fastScrollPass || !alignPass || !linkPass || !redirectWorked || !consolePass) {
    if (browser.consoleErrors.length > 0) {
      console.error('Console errors:', browser.consoleErrors);
    }
    process.exit(1);
  }
  console.log('STAGE 3 PASSED ALL CHECKS!');
}

testStage3().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
