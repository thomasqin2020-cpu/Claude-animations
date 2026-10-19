"""Synthesize videos/<slug>/script.txt line by line, write audio/narration.wav and narration.js
(cue start/end per line) so the master timeline is driven by the real audio.

Engines:
  kokoro      local, free, deterministic (default). --voice am_michael, --speed 1.05
  elevenlabs  ElevenLabs REST API. Needs ELEVENLABS_API_KEY in the environment.
              --voice <voice_id> (run --list-voices to see yours), --model eleven_multilingual_v2
Line-by-line synthesis is what makes the cue times exact; one call per line.
"""
import os, sys, json, argparse, numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--video', default=open(os.path.join(ROOT, 'videos/current.txt')).read().strip())
ap.add_argument('--engine', choices=['kokoro', 'elevenlabs'], default='kokoro')
ap.add_argument('--voice', default=None)
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
    voice = args.voice
    if not voice: sys.exit('--voice <voice_id> is required for elevenlabs (see --list-voices)')
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

synth, VOICE = kokoro_engine() if args.engine == 'kokoro' else elevenlabs_engine()

# ---------------------------------------------------------------- assemble
VDIR = os.path.join(ROOT, 'videos', args.video); os.makedirs(os.path.join(VDIR, 'audio'), exist_ok=True)
lines = [l.strip() for l in open(os.path.join(VDIR, 'script.txt')) if l.strip()]
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
