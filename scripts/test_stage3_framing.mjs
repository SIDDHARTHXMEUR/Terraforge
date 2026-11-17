import { createBrowser, getBaseUrl } from './regress.mjs';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\siddh\\.gemini\\antigravity\\brain\\56551fc1-2953-4af2-9b35-c945eba55a1a';
const MEDIA_DIR = path.join(ARTIFACT_DIR, 'artifacts_media');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

const DISPLAY_RADII = {
  mercury: 4.8,
  venus: 5.4,
  earth: 5.8,
  mars: 4.8,
  jupiter: 18.0,
  saturn: 15.0,
  uranus: 9.2,
  neptune: 8.8
};

async function runStage3Verification() {
  console.log('=====================================================');
  console.log('   STAGE 3: SIMULATOR FRAMING & DRIFT VERIFICATION    ');
  console.log('=====================================================');

  const browser = await createBrowser(`${getBaseUrl()}/#/sim`);
  await new Promise(r => setTimeout(r, 2000));

  const testBodies = ['mercury', 'venus', 'earth', 'jupiter', 'saturn', 'uranus'];
  const framingResults = [];

  for (const body of testBodies) {
    console.log(`\nNavigating to ${body.toUpperCase()}...`);
    await browser.send('Runtime.evaluate', {
      expression: `window.location.hash = '#/sim/${body}'`
    });

    // Wait 2.0s for arrival and settling
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot
    const shot = await browser.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(MEDIA_DIR, `stage3_${body}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`  Saved screenshot: stage3_${body}.png`);

    const R = DISPLAY_RADII[body];
    const measure = await browser.send('Runtime.evaluate', {
      expression: `(() => {
        const gl = window.__threeGl;
        const camera = window.__threeCamera;
        const group = window.__getThreeBodyGroup ? window.__getThreeBodyGroup('${body}') : null;
        if (!camera || !group) return { error: 'No group or camera' };

        const worldPos = new THREE.Vector3();
        group.getWorldPosition(worldPos);

        const dist = camera.position.distanceTo(worldPos);
        const fovRad = (camera.fov * Math.PI) / 180;
        const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * camera.aspect);
        const angularDiam = 2 * Math.atan(${R} / dist);
        const widthFraction = angularDiam / hFovRad;

        const ndc = worldPos.clone().project(camera);
        const screenX = (ndc.x + 1) / 2;
        const planetLeftLimb = screenX - (widthFraction / 2);
        const textClearance = planetLeftLimb - 0.22;

        const sunPos = new THREE.Vector3(0, 0, 0);
        const sunDist = camera.position.distanceTo(sunPos);
        const sunAngle = 2 * Math.atan(54.0 / sunDist);
        const sunNdc = sunPos.clone().project(camera);
        const sunInView = Math.abs(sunNdc.x) <= 1.0 && Math.abs(sunNdc.y) <= 1.0 && sunNdc.z > 0;
        const sunViewportWidthFraction = sunInView ? (sunAngle / hFovRad) : 0.0;

        return {
          dist,
          widthFraction,
          screenX,
          planetLeftLimb,
          textClearance,
          sunInView,
          sunViewportWidthFraction
        };
      })()`,
      returnByValue: true
    });

    const m = measure.result?.value || {};
    const widthPct = ((m.widthFraction || 0) * 100).toFixed(1);
    const clearancePct = ((m.textClearance || 0) * 100).toFixed(1);
    const sunPct = ((m.sunViewportWidthFraction || 0) * 100).toFixed(1);

    const isGasGiant = body === 'jupiter' || body === 'saturn';
    const minWidth = 0.40;
    const maxWidth = isGasGiant ? 0.60 : 0.55;
    const widthPass = m.widthFraction >= minWidth && m.widthFraction <= maxWidth;
    const clearancePass = m.textClearance >= 0.03;
    const sunPass = m.sunViewportWidthFraction <= 0.10;

    console.log(`  Planet Width:    ${widthPct}% (Target: 40% - ${isGasGiant ? '60%' : '55%'}): ${widthPass ? 'PASS' : 'FAIL'}`);
    console.log(`  Screen X Center: ${((m.screenX || 0) * 100).toFixed(1)}% (Right Half >= 50%): ${m.screenX >= 0.5 ? 'PASS' : 'FAIL'}`);
    console.log(`  Text Clearance:  ${clearancePct}% (Target >= 3%): ${clearancePass ? 'PASS' : 'FAIL'}`);
    console.log(`  Sun in Viewport: ${sunPct}% (Target <= 10%): ${sunPass ? 'PASS' : 'FAIL'}`);

    framingResults.push({
      body,
      widthFraction: m.widthFraction,
      screenX: m.screenX,
      textClearance: m.textClearance,
      sunViewportWidthFraction: m.sunViewportWidthFraction,
      pass: widthPass && clearancePass && sunPass
    });
  }

  // 2. 10s Focus Drift Check on Earth
  console.log('\n--- EVALUATING 10s FOCUS DRIFT ON EARTH ---');
  await browser.send('Runtime.evaluate', { expression: `window.location.hash = '#/sim/earth'` });
  await new Promise(r => setTimeout(r, 2000));

  const driftT0 = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const camera = window.__threeCamera;
      const group = window.__getThreeBodyGroup('earth');
      const worldPos = new THREE.Vector3();
      group.getWorldPosition(worldPos);
      const ndc0 = worldPos.clone().project(camera);
      const sunNdc0 = new THREE.Vector3(0,0,0).project(camera);
      return {
        screenX: (ndc0.x + 1) / 2,
        sunScreenX: (sunNdc0.x + 1) / 2,
        camPos: [camera.position.x, camera.position.y, camera.position.z]
      };
    })()`,
    returnByValue: true
  });

  console.log('  Waiting 10 seconds with zero user input to measure drift...');
  await new Promise(r => setTimeout(r, 10000));

  const driftT10 = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const camera = window.__threeCamera;
      const group = window.__getThreeBodyGroup('earth');
      const worldPos = new THREE.Vector3();
      group.getWorldPosition(worldPos);
      const ndc10 = worldPos.clone().project(camera);
      const sunNdc10 = new THREE.Vector3(0,0,0).project(camera);
      return {
        screenX: (ndc10.x + 1) / 2,
        sunScreenX: (sunNdc10.x + 1) / 2,
        camPos: [camera.position.x, camera.position.y, camera.position.z]
      };
    })()`,
    returnByValue: true
  });

  const d0 = driftT0.result?.value;
  const d10 = driftT10.result?.value;
  const planetCenterShift = Math.abs(d10.screenX - d0.screenX) * 100;
  const sunShift = Math.abs(d10.sunScreenX - d0.sunScreenX) * 100;

  console.log(`  Planet center shift over 10s: ${planetCenterShift.toFixed(3)}% (Gate < 0.5%): ${planetCenterShift < 0.5 ? 'PASS' : 'FAIL'}`);
  console.log(`  Sun screen shift over 10s:    ${sunShift.toFixed(3)}% (Gate fixed ~ 0%): ${sunShift < 0.5 ? 'PASS' : 'FAIL'}`);

  const driftPass = planetCenterShift < 0.5 && sunShift < 0.5;
  const allFramingPass = framingResults.every(r => r.pass) && driftPass;

  console.log('\n================ STAGE 3 SUMMARY ================');
  console.log(`  Framing targets (Mercury, Venus, Earth, Jupiter, Saturn, Uranus): ${framingResults.every(r => r.pass) ? 'PASS' : 'FAIL'}`);
  console.log(`  10s Zero Drift: ${driftPass ? 'PASS' : 'FAIL'}`);
  console.log(`  Overall Stage 3: ${allFramingPass ? 'PASSED' : 'FAILED'}`);

  browser.close();
  if (!allFramingPass) process.exit(1);
}

runStage3Verification().catch(err => {
  console.error(err);
  process.exit(1);
});
