// Part 1 bench: horizontal spring (k = 10 N/m) on a track, 1 kg block, ruler. Used for the
// opening (0 to C4) and the elastic-limit ending (34.0 to end).
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createRuler } from '/src/props/ruler.js';
import { createLabel } from '/src/props/label.js';
import { lerp, easeInOut, easeOut, span, pulse } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

export const UNIT = 2.5;      // scene units per metre
export const FSCALE = 0.16;   // scene units per newton
const K = 10, NAT = 1.0;      // N/m, natural length in scene units
const ANCHOR_X = -1.25, Y = 0.31; // spring axis height (block centre)

export function buildBench(C) {
  const g = new THREE.Group(); g.name = 'scene_bench';
  g.add(createLab({ benchWidth: 9 }));
  labLights(g, [5, 8, 7]);
  g.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
  const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT, name: 'spring1' });
  spring.rotation.z = -Math.PI / 2; spring.position.set(ANCHOR_X, Y, 0); g.add(spring);   // +y of spring -> +x world
  const block = createBlock('1 kg'); block.position.x = ANCHOR_X + NAT + 0.25; g.add(block);
  const ruler = createRuler({ from: -0.3, to: 0.6, unit: UNIT, step: 0.1 }); ruler.position.set(ANCHOR_X + NAT + 0.25, 0.07, 0.62); g.add(ruler);
  const fSpring = createArrow(LAB.coral, { label: 'F', name: 'fSpring' }); g.add(fSpring);
  const fApplied = createArrow(LAB.teal, { label: 'pull', name: 'fApplied', labelOffset: [0, -0.3, 0.2] }); g.add(fApplied);
  const xArrow = createArrow(LAB.green, { label: 'x', name: 'xArrow', radius: 0.025, head: 0.1, labelOffset: [0, -0.25, 0.1] }); g.add(xArrow);
  // Second lane for the stiffness comparison: thick spring k = 40 on a shelf above.
  const lane = new THREE.Group(); lane.name = 'lane2'; lane.position.y = 1.45; lane.visible = false; g.add(lane);
  const shelf = box(4.5, 0.12, 1.2, LAB.bench, 0.03); shelf.position.set(-0.2, -0.06, 0); lane.add(shelf);
  lane.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
  const spring2 = createSpring({ coils: 12, radius: 0.16, wire: 0.05, length: NAT, name: 'spring2', color: 0xd0d4dc }); spring2.rotation.z = -Math.PI / 2; spring2.position.set(ANCHOR_X, Y, 0); lane.add(spring2);
  const block2 = createBlock('1 kg'); block2.position.x = ANCHOR_X + NAT + 0.25; lane.add(block2);
  const f2 = createArrow(LAB.coral, { label: '8 N', name: 'f2' }); lane.add(f2);
  const f1Label = createLabel('k = 10 N/m', { size: 0.22 }); f1Label.position.set(ANCHOR_X + 0.3, Y + 0.6, 0.2); f1Label.visible = false; g.add(f1Label);
  const f2Label = createLabel('k = 40 N/m', { size: 0.22 }); f2Label.position.set(ANCHOR_X + 0.3, Y + 0.6, 0.2); lane.add(f2Label);
  const fLabel2N = createArrow(LAB.coral, { label: '2 N', name: 'f1b' }); fLabel2N.visible = false; g.add(fLabel2N);

  // Displacement of the block in metres as a closed-form function of time.
  function xOf(t) {
    if (t < 2.8) return 0.2 * easeInOut(span(t, 0.3, 2.8));
    if (t < C[1]) return 0.2;
    if (t < C[2]) return 0.2 * Math.cos(Math.PI * (t - C[1]) / 1.2);
    if (t < C[4]) return 0.2;
    // ending: overstretch to 0.5, release, settle at a permanent offset
    if (t < 34.9) return lerp(0.2, 0.5, easeInOut(span(t, 34.0, 34.9)));
    if (t < 35.3) return 0.5;
    const u = t - 35.3; return 0.12 + 0.38 * Math.exp(-3 * u) * Math.cos(9 * u);
  }
  function update(t, cam) {
    const x = xOf(t); const xs = x * UNIT;
    const permanent = t > 35.3 ? Math.min(1, (t - 35.3) / 0.4) : 0;
    spring.setSet(permanent * 0.5);
    spring.setLength(NAT + xs);
    block.position.x = ANCHOR_X + NAT + 0.25 + xs;
    const bx = block.position.x, left = bx - 0.25, right = bx + 0.25;
    // spring force on the block: -kx, drawn from the block face toward equilibrium
    const F = -K * x;
    const showF = (t > 2.6 && t < C[4]) || t > 34.0;
    fSpring.set([F < 0 ? left : right, Y + 0.12, 0.05], [Math.sign(F) || 1, 0, 0], showF ? Math.abs(F) * FSCALE : 0);
    const showApplied = t < C[1] && t > 0.3;
    fApplied.set([right, Y - 0.12, 0.05], [1, 0, 0], showApplied ? Math.abs(K * x) * FSCALE : 0);
    const showX = t > 2.6 && t < C[2];
    xArrow.set([ANCHOR_X + NAT + 0.25, 0.25, 0.75], [Math.sign(x) || 1, 0, 0], showX ? Math.abs(xs) : 0);
    // stiffness comparison lane
    const inLane = t >= C[2] && t < C[4];
    lane.visible = inLane; const showK = t >= C[2] && t < C[3]; f1Label.visible = showK; f2Label.visible = showK; fLabel2N.visible = inLane;
    if (inLane) {
      spring2.setLength(NAT + 0.2 * UNIT); block2.position.x = ANCHOR_X + NAT + 0.25 + 0.2 * UNIT;
      const grow = easeOut(span(t, C[2] + 0.3, C[2] + 1.3));
      f2.set([block2.position.x - 0.25, Y + 0.12, 0.05], [-1, 0, 0], 40 * 0.2 * FSCALE * grow);
      fLabel2N.set([left, Y + 0.12, 0.05], [-1, 0, 0], 10 * 0.2 * FSCALE * grow);
      fSpring.visible = false;
    }
    // dim everything on the push-in by lowering exposure is global; instead fade spring glow up as a "focus" cue
    spring.setGlow(t >= C[3] && t < C[4] ? 0.6 * easeInOut(span(t, C[3], C[3] + 0.8)) : 0);
    spring2.setGlow(t >= C[3] && t < C[4] ? 0.6 * easeInOut(span(t, C[3], C[3] + 0.8)) : 0);

    // ---- camera ----
    if (t < C[1]) dolly(cam, t, 0, C[1], [1.4, 1.6, 8.0], [1.2, 1.3, 7.2], [0.2, 0.5, 0], [0.25, 0.45, 0]);
    else if (t < C[2]) dolly(cam, t, C[1], C[2], [2.8, 2.6, 6.4], [2.4, 2.4, 6.0], [0.1, 0.4, 0], [0.1, 0.4, 0]);
    else if (t < C[3]) dolly(cam, t, C[2], C[3], [0.4, 1.9, 7.8], [0.4, 1.8, 7.4], [-0.2, 1.0, 0], [-0.2, 1.0, 0]);
    else if (t < C[4]) dolly(cam, t, C[3], C[4], [0.4, 1.8, 7.4], [-0.5, 0.9, 2.6], [-0.2, 1.0, 0], [-0.7, 0.35, 0], easeInOut);
    else dolly(cam, t, 34.0, 37.1, [1.4, 1.5, 7.0], [1.6, 1.4, 7.4], [-0.1, 0.45, 0], [0.1, 0.45, 0]);
  }
  function captions(t, cap) {
    cap.draw('F = −kx', t, 4.4, C[1], { y: 1500, size: 84 });
    cap.draw('x > 0  →  F < 0\nx < 0  →  F > 0', t, C[1] + 0.3, C[2], { y: 1500, size: 62 });
    cap.draw('[k] = N/m', t, C[2] + 0.4, C[3], { y: 1500, size: 76 });
    cap.draw('F ∝ x ?', t, C[3] + 0.2, C[4], { y: 1500, size: 84 });
    cap.draw('valid for small x', t, 34.6, 37.1, { y: 1500, size: 66 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
