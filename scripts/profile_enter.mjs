import { createBrowser, getBaseUrl } from './regress.mjs';

async function profile() {
  const browser = await createBrowser(getBaseUrl() + '/#/');
  await new Promise(r => setTimeout(r, 2000));
  await browser.send('Profiler.enable');
  await browser.send('Profiler.start');

  await browser.send('Runtime.evaluate', {
    expression: 'window.location.hash = "#/sim"'
  });

  await new Promise(r => setTimeout(r, 3000));
  const res = await browser.send('Profiler.stop');
  browser.close();

  const profile = res.profile;
  const nodes = profile.nodes;
  const timeDeltas = profile.timeDeltas;
  const samples = profile.samples;
  const nodeTimes = {};
  for (let i = 0; i < samples.length; i++) {
    const id = samples[i];
    nodeTimes[id] = (nodeTimes[id] || 0) + (timeDeltas[i] || 0);
  }
  const heavy = nodes
    .map(n => ({
      name: n.callFrame.functionName || '(anonymous)',
      url: n.callFrame.url,
      line: n.callFrame.lineNumber,
      timeMs: (nodeTimes[n.id] || 0) / 1000
    }))
    .filter(n => n.timeMs > 30)
    .sort((a, b) => b.timeMs - a.timeMs);

  console.log('Heavy operations during ENTER:');
  console.table(heavy.slice(0, 15));
}

profile().catch(console.error);
