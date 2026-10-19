// Headless scene-graph validation without rendering a video.
import { chromium } from 'playwright';
import { createServer } from './serve.js';
import fs from 'node:fs';
import { argValue } from './args.js';
const video = argValue(process.argv.slice(2), 'video') || fs.readFileSync('videos/current.txt', 'utf8').trim();
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exitCode = 1; });
await page.goto(`http://localhost:${server.address().port}/?video=${video}`);
await page.waitForFunction(() => window.__animReady === true);
const frames = await page.evaluate(() => __anim.frames);
let bad = 0;
for (let f = 0; f < frames; f += 15) {
  const v = await page.evaluate((fr) => { __anim.seek(fr); return __anim.validate(); }, f);
  if (v.problems.length) { bad++; console.error(`frame ${f}:`, v.problems); }
}
console.log(bad ? `${bad} frames with problems` : `all ${Math.ceil(frames / 15)} sampled frames valid`);
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
