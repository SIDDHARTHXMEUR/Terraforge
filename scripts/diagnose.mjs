import { createBrowser } from './regress.mjs';

async function diagnose() {
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 4000));
  
  const evalResult = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const scene = window.__threeScene;
      if (!scene) return { status: 'no three scene' };
      
      const meshes = [];
      scene.traverse(obj => {
        if (obj.isMesh) {
          meshes.push({
            name: obj.name,
            matType: obj.material?.type,
            hasUniforms: !!obj.material?.uniforms,
            uniformKeys: obj.material?.uniforms ? Object.keys(obj.material.uniforms) : []
          });
        }
      });
      return { status: 'ok', meshCount: meshes.length, meshes };
    })()`,
    returnByValue: true
  });
  console.log('Diagnosis:', JSON.stringify(evalResult.result.value, null, 2));
  console.log('Console Errors:', b.consoleErrors);
  await b.close();
}

diagnose().catch(console.error);
