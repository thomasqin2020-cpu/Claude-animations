import * as THREE from 'three';
import { mat } from '../materials.js';
import { rng } from '../timeline.js';

// Jagged lunar shard: icosahedron with seeded outward spikes so every grain has a distinct
// silhouette but the same seed always yields the same shape.
export function shardGeometry(seed, spike = 0.55) {
  const r = rng(seed);
  const g = new THREE.IcosahedronGeometry(1, 0);
  const p = g.attributes.position; const v = new THREE.Vector3();
  // Icosahedron(…, 0) is non-indexed: 60 verts; displace by position hash so shared corners agree.
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = v.toArray().map((n) => n.toFixed(3)).join(',');
    if (!seen.has(key)) seen.set(key, 0.6 + r() * (0.4 + spike) * (r() < 0.3 ? 1.8 : 1));
    v.multiplyScalar(seen.get(key)); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// Rounded Earth sand grain: smoother sphere with gentle lumps.
export function roundGrainGeometry(seed) {
  const r = rng(seed);
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position; const v = new THREE.Vector3(); const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = v.toArray().map((n) => n.toFixed(3)).join(',');
    if (!seen.has(key)) seen.set(key, 0.9 + r() * 0.18);
    v.multiplyScalar(seen.get(key)); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export const GRAIN = {
  moon: mat(0x7d7b76, { roughness: 0.95 }),
  moonLight: mat(0x9b9893, { roughness: 0.95 }),
  glass: mat(0xd6e6ee, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.85, emissive: 0x6b8a99, emissiveIntensity: 0.25 }),
  sand: mat(0xd9b77a, { roughness: 0.9 }),
  sandDark: mat(0xb8955c, { roughness: 0.9 })
};

// Deterministic ballistic dust: `events` are {t, x, y, z, n, spread, up} bursts. Each
// particle's position at time t is closed-form, so seeking is exact and nothing accumulates.
export function createDustSystem(events, opts = {}) {
  const g = opts.g ?? 1.62, life = opts.life ?? 1.6, size = opts.size ?? 0.05;
  const count = events.reduce((s, e) => s + e.n, 0);
  const geo = opts.shard ? shardGeometry(5, 0.3) : new THREE.IcosahedronGeometry(1, 0);
  const mesh = new THREE.InstancedMesh(geo, opts.material ?? mat(0x8c8a84), count);
  mesh.castShadow = false; mesh.frustumCulled = false; mesh.name = 'dust';
  const parts = []; const r = rng(opts.seed ?? 21);
  for (const e of events) for (let i = 0; i < e.n; i++) {
    const a = r() * Math.PI * 2, sp = (0.4 + r() * 1.0) * (e.spread ?? 1);
    parts.push({ t0: e.t, x: e.x, y: e.y, z: e.z, vx: Math.cos(a) * sp + (e.vx ?? 0), vz: Math.sin(a) * sp + (e.vz ?? 0), vy: (0.8 + r() * 1.6) * (e.up ?? 1), s: size * (0.5 + r()), rot: r() * 6, rs: (r() - 0.5) * 8 });
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  mesh.update = (t) => {
    parts.forEach((pt, i) => {
      const dt = t - pt.t0;
      if (dt < 0 || dt > life) { s.set(0, 0, 0); p.set(0, -100, 0); }
      else {
        const y = pt.y + pt.vy * dt - 0.5 * g * dt * dt;
        p.set(pt.x + pt.vx * dt, Math.max(pt.y, y), pt.z + pt.vz * dt);
        const fade = y < pt.y ? 0 : 1;         // vanish when it lands (lunar dust doesn't hang)
        s.setScalar(pt.s * fade);
      }
      e.set(pt.rot + pt.rs * Math.max(0, dt), pt.rot * 1.3, 0); q.setFromEuler(e);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}
