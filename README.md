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

## Current video: Moon Dust (idea 40)

- Script: `script/narration.txt`. Voice: `python3 scripts/tts.py am_michael 1.1` writes `audio/narration.wav` and `src/narration.js`.
- Shot plan and fact basis: `docs/moon-dust-shot-plan.md`.
- Render: `npm run render` (about 10 minutes on CPU) writes `out/final-animation.mp4` with the narration muxed in.
- QA: `npm run contact-sheet -- --cuts=9,13.51,15.01,22.2,23.86,25.65,26.85,28.19,32.48`.
