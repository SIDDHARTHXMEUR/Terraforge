import { createBrowser } from './regress.mjs';
import fs from 'fs';
import path from 'path';

async function testHothouse() {
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

  // Click HOTHOUSE preset button
  console.log('Clicking HOTHOUSE button...');
  await runExpr(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('HOTHOUSE'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
  const ss = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(MEDIA_DIR, 'earth_climate_impact_hothouse.png'), Buffer.from(ss.data, 'base64'));
  console.log('Saved Hothouse screenshot');

  await b.close();
}

testHothouse().catch(console.error);
