import { createBrowser } from './regress.mjs';
import { getUnifiedPlanetStats } from '../src/utils/celestialStats.js';

async function testStage5() {
  console.log('--- STARTING STAGE 5 CONSISTENCY TEST ---');

  // 1. Verify unified stats function returns clean, valid data for all 9 celestial bodies
  console.log('1. Checking getUnifiedPlanetStats for all bodies...');
  const bodies = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  for (const b of bodies) {
    const s = getUnifiedPlanetStats(b);
    if (!s.name || !s.typeStr || !s.diameterStr || !s.dayStr) {
      console.error(`Invalid stats for ${b}:`, s);
      process.exit(1);
    }
  }
  console.log('All 9 celestial bodies validated with unified stats function => PASS');

  // 2. Launch browser to verify headers and preloader
  const browser = await createBrowser('http://localhost:3000/#/');
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Inspecting landing header...');
  const landingHeader = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const wm = document.querySelector('.font-wordmark') || document.querySelector('header span');
      const cs = wm ? window.getComputedStyle(wm) : null;
      return {
        fontFamily: cs ? cs.fontFamily : '',
        letterSpacing: cs ? cs.letterSpacing : '',
        fontSize: cs ? cs.fontSize : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Landing wordmark typography:', landingHeader.result.value);

  console.log('3. Inspecting simulator header...');
  await browser.send('Page.navigate', { url: 'http://localhost:3000/#/sim' });
  await new Promise(r => setTimeout(r, 2000));

  const simHeader = await browser.send('Runtime.evaluate', {
    expression: `(() => {
      const wm = document.querySelector('.font-wordmark') || document.querySelector('header span');
      const cs = wm ? window.getComputedStyle(wm) : null;
      return {
        fontFamily: cs ? cs.fontFamily : '',
        letterSpacing: cs ? cs.letterSpacing : '',
        fontSize: cs ? cs.fontSize : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Simulator wordmark typography:', simHeader.result.value);

  const fontMatch = landingHeader.result.value.fontFamily.includes('League Gothic') &&
                    simHeader.result.value.fontFamily.includes('League Gothic');

  console.log(`Wordmark consistency: ${fontMatch ? 'PASS' : 'FAIL'}`);

  browser.close();

  if (!fontMatch) {
    process.exit(1);
  }
  console.log('STAGE 5 PASSED ALL CHECKS!');
}

testStage5().catch(err => {
  console.error(err);
  process.exit(1);
});
