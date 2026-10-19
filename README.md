# Claude Animations

Deterministic Three.js explainer Shorts: 1080x1920, 30 fps, rendered headlessly with
Playwright and encoded to H.264 with FFmpeg. Every frame is a pure function of the frame
index, so a render is reproducible from source.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Installs three and playwright (uses the preinstalled Chromium at `/opt/pw-browsers/chromium`; set `CHROMIUM_PATH` to override). |
| `npm run preview` | Serves the project; open `http://localhost:4173/?preview=1` for a looping real-time preview, or `?frame=N` to inspect one frame. |
| `npm run validate` | Headless scene-graph check: body-part counts per character, overlapping characters, NaN transforms. |
| `npm run render` | Renders every frame and writes `out/final-animation.mp4`. If an audio file exists in `audio/`, it is muxed in. |
| `npm run render:frames` | Same, but also keeps one PNG every 15 frames in `out/frames/` for inspection. |
| `npm run contact-sheet -- --cuts=10,20` | Builds `out/contact-sheet.png` plus before/after stills around each listed cut time in `out/qa/`. |

Render options: `--start=F --end=F --out=name.mp4 --audio=path`.

## Layout

```
index.html              importmap + stage canvases (3D + 2D caption overlay)
src/main.js             renderer, lights, master timeline, seek/capture API (window.__anim)
src/timeline.js         FPS/size constants, easing, seeded RNG, scene scheduler
src/materials.js        cached flat-shaded materials, bevelled box geometry
src/characters/         humanoid rig (nested joints, pose/idle/walk)
src/scenes/             one module per major scene: build() + update(localT, camera)
src/captions.js         on-screen text inside the vertical safe area
src/validate.js         rig and scene-graph checks run before and during render
scripts/render.js       Playwright + FFmpeg frame pipeline
scripts/contact-sheet.js QA stills
```

## Composition note

The 9:16 frame with a 40 degree vertical FOV has a horizontal FOV of only about 23 degrees.
Shots must be framed for that: keep subjects within roughly plus or minus 11 degrees of the
camera's forward axis, and stack foreground, midground, and background vertically.

## Making a new video

The skill at `.claude/skills/explainer-short/SKILL.md` drives this. In short:

```
cp -r videos/_template videos/<slug>          # edit main.js, script.txt, scenes/
python3 scripts/tts.py --video <slug>          # narration + cue times (Kokoro, local)
# or: ELEVENLABS_API_KEY=... python3 scripts/tts.py --video <slug> --engine elevenlabs --voice <voice_id>
node scripts/dev/frame.mjs 0 90 180            # spot frames to out/dev/
node scripts/render.js --video <slug>          # out/<slug>/final-animation.mp4
node scripts/contact-sheet.js --video <slug> --cuts=9,13.5
```

`videos/current.txt` names the default video for every script. Reusable library code
lives in `src/`; per-video code lives in `videos/<slug>/`.

## Videos

- `videos/moon-dust/`: Apollo suit abrasion (idea 40). Render in `renders/moon-dust/`.
- `videos/spring-1-hookes-law/`, `spring-2-energy/`, `spring-3-tension/`, `spring-4-shm/`: four-part AP Physics C spring-force series. Renders in `renders/<slug>/`.

Shared physics props added for the series: `src/props/spring.js` (closed-form helix with `setLength`),
`arrow.js`, `label.js`, `graphPanel.js` (curves, Riemann strips, filled areas), `lab.js` (dark lab,
bench, anchor, block, lights), `ruler.js`, `chartRecorder.js`.
