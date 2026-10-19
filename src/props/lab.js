import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { createLabel } from './label.js';

// Shared dark-navy physics lab: floor, back wall, and a bench with a track. Lights are
// included so a scene gets consistent lighting by calling labLights(group, keyDir).
export const LAB = { bg: 0x101420, floor: 0x1c2333, wall: 0x232b3d, bench: 0x394459, track: 0x59657f, accent: 0x7b8aa8,
  coral: 0xff6b5b, teal: 0x2ec4b6, green: 0x7bd389, purple: 0x9b7bff, red: 0xe63946, amber: 0xffb347 };

export function createLab(opts = {}) {
  const g = new THREE.Group(); g.name = 'lab';
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(LAB.floor, { roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wall = box(40, 20, 0.5, LAB.wall, 0.05); wall.position.set(0, 10, -3.2); wall.receiveShadow = true; g.add(wall);
  // subtle wall panels for depth
  for (let i = -3; i <= 3; i++) { const p = box(3.6, 2.4, 0.1, mat(0x273047), 0.05); p.position.set(i * 4.2, 1.9, -2.9); g.add(p); }
  if (opts.bench !== false) {
    const bench = box(opts.benchWidth ?? 8, 0.5, 2.2, LAB.bench, 0.06); bench.position.set(0, -0.25, 0); bench.receiveShadow = true; g.add(bench);
    const track = box(opts.benchWidth ?? 8, 0.06, 0.5, LAB.track, 0.02); track.position.set(0, 0.03, 0); track.receiveShadow = true; g.add(track);
    for (const s of [-1, 1]) { const leg = box(0.3, 1.6, 1.8, mat(0x2b3448), 0.04); leg.position.set(s * ((opts.benchWidth ?? 8) / 2 - 0.5), -1.3, 0); g.add(leg); }
  }
  return g;
}

export function labLights(g, key = [5, 8, 7]) {
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4); sun.position.set(...key); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; g.add(sun);
  g.add(new THREE.HemisphereLight(0x8fa3c8, 0x1a1f2c, 0.9));
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.7); rim.position.set(-6, 4, -4); g.add(rim);
  return sun;
}

// Wall anchor plate for a horizontal spring; the spring's fixed end sits at the plate face.
export function createAnchor(x, y = 0.35) {
  const g = new THREE.Group(); g.name = 'anchor';
  const plate = box(0.25, 1.1, 0.9, LAB.accent, 0.04); plate.position.set(x, y + 0.2, 0); g.add(plate);
  const base = box(0.6, 0.12, 1.0, mat(0x2b3448), 0.03); base.position.set(x - 0.1, 0.1, 0); g.add(base);
  return g;
}

// Block of mass with a label, resting on the track at y = 0.06 (track top).
export function createBlock(label, color = 0xd9b86a, size = 0.5) {
  const g = new THREE.Group(); g.name = 'block';
  const b = box(size, size, size, color, 0.06); b.position.y = 0.06 + size / 2; g.add(b);
  if (label) { const l = createLabel(label, { size: 0.2, bg: null, color: '#1a1a1a' }); l.position.set(0, 0.06 + size / 2, size / 2 + 0.02); g.add(l); }
  g.top = 0.06 + size; g.center = 0.06 + size / 2;
  return g;
}
