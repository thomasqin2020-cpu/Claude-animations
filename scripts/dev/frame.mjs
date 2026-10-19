// Usage: node scripts/dev/frame.mjs 0 60 150 ... -> writes out/dev/f<N>.png and prints validation
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createServer } from '../serve.js';
const frames = process.argv.slice(2).map(Number);
fs.mkdirSync('out/dev', { recursive: true });
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => { if (!m.text().includes('404')) console.log('console:', m.text()); });
page.on('pageerror', e => console.log('PAGE ERROR', e.message));
const video = process.env.VIDEO || (await import('node:fs')).readFileSync('videos/current.txt', 'utf8').trim();
await page.goto(`http://localhost:${server.address().port}/?video=${video}`);
await page.waitForFunction(() => window.__animReady === true);
for (const f of frames) {
  const r = await page.evaluate((fr) => { try { __anim.seek(fr); const v = __anim.validate(); v.cam = __dbg.camera.position.toArray().map(x => +x.toFixed(2)); return v; } catch (e) { return { error: e.stack }; } }, f);
  console.log(f, JSON.stringify(r));
  const d = await page.evaluate(() => __anim.capture());
  fs.writeFileSync(`out/dev/f${String(f).padStart(4, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
}
await browser.close(); server.close();
