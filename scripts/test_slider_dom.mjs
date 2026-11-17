import { createBrowser } from './regress.mjs';

async function testDomSlider() {
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 3500));

  // Click Climate Lab
  await b.send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Climate Lab'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Find slider position
  const sliderBox = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="range"]');
      if (!input) return null;
      const rect = input.getBoundingClientRect();
      return { x: rect.x + rect.width * 0.75, y: rect.y + rect.height * 0.5 };
    })()`,
    returnByValue: true
  });
  console.log('Slider box:', sliderBox.result.value);

  // Click on the slider at 75% position
  if (sliderBox.result.value) {
    const { x, y } = sliderBox.result.value;
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left' });
  }
  await new Promise(r => setTimeout(r, 1000));

  // Read uniform value and HUD text
  const hudCheck = await b.send('Runtime.evaluate', {
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
      const scene = window.__threeScene;
      let earthMesh = null;
      scene.traverse(o => {
        if (o.isMesh && o.material?.uniforms?.uLandmask) earthMesh = o;
      });

      return {
        sliderValues: inputs.map(i => i.value),
        uTempAnomaly: earthMesh?.material?.uniforms?.uTempAnomaly?.value,
        uSeaLevelDelta: earthMesh?.material?.uniforms?.uSeaLevelDelta?.value
      };
    })()`,
    returnByValue: true
  });

  console.log('HUD and Uniform check after click:', hudCheck.result.value);
  await b.close();
}

testDomSlider().catch(console.error);
