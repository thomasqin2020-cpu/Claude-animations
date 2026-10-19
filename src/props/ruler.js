import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { createLabel } from './label.js';

// Horizontal ruler along +x: zero at local origin, `unit` world units per metre, ticks every 0.1 m.
export function createRuler(opts = {}) {
  const g = new THREE.Group(); g.name = 'ruler';
  const from = opts.from ?? -0.5, to = opts.to ?? 0.5, unit = opts.unit ?? 1, step = opts.step ?? 0.1;
  const bar = box((to - from) * unit, 0.05, 0.22, mat(0xe9e4d2), 0.01); bar.position.set((from + to) / 2 * unit, 0, 0); g.add(bar);
  for (let v = from; v <= to + 1e-9; v += step) {
    const major = Math.abs(Math.round(v / (step * 5)) * step * 5 - v) < 1e-6;
    const t = box(0.02, 0.04, major ? 0.2 : 0.1, mat(0x222222), 0.002); t.position.set(v * unit, 0.03, major ? 0 : 0.05); g.add(t);
    if (major && opts.labels !== false) { const l = createLabel((v >= 0 ? '+' : '') + v.toFixed(1), { size: 0.12, bg: null, color: '#1a1a1a' }); l.position.set(v * unit, 0.09, 0.0); g.add(l); }
  }
  return g;
}
