// Part 4 recorder (C2 to C5): the block oscillates on a raised beam; a pen under it traces
// x(t) onto a paper strip scrolling down. Brackets mark A and one period; captions derive omega.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createChartRecorder } from '/src/props/chartRecorder.js';
import { createLabel } from '/src/props/label.js';
import { easeOut, span, pulse } from '/src/timeline.js';
import { dolly } from '/src/camera.js';
import { UNIT, NAT, ANCHOR_X, Y, OMEGA, PERIOD } from './common.js';

const A = 0.30, BEAM_Y = 2.2, SPEED = 0.5;   // strip scroll speed: one period = 0.99 units

export function buildRecorder(C) {
  const g = new THREE.Group(); g.name = 'scene_recorder';
  g.add(createLab({ bench: false }));
  labLights(g, [5, 8, 7]);
  const rig = new THREE.Group(); rig.position.y = BEAM_Y; g.add(rig);
  const beam = box(5.0, 0.14, 0.6, LAB.bench, 0.03); beam.position.set(-0.2, -0.07, 0); rig.add(beam);
  for (const sx of [-2.4, 2.0]) { const post = box(0.18, BEAM_Y, 0.18, mat(0x2b3448), 0.03); post.position.set(sx, -BEAM_Y / 2 - 0.1, -0.35); rig.add(post); }
  rig.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
  const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT }); spring.rotation.z = -Math.PI / 2; spring.position.set(ANCHOR_X, Y, 0); rig.add(spring);
  const block = createBlock('1 kg'); rig.add(block);
  const pen = box(0.05, 0.5, 0.05, mat(LAB.teal, { emissive: LAB.teal, emissiveIntensity: 0.5 }), 0.01); pen.position.set(0, -0.2, 0.3); block.add(pen);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), mat(LAB.teal, { emissive: LAB.teal, emissiveIntensity: 0.8 })); tip.rotation.x = Math.PI; tip.position.set(0, -0.5, 0.3); block.add(tip);
  const rec = createChartRecorder({ width: 2.2, height: 3.4, speed: SPEED, color: LAB.teal }); rec.position.set(0, BEAM_Y - 0.55, 0.28); g.add(rec);
  // brackets (built from thin boxes) that ride the paper with the features they mark
  const brMat = mat(LAB.amber, { emissive: LAB.amber, emissiveIntensity: 0.6 });
  const aBr = new THREE.Group(); const aBar = box(1, 0.03, 0.03, brMat, 0.003); aBr.add(aBar); const aT1 = box(0.03, 0.14, 0.03, brMat, 0.003), aT2 = box(0.03, 0.14, 0.03, brMat, 0.003); aBr.add(aT1, aT2);
  const aLabel = createLabel('A', { size: 0.2, color: '#ffb347' }); aBr.add(aLabel); aBr.visible = false; rec.add(aBr);
  const pBr = new THREE.Group(); const pBar = box(0.03, 1, 0.03, brMat, 0.003); pBr.add(pBar); const pT1 = box(0.16, 0.03, 0.03, brMat, 0.003), pT2 = box(0.16, 0.03, 0.03, brMat, 0.003); pBr.add(pT1, pT2);
  const pLabel = createLabel('T', { size: 0.2, color: '#ffb347' }); pBr.add(pLabel); pBr.visible = false; rec.add(pBr);

  const t0 = C[2] + 0.4;
  const xOf = (t) => (t < t0 ? A : A * Math.cos(OMEGA * (t - t0)));
  function update(t, cam) {
    const x = xOf(t); const xs = x * UNIT;
    spring.setLength(NAT + xs); block.position.x = xs;
    rec.update(t, (ti) => xOf(ti) * UNIT, t0);
    // A bracket on the first peak (t0) while it is still on the paper
    const np = Math.max(0, Math.floor((t - t0) / PERIOD)); const yPeak = -(t - (t0 + np * PERIOD)) * SPEED;   // latest peak
    aBr.visible = t >= 15.0 && t < C[4];
    if (aBr.visible) { aBar.scale.x = A * UNIT; aBar.position.set(A * UNIT / 2, yPeak + 0.12, 0.06); aT1.position.set(0, yPeak + 0.12, 0.06); aT2.position.set(A * UNIT, yPeak + 0.12, 0.06); aLabel.position.set(A * UNIT / 2, yPeak + 0.34, 0.08); }
    // period bracket on the most recent complete cycle
    const n = Math.floor((t - t0) / PERIOD) - 1;
    pBr.visible = t >= 15.0 && n >= 0;
    if (pBr.visible) {
      const ya = -(t - (t0 + n * PERIOD)) * SPEED, yb = -(t - (t0 + (n + 1) * PERIOD)) * SPEED; const xb = A * UNIT + 0.25;
      pBar.scale.y = yb - ya; pBar.position.set(xb, (ya + yb) / 2, 0.06); pT1.position.set(xb, ya, 0.06); pT2.position.set(xb, yb, 0.06);
      pLabel.position.set(xb + 0.2, (ya + yb) / 2, 0.08);
      pLabel.visible = t >= C[4];
      const pl = t >= C[4] ? 0.6 + 0.9 * Math.max(0, Math.sin(OMEGA * (t - t0))) : 0.6; brMat.emissiveIntensity = pl;
    }
    dolly(cam, t, C[2], 15.0, [0.2, 2.4, 6.6], [0.1, 1.9, 6.4], [0, 2.0, 0], [0, 1.25, 0]);
  }
  function captions(t, cap) {
    cap.draw('x(t) = A cos(ωt + φ)', t, C[2] + 0.3, C[3], { y: 1500, size: 68 });
    cap.draw('d²x/dt² = −ω²x', t, C[3], C[3] + 1.3, { y: 1500, size: 70 });
    cap.draw('−mω²x = −kx', t, C[3] + 1.3, C[3] + 2.6, { y: 1500, size: 70 });
    cap.draw('ω² = k/m', t, C[3] + 2.6, C[4], { y: 1500, size: 78 });
    cap.draw('T = 2π/ω = 2π√(m/k)\nT ≈ 1.99 s', t, C[4] + 0.2, C[5], { y: 1500, size: 58 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
