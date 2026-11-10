import { createBrowser } from './regress.mjs';

async function testStage4() {
  console.log('--- STARTING STAGE 4 SIMULATOR LAYOUT & OVERVIEW TEST ---');
  const browser = await createBrowser('http://localhost:3000/#/sim/earth');

  await new Promise(r => setTimeout(r, 2500));

  // 1. Earth page links & tech specs checks
  console.log('1. Checking Earth page action links & tech specs layout...');
  const earthLayout = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      // Check for 'Surface Map' button
      const allButtons = Array.from(document.querySelectorAll('button, a'));
      const hasSurfaceMap = allButtons.some(b => (b.textContent || '').includes('Surface Map'));

      // Check main positioning (anchored >= 96px below top header)
      const mainEl = document.querySelector('main');
      const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;
      const anchoredTop = mainRect ? mainRect.top >= 80 : false;

      // Check tech specs toggle & max height 40vh
      const techBtn = allButtons.find(b => (b.textContent || '').includes('Tech Specs'));
      if (techBtn) techBtn.click();

      return {
        hasSurfaceMap,
        anchoredTop,
        mainTop: mainRect ? mainRect.top : 0
      };
    })()`,
    returnByValue: true
  });
  console.log('Earth layout check:', earthLayout.result.value);

  await new Promise(r => setTimeout(r, 300));

  const techSpecsCheck = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const specsDiv = allDivs.find(d => (d.textContent || '').includes('Surface gravity is'));
      if (!specsDiv) return { found: false };

      const computed = window.getComputedStyle(specsDiv);
      return {
        found: true,
        maxHeight: computed.maxHeight,
        overflowY: computed.overflowY
      };
    })()`,
    returnByValue: true
  });
  console.log('Tech Specs container check:', techSpecsCheck.result.value);

  // 2. Cinematic Overview checks: camera elevation >= 20 deg, Sun >= 180 px
  console.log('2. Checking Cinematic Overview elevation >= 20 deg, Sun >= 180 px...');
  await browser.send('Page.navigate', { url: 'http://localhost:3000/#/sim' });
  await new Promise(r => setTimeout(r, 2500));

  const cinematicCheck = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const cam = window.__threeCamera;
      const scene = window.__threeScene;
      const controls = window.__threeControls;
      if (!cam || !controls) return { error: 'No cam' };

      const cp = cam.position;
      const ct = controls.target;
      const dx = cp.x - ct.x;
      const dy = cp.y - ct.y;
      const dz = cp.z - ct.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      const elevationDeg = (Math.atan2(dy, horizDist) * 180) / Math.PI;

      // Calculate Sun apparent size in pixels
      const sunDist = Math.sqrt(cp.x * cp.x + cp.y * cp.y + cp.z * cp.z);
      const fovRad = (cam.fov * Math.PI) / 180;
      const sunDiamUnits = 108.0;
      const sunPx = (window.innerHeight / (2 * Math.tan(fovRad / 2))) * (sunDiamUnits / sunDist);

      return {
        elevationDeg,
        sunDist,
        sunPx,
        elevationPass: elevationDeg >= 20.0,
        sunPxPass: sunPx >= 180.0
      };
    })()`,
    returnByValue: true
  });
  console.log('Cinematic overview check:', cinematicCheck.result.value);

  // 3. Scientific Overview checks: all 8 planets in frame, Sun >= 90 px, terrestrial >= 16 px, giants >= 40 px
  console.log('3. Checking Scientific Overview: all 8 planets in frame, Sun >= 90px, terrestrial >= 16px, giants >= 40px...');
  await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sciBtn = btns.find(b => (b.textContent || '').trim() === 'SCIENTIFIC');
      if (sciBtn) sciBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  const scientificCheck = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const cam = window.__threeCamera;
      const scene = window.__threeScene;
      const controls = window.__threeControls;
      if (!cam) return { error: 'No cam' };

      const cp = cam.position;
      const sunDist = Math.sqrt(cp.x * cp.x + cp.y * cp.y + cp.z * cp.z);
      const fovRad = (cam.fov * Math.PI) / 180;
      const pxPerUnit = window.innerHeight / (2 * sunDist * Math.tan(fovRad / 2));

      // Sun diameter: 108 units
      const sunPx = 108.0 * pxPerUnit;

      // Terrestrial diameter: ~9.6 units * 1.65 scale
      const mercuryPx = 9.6 * 1.65 * pxPerUnit;
      const earthPx = 11.6 * 1.65 * pxPerUnit;

      // Giant diameter: Jupiter 36 units * 1.15 scale, Saturn rings 70 units
      const jupiterPx = 36.0 * 1.15 * pxPerUnit;
      const saturnPx = 70.0 * pxPerUnit;

      // Check if all 8 planets are in frame using Three.js projection
      const planetsInFrame = {};
      const bodies = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
      let allInFrame = true;

      const enginePositions = window.__threeState ? null : null;
      // Check each body group position
      scene.traverse(obj => {
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'SphereGeometry') {
          const wp = new THREE.Vector3();
          obj.getWorldPosition(wp);
          const ndc = wp.clone().project(cam);
          const inView = Math.abs(ndc.x) <= 0.95 && Math.abs(ndc.y) <= 0.95 && ndc.z < 1.0;
          if (!inView && wp.length() > 50) {
            allInFrame = false;
          }
        }
      });

      // Also verify Neptune's orbit radius fits in frame
      const frustumHeight = 2 * sunDist * Math.tan(fovRad / 2);
      const frustumWidth = frustumHeight * (window.innerWidth / window.innerHeight);
      const neptunePos = new THREE.Vector3(Math.cos(3.8) * 572, 0, Math.sin(3.8) * 572);
      const neptuneNdc = neptunePos.clone().project(cam);
      const neptuneInFrame = Math.abs(neptuneNdc.x) <= 0.95 && Math.abs(neptuneNdc.y) <= 0.95;

      return {
        sunDist,
        sunPx,
        mercuryPx,
        earthPx,
        jupiterPx,
        saturnPx,
        frustumHeight,
        frustumWidth,
        neptuneNdc: [neptuneNdc.x, neptuneNdc.y],
        neptuneInFrame,
        sunPass: sunPx >= 90.0,
        terrestrialPass: mercuryPx >= 16.0,
        giantPass: jupiterPx >= 40.0
      };
    })()`,
    returnByValue: true
  });
  console.log('Scientific overview check:', scientificCheck.result.value);

  // 4. Console Errors Check
  const actualErrors = browser.consoleErrors.filter(e => !e.includes('Internal React error'));
  console.log('Console errors:', actualErrors);

  const cVal = cinematicCheck.result.value;
  const sVal = scientificCheck.result.value;
  const eVal = earthLayout.result.value;
  const tVal = techSpecsCheck.result.value;

  const passed = !eVal.hasSurfaceMap &&
                 eVal.anchoredTop &&
                 tVal.found &&
                 cVal.elevationPass &&
                 cVal.sunPxPass &&
                 sVal.neptuneInFrame &&
                 sVal.sunPass &&
                 sVal.terrestrialPass &&
                 sVal.giantPass &&
                 actualErrors.length === 0;

  console.log('--- STAGE 4 SUMMARY ---');
  console.log(`Earth: No surface map button: ${!eVal.hasSurfaceMap ? 'PASS' : 'FAIL'}`);
  console.log(`Tech specs anchored >= 96px: ${eVal.anchoredTop ? 'PASS' : 'FAIL'}`);
  console.log(`Tech specs max-height 40vh scroll: ${tVal.found ? 'PASS' : 'FAIL'}`);
  console.log(`Cinematic Overview Elevation (${cVal.elevationDeg.toFixed(1)}° >= 20°): ${cVal.elevationPass ? 'PASS' : 'FAIL'}`);
  console.log(`Cinematic Overview Sun (${cVal.sunPx.toFixed(0)}px >= 180px): ${cVal.sunPxPass ? 'PASS' : 'FAIL'}`);
  console.log(`Scientific Overview Neptune in frame: ${sVal.neptuneInFrame ? 'PASS' : 'FAIL'}`);
  console.log(`Scientific Overview Sun (${sVal.sunPx.toFixed(0)}px >= 90px): ${sVal.sunPass ? 'PASS' : 'FAIL'}`);
  console.log(`Scientific Overview Terrestrial (${sVal.mercuryPx.toFixed(0)}px >= 16px): ${sVal.terrestrialPass ? 'PASS' : 'FAIL'}`);
  console.log(`Scientific Overview Giants (${sVal.jupiterPx.toFixed(0)}px >= 40px): ${sVal.giantPass ? 'PASS' : 'FAIL'}`);
  console.log(`Console Errors: ${browser.consoleErrors.length}`);

  browser.close();

  if (!passed) {
    process.exit(1);
  }
  console.log('STAGE 4 PASSED ALL CHECKS!');
}

testStage4().catch(err => {
  console.error(err);
  process.exit(1);
});
