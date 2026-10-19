import { chromium } from 'playwright';
import { createServer } from '../serve.js';
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('console:', m.text()));
page.on('pageerror', e => console.log('ERR', e.message));
const video = process.env.VIDEO || (await import('node:fs')).readFileSync('videos/current.txt', 'utf8').trim();
await page.goto(`http://localhost:${server.address().port}/?video=${video}`);
await page.waitForFunction(() => window.__animReady === true);
console.log(await page.evaluate(() => {
  __anim.seek(59);
  const out = [];
  __dbg.scene.traverse(o => { if (o.name === 'hero' || o.name === 'head' || o.name === 'torso') { const p = o.getWorldPosition(o.position.clone()); out.push([o.name, o.visible, p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2), o.geometry ? o.geometry.attributes.position.count : '-']); } });
  out.push(['cam', __dbg.camera.position.toArray().map(v=>v.toFixed(2))]);
  return out;
}));
await browser.close(); server.close();
