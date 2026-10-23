"""Synthesize videos/<slug>/script.txt line by line, write audio/narration.wav and narration.js
(cue start/end per line) so the master timeline is driven by the real audio.

Engines:
  elevenlabs  default whenever ELEVENLABS_API_KEY is set (environment or .env.local).
              --voice <voice_id> (default ELEVENLABS_VOICE; --list-voices shows yours),
              --model eleven_multilingual_v2, --add-voice <library_voice_id> adds a library voice.
  files       pre-made clips, one per script line, in --clips <dir> named line_000.mp3, line_001.mp3,
              ... (any format ffmpeg reads). Used with the ElevenLabs connector when no API key is set.
  kokoro      local, free, deterministic fallback. --voice am_michael, --speed 1.05
Line-by-line synthesis is what makes the cue times exact; one call per line.
"""
import os, sys, json, argparse, numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# .env.local (gitignored) supplies secrets when the environment does not.
_env = os.path.join(ROOT, '.env.local')
if os.path.exists(_env):
    for line in open(_env):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1); os.environ.setdefault(k.strip(), v.strip())
ap = argparse.ArgumentParser()
ap.add_argument('--video', default=open(os.path.join(ROOT, 'videos/current.txt')).read().strip())
ap.add_argument('--engine', choices=['kokoro', 'elevenlabs', 'files'], default='elevenlabs' if os.environ.get('ELEVENLABS_API_KEY') else 'kokoro')
ap.add_argument('--voice', default=None)
ap.add_argument('--clips', default=None, help='files engine: directory of line_NNN.* clips')
ap.add_argument('--add-voice', default=None, help='elevenlabs: add a voice-library voice to the account (voice_id), then exit')
ap.add_argument('--speed', type=float, default=1.0)
ap.add_argument('--model', default='eleven_multilingual_v2', help='elevenlabs model_id')
ap.add_argument('--stability', type=float, default=0.5)
ap.add_argument('--similarity', type=float, default=0.75)
ap.add_argument('--list-voices', action='store_true', help='elevenlabs: print your voices and exit')
args = ap.parse_args()
SR = 24000
LEAD, GAP, TAIL = 0.35, 0.38, 0.9   # seconds of silence before, between, after lines

# ---------------------------------------------------------------- engines
def kokoro_engine():
    import urllib.request, espeakng_loader
    from kokoro_onnx import Kokoro
    from kokoro_onnx.config import EspeakConfig
    cache = os.path.expanduser('~/.cache/kokoro-tts'); os.makedirs(cache, exist_ok=True)
    files = {'kokoro-v1.0.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
             'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin'}
    for n, u in files.items():
        p = os.path.join(cache, n)
        if not os.path.exists(p): print('downloading', n); urllib.request.urlretrieve(u, p)
    cfg = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=espeakng_loader.get_data_path())
    k = Kokoro(os.path.join(cache, 'kokoro-v1.0.onnx'), os.path.join(cache, 'voices-v1.0.bin'), espeak_config=cfg)
    voice = args.voice or 'am_michael'
    def synth(line):
        audio, sr = k.create(line, voice=voice, speed=args.speed, lang='en-us')
        return audio.astype(np.float32), sr
    return synth, voice

def elevenlabs_engine():
    import requests
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key: sys.exit('ELEVENLABS_API_KEY is not set')
    H = {'xi-api-key': key}
    if args.list_voices:
        r = requests.get('https://api.elevenlabs.io/v1/voices', headers=H, timeout=30); r.raise_for_status()
        for v in r.json().get('voices', []): print(f"{v['voice_id']}  {v['name']}  {v.get('labels', {})}")
        sys.exit(0)
    if args.add_voice:
        r = requests.get('https://api.elevenlabs.io/v1/shared-voices', headers=H, params={'search': args.add_voice, 'page_size': 5}, timeout=30); r.raise_for_status()
        hit = next((v for v in r.json().get('voices', []) if v['voice_id'] == args.add_voice), None)
        if not hit: sys.exit('voice not found in the library: ' + args.add_voice)
        r = requests.post(f"https://api.elevenlabs.io/v1/voices/add/{hit['public_owner_id']}/{hit['voice_id']}", headers=H, json={'new_name': hit['name'].split(' - ')[0]}, timeout=30)
        print(r.status_code, r.text[:300]); sys.exit(0 if r.ok else 1)
    voice = args.voice or os.environ.get('ELEVENLABS_VOICE')
    if not voice: sys.exit('--voice <voice_id> is required for elevenlabs (or set ELEVENLABS_VOICE; see --list-voices)')
    def synth(line):
        # pcm_24000 returns raw 16-bit little-endian mono at 24 kHz, which matches the Kokoro path.
        r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}', params={'output_format': 'pcm_24000'},
                          headers={**H, 'Content-Type': 'application/json'},
                          json={'text': line, 'model_id': args.model,
                                'voice_settings': {'stability': args.stability, 'similarity_boost': args.similarity, 'speed': args.speed}},
                          timeout=120)
        if r.status_code != 200: sys.exit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
        return np.frombuffer(r.content, dtype='<i2').astype(np.float32) / 32768.0, SR
    return synth, voice

def files_engine():
    import subprocess, glob
    if not args.clips: sys.exit('--clips <dir> is required for --engine files')
    state = {'i': 0}
    def synth(line):
        hits = sorted(glob.glob(os.path.join(args.clips, f"line_{state['i']:03d}.*")))
        if not hits: sys.exit(f"missing clip line_{state['i']:03d}.* for: {line}")
        state['i'] += 1
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', hits[0], '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        return np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0, SR
    return synth, args.voice or 'clips:' + os.path.basename(os.path.normpath(args.clips))

synth, VOICE = {'kokoro': kokoro_engine, 'elevenlabs': elevenlabs_engine, 'files': files_engine}[args.engine]()

# ---------------------------------------------------------------- assemble
VDIR = os.path.join(ROOT, 'videos', args.video); os.makedirs(os.path.join(VDIR, 'audio'), exist_ok=True)
lines = [l.strip() for l in open(os.path.join(VDIR, 'script.txt')) if l.strip() and not l.lstrip().startswith('#')]  # '#' lines are build comments
chunks, cues = [], []
t = LEAD; chunks.append(np.zeros(int(LEAD * SR), dtype=np.float32))
for i, line in enumerate(lines):
    audio, sr = synth(line)
    if sr != SR:   # resample if an engine ever returns a different rate
        idx = np.linspace(0, len(audio) - 1, int(len(audio) * SR / sr)); audio = np.interp(idx, np.arange(len(audio)), audio).astype(np.float32)
    # trim leading/trailing silence so cue times match the spoken words
    nz = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(0, nz[0] - 600): nz[-1] + 1200] if len(nz) else audio
    d = len(audio) / SR
    cues.append({'i': i, 'text': line, 'start': round(t, 3), 'end': round(t + d, 3)})
    chunks.append(audio); t += d
    if i < len(lines) - 1: chunks.append(np.zeros(int(GAP * SR), dtype=np.float32)); t += GAP
chunks.append(np.zeros(int(TAIL * SR), dtype=np.float32)); t += TAIL
out = np.concatenate(chunks)
out = out / max(1e-6, np.abs(out).max()) * 0.89
sf.write(os.path.join(VDIR, 'audio/narration.wav'), out, SR)
with open(os.path.join(VDIR, 'narration.js'), 'w') as f:
    f.write('// Generated by scripts/tts.py from script.txt. Do not edit by hand.\n')
    f.write('export const NARRATION = ' + json.dumps({'engine': args.engine, 'voice': VOICE, 'duration': round(t, 3), 'cues': cues}, indent=2) + ';\n')
print(f'{args.engine}/{VOICE}: duration {t:.2f}s'); [print(f"{c['start']:6.2f} - {c['end']:6.2f}  {c['text']}") for c in cues]
