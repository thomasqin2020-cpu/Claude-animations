---
name: explainer-short
description: Turns a narration script plus visual direction into a finished vertical 3D explainer Short (1080x1920, 30 fps, H.264 MP4 with synthesized voiceover) using this repo's deterministic Three.js pipeline. Use when the user gives a script, a storyboard, or "make the animation for this", or asks for a YouTube Short / explainer video / animated video from text.
---

# Explainer Short

This skill runs inside the `Claude-animations` repository (github.com/thomasqin2020-cpu/Claude-animations,
branch `claude/busy-ptolemy-u9u6w9` until merged). If the working directory is not that repo, clone it,
run `npm install` and `pip install kokoro-onnx soundfile --break-system-packages`, and work there.

Input: a narration script, and optionally the user's visual direction (style, scenes, camera
ideas, what must be on screen). Output: `videos/<slug>/` with the source, and
`out/<slug>/final-animation.mp4` verified with ffprobe, plus the file sent to the user.

The pipeline is already built. Do not rewrite it. Write only the per-video files:
`script.txt`, `main.js`, `scenes/*.js`, and `shot-plan.md`. Everything else is library code
in `src/` and `scripts/`. Read `references/library.md` before writing any scene code and
`references/pitfalls.md` before the first spot render.

## Workflow

1. **Read the input.** Separate the script (what is spoken) from the visual direction (what
   is seen). If the user gave only a script, derive the visuals yourself from the sentences.
   If they gave only a topic, write a 65 to 85 word script first and show it. Check every
   factual claim that will be on screen; if a claim is wrong, say so and fix the script.
2. **Scaffold.** `slug` is kebab-case. `cp -r videos/_template videos/<slug>`, then replace
   `<SLUG>` and `<TITLE>` in `main.js`. Write the script to `videos/<slug>/script.txt`, one
   sentence per line: each line becomes a cue the timeline can cut on, so split long
   sentences where you want a cut. Apply `references/tts-formatting.md` (spell out numbers,
   units, abbreviations).
3. **Narration first, then timing.** Run
   `python3 scripts/tts.py --video <slug> --voice am_michael --speed 1.05` (voices in
   `references/library.md`). For an ElevenLabs voice, export `ELEVENLABS_API_KEY` and run
   `python3 scripts/tts.py --video <slug> --engine elevenlabs --voice <voice_id>`
   (`--list-voices` prints the account's voices). Same output files either way. It writes `audio/narration.wav` and `narration.js` with exact
   cue start and end times and prints them. Target 25 to 40 s for a Short. If the user
   supplied a recorded voiceover, put it at `videos/<slug>/audio/narration.wav`, measure cue
   times from it (ffprobe plus listening or a transcript), and write `narration.js` by hand
   in the same shape.
4. **Shot plan.** Write `videos/<slug>/shot-plan.md`: a table of time range, voiceover
   line, scene, what is on screen, camera. Rules: a major scene roughly every 10 s, a new
   movement, reveal, cut, or camera change every 2 to 4 s, every visual demonstrates the
   line being spoken, cuts land on cue boundaries (`C[n]`), transitions are motivated
   (follow an object, zoom into a detail, match framing between two worlds). Honor the user's
   visual direction literally where it is specific; fill gaps with the grammar in
   `references/shot-grammar.md`.
5. **Build scenes.** One module per major location in `videos/<slug>/scenes/`, following the
   contract in `references/library.md` (`build*()` returns `{ group, update(t, camera),
   captions?(t, cap), background? }`, everything a pure function of absolute time `t`).
   Reuse `src/characters/*` and `src/props/*`; add new reusable characters or props to `src/`
   rather than inside a video. Wire the scene list in `main.js` with start/end on cue times.
   Set `videos/current.txt` to the slug so every script defaults to this video.
6. **Spot-check before the full render.** `node scripts/dev/frame.mjs <frames...>` writes
   `out/dev/f####.png` and prints validation (body-part counts, overlaps) and the camera
   position. Render one frame per shot plus one on each side of every cut, tile them with
   ffmpeg `hstack`, and look at them. Use `node scripts/dev/probe.mjs <frame> <names...>` to
   print world positions when a hand, prop, or subject is not where the shot needs it. Fix
   framing with numbers, not guesses: the vertical frame has only about 23 degrees of
   horizontal field of view.
7. **Full render.** `node scripts/render.js --video <slug>` (about 0.5 s per frame on CPU;
   run it in the background for anything over 2 minutes). Then
   `node scripts/contact-sheet.js --video <slug> --cuts=<cue times>` and inspect
   `out/<slug>/contact-sheet.png` and `out/<slug>/qa/*.png`. Check for black frames, empty
   shots, subjects out of frame, clipping, duplicated characters, captions over the action,
   and visuals that drift from the narration. Fix and re-render until clean. Never ship a
   render you have not looked at.
8. **Verify and deliver.** ffprobe must show h264, 1080x1920, 30/1, yuv420p, an aac audio
   stream, and the expected frame count. Copy the MP4 and contact sheet to
   `renders/<slug>/`, send the MP4 to the user, commit, and report: duration, resolution,
   fps, audio included, a scene summary, and the exact render command.

## Non-negotiables

- Deterministic: no `Math.random`, no `Date.now`, no accumulated state in `update`. Use
  `rng(seed)` from `src/timeline.js` and closed-form motion.
- Characters come from `createHumanoid` or builders on top of it, so the validator's
  body-part counts hold. Never add a second head, arm, or leg mesh to a rig.
- Captions only when they add understanding; short, inside y 1400 to 1600 (the vertical
  safe area), never over the subject.
- Cuts on cue boundaries use `C[n]` from `narration.js`, never a hard-coded second value
  that can round differently from the cue. Beats inside a line are written relative to the
  cue too (`C[n] + 1.2`, or a fraction of the line via `lerp(C[n], C[n+1], 0.6)`), so a
  re-synthesized voice with different timing re-times the whole video without edits.
- The narration file is the clock. Re-running `tts.py` re-times the whole video; never edit
  `narration.js` by hand except for a user-supplied recording.
