// Part 4 oscillator: bench, k = 10 N/m, 1 kg block, A = 0.30 m. Opening (0 to C2) with the
// -kx arrow and a slow-motion acceleration beat, and the two-lane amplitude comparison (C5 to C6).
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createRuler } from '/src/props/ruler.js';
import { createLabel } from '/src/props/label.js';
import { easeInOut, easeOut, span } from '/src/timeline.js';
import { dolly } from '/src/camera.js';
import { UNIT, FSCALE, K, NAT, ANCHOR_X, Y, OMEGA } from './common.js';

const A = 0.30, RELEASE = 1.5;

export function buildOscillator(C) {
  const g = new THREE.Group(); g.name = 'scene_oscillator';
  g.add(createLab({ benchWidth: 9 }));
  labLights(g, [5, 8, 7]);
  const makeLane = (amp, labelText) => {
    const lane = new THREE.Group();
    lane.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
    const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT }); spring.rotation.z = -Math.PI / 2; spring.position.set(ANCHOR_X, Y, 0); lane.add(spring);
    const block = createBlock('1 kg'); lane.add(block);
    const ruler = createRuler({ from: -0.4, to: 0.4, unit: UNIT, step: 0.1 }); ruler.position.set(0, 0.07, 0.62); lane.add(ruler);
    const label = createLabel(labelText, { size: 0.22 }); label.position.set(ANCHOR_X + 0.3, Y + 0.6, 0.2); label.visible = false; lane.add(label);
    return { lane, spring, block, label, amp };
  };
  const L1 = makeLane(A, 'A = 0.30 m'); g.add(L1.lane);
  const L2 = makeLane(0.10, 'A = 0.10 m'); L2.lane.position.y = 1.45; L2.lane.visible = false; g.add(L2.lane);
  const shelf = box(4.5, 0.12, 1.2, LAB.bench, 0.03); shelf.position.set(-0.2, -0.06, 0); L2.lane.add(shelf);
  const fSpring = createArrow(LAB.coral, { label: '−kx', name: 'fSpring' }); g.add(fSpring);
  const xArrow = createArrow(LAB.green, { label: 'x', name: 'xArrow', radius: 0.025, head: 0.1, labelOffset: [0, -0.25, 0.1] }); g.add(xArrow);
  const aArrow = createArrow(LAB.purple, { label: 'a', name: 'aArrow', labelOffset: [0, 0.3, 0.1] }); g.add(aArrow);
  const eqMark = box(0.03, 0.9, 0.03, mat(LAB.green, { emissive: LAB.green, emissiveIntensity: 0.5 }), 0.004); eqMark.position.set(0, 0.45, 0.62); eqMark.visible = false; g.add(eqMark);

  // Oscillator time: real time until C1, then a closed-form slow-motion remap (0.3x) for the acceleration line.
  const tau = (t) => (t < C[1] ? t : C[1] + (t - C[1]) * 0.3);
  const xOf = (t) => { const s = tau(t); if (s < 1.0) return A * easeInOut(span(s, 0.2, 1.0)); if (s < RELEASE) return A; return A * Math.cos(OMEGA * (s - RELEASE)); };
  const setLane = (L, x) => { const xs = x * UNIT; L.spring.setLength(NAT + xs); L.block.position.x = xs; };

  function update(t, cam) {
    const twoLane = t >= C[5];
    L2.lane.visible = twoLane; L1.label.visible = twoLane; L2.label.visible = twoLane;
    if (!twoLane) {
      const x = xOf(t); setLane(L1, x);
      const bx = x * UNIT, left = bx - 0.25, right = bx + 0.25;
      const F = -K * x;
      const showF = t > 3.0;
      fSpring.set([F < 0 ? left : right, Y + 0.12, 0.05], [Math.sign(F) || 1, 0, 0], showF ? Math.abs(F) * FSCALE : 0);
      const showA = t >= C[1];
      eqMark.visible = showA;
      xArrow.set([0, 0.25, 0.75], [Math.sign(x) || 1, 0, 0], showA ? Math.abs(bx) : 0);
      aArrow.set([F < 0 ? left : right, Y + 0.62, 0.05], [Math.sign(F) || 1, 0, 0], showA ? Math.abs(K * x) * FSCALE : 0);   // a = -(k/m)x, m = 1
    } else {
      // both lanes held at their amplitudes, released together, stay in phase
      const t0 = C[5] + 0.5; const ph = t < t0 ? 1 : Math.cos(OMEGA * (t - t0));
      setLane(L1, A * ph); setLane(L2, 0.10 * ph);
      fSpring.set([0, 0, 0], [1, 0, 0], 0); xArrow.set([0, 0, 0], [1, 0, 0], 0); aArrow.set([0, 0, 0], [1, 0, 0], 0); eqMark.visible = false;
    }
    if (t < 3.5) dolly(cam, t, 0, 3.5, [1.0, 1.7, 8.2], [0.9, 1.5, 7.8], [0.1, 0.5, 0], [0.1, 0.45, 0]);
    else if (t < C[1]) dolly(cam, t, 3.5, C[1], [0.9, 1.5, 7.8], [0.5, 1.2, 6.4], [0.1, 0.45, 0], [0.1, 0.4, 0]);
    else if (t < C[2]) dolly(cam, t, C[1], C[2], [2.8, 2.6, 6.6], [2.4, 2.4, 6.2], [0.1, 0.4, 0], [0.1, 0.4, 0]);
    else dolly(cam, t, C[5], C[6], [0.3, 1.9, 8.2], [0.3, 1.8, 7.9], [-0.1, 1.0, 0], [-0.1, 1.0, 0]);
  }
  function captions(t, cap) {
    cap.draw('m·d²x/dt² = −kx', t, 3.6, C[1], { y: 1500, size: 70 });
    cap.draw('a = −(k/m)x', t, C[1] + 0.3, C[2], { y: 1500, size: 76 });
    cap.draw('T independent of A', t, C[5] + 0.3, C[6], { y: 1500, size: 66 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
