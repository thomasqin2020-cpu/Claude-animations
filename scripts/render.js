// Headless deterministic render: seeks every frame via window.__anim.seek(f),
// pulls the PNG, and pipes it straight into FFmpeg (H.264, yuv420p). Frames never
// touch the disk unless --frames is passed (then a sparse set is kept for QA).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from './serve.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const args = process.argv.slice(2);
const keepFrames = args.includes('--frames');
const startArg = Number((args.find((a) => a.startsWith('--start=')) || '--start=0').split('=')[1]);
const endArg = args.find((a) => a.startsWith('--end='));
const outName = (args.find((a) => a.startsWith('--out=')) || '--out=final-animation.mp4').split('=')[1];
const audio = (args.find((a) => a.startsWith('--audio=')) || '--audio=').split('=')[1] || findAudio();

function findAudio() {
  const dir = path.join(ROOT, 'audio');
  if (!fs.existsSync(dir)) return '';
  const f = fs.readdirSync(dir).find((n) => /\.(mp3|wav|m4a|aac|ogg)$/i.test(n));
  return f ? path.join(dir, f) : '';
}

fs.mkdirSync(OUT, { recursive: true });
if (keepFrames) fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });

const server = createServer();
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exitCode = 1; });
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__animReady === true, null, { timeout: 60000 });
const info = await page.evaluate(() => ({ fps: __anim.fps, frames: __anim.frames, duration: __anim.duration }));
const endFrame = endArg ? Number(endArg.split('=')[1]) : info.frames;
console.log(`timeline: ${info.duration}s, ${info.frames} frames @ ${info.fps}fps; rendering ${startArg}..${endFrame - 1}`);

const validation = await page.evaluate(() => { __anim.seek(0); return __anim.validate(); });
console.log('validation @ frame 0:', JSON.stringify(validation));
if (validation.problems.length) { console.error('Validation failed'); process.exit(1); }

const mp4 = path.join(OUT, outName);
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-i', '-',
  ...(audio ? ['-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k'] : []),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(info.fps), '-movflags', '+faststart',
  mp4
], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = startArg; f < endFrame; f++) {
  const dataUrl = await page.evaluate((frame) => { __anim.seek(frame); return __anim.capture(); }, f);
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (keepFrames && (f % 15 === 0 || f === endFrame - 1)) fs.writeFileSync(path.join(OUT, 'frames', `f${String(f).padStart(5, '0')}.png`), buf);
  if (f % 30 === 0) {
    const v = await page.evaluate(() => __anim.validate());
    if (v.problems.length) { console.error(`validation problems at frame ${f}:`, v.problems); process.exitCode = 1; }
    const el = (Date.now() - t0) / 1000;
    console.log(`frame ${f}/${endFrame}  ${el.toFixed(0)}s elapsed  (${(el / Math.max(1, f - startArg + 1) * (endFrame - f)).toFixed(0)}s left)  chars=${v.characterCount} tris=${v.triangles}`);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
server.close();
console.log(`wrote ${mp4}${audio ? ' (with audio: ' + path.basename(audio) + ')' : ' (silent)'}`);
