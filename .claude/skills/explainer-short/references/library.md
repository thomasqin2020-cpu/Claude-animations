# Library reference (src/ and scripts/)

All paths are imported absolutely from a video folder, e.g. `import { mat } from '/src/materials.js'`.

## src/timeline.js
- `FPS = 30`, `WIDTH = 1080`, `HEIGHT = 1920`.
- Easing: `clamp01, lerp(a,b,t), easeInOut, easeOut, easeIn, smoother, span(t,a,b)` (0..1 progress of t through [a,b]), `pulse(t,a,b)` (0→1→0).
- `rng(seed)` seeded mulberry32. Use it for every layout or particle decision.
- `makeTimeline(scenes)` used by `src/app.js`; you do not call it directly.

## src/app.js
`runVideo({ narration, audio, scenes, fov?, exposure?, design? })`. `design` is an older narration object (save it as `narration-design.js`) whose cue times the scenes were authored against; the runtime then warps real time onto it line by line, so switching voices never requires editing scene code. `scenes` is an ordered list of
`{ name, start, end?, scene, bg }`. `scene` is the object a `build*()` returns. Two entries may
share the same scene object (return to a location later). `end` may be omitted on the last entry.
Exposes `window.__anim` (seek, capture, validate) and `window.__dbg` (scene, camera, renderer, timeline).

## Scene module contract
```js
export function buildX() {
  const g = new THREE.Group(); g.name = 'scene_x';
  // lights live INSIDE the group so they switch with it
  function update(t, cam) { /* absolute seconds; set positions, poses, camera */ }
  function captions(t, cap) { cap.draw('TEXT', t, start, end, { y: 1500, size: 70 }); }
  return { group: g, update, captions, background: 0x101420 };
}
```
`update` must set the camera every frame (position + lookAt) because other scenes move it.

## src/materials.js
- `mat(hex, { roughness, metalness, emissive, emissiveIntensity, transparent, opacity })` cached flat-shaded MeshStandardMaterial. Keep `metalness <= 0.2`: there is no environment map, so metal renders black.
- `bevelBox(w,h,d,r)` cached bevelled geometry; `box(w,h,d,colorOrMaterial,r)` returns a shadow-casting mesh. This is the main building block for the polished voxel look.

## src/characters/humanoid.js
`createHumanoid({ skin, hair, shirt, pants, shoes, accent })` returns a rig:
- `rig.root` (Group, `userData.kind = 'humanoid'`, validated), `rig.hips`, `rig.neck`, `rig.arms.L/R.{shoulder, elbow, hand}`, `rig.legs.L/R.{hip, knee}`.
- `rig.pose({ armL, armR, armLz, armRz, elbowL, elbowR, legL, legR, kneeL, kneeR, headYaw, headPitch, torsoYaw, torsoPitch })` radians, resets everything first.
- `rig.idle(t, seed)`, `rig.walk(t, speed)`.
- Sign conventions (measured): negative `legL` swings the thigh forward; positive `kneeL` bends the shin back under it; negative `armL` raises the arm forward. `torsoPitch` rotates the hips group, so it pitches the legs too: compensate (`legL = -desired - torsoPitch`).
- Feet rest on y = 0 with `hips.position.y = 0.93`. Character is about 1.8 units tall.
Attach props to `rig.arms.L.elbow` (hand is at local y = -0.34).

## src/characters/astronaut.js
`createAstronaut()` (white suit, helmet, visor, backpack, wrist rings, wear patches via `rig.setWear(0..1)`, dust tint via `rig.setDust(0..1)`), `moonWalk(rig, t)`. Example of a builder on top of the humanoid rig.

## src/props
- `terrain.js`: `createMoonTerrain(size, seg, seed)`, `createEarth(radius)`.
- `lunarModule.js`: `createLunarModule()`.
- `grains.js`: `shardGeometry(seed, spike)`, `roundGrainGeometry(seed)`, `GRAIN` materials, `createDustSystem(events, opts)` closed-form ballistic bursts (`mesh.update(t)` each frame; events `{ t, x, y, z, n, spread, up, vx, vz }`).
Add new props here when they could be reused (vehicles, buildings, trees, machines).

## src/camera.js
- `dolly(cam, t, a, b, fromPos, toPos, lookFrom, lookTo?, ease?)`
- `fixed(cam, pos, look)`
- `orbit(cam, t, a, b, center, radius, height, angle0, angle1, lookY?)`
Field of view is 40 degrees vertical, so only about 23 degrees horizontal: keep subjects within about 11 degrees of the forward axis, stack depth vertically, and prefer slightly longer lenses (camera farther back) over wide ones.

## src/captions.js
`cap.draw(text, t, start, end, { y, size, color })` with fade and pop; `cap.gauge(label, value01, t, start, end, { y })`. Safe band: y between 1400 and 1600.

## src/validate.js
Runs automatically every 30 frames during render and in `frame.mjs`. Flags wrong body-part counts, two humanoids within 0.3 units, NaN transforms. A failure aborts the render.

## scripts
- `scripts/tts.py --video <slug> [--engine kokoro|elevenlabs] --voice <name|voice_id> --speed <x>`: TTS line by line (Kokoro locally, or ElevenLabs over REST with `ELEVENLABS_API_KEY`; `--model`, `--stability`, `--similarity`, `--list-voices` apply to ElevenLabs), trims silence, writes `audio/narration.wav` and `narration.js` (`{ voice, duration, cues: [{ i, text, start, end }] }`). Gaps: 0.35 s lead, 0.38 s between lines, 0.9 s tail. Voices: male `am_michael am_adam am_liam am_onyx am_eric am_fenrir am_echo am_puck`, female `af_heart af_bella af_nicole af_nova af_sarah af_jessica af_kore af_aoede af_river af_sky`, British `bm_george bm_daniel bm_fable bm_lewis bf_emma bf_alice bf_isabella bf_lily`. First run downloads about 340 MB to `~/.cache/kokoro-tts/`. Needs `pip install kokoro-onnx soundfile --break-system-packages`.
- `scripts/render.js --video <slug> [--start=F --end=F --out=name.mp4 --frames]`: Playwright + FFmpeg; writes `out/<slug>/<name>`; muxes `videos/<slug>/audio/*.wav|mp3` if present.
- `scripts/subtitles.py --video <slug> [--burn] [--size 40] [--chars 64]`: narration subtitles from `narration.js`; writes `videos/<slug>/subtitles.srt` and `out/<slug>/subtitles.ass`, converts spelled-out numbers to digits, and with `--burn` writes `out/<slug>/final-subtitled.mp4` in one ffmpeg pass.
- `scripts/contact-sheet.js --video <slug> --every=30 --cuts=9,13.5`: `out/<slug>/contact-sheet.png` and `out/<slug>/qa/cut_*_before|after.png`.
- `scripts/validate.js --video <slug>`: headless validation only.
- `scripts/dev/frame.mjs <frames...>`: spot frames to `out/dev/` with validation and camera position. `VIDEO=<slug>` env var overrides `videos/current.txt`.
- `scripts/dev/probe.mjs <frame> <objectNames...>`: world positions of named objects.
- `npm run preview` then open `http://localhost:4173/?video=<slug>&preview=1`, click to play with audio.
