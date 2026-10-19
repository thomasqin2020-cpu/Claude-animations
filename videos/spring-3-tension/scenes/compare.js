// Part 3 compare (C7 to end): bar chart of stiffness. Series is softer than either; parallel stiffer than both.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, LAB } from '/src/props/lab.js';
import { createLabel } from '/src/props/label.js';
import { easeOut, span } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

const BASE = 2.5, SCALE = 0.1;   // 30 N/m -> 3.0 units tall
export function buildCompare(C) {
  const g = new THREE.Group(); g.name = 'scene_compare';
  g.add(createLab({ bench: false })); labLights(g, [4, 8, 8]);
  const plinth = box(4.6, 0.2, 1.2, LAB.bench, 0.04); plinth.position.set(0, BASE - 0.1, 0); g.add(plinth);
  const defs = [
    { name: 'kₛ', val: 6.7, x: -1.2, color: LAB.green, t0: C[7] + 0.2 },
    { name: 'k₁', val: 10, x: -0.4, color: 0x5aa9ff, t0: C[7] + 0.6 },
    { name: 'k₂', val: 20, x: 0.4, color: 0xffa040, t0: C[7] + 1.0 },
    { name: 'kₚ', val: 30, x: 1.2, color: LAB.green, t0: C[8] + 0.2 }
  ];
  const bars = defs.map((d) => {
    const m = mat(d.color, { emissive: d.color, emissiveIntensity: 0.2 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1, 0.55), m); b.castShadow = true; b.position.set(d.x, BASE, 0); g.add(b);
    const name = createLabel(d.name, { size: 0.26, bg: null }); name.position.set(d.x, BASE - 0.32, 0.4); g.add(name);
    const valLabel = createLabel(d.val.toFixed(d.val < 10 ? 1 : 0) + ' N/m', { size: 0.2 }); g.add(valLabel);
    return { ...d, b, m, valLabel };
  });
  function update(t, cam) {
    for (const bar of bars) {
      const h = Math.max(1e-3, bar.val * SCALE * easeOut(span(t, bar.t0, bar.t0 + 0.8)));
      bar.b.scale.y = h; bar.b.position.y = BASE + h / 2;
      bar.valLabel.visible = t > bar.t0 + 0.5; bar.valLabel.position.set(bar.x, BASE + h + 0.22, 0.3);
      const lit = (bar.name === 'kₛ' && t < C[8]) || (bar.name === 'kₚ' && t >= C[8]);
      bar.m.emissiveIntensity = lit ? 0.55 + 0.25 * Math.sin(t * 6) : 0.15;
    }
    dolly(cam, t, C[7], 35.3, [0.0, 3.9, 7.4], [0.0, 4.1, 8.4], [0, 3.7, 0], [0, 3.8, 0]);
  }
  function captions(t, cap) {
    // bar labels carry the numbers; no 2D caption so nothing collides with the bars
  }
  return { group: g, update, captions, background: LAB.bg };
}
