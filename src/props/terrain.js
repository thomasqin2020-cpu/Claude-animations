import * as THREE from 'three';
import { mat } from '../materials.js';
import { rng } from '../timeline.js';

// Low-poly lunar ground: displaced plane plus crater rims and scattered rocks. Seeded.
export function createMoonTerrain(size = 60, seg = 48, seed = 11) {
  const r = rng(seed);
  const g = new THREE.Group(); g.name = 'terrain';
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  const pos = geo.attributes.position;
  const craters = Array.from({ length: 9 }, () => ({ x: (r() - 0.5) * size * 0.8, y: (r() - 0.5) * size * 0.8, rad: 1.5 + r() * 4 }));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    let h = (r() - 0.5) * 0.18 + Math.sin(x * 0.25) * Math.cos(y * 0.21) * 0.35;
    for (const c of craters) {
      const d = Math.hypot(x - c.x, y - c.y) / c.rad;
      if (d < 1.3) h += d < 0.8 ? -0.35 * (0.8 - d) / 0.8 * c.rad * 0.3 : Math.sin((d - 0.8) / 0.5 * Math.PI) * 0.18 * c.rad * 0.12;
    }
    // keep a flat landing/walking pad near the origin
    const near = Math.hypot(x, y); if (near < 7) h *= near / 7;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat(0x8d8b86, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const rockMat = mat(0x6e6c68, { roughness: 1 });
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 60); rocks.castShadow = true; rocks.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 5 + r() * 24; const sc = 0.2 + r() * r() * 1.4;
    p.set(Math.cos(a) * d, sc * 0.3, Math.sin(a) * d); e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); s.set(sc, sc * 0.6, sc * 0.8);
    rocks.setMatrixAt(i, m.compose(p, q, s));
  }
  g.add(rocks);
  return g;
}

// Earth seen from the Moon: blue sphere with low-poly green landmasses and a thin glow.
export function createEarth(radius = 3) {
  const g = new THREE.Group(); g.name = 'earth';
  const sea = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), mat(0x2f6fd6, { roughness: 0.6, emissive: 0x0b2a66, emissiveIntensity: 0.8 })); g.add(sea);
  const r = rng(3);
  for (let i = 0; i < 7; i++) {
    const land = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * (0.25 + r() * 0.3), 1), mat(0x4faa4e, { roughness: 1, emissive: 0x143a14, emissiveIntensity: 0.6 }));
    const a = r() * Math.PI * 2, b = (r() - 0.5) * 2.4;
    land.position.set(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)).multiplyScalar(radius * 0.86);
    land.scale.set(1, 1, 0.35); land.lookAt(0, 0, 0); g.add(land);
  }
  const cloud = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 1.04, 1), mat(0xffffff, { transparent: true, opacity: 0.22, emissive: 0xffffff, emissiveIntensity: 0.5 })); g.add(cloud);
  return g;
}
