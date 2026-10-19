import * as THREE from 'three';
import { mat } from '../materials.js';

// Helical spring along +y from y = 0 to y = length. setLength() rewrites vertex positions in
// closed form (each vertex remembers its helix parameter u and its offset from the helix
// centre line), so the wire keeps its thickness at any stretch. setSet(f) opens the coils
// unevenly to show permanent deformation.
export function createSpring(opts = {}) {
  const coils = opts.coils ?? 10, R = opts.radius ?? 0.14, wire = opts.wire ?? 0.028, L0 = opts.length ?? 1.0;
  const color = opts.color ?? 0xb9bcc6;
  const material = mat(color, { roughness: 0.45, metalness: 0.15, emissive: opts.glow ?? 0x000000, emissiveIntensity: 0 });
  const segs = coils * 14, radial = 7;
  const geo = new THREE.BufferGeometry();
  const n = (segs + 1) * (radial + 1);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  const U = new Float32Array(n), OFF = new Float32Array(n * 3);
  const idx = [];
  const center = (u, L) => new THREE.Vector3(R * Math.cos(u * coils * Math.PI * 2), u * L, R * Math.sin(u * coils * Math.PI * 2));
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const c = center(u, L0), c2 = center(Math.min(1, u + 1e-3), L0);
    const T = c2.sub(c).normalize();
    const N = new THREE.Vector3(Math.cos(u * coils * Math.PI * 2), 0, Math.sin(u * coils * Math.PI * 2)); // radial outward
    const B = new THREE.Vector3().crossVectors(T, N).normalize(); N.crossVectors(B, T).normalize();
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * Math.PI * 2; const k = i * (radial + 1) + j;
      const off = N.clone().multiplyScalar(Math.cos(a) * wire).add(B.clone().multiplyScalar(Math.sin(a) * wire));
      U[k] = u; OFF.set([off.x, off.y, off.z], k * 3);
      pos.set([c.x + off.x, c.y + off.y, c.z + off.z], k * 3); nor.set(off.clone().normalize().toArray(), k * 3);
      if (i < segs && j < radial) { const b = k + radial + 1; idx.push(k, b, k + 1, b, b + 1, k + 1); }
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const g = new THREE.Group(); g.name = opts.name ?? 'spring'; g.add(mesh);
  // end caps: short straight stubs so the spring visibly attaches to things
  const stub = new THREE.CylinderGeometry(wire, wire, 0.12, 6);
  const capA = new THREE.Mesh(stub, material), capB = new THREE.Mesh(stub, material);
  capA.position.set(R, 0, 0); capB.position.set(R, L0, 0); g.add(capA, capB);
  let set = 0, length = L0;
  g.setLength = (L) => {
    length = L; const p = geo.attributes.position;
    for (let k = 0; k < n; k++) {
      const u = U[k];
      // permanent set: coils near the fixed end stay opened out
      const uu = set > 0 ? u + set * 0.12 * Math.sin(u * Math.PI) : u;
      const cy = uu * L, cx = R * Math.cos(u * coils * Math.PI * 2), cz = R * Math.sin(u * coils * Math.PI * 2);
      p.setXYZ(k, cx + OFF[k * 3], cy + OFF[k * 3 + 1], cz + OFF[k * 3 + 2]);
    }
    p.needsUpdate = true; capB.position.y = L;
  };
  g.setSet = (f) => { set = f; g.setLength(length); };
  g.setGlow = (a) => { material.emissive.set(opts.glow ?? 0xffb347); material.emissiveIntensity = a; };
  g.naturalLength = L0; g.material = material;
  return g;
}
