// Part 3 rigs (C3 to C7): series rig at x = 0 and parallel rig at x = +4.6 under one
// ceiling beam; the camera trucks right at C5. k1 = 10 N/m thin blue, k2 = 20 N/m thick orange.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createLabel } from '/src/props/label.js';
import { lerp, easeInOut, easeOut, span } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

const UNIT = 2.5, FSCALE = 0.16, F = 3.0;
const BEAM_Y = 5.2, NAT = 1.0;
const X1 = 0.30 * UNIT, X2 = 0.15 * UNIT, XP = 0.10 * UNIT;      // 0.75, 0.375, 0.25
const PX = 4.6;                                                  // parallel rig x offset
const BLUE = 0x5aa9ff, ORANGE = 0xffa040;

function bracket(len, label, color = '#7bd389') {
  const g = new THREE.Group();
  const m = mat(LAB.green, { emissive: LAB.green, emissiveIntensity: 0.4 });
  const bar = box(0.025, len, 0.025, m, 0.004); bar.position.y = -len / 2; g.add(bar);
  for (const y of [0, -len]) { const tick = box(0.16, 0.025, 0.025, m, 0.004); tick.position.y = y; g.add(tick); }
  if (label) { const l = createLabel(label, { size: 0.2, color }); l.position.set(0.32, -len / 2, 0.1); g.add(l); }
  g.setLen = (L) => { bar.scale.y = Math.max(1e-3, L / len); bar.position.y = -L / 2; g.children[2].position.y = -L; if (label) g.children[3].position.y = -L / 2; };
  return g;
}
function hanger(size = 0.5) { const b = box(size, size, size, 0xd9b86a, 0.06); return b; }

export function buildRigs(C) {
  const g = new THREE.Group(); g.name = 'scene_rigs';
  g.add(createLab({ bench: false })); labLights(g, [5, 9, 8]);
  const beam = box(9, 0.3, 0.8, LAB.bench, 0.05); beam.position.set(PX / 2, BEAM_Y + 0.15, 0); g.add(beam);
  for (const x of [-0.5, PX / 2, PX + 0.5]) { const post = box(0.3, 0.3, 0.9, LAB.accent, 0.04); post.position.set(x, BEAM_Y + 0.15, 0.05); g.add(post); }

  // ----- series rig -----
  const s1 = createSpring({ coils: 10, radius: 0.16, wire: 0.026, length: NAT, color: BLUE, name: 'k1s' }); s1.rotation.z = Math.PI; s1.position.set(0, BEAM_Y, 0); g.add(s1); // +y -> down
  const s2 = createSpring({ coils: 10, radius: 0.18, wire: 0.05, length: NAT, color: ORANGE, name: 'k2s' }); s2.rotation.z = Math.PI; g.add(s2);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(LAB.accent)); g.add(joint);
  const blockS = hanger(); g.add(blockS);
  const blockSLabel = createLabel('3.0 N', { size: 0.2, bg: null, color: '#1a1a1a' }); g.add(blockSLabel);
  const k1Label = createLabel('k₁ = 10 N/m', { size: 0.2, color: '#5aa9ff' }); k1Label.position.set(-1.05, BEAM_Y - 0.95, 0.2); g.add(k1Label);
  const k2Label = createLabel('k₂ = 20 N/m', { size: 0.2, color: '#ffa040' }); g.add(k2Label);
  const tS1 = createArrow(LAB.coral, { label: '3.0 N', labelOffset: [-0.48, 0, 0] }); g.add(tS1);
  const tS2 = createArrow(LAB.coral, { label: '3.0 N', labelOffset: [-0.48, 0, 0] }); g.add(tS2);
  const br1 = bracket(X1, 'x₁'); g.add(br1); const br2 = bracket(X2, 'x₂'); g.add(br2);
  const brSum = bracket(X1 + X2, 'x'); g.add(brSum);
  const ksLabel = createLabel('kₛ = 6.7 N/m', { size: 0.24, color: '#7bd389' }); ksLabel.position.set(0.55, BEAM_Y - 0.88, 0.3); g.add(ksLabel);
  const l0a = box(0.5, 0.02, 0.02, mat(0x9aa3b5), 0.003); l0a.position.set(0, BEAM_Y - NAT, 0); g.add(l0a);   // natural-length marks
  const l0b = box(0.5, 0.02, 0.02, mat(0x9aa3b5), 0.003); g.add(l0b);

  // ----- parallel rig -----
  const W = 1.2, p = 20 / (10 + 20) * W;     // load 2/3 of the way toward k2
  const xa = PX - W / 2, xb = PX + W / 2;
  const p1 = createSpring({ coils: 10, radius: 0.16, wire: 0.026, length: NAT, color: BLUE, name: 'k1p' }); p1.rotation.z = Math.PI; p1.position.set(xa, BEAM_Y, 0); g.add(p1);
  const p2 = createSpring({ coils: 10, radius: 0.18, wire: 0.05, length: NAT, color: ORANGE, name: 'k2p' }); p2.rotation.z = Math.PI; p2.position.set(xb, BEAM_Y, 0); g.add(p2);
  const bar = box(W + 0.5, 0.1, 0.3, LAB.accent, 0.03); g.add(bar);
  const rod = box(0.05, 0.5, 0.05, mat(0x9aa3b5), 0.01); g.add(rod);
  const blockP = hanger(); g.add(blockP);
  const blockPLabel = createLabel('3.0 N', { size: 0.2, bg: null, color: '#1a1a1a' }); g.add(blockPLabel);
  const tP1 = createArrow(LAB.coral, { label: '1.0 N', labelOffset: [-0.34, 0, 0] }); g.add(tP1);
  const tP2 = createArrow(LAB.coral, { label: '2.0 N', labelOffset: [0.34, 0, 0] }); g.add(tP2);
  const brP = bracket(XP, 'x = 0.10 m'); g.add(brP);
  const kpLabel = createLabel('kₚ = 30 N/m', { size: 0.24, color: '#7bd389' }); kpLabel.position.set(PX, BEAM_Y - 0.55, 0.3); g.add(kpLabel);
  const k1pLabel = createLabel('k₁', { size: 0.2, color: '#5aa9ff' }); k1pLabel.position.set(xa - 0.4, BEAM_Y - 0.6, 0.2); g.add(k1pLabel);
  const k2pLabel = createLabel('k₂', { size: 0.2, color: '#ffa040' }); k2pLabel.position.set(xb + 0.4, BEAM_Y - 0.6, 0.2); g.add(k2pLabel);
  const pLabel = createLabel('⅔ w', { size: 0.18, bg: null, color: '#c9d2e6' }); g.add(pLabel);
  const l0p = box(W + 0.9, 0.02, 0.02, mat(0x9aa3b5), 0.003); l0p.position.set(PX, BEAM_Y - NAT, 0); g.add(l0p);

  function update(t, cam) {
    // series: load hooks on during line 3
    const hook = easeInOut(span(t, C[3] + 0.3, C[3] + 1.6));
    const e1 = X1 * hook, e2 = X2 * hook;
    s1.setLength(NAT + e1); const jy = BEAM_Y - NAT - e1; joint.position.set(0, jy, 0);
    s2.position.set(0, jy, 0); s2.setLength(NAT + e2); const by = jy - NAT - e2;
    blockS.position.set(0, by - 0.25, 0); blockSLabel.position.set(0, by - 0.25, 0.27);
    k2Label.position.set(-1.05, jy - 0.4, 0.2); l0b.position.set(0, jy - NAT, 0);
    const tg = easeOut(span(t, C[3] + 1.6, C[3] + 2.3));
    tS1.set([-0.42, jy + 0.6, 0.1], [0, -1, 0], F * FSCALE * tg);                // tension in spring 1 (on the joint)
    tS2.set([-0.42, by + 0.55, 0.1], [0, -1, 0], F * FSCALE * tg);                 // tension in spring 2 (on the block)
    const brOn = t >= 14.2 && t < C[5];
    br1.visible = brOn; br1.position.set(0.5, BEAM_Y - NAT, 0.1);
    br2.visible = brOn; br2.position.set(0.5, jy - NAT, 0.1);
    brSum.visible = t >= 15.3 && t < C[5]; brSum.position.set(0.95, by + X1 + X2, 0.1);
    ksLabel.visible = t >= 19.5 && t < C[5];
    // parallel: load hooks on at C5
    const hp = easeInOut(span(t, C[5] + 0.6, C[5] + 1.7)); const ep = XP * hp;
    p1.setLength(NAT + ep); p2.setLength(NAT + ep);
    const bary = BEAM_Y - NAT - ep; bar.position.set(PX, bary - 0.05, 0);
    rod.position.set(xa + p, bary - 0.35, 0); blockP.position.set(xa + p, bary - 0.85, 0); blockPLabel.position.set(xa + p, bary - 0.85, 0.27);
    pLabel.position.set(xa + p / 2, bary - 0.28, 0.2); pLabel.visible = t >= C[5] + 1.7;
    const tpg = easeOut(span(t, C[5] + 1.8, C[5] + 2.5));
    tP1.set([xa - 0.32, bary + 0.5, 0.1], [0, -1, 0], 1.0 * FSCALE * tpg * 2);   // drawn at 2x FSCALE so 1.0 N is legible; ratio stays 1:2
    tP2.set([xb + 0.32, bary + 0.5, 0.1], [0, -1, 0], 2.0 * FSCALE * tpg * 2);
    brP.visible = t >= C[5] + 1.8; brP.position.set(PX + 0.0, BEAM_Y - NAT, 0.1);
    kpLabel.visible = t >= C[6] + 0.8;
    // ---- camera ---- (rig top ~5.2, block bottom ~1.5; camera back far enough that the rig clears the caption band)
    if (t < C[5]) dolly(cam, t, C[3], C[4], [0.3, 3.3, 8.0], [0.2, 3.2, 7.4], [0, 2.95, 0], [0, 2.9, 0]);
    else dolly(cam, t, C[5], C[5] + 1.4, [0.2, 3.2, 7.4], [PX - 0.1, 3.6, 7.9], [0, 2.9, 0], [PX - 0.1, 3.35, 0]);
  }
  function captions(t, cap) {
    cap.draw('x₁ = 0.30 m    x₂ = 0.15 m', t, 14.3, 15.5, { y: 1500, size: 56 });
    cap.draw('x = x₁ + x₂ = 0.45 m', t, 15.5, C[4], { y: 1500, size: 62 });
    cap.draw('F/kₛ = F/k₁ + F/k₂', t, C[4] + 0.3, 19.5, { y: 1500, size: 64 });
    cap.draw('1/kₛ = 1/k₁ + 1/k₂', t, 19.5, C[5], { y: 1500, size: 70 });
    cap.draw('F = k₁x + k₂x', t, C[5] + 1.6, C[6], { y: 1500, size: 70 });
    cap.draw('kₚ = k₁ + k₂', t, C[6] + 0.3, C[7], { y: 1500, size: 76 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
