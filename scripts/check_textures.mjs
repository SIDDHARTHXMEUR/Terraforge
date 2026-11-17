import { createBrowser } from './regress.mjs';

async function check() {
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 4000));
  const res = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const scene = window.__threeScene;
      if (!scene) return 'no scene';
      let found = null;
      scene.traverse(o => {
        if (o.isMesh && o.material?.uniforms?.uLandmask) found = o;
      });
      if (!found) return 'no earth mesh';
      const u = found.material.uniforms;
      return {
        uTempAnomaly: u.uTempAnomaly?.value,
        uSeaLevelDelta: u.uSeaLevelDelta?.value,
        hasAlbedoImg: !!u.uAlbedo?.value?.image,
        hasBumpImg: !!u.uBumpMap?.value?.image,
        hasLandmaskImg: !!u.uLandmask?.value?.image
      };
    })()`,
    returnByValue: true
  });
  console.log('Result:', JSON.stringify(res, null, 2));
  await b.close();
}

check().catch(console.error);
