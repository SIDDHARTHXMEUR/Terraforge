import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

async function investigate() {
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 4000));

  const result = await b.send('Runtime.evaluate', {
    expression: `(() => {
      // Find all meshes in the scene
      const scene = window.__threeScene;
      if (!scene) return { error: 'No __threeScene' };

      let earthMesh = null;
      scene.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.uLandmask) {
          earthMesh = obj;
        }
      });

      if (!earthMesh) return { error: 'No earth mesh with uLandmask found in scene' };

      const u = earthMesh.material.uniforms;
      return {
        found: true,
        tempAnomalyUniform: u.uTempAnomaly ? u.uTempAnomaly.value : 'missing',
        seaLevelUniform: u.uSeaLevelDelta ? u.uSeaLevelDelta.value : 'missing',
        cloudCoverUniform: u.uCloudCover ? u.uCloudCover.value : 'missing',
        visible: earthMesh.visible,
        parentVisible: earthMesh.parent?.visible,
        parentParentVisible: earthMesh.parent?.parent?.visible,
        materialType: earthMesh.material.type
      };
    })()`,
    returnByValue: true
  });

  console.log('Earth mesh check:', JSON.stringify(result.result.value, null, 2));

  // Now, in the browser, let's change tempAnomaly via store and see if uniform changes
  const changeResult = await b.send('Runtime.evaluate', {
    expression: `(() => {
      // Find Zustand store if exposed or trigger via button
      const buttons = Array.from(document.querySelectorAll('button'));
      const labBtn = buttons.find(b => b.textContent && b.textContent.includes('Climate Lab'));
      if (labBtn) labBtn.click();
      return { labBtnFound: !!labBtn };
    })()`,
    returnByValue: true
  });
  console.log('Lab button click:', changeResult.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Now click ICE AGE button
  const iceResult = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const iceBtn = buttons.find(b => b.textContent && b.textContent.includes('ICE AGE'));
      if (iceBtn) iceBtn.click();
      return { iceBtnFound: !!iceBtn };
    })()`,
    returnByValue: true
  });
  console.log('Ice button click:', iceResult.result.value);

  await new Promise(r => setTimeout(r, 1500));

  // Check uniform values again
  const uniformAfter = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const scene = window.__threeScene;
      let earthMesh = null;
      scene.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.uLandmask) {
          earthMesh = obj;
        }
      });
      if (!earthMesh) return { error: 'No earth mesh' };
      const u = earthMesh.material.uniforms;
      return {
        uTempAnomaly: u.uTempAnomaly?.value,
        uSeaLevelDelta: u.uSeaLevelDelta?.value
      };
    })()`,
    returnByValue: true
  });
  console.log('Uniforms after ICE AGE:', uniformAfter.result.value);

  await b.close();
}

investigate().catch(console.error);
