"""Narration subtitles from videos/<slug>/narration.js.

Writes videos/<slug>/subtitles.srt (upload to YouTube as a caption track) and
out/<slug>/subtitles.ass, and with --burn renders out/<slug>/final-subtitled.mp4 from
out/<slug>/final-animation.mp4 (no 3D re-render; one ffmpeg pass).

script.txt spells numbers out for the voice ("eighteen sixty-one"); subtitles turn them
back into digits (1861, 600,000, $300,000,000, 57.5%). Long lines are split into one-line
chunks timed by character count so each chunk reads as a single line at the bottom.
  python3 scripts/subtitles.py --video <slug> [--burn] [--size 40] [--width 1920 --height 1080]
"""
import os, re, json, argparse, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--video', default=open(os.path.join(ROOT, 'videos/current.txt')).read().strip())
ap.add_argument('--burn', action='store_true')
ap.add_argument('--size', type=int, default=40)
ap.add_argument('--margin', type=int, default=26, help='pixels from the bottom edge')
ap.add_argument('--chars', type=int, default=64, help='max characters per subtitle line')
ap.add_argument('--width', type=int, default=1920)
ap.add_argument('--height', type=int, default=1080)
ap.add_argument('--crf', type=int, default=17)
args = ap.parse_args()

# ---------------------------------------------------------------- words -> digits
UNITS = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'twenty thirty forty fifty sixty seventy eighty ninety'.split()
NUM = {w: i for i, w in enumerate(UNITS)}; NUM.update({w: 20 + 10 * i for i, w in enumerate(TENS)})
SCALE = {'hundred': 100, 'thousand': 1000, 'million': 10**6, 'billion': 10**9}
PLURAL_TENS = {'twenties': 20, 'thirties': 30, 'forties': 40, 'fifties': 50, 'sixties': 60, 'seventies': 70, 'eighties': 80, 'nineties': 90}
CENT = {'seventeen': 17, 'eighteen': 18, 'nineteen': 19}

def split_punct(tok):
    m = re.match(r"^([\"'(]*)(.*?)([.,;:!?\"')]*)$", tok); return m.group(1), m.group(2), m.group(3)

def small(word):  # 'sixty-one' -> 61, 'seven' -> 7, else None
    w = word.lower()
    if w in NUM: return NUM[w]
    if '-' in w:
        a, b = w.split('-', 1)
        if a in NUM and b in NUM and NUM[a] >= 20 and NUM[b] < 10: return NUM[a] + NUM[b]
    return None

def year_at(toks, i):
    """'eighteen sixty-one' -> (1861, 2), 'eighteen oh four' -> 1804, 'eighteen hundred' -> 1800, 'eighteen forties' -> '1840s'."""
    pre, w0, post0 = split_punct(toks[i])
    if w0.lower() not in CENT or post0 or i + 1 >= len(toks): return None
    c = CENT[w0.lower()] * 100
    _, w1, post1 = split_punct(toks[i + 1]); l1 = w1.lower()
    if l1 == 'oh' and i + 2 < len(toks):
        _, w2, post2 = split_punct(toks[i + 2]); v = small(w2)
        if v is not None and v < 10: return pre + str(c + v) + post2, 3
    if l1 == 'hundred': return pre + str(c) + post1, 2
    if l1 in PLURAL_TENS: return pre + str(c + PLURAL_TENS[l1]) + 's' + post1, 2
    if '-' in l1 and l1.split('-')[1] in PLURAL_TENS and l1.split('-')[0] in NUM: return None
    v = small(w1)
    if v is not None and v >= 10: return pre + str(c + v) + post1, 2
    return None

def number_at(toks, i):
    """Greedy cardinal parse; converts only when the value is >= 100 or a % / $ unit follows."""
    total, cur, j, used, dec, last_post = 0.0, 0.0, i, 0, None, ''
    pre = split_punct(toks[i])[0]
    while j < len(toks):
        p, w, post = split_punct(toks[j]); l = w.lower()
        if p and j > i: break
        nxt = split_punct(toks[j + 1])[1].lower() if j + 1 < len(toks) else ''
        if small(w) is not None and dec is None: cur += small(w)
        elif l == 'a' and nxt in SCALE and used == 0: cur += 1
        elif l in SCALE and (used > 0 or cur > 0):
            if l == 'hundred': cur *= 100
            else: total += cur * SCALE[l]; cur = 0
        elif l == 'and' and used > 0 and nxt == 'a' and j + 2 < len(toks) and split_punct(toks[j + 2])[1].lower() in ('half', 'quarter'):
            q = split_punct(toks[j + 2]); cur += 0.5 if q[1].lower() == 'half' else 0.25; j += 3; used += 3; last_post = q[2]
            if last_post: break
            continue
        elif l == 'point' and used > 0 and small(nxt) is not None and small(nxt) < 10: dec = ''
        elif dec is not None and small(w) is not None and small(w) < 10: dec += str(small(w))
        else: break
        used += 1; j += 1; last_post = post
        if post: break
    if used == 0: return None
    val = total + cur
    if dec: val = float(f'{int(val)}.{dec}')
    unit = split_punct(toks[j])[1].lower() if j < len(toks) and not last_post else ''
    if val < 100 and unit not in ('percent', 'dollars'): return None
    s = f'{val:,.0f}' if float(val).is_integer() else (f'{val:,.2f}'.rstrip('0').rstrip('.'))
    if unit == 'percent':
        p2, _, post2 = split_punct(toks[j]); return pre + s + '%' + post2, used + 1
    if unit == 'dollars':
        p2, _, post2 = split_punct(toks[j]); return pre + '$' + s + post2, used + 1
    return pre + s + last_post, used

def digits(text):
    toks, out, i = text.split(' '), [], 0
    while i < len(toks):
        r = year_at(toks, i) or number_at(toks, i)
        if r: out.append(r[0]); i += r[1]
        else: out.append(toks[i]); i += 1
    return ' '.join(out)

# ---------------------------------------------------------------- chunks and files
src = open(os.path.join(ROOT, 'videos', args.video, 'narration.js')).read()
N = json.loads(src[src.index('{'): src.rindex('}') + 1])

def chunks(text, n):
    words, lines, cur = text.split(), [], ''
    for w in words:
        if cur and len(cur) + 1 + len(w) > n: lines.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    if cur: lines.append(cur)
    if len(lines) > 1 and len(lines[-1]) < 14:  # avoid an orphan word on its own card
        last = lines.pop(); lines[-1] += ' ' + last
    return lines

events = []
for c in N['cues']:
    text = digits(c['text']); parts = chunks(text, args.chars)
    total = sum(len(p) for p in parts); t = c['start']; dur = c['end'] - c['start']
    for k, p in enumerate(parts):
        d = dur * len(p) / total
        end = c['end'] if k == len(parts) - 1 else t + d
        events.append((t, end + (0.25 if k == len(parts) - 1 else 0), p)); t += d
# never let a lingering end overlap the next start
events = [(s, min(e, events[k + 1][0] - 0.02) if k + 1 < len(events) else e, p) for k, (s, e, p) in enumerate(events)]

def srt_t(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return f'{int(h):02}:{int(m):02}:{int(s):02},{int(round((s - int(s)) * 1000)):03}'
def ass_t(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return f'{int(h)}:{int(m):02}:{s:05.2f}'

vdir = os.path.join(ROOT, 'videos', args.video); odir = os.path.join(ROOT, 'out', args.video); os.makedirs(odir, exist_ok=True)
with open(os.path.join(vdir, 'subtitles.srt'), 'w') as f:
    for k, (s, e, p) in enumerate(events, 1): f.write(f'{k}\n{srt_t(s)} --> {srt_t(e)}\n{p}\n\n')
ass = os.path.join(odir, 'subtitles.ass')
with open(ass, 'w') as f:
    f.write(f'[Script Info]\nScriptType: v4.00+\nPlayResX: {args.width}\nPlayResY: {args.height}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n')
    f.write('[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n')
    f.write(f'Style: Sub,Inter,{args.size},&H00FFFFFF,&H00FFFFFF,&H00101010,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,60,60,{args.margin},1\n\n')
    f.write('[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n')
    for s, e, p in events: f.write(f'Dialogue: 0,{ass_t(s)},{ass_t(e)},Sub,,0,0,0,,{p}\n')
print(f'{len(events)} subtitle cards from {len(N["cues"])} cues -> videos/{args.video}/subtitles.srt, out/{args.video}/subtitles.ass')

if args.burn:
    src_mp4, dst = os.path.join(odir, 'final-animation.mp4'), os.path.join(odir, 'final-subtitled.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src_mp4, '-vf', f'ass={ass}', '-c:v', 'libx264', '-preset', 'medium',
                    '-crf', str(args.crf), '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)
    print('wrote', dst)
