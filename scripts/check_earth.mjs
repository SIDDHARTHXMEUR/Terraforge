import { createBrowser } from './regress.mjs';

async function check() {
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 3000));
  const res = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const m = window.__earthBodyMesh;
      if (!m) return "no mesh";
      return {
        keys: Object.keys(m.material.uniforms),
        uTempAnomaly: m.material.uniforms.uTempAnomaly?.value,
        uSeaLevelDelta: m.material.uniforms.uSeaLevelDelta?.value
      };
    })()`,
    returnByValue: true
  });
  console.log('Uniforms check:', JSON.stringify(res.result.value, null, 2));
  await b.close();
}

check().catch(console.error);
