import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

async function verifyClimateLab() {
  console.log('Testing Enhanced Earth Climate Laboratory & Impact Card...');
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 3500));

  const MEDIA_DIR = 'C:\\Users\\siddh\\.gemini\\antigravity\\brain\\56551fc1-2953-4af2-9b35-c945eba55a1a\\artifacts_media';

  const runExpr = async (expr) => {
    return await b.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
  };

  // 1. Open Climate Lab
  console.log('Clicking Climate Lab toggle...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Climate Lab'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Baseline with both cards
  const ss1 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_impact_present.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved baseline with Impact Card');

  // 2. Set Temp Anomaly to +5°C (Hothouse warming)
  console.log('Setting temp anomaly to +5°C...');
  await runExpr(`
    (() => {
      const input = document.querySelector('input[type="range"]');
      if (input) {
        input.value = "5";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss2 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_impact_plus5.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved +5°C warming screenshot');

  // 3. Click ICE AGE preset
  console.log('Selecting ICE AGE preset...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('ICE AGE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss3 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_impact_ice_age.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved Ice Age screenshot');

  console.log('Console errors:', b.consoleErrors.length);
  await b.close();
  console.log('Verification completed successfully!');
}

verifyClimateLab().catch(e => {
  console.error(e);
  process.exit(1);
});
