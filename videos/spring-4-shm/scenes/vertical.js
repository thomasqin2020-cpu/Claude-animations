// Part 4 vertical (C6 to end): the horizontal rig pivots 90 degrees into a hanging spring,
// the block settles d = mg/k below the natural length, then oscillates with the same period
// as a ghost horizontal oscillator above.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createLabel } from '/src/props/label.js';
import { lerp, easeInOut, easeOut, span } from '/src/timeline.js';
import { dolly } from '/src/camera.js';
import { UNIT, FSCALE, K, M, NAT, OMEGA } from './common.js';

const G = 9.8, D = M * G / K;            // 0.98 m
const PIV = [0, 5.6, 0];                // pivot (anchor face) in world
const A = 0.30, PULL_T = 31.0, REL_T = 31.6;

export function buildVertical(C) {
  const g = new THREE.Group(); g.name = 'scene_vertical';
  g.add(createLab({ bench: false }));
  labLights(g, [5, 9, 8]);
  // support: a post and a beam the pivot hangs from
  const post = box(0.3, 6.3, 0.3, mat(0x2b3448), 0.04); post.position.set(-2.2, 3.15, -0.3); g.add(post);
  const beam = box(2.6, 0.2, 0.4, LAB.bench, 0.04); beam.position.set(-1.0, PIV[1] + 0.35, -0.3); g.add(beam);
  // rig: spring along local +x from the pivot, block beyond it; rotated -90deg to hang
  const rig = new THREE.Group(); rig.position.set(...PIV); g.add(rig);
  const plate = box(0.25, 0.9, 0.9, LAB.accent, 0.04); plate.position.set(-0.12, 0, 0); rig.add(plate);
  // the bench top rotates with the rig, so the tilt reads as the whole bench being stood on end
  const benchTop = box(2.4, 0.14, 1.0, LAB.bench, 0.04); benchTop.position.set(1.0, -0.64, 0); rig.add(benchTop);
  const track = box(2.4, 0.06, 0.5, LAB.track, 0.02); track.position.set(1.0, -0.54, 0); rig.add(track);
  const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT }); spring.rotation.z = -Math.PI / 2; rig.add(spring);
  const block = createBlock('1 kg'); block.position.set(NAT + 0.25, -0.31, 0); rig.add(block);   // block centre on the spring axis
  // ghost horizontal oscillator above the beam (translucent copy)
  const ghost = new THREE.Group(); ghost.position.set(-1.25, PIV[1] + 0.75, 0); ghost.visible = false; g.add(ghost);
  const gSpring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT, color: 0x8fa3c8 }); gSpring.rotation.z = -Math.PI / 2; gSpring.position.y = 0.31; ghost.add(gSpring);
  const gBlock = box(0.5, 0.5, 0.5, mat(0xd9b86a, { transparent: true, opacity: 0.55 }), 0.06); gBlock.position.set(NAT + 0.25, 0.31, 0); ghost.add(gBlock);
  const gTrack = box(3.2, 0.06, 0.4, LAB.track, 0.02); gTrack.position.set(0.4, 0.03, 0); ghost.add(gTrack);
  const gLabel = createLabel('horizontal, same k and m', { size: 0.18 }); gLabel.position.set(1.0, -0.3, 0.3); ghost.add(gLabel);
  // natural-length line (dashed) and equilibrium line, plus the d bracket
  const natY = PIV[1] - NAT - 0.25, eqY = natY - D * UNIT;
  const dash = (y, color) => { const grp = new THREE.Group(); for (let i = 0; i < 10; i++) { const s = box(0.18, 0.025, 0.025, mat(color, { emissive: color, emissiveIntensity: 0.5 }), 0.003); s.position.set(-1.5 + i * 0.34, y, 0.05); grp.add(s); } grp.visible = false; g.add(grp); return grp; };
  const natLine = dash(natY, 0xffffff), eqLine = dash(eqY, LAB.green);
  const natLabel = createLabel('natural length', { size: 0.18 }); natLabel.position.set(-1.1, natY + 0.2, 0.1); natLabel.visible = false; g.add(natLabel);
  const dArrow = createArrow(LAB.green, { label: 'd', radius: 0.025, head: 0.1, labelOffset: [-0.3, 0, 0.1] }); g.add(dArrow);
  const wArrow = createArrow(LAB.purple, { label: 'mg', labelOffset: [0.35, 0, 0.1] }); g.add(wArrow);
  const kArrow = createArrow(LAB.coral, { label: 'kd', labelOffset: [0.4, 0, 0.1] }); g.add(kArrow);

  const ROT_END = C[6] + 1.3, LOWER_END = ROT_END + 1.4;
  // stretch of the spring in metres as a function of time
  function stretch(t) {
    if (t < ROT_END) return 0;
    if (t < LOWER_END) return D * easeInOut(span(t, ROT_END, LOWER_END));
    if (t < PULL_T) return D;
    if (t < REL_T) return D + A * easeInOut(span(t, PULL_T, REL_T));
    return D + A * Math.cos(OMEGA * (t - REL_T));
  }
  function update(t, cam) {
    rig.rotation.z = -Math.PI / 2 * easeInOut(span(t, C[6], ROT_END));
    const s = stretch(t); const ss = s * UNIT;
    spring.setLength(NAT + ss); block.position.x = NAT + 0.25 + ss;
    const settled = t >= LOWER_END;
    natLine.visible = t >= ROT_END; natLabel.visible = natLine.visible; eqLine.visible = settled;
    const by = PIV[1] - (NAT + 0.25 + ss);     // block centre y (hanging)
    const showD = t >= LOWER_END - 0.4 && t < C[7] + 1.0;
    dArrow.set([-0.9, natY, 0.05], [0, -1, 0], showD ? Math.max(0, natY - eqY) * easeOut(span(t, LOWER_END - 0.4, LOWER_END + 0.3)) : 0);
    const showForces = t >= LOWER_END && t < REL_T;
    wArrow.set([0.35, by - 0.25, 0.05], [0, -1, 0], showForces ? M * G * FSCALE * 0.5 : 0);
    kArrow.set([0.35, by + 0.25, 0.05], [0, 1, 0], showForces ? K * D * FSCALE * 0.5 : 0);
    ghost.visible = t >= C[7] - 0.3;
    if (ghost.visible) { const xg = A * Math.cos(OMEGA * (t - REL_T)) * UNIT; gSpring.setLength(NAT + xg); gBlock.position.x = NAT + 0.25 + xg; }
    if (t < ROT_END) dolly(cam, t, C[6], ROT_END, [0.6, 4.6, 8.0], [0.6, 3.4, 9.9], [0.2, 4.9, 0], [0.0, 2.75, 0]);
    else if (t < C[7]) dolly(cam, t, ROT_END, C[7], [0.6, 3.4, 9.9], [0.5, 3.3, 9.9], [0.0, 2.75, 0], [0.0, 2.75, 0]);
    else dolly(cam, t, C[7], 36.7, [0.5, 3.3, 9.9], [0.6, 3.6, 12.4], [0.0, 2.75, 0], [-0.1, 3.15, 0]);
  }
  function captions(t, cap) {
    cap.draw('kd = mg', t, LOWER_END - 0.2, 30.5, { y: 1500, size: 76 });
    cap.draw('d = mg/k ≈ 0.98 m', t, 30.5, C[7], { y: 1500, size: 64 });
    cap.draw('T = 2π√(m/k)', t, C[7] + 0.2, 36.7, { y: 1500, size: 72 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
