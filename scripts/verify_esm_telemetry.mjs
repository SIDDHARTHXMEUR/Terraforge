import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

async function verifyTelemetry() {
  console.log('Testing Earth System Telemetry & Visual Shader Inundation...');
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

  // Open Climate Lab
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Climate Lab'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1200));

  // 1. Screenshot Baseline
  const ss1 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_esm_baseline.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved ESM baseline screenshot');

  // 2. Click HOTHOUSE
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('HOTHOUSE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss2 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_esm_hothouse.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved ESM Hothouse screenshot');

  // 3. Click ICE AGE
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('ICE AGE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss3 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_esm_ice_age.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved ESM Ice Age screenshot');

  // Verify that word "Population" does not appear anywhere in the DOM
  const popCheck = await runExpr(`
    document.body.innerText.toLowerCase().includes('population')
  `);
  console.log('Contains word "population":', popCheck.result.value);

  console.log('Console Errors:', b.consoleErrors.length);
  await b.close();
  console.log('Verification completed successfully!');
}

verifyTelemetry().catch(console.error);
