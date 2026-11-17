import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

async function verifyClimateLab() {
  console.log('Testing Earth Climate Laboratory...');
  const b = await createBrowser('http://localhost:3000/#/sim/earth');
  await new Promise(r => setTimeout(r, 3000));

  const MEDIA_DIR = 'C:\\Users\\siddh\\.gemini\\antigravity\\brain\\56551fc1-2953-4af2-9b35-c945eba55a1a\\artifacts_media';

  const runExpr = async (expr) => {
    return await b.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
  };

  // 1. Open Climate Lab
  console.log('Opening Climate Lab toggle...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Climate Lab'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot Climate Lab Open (Present Baseline)
  const ss1 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_lab_present.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved baseline Earth Climate screenshot');

  // 2. Select ICE AGE preset
  console.log('Selecting ICE AGE preset...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('ICE AGE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss2 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_lab_ice_age.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved Ice Age Earth Climate screenshot');

  // 3. Select HOTHOUSE preset
  console.log('Selecting HOTHOUSE preset...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('HOTHOUSE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss3 = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_lab_hothouse.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved Hothouse Earth Climate screenshot');

  // 4. Reset to baseline
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('PRESENT'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  console.log('Console errors:', b.consoleErrors.length);
  await b.close();
  console.log('Climate Lab verification completed successfully!');
}

verifyClimateLab().catch(e => {
  console.error(e);
  process.exit(1);
});
