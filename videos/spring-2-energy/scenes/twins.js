// Part 2 ending (C6 to end): two springs stacked, stretched x and 2x. Behind each, its energy
// triangle; under the 2x spring four small triangles tile the big one. 0.20 J vs 0.80 J.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createLabel } from '/src/props/label.js';
import { easeOut, easeInOut, span } from '/src/timeline.js';
import { dolly } from '/src/camera.js';
import { UNIT, K, NAT, ANCHOR_X, Y } from './benchGraph.js';

export function buildTwins(C) {
  const g = new THREE.Group(); g.name = 'scene_twins';
  g.add(createLab({ benchWidth: 9 }));
  labLights(g, [5, 8, 7]);
  const lanes = [];
  const triMat = [mat(LAB.amber, { emissive: LAB.amber, emissiveIntensity: 0.5, side: THREE.DoubleSide }), mat(0xffd27a, { emissive: 0xffd27a, emissiveIntensity: 0.45, side: THREE.DoubleSide })];
  const triGeo = (w, h) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h); s.closePath(); return new THREE.ShapeGeometry(s); };
  const TW = 0.45, TH = 0.45; // small triangle size in scene units (0.2 m x 2 N)
  for (const [i, x] of [[0, 0.2], [1, 0.4]]) {
    const lane = new THREE.Group(); lane.position.y = i * 2.1; g.add(lane);
    if (i) { const shelf = box(4.6, 0.12, 1.2, LAB.bench, 0.03); shelf.position.set(-0.1, -0.06, 0); lane.add(shelf); }
    lane.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
    const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT, name: 'twin' + i }); spring.rotation.z = -Math.PI / 2; spring.position.set(ANCHOR_X, Y, 0); lane.add(spring);
    const block = createBlock('1 kg'); lane.add(block);
    const xl = createLabel(i ? 'x = 0.40 m' : 'x = 0.20 m', { size: 0.2, color: '#7bd389' }); xl.position.set(i ? 1.0 : 0.55, Y + 0.62, 0.3); lane.add(xl);
    const el = createLabel(i ? '0.80 J' : '0.20 J', { size: 0.26, color: '#ffb347' }); el.position.set(i ? 0.35 : 0.0, i ? 1.3 : 1.05, -0.8); lane.add(el);
    // triangle(s) on the wall behind, to the right of the block
    const tris = [];
    const base = new THREE.Vector3(i ? -1.15 : -0.9, 0.85, -0.9);
    if (!i) { const m = new THREE.Mesh(triGeo(TW, TH), triMat[0]); m.position.copy(base); lane.add(m); tris.push(m); }
    else {
      // four copies tiling the 2x triangle: two along the base, one on top, one flipped in the middle
      // Four copies tiling the 2x triangle: three translated copies plus one point-reflected copy
      // filling the middle, built with CCW winding so its normal faces the camera.
      const flipGeo = () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-TW, 0); s.lineTo(-TW, -TH); s.closePath(); return new THREE.ShapeGeometry(s); };
      const place = [[0, 0, false], [TW, 0, false], [TW, TH, false], [2 * TW, TH, true]];
      place.forEach(([dx, dy, flip], j) => { const m = new THREE.Mesh(flip ? flipGeo() : triGeo(TW, TH), triMat[j % 2]); m.position.set(base.x + dx, base.y + dy, base.z + (flip ? 0.005 : 0)); lane.add(m); tris.push(m); });
      const outline = new THREE.Mesh(triGeo(2 * TW, 2 * TH), mat(0xffffff, { transparent: true, opacity: 0.12, side: THREE.DoubleSide })); outline.position.copy(base).add(new THREE.Vector3(0, 0, -0.01)); lane.add(outline);
    }
    lanes.push({ lane, spring, block, x, tris, el, xl });
  }
  function update(t, cam) {
    for (const L of lanes) {
      const xs = L.x * UNIT * easeInOut(span(t, C[6], C[6] + 1.0));
      L.spring.setLength(NAT + xs); L.block.position.x = ANCHOR_X + NAT + 0.25 + xs;
      L.tris.forEach((m, j) => { m.visible = t >= C[6] + 1.1 + j * 0.35; });
      L.el.visible = t >= C[6] + 2.6; L.spring.setGlow(0.5 * easeInOut(span(t, C[6] + 0.8, C[6] + 1.6)));
    }
    dolly(cam, t, C[6], 32.9, [0.5, 1.8, 7.8], [0.6, 1.9, 8.8], [-0.1, 1.45, 0], [-0.1, 1.5, 0]);
  }
  function captions(t, cap) { cap.draw('2x  →  4U', t, C[6] + 1.6, 32.9, { y: 1500, size: 80 }); }
  return { group: g, update, captions, background: LAB.bg };
}
