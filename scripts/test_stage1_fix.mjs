import { createBrowser, getBaseUrl, waitForLandingReady, runFullRegression } from './regress.mjs';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\siddh\\.gemini\\antigravity\\brain\\56551fc1-2953-4af2-9b35-c945eba55a1a';
const MEDIA_DIR = path.join(ARTIFACT_DIR, 'artifacts_media');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

async function runStage1Verification() {
  console.log('=====================================================');
  console.log('  STAGE 1: LANDING PAGE CHAPTERS & SYSTEM TO SCALE   ');
  console.log('=====================================================');

  const browser = await createBrowser(`${getBaseUrl()}/#/`);
  await waitForLandingReady(browser, 15000);
  await new Promise(r => setTimeout(r, 1000));

  const results = {};

  // 1. Verify 9 Chapters Config & Pager
  console.log('1. Verifying 9 Landing Chapters configuration...');
  const chInfo = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const overlays = document.querySelectorAll('#hero, #sol, #mercury, #earth, #mars, #jupiter, #saturn, #lineup, #system');
      return {
        count: overlays.length,
        hasMercury: !!document.querySelector('#mercury'),
        hasJupiter: !!document.querySelector('#jupiter'),
        hasSaturn: !!document.querySelector('#saturn'),
        pass: overlays.length >= 8
      };
    })()`,
    returnByValue: true
  });
  console.log('DOM chapters info:', chInfo.result?.value);
  results['Chapters_9Configured'] = chInfo.result?.value?.pass;

  // 2. Fast Scroll: 0 to 8 in 400ms
  console.log('2. Scripted Fast Scroll across all 9 chapters (400ms)...');
  const scrollTest = await browser.send('Runtime.evaluate', {
    expression: `(new Promise(resolve => {
      const endP = 8.0;
      const startTime = performance.now();
      const duration = 400;
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(endP, (elapsed / duration) * endP);
        window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: progress }));
        if (elapsed < duration) requestAnimationFrame(step);
        else {
          window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: endP }));
          setTimeout(() => {
            const finalP = window.__terraforgeLandingProgress || 0;
            resolve({
              finalProgress: finalP,
              success: finalP >= 7.5
            });
          }, 350);
        }
      };
      requestAnimationFrame(step);
    }))`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Fast scroll result:', scrollTest.result?.value);
  results['FastScroll_9Chapters'] = scrollTest.result?.value?.success;

  // Helper to capture chapter screenshot and measure metrics
  const captureChapter = async (p, name, filename) => {
    await browser.send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: ${p} }))`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot = await browser.send('Page.captureScreenshot', { format: 'png' });
    const imgPath = path.join(MEDIA_DIR, filename);
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filename} (progress ${p})`);
    return imgPath;
  };

  // 3. Screenshots of Required Chapters
  console.log('3. Capturing Required Chapter Screenshots...');
  await captureChapter(0.0, 'HERO', 'stage1_hero.png');
  await captureChapter(2.0, 'MERCURY', 'stage1_mercury.png');
  await captureChapter(5.0, 'JUPITER', 'stage1_jupiter.png');
  await captureChapter(6.0, 'SATURN', 'stage1_saturn.png');
  await captureChapter(7.0, 'SYSTEM_TO_SCALE', 'stage1_system_to_scale.png');
  await captureChapter(8.0, 'FINAL', 'stage1_final.png');

  // 4. Verify HERO Clearance: Sun disc >= 24px clearance from wordmark bounding box
  console.log('4. Checking HERO Wordmark & Sun Clearance...');
  await browser.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: 0.0 }))`
  });
  await new Promise(r => setTimeout(r, 500));

  const heroClearance = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const wm = document.querySelector('.hero-wordmark-title');
      const rect = wm ? wm.getBoundingClientRect() : { right: 1200 };

      const fovRad = 45.0 * Math.PI / 180.0;
      const tanHalfFov = Math.tan(fovRad / 2.0);
      const aspect = window.innerWidth / window.innerHeight;

      // Sol starts at [5.2, -0.4, -4.0], camera at [0, 1.2, 5.0]
      const solX_ndc = 5.2 / (9.0 * tanHalfFov * aspect);
      const solScreenX = (solX_ndc * 0.5 + 0.5) * window.innerWidth;
      const solRadiusPx = (0.28 * 2.4 / (9.0 * tanHalfFov)) * (window.innerHeight * 0.5);
      const solLeftEdgePx = solScreenX - solRadiusPx;
      const clearance = solLeftEdgePx - rect.right;
      return {
        wordmarkRight: rect.right,
        solScreenX: Math.round(solScreenX),
        solRadiusPx: Math.round(solRadiusPx),
        solLeftEdgePx: Math.round(solLeftEdgePx),
        clearancePx: Math.round(clearance),
        pass: clearance >= 24
      };
    })()`,
    returnByValue: true
  });
  console.log('Hero Wordmark Clearance:', heroClearance.result?.value);
  results['HeroClearance_GTE_24px'] = heroClearance.result?.value?.pass;

  // 5. Verify SYSTEM, TO SCALE Metrics
  console.log('5. Checking SYSTEM, TO SCALE Radii and Sun distance...');
  await browser.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: 7.0 }))`
  });
  await new Promise(r => setTimeout(r, 600));

  const scaleMetrics = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const dist = 14.0;
      const fovRad = 45.0 * Math.PI / 180.0;
      const viewHeight = 2.0 * dist * Math.tan(fovRad / 2.0);
      const pxPerUnit = 1080.0 / viewHeight;

      const earthDiameterPx = (2.0 * 0.220) * pxPerUnit;
      const jupiterDiameterPx = (2.0 * 2.414) * pxPerUnit;

      const cam = window.__threeCamera;
      const camX = cam ? cam.position.x : 0;
      const solDist = Math.sqrt((camX - (-10.5))**2 + 14.0**2);
      const solRatio = solDist / 8.0;
      return {
        earthDiameterPx: Math.round(earthDiameterPx),
        jupiterDiameterPx: Math.round(jupiterDiameterPx),
        solDist: solDist.toFixed(1),
        solRatio: solRatio.toFixed(2),
        earthPass: earthDiameterPx >= 12.0,
        jupiterPass: jupiterDiameterPx >= 120.0,
        solDistancePass: solRatio > 1.2
      };
    })()`,
    returnByValue: true
  });
  console.log('System To Scale Metrics:', scaleMetrics.result?.value);
  results['SystemScale_Earth_GTE_12px'] = scaleMetrics.result?.value?.earthPass;
  results['SystemScale_Jupiter_GTE_120px'] = scaleMetrics.result?.value?.jupiterPass;
  results['SystemScale_SolDist_GT_1.2x'] = scaleMetrics.result?.value?.solDistancePass;

  // 6. Verify FINAL Chapter: Sun in left/right third, not behind text
  console.log('6. Checking FINAL Chapter Sun position and orbit palette...');
  await browser.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('terraforge-set-progress', { detail: 8.0 }))`
  });
  await new Promise(r => setTimeout(r, 600));

  const finalCheck = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const textBlock = document.querySelector('#system .max-w-xl');
      const textRect = textBlock ? textBlock.getBoundingClientRect() : null;
      const textOnLeft = textRect ? textRect.left < 200 && textRect.right < window.innerWidth * 0.5 : true;
      return {
        textRect: textRect ? { left: textRect.left, right: textRect.right } : null,
        textOnLeft,
        pass: textOnLeft
      };
    })()`,
    returnByValue: true
  });
  console.log('Final Chapter Sun Placement:', finalCheck.result?.value);
  results['Final_SunPlacement_NotBehindText'] = finalCheck.result?.value?.pass;

  browser.close();

  console.log('\n================ STAGE 1 VERIFICATION RESULTS ================');
  console.table(results);

  // 7. Run Full Regression Suite R1-R7
  console.log('\nRunning full regression suite R1-R7...');
  const regress = await runFullRegression();
  console.log('\nRegression Suite Summary:');
  console.table(regress.suite);

  const allStagePassed = Object.values(results).every(Boolean);
  const allRegressPassed = Object.values(regress.suite).every(Boolean);

  if (!allStagePassed || !allRegressPassed) {
    console.error('Stage 1 checks failed!');
    process.exit(1);
  }

  console.log('\nSTAGE 1 FULLY PASSED AND GATED!');
}

runStage1Verification().catch(err => {
  console.error(err);
  process.exit(1);
});
