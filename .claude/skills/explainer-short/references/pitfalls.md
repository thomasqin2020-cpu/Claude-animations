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
