# Pitfalls found while building real videos

Each of these cost a render. Check them before the first spot frame.

1. **Subject out of frame horizontally.** 9:16 with a 40 degree vertical FOV gives about 23 degrees horizontal. A character 12 degrees off-axis is gone. Aim the lookAt at the subject, not at the scene origin, and verify with `frame.mjs`.
2. **Shared scene groups.** If two timeline entries use one scene object, set all groups invisible first, then the active one visible (`src/app.js` already does this). Do not add per-entry visibility logic.
3. **Cue-time boundaries.** Cue starts are rounded to 3 decimals. Inside a scene, branch on cue times you pass in or on generous thresholds (`t < 20`), never on a hard-coded value equal to a cut time; the last frame before the cut will hit the wrong branch.
4. **Unlit subject.** The key light must come from the camera side. Put the sun roughly 30 to 60 degrees off the camera axis, above, and add a hemisphere light at 0.9 for fill; on black-sky scenes raise fill further.
5. **Metal looks black.** No environment map, so keep `metalness` at or below 0.2 and fake gloss with low roughness plus a touch of emissive.
6. **Torso pitch moves the legs.** `torsoPitch` rotates the hips group. For crouches: `legL = -(thighForward) - torsoPitch`, `kneeL = thighForward`, and lower `hips.position.y` until `probe.mjs` shows feet near y = 0.
7. **Hands reach where they can, not where you want.** Probe hand and target world positions and iterate the pose numerically; use the hand on the same side as the target.
8. **Transparent overlays fight.** Two transparent shells on the same surface sort unpredictably. Give the one that must win a larger depth and a higher `renderOrder`.
9. **Particle scale.** Shard geometries are unit-size spikes; a `size` of 0.02 to 0.05 reads as grit next to a 1.8 unit character; 0.1 reads as rocks.
10. **Dust must land.** On airless worlds nothing hangs; make particles vanish when their arc returns to ground. In air, add drift and a longer `life`.
11. **Earth or any sky object** must be placed along the camera's forward azimuth for the shots that need it; compute, do not eyeball.
12. **Captions over feet.** Lower the lookAt so the figure sits higher when a gauge or caption is in the bottom band.
13. **Playwright and Chromium versions differ.** Always launch with `executablePath: '/opt/pw-browsers/chromium'` (already in the scripts).
14. **Long renders.** 1000 frames is about 9 minutes; run `render.js` in the background and poll the log for `^wrote`.

15. **Render time cost.** A 15 minute 16:9 video is about 27,000 frames and 3 hours on CPU. Fix
    problems from spot frames before the full render; after it, re-render only broken ranges.

## Review checklist (from the Chapter 16 review, where each of these reached the delivered video)

Every item below shipped once and confused the viewer. Check each before delivery.

- **Empty build-up shots.** A prop that scales up from 0 shows only shadows until it grows (the
  pyramid sat as two floating shadows for 10 s). Start visible, or cut in when it appears.
- **Camera aimed at nothing.** Push-ins and tilts that end on a flat colour wall, the side of a
  block, or the back of a head (pyramid descent, throne crack, whip post, mask). The end frame of
  every move must still contain an identifiable subject. Probe it.
- **Abstract geometry with no labels.** Unlabelled slabs read as nothing (emancipation map before
  it fills, state blocks on the cotton map, globe continents). Give every map shape an outline
  and a readable name, and keep continents on the sphere surface, not as cards sticking out.
- **Labels that render as black boxes.** Dark text on a dark sprite background at small size is
  unreadable (state names, "slave codes" under the law book). Minimum label height on screen
  about 24 px; light text on dark, or dark text on parchment, never dark on dark.
- **Props that read as something else.** Lincoln's list held edge-on read as a pistol; a burning
  page read as a glowing face; a chain of torus rings read as text ("OIOIOI"); a sign held
  edge-on read as a bar. Hold flat props facing the camera and check the silhouette.
- **Scale too small to read.** Key action in 2 to 5 % of the frame (the ship carrying the bale,
  the coin pile, figures on the two platforms). The subject of the line should fill at least a
  fifth of the frame height.
- **Characters leaving the shot.** The auctioned mother and child walked behind the crowd and
  vanished; Lincoln's head left the top of the frame. Track the subject or keep it inside.
- **Long static holds.** A beat with nothing changing for more than 8 s (pyramid "push" of 0.08
  units for 25 s, John Little night held 30 s). Add a visible change or a cut.
- **Night that is not night.** A "night" scene still under a beige sky. Change the background
  and the sky colour, not only the lights.
- **Overlapping labels.** Several world labels at one spot (NO ENTRY / NO VOTE / NO SCHOOL,
  the abolitionist trio's banners over heads). Space them or show one at a time.
- **No narration subtitles.** Always burn them in (`scripts/subtitles.py --burn`).
