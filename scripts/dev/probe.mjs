// Print world positions of named objects at given frames: node scripts/dev/probe.mjs 900 handR shinL brush
import { chromium } from 'playwright';
import { createServer } from '../serve.js';
const [frame, ...names] = process.argv.slice(2);
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const video = process.env.VIDEO || (await import('node:fs')).readFileSync('videos/current.txt', 'utf8').trim();
await page.goto(`http://localhost:${server.address().port}/?video=${video}`); await page.waitForFunction(() => window.__animReady === true);
console.log(await page.evaluate(([f, names]) => { __anim.seek(f); const out = {}; for (const n of names) { const o = __dbg.scene.getObjectByName(n); if (o) { const v = o.getWorldPosition(o.position.clone()); out[n] = v.toArray().map(x => +x.toFixed(2)); } } return out; }, [Number(frame), names]));
await browser.close(); server.close();
