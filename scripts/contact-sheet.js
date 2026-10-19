// Builds out/contact-sheet.png: one thumbnail every N frames across the whole video,
// plus out/qa/*.png stills around every scene boundary listed in --cuts=1.5,4,...
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argValue } from './args.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const video = argValue(args, 'video') || fs.readFileSync(path.join(ROOT, 'videos/current.txt'), 'utf8').trim();
const OUT = path.join(ROOT, 'out', video);
const mp4 = path.join(OUT, argValue(args, 'in') || 'final-animation.mp4');
const every = Number(argValue(args, 'every') || 30);
const cols = Number(argValue(args, 'cols') || 6);
const cuts = (argValue(args, 'cuts') || '').split(',').filter(Boolean).map(Number);
const nb = Number(execSync(`ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "${mp4}"`).toString().trim());
const rows = Math.ceil(nb / every / cols);
execSync(`ffmpeg -y -loglevel error -i "${mp4}" -vf "select='not(mod(n\\,${every}))',scale=180:-1,tile=${cols}x${rows}:padding=4:margin=4" -frames:v 1 "${path.join(OUT, 'contact-sheet.png')}"`);
console.log(`contact sheet: ${nb} frames, every ${every} -> out/${video}/contact-sheet.png`);
const qa = path.join(OUT, 'qa'); fs.mkdirSync(qa, { recursive: true });
for (const c of cuts) for (const d of [-0.1, 0.1]) {
  const t = Math.max(0, c + d);
  execSync(`ffmpeg -y -loglevel error -ss ${t} -i "${mp4}" -frames:v 1 "${path.join(qa, `cut_${c}_${d < 0 ? 'before' : 'after'}.png`)}"`);
}
if (cuts.length) console.log(`cut stills in out/${video}/qa/`);
