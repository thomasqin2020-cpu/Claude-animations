// Builds out/contact-sheet.png: one thumbnail every N frames across the whole video,
// plus out/qa/*.png stills around every scene boundary listed in --cuts=1.5,4,...
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const mp4 = path.join(ROOT, 'out', (args.find((a) => a.startsWith('--in=')) || '--in=final-animation.mp4').split('=')[1]);
const every = Number((args.find((a) => a.startsWith('--every=')) || '--every=30').split('=')[1]);
const cols = Number((args.find((a) => a.startsWith('--cols=')) || '--cols=6').split('=')[1]);
const cuts = ((args.find((a) => a.startsWith('--cuts=')) || '--cuts=').split('=')[1] || '').split(',').filter(Boolean).map(Number);
const nb = Number(execSync(`ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "${mp4}"`).toString().trim());
const rows = Math.ceil(nb / every / cols);
execSync(`ffmpeg -y -loglevel error -i "${mp4}" -vf "select='not(mod(n\\,${every}))',scale=180:-1,tile=${cols}x${rows}:padding=4:margin=4" -frames:v 1 "${path.join(ROOT, 'out', 'contact-sheet.png')}"`);
console.log(`contact sheet: ${nb} frames, every ${every} -> out/contact-sheet.png`);
const qa = path.join(ROOT, 'out', 'qa'); fs.mkdirSync(qa, { recursive: true });
for (const c of cuts) for (const d of [-0.1, 0.1]) {
  const t = Math.max(0, c + d);
  execSync(`ffmpeg -y -loglevel error -ss ${t} -i "${mp4}" -frames:v 1 "${path.join(qa, `cut_${c}_${d < 0 ? 'before' : 'after'}.png`)}"`);
}
if (cuts.length) console.log(`cut stills in out/qa/`);
