import * as THREE from 'three';
import { mat } from '../materials.js';
import { createLabel } from './label.js';

// Force/displacement arrow: shaft + cone head, optional text label at the tip.
// set(from, dir, length): closed-form placement; length 0 hides it.
export function createArrow(color, opts = {}) {
  const g = new THREE.Group(); g.name = opts.name ?? 'arrow';
  const r = opts.radius ?? 0.035, head = opts.head ?? 0.14;
  const m = mat(color, { roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), m); shaft.castShadow = true; g.add(shaft);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, head, 10), m); cone.castShadow = true; g.add(cone);
  const label = opts.label ? createLabel(opts.label, { color: '#' + color.toString(16).padStart(6, '0'), size: opts.labelSize ?? 0.22 }) : null;
  if (label) g.add(label);
  const UP = new THREE.Vector3(0, 1, 0), D = new THREE.Vector3(), F = new THREE.Vector3(), LP = new THREE.Vector3(), Qi = new THREE.Quaternion();
  // labelOffset is a WORLD-space offset from the arrow's midpoint (default: above it).
  g.set = (from, dir, length, labelOffset = opts.labelOffset ?? [0, 0.3, 0]) => {
    g.visible = length > 1e-4;
    if (!g.visible) return;
    F.set(...from); D.set(...dir).normalize();
    g.position.copy(F); g.quaternion.setFromUnitVectors(UP, D);
    const sl = Math.max(0.001, length - head);
    shaft.scale.set(1, sl, 1); shaft.position.y = sl / 2; cone.position.y = sl + head / 2;
    if (label) { Qi.copy(g.quaternion).invert(); LP.set(...labelOffset).applyQuaternion(Qi); LP.y += length / 2; label.position.copy(LP); }
  };
  g.set([0, 0, 0], [0, 1, 0], 0);
  return g;
}
