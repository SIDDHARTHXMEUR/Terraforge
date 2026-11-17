import { createBrowser, getBaseUrl } from './regress.mjs';

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

async function testBody(body) {
  const browser = await createBrowser(getBaseUrl() + `/#/sim/${body}`);
  await new Promise(r => setTimeout(r, 2500));
  const R = DISPLAY_RADII[body];
  const res = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const gl = window.__threeGl;
      const camera = window.__threeCamera;
      const group = window.__getThreeBodyGroup ? window.__getThreeBodyGroup('${body}') : null;
      if (!camera || !group) return { error: 'missing' };

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
  console.log(`Measure for ${body}:`, res.result?.value);
  browser.close();
}

async function run() {
  for (const b of ['mercury', 'venus', 'earth', 'jupiter', 'saturn', 'uranus']) {
    await testBody(b);
  }
}
run().catch(console.error);
