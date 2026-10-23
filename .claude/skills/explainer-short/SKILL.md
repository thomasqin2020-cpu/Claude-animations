---
name: explainer-short
description: Turns a narration script plus visual direction into a finished vertical 3D explainer Short (1080x1920, 30 fps, H.264 MP4 with synthesized voiceover) using this repo's deterministic Three.js pipeline. Use when the user gives a script, a storyboard, or "make the animation for this", or asks for a YouTube Short / explainer video / animated video from text.
---

# Explainer Short

This skill runs inside the `Claude-animations` repository (github.com/thomasqin2020-cpu/Claude-animations,
branch `claude/eloquent-newton-61m76a` until merged). If the working directory is not that repo, clone it,
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
3. **Narration first, then timing.** Run `python3 scripts/tts.py --video <slug>`. The
   default engine is ElevenLabs with the narrator in `ELEVENLABS_VOICE`; the key and voice
   come from the environment or from `.env.local` at the repo root (gitignored). Do not ask
   the user for the key or the voice when either source has them. If no key is found
   anywhere, ask once, write it to `.env.local`, and carry on. Thomas's standing choices:
   voice Jarnathan - Confident and Versatile (`c6SfcYrb2t09NHXiT80T`, already on the
   account), fallback Adam (`pNInz6obpgDQGcFmaJgB`). Always use ElevenLabs for the voice;
   never deliver a Kokoro narration as final. Two ways to reach ElevenLabs, in this order:
   - **API key (preferred for full videos).** `ELEVENLABS_API_KEY` (starts with `sk_`) from the
     environment secret or `.env.local`; `tts.py` then synthesizes every line in one command.
     Never write the key into this file or any committed file: the repo is public. A 64-character
     hex value is a key ID, not a key; ElevenLabs rejects it.
   - **ElevenLabs connector (no key needed).** If no key is set but the ElevenLabs connector is
     attached (tools named `creative_generate_speech`, `creative_get_flow_run_status`), use it.
     For each non-comment line of `script.txt`, in order: call `creative_generate_speech` with
     the line as `prompt`, `voice_id` `c6SfcYrb2t09NHXiT80T`, `model_id`
     `eleven_multilingual_v2`, `generations_count` 1 (the default 2 doubles the credits), and one
     shared `flow_id` (create it with `creative_create_flow` first). Poll
     `creative_get_flow_run_status` until `all_completed`, then download each generation's
     `content_url` (a signed MP3 link that expires after 2 hours) with curl to
     `<dir>/line_NNN.mp3`, NNN being the zero-padded line index. Never re-call a generation to
     retry: each call is charged. Then run
     `python3 scripts/tts.py --video <slug> --engine files --clips <dir> --voice c6SfcYrb2t09NHXiT80T`,
     which trims and assembles the clips and writes the cue times exactly like the API path.
     Tested on 2026-10-23: one line cost 74 credits and downloaded fine.
   Kokoro
   (`--engine kokoro --voice am_michael --speed 1.05`) is the offline fallback only. It writes `audio/narration.wav` and `narration.js` with exact
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
   For a 16:9 long-form video pass `width: 1920, height: 1080` to `runVideo` and use a caption
   band around y 880 to 1000; `videos/ch16-slavery-long` is the reference build.
6. **Spot-check before the full render.** `node scripts/dev/frame.mjs <frames...>` writes
   `out/dev/f####.png` and prints validation (body-part counts, overlaps) and the camera
   position. Render one frame per shot plus one on each side of every cut, tile them with
   ffmpeg `hstack`, and look at them. Use `node scripts/dev/probe.mjs <frame> <names...>` to
   print world positions when a hand, prop, or subject is not where the shot needs it. Fix
   framing with numbers, not guesses: the vertical frame has only about 23 degrees of
   horizontal field of view.
7. **Full render, then a full review before anything is sent.** `node scripts/render.js --video <slug>`
   (about 0.4 s per frame on CPU; run it in the background for anything over 2 minutes). Thomas
   requires a review of every finished video for broken or confusing parts before delivery; a
   contact sheet alone is not a review. Do all of this every time:
   - Extract a timestamped frame every 3 s (Short) or 6 s (long form) and tile them 4x4:
     `ffmpeg -i out/<slug>/final-animation.mp4 -vf "fps=1/6,scale=480:-1,drawtext=fontfile=/usr/share/fonts/opentype/inter/Inter-Bold.otf:text='%{pts\:hms}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=4x4:padding=4" out/<slug>/review/r%02d.png`
     and look at every sheet, not a sample.
   - For each frame, compare against the narration line playing at that time (shot plan). Ask:
     could a viewer who has not read the script say what this frame shows? If not, it is broken.
   - Check every item in `references/pitfalls.md` under "Review checklist", plus black or empty
     frames, subjects out of frame, clipping, duplicated characters, and text over the action.
   - Fix what you find, re-render only the affected frame ranges with `--start/--end --out`,
     splice them in with ffmpeg (three-input concat, audio from the master), and review the
     spliced ranges again. Never ship a render you have not reviewed end to end.
   - In the delivery message, list what the review found and what was fixed. If something is
     knowingly left imperfect, say which timestamps.
8. **Subtitles.** Narration subtitles are on by default. Run
   `python3 scripts/subtitles.py --video <slug> --burn`: it writes `videos/<slug>/subtitles.srt`
   (spelled-out numbers turned back into digits) and burns them into
   `out/<slug>/final-subtitled.mp4` without a 3D re-render. Keep on-screen labels above the
   subtitle line (long form: label band y 880 to 1000, subtitles at the bottom edge). Review the
   subtitled file too.
9. **Verify and deliver.** ffprobe must show h264, the expected resolution (1080x1920 Short,
   1920x1080 long form), 30/1, yuv420p, an aac audio stream, and the expected frame count. Send
   the subtitled MP4 and the SRT. Copy them and the contact sheet to `renders/<slug>/` (files over
   100 MB need a crf 24 copy for git), send the MP4 to the user, commit, and report: duration, resolution,
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
- Changing the voice on an existing video: keep the cue times the scenes were authored
  against in `narration-design.js` (copy the old `narration.js`, rename the export to
  `DESIGN`), pass `design: DESIGN` to `runVideo`, and build `C` from `DESIGN`. The runtime
  warps the new narration onto the design timeline, so no scene edits are needed.
