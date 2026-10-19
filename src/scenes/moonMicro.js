// Scene C (13.51 - 23.86 s): the same micro framing on the Moon. Nothing moves, then
// meteorite impacts shatter rock into shards and glass beads, then a boot kicks them up.
import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { shardGeometry, GRAIN, createDustSystem } from '../props/grains.js';
import { rng, span, easeInOut, easeOut, easeIn, lerp } from '../timeline.js';
import { dolly, orbit } from '../camera.js';

const G = 1.62;
export function buildMoonMicro() {
  const g = new THREE.Group(); g.name = 'scene_moonMicro';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 24, 24), GRAIN.moon); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const gp = ground.geometry.attributes.position; const gr = rng(6);
  for (let i = 0; i < gp.count; i++) gp.setZ(i, (gr() - 0.5) * 0.25); ground.geometry.computeVertexNormals(); g.add(ground);
  const r = rng(41); const sp = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) { const a = r() * Math.PI * 2, b = r() * 0.8 + 0.08; sp.set([Math.cos(a) * Math.cos(b) * 100, Math.sin(b) * 100, Math.sin(a) * Math.cos(b) * 100], i * 3); }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false })); g.add(stars);

  // Three boulders that get struck in sequence. Each has pre-fractured shards + glass beads.
  const impacts = [{ t: 15.6, x: -2.2, z: -0.5 }, { t: 17.4, x: 3.2, z: -2.0 }, { t: 19.1, x: -0.3, z: -2.4 }];
  const sr = rng(77); const boulders = [];
  impacts.forEach((imp, k) => {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), GRAIN.moonLight); b.position.set(imp.x, 0.8, imp.z); b.rotation.set(sr() * 3, sr() * 3, 0); b.castShadow = b.receiveShadow = true; g.add(b);
    const pieces = [];
    for (let i = 0; i < 16; i++) {
      const isGlass = i >= 11;
      const m = new THREE.Mesh(isGlass ? new THREE.IcosahedronGeometry(1, 1) : shardGeometry(300 + k * 20 + i), isGlass ? GRAIN.glass : (i % 2 ? GRAIN.moon : GRAIN.moonLight));
      const s = isGlass ? 0.12 + sr() * 0.1 : 0.22 + sr() * 0.3; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; m.visible = false; g.add(m);
      const a = sr() * Math.PI * 2, v = 1.5 + sr() * 3.0;
      pieces.push({ m, s, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 1.5 + sr() * 3.5, rx: sr() * 6, rz: sr() * 6, rs: (sr() - 0.5) * 10 });
    }
    // incoming meteorite: streak + small rock
    const met = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mat(0x5a4a3a, { emissive: 0xff7a2a, emissiveIntensity: 1.2 })); met.visible = false; g.add(met);
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 5, 6), mat(0xffb070, { emissive: 0xff9a40, emissiveIntensity: 1.5, transparent: true, opacity: 0.8 })); trail.visible = false; g.add(trail);
    const flash = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(0xfff2c0, { emissive: 0xffffff, emissiveIntensity: 2, transparent: true, opacity: 0.9 })); flash.visible = false; g.add(flash);
    boulders.push({ imp, b, pieces, met, trail, flash, dir: new THREE.Vector3(0.45 + sr() * 0.3, -1, -0.3 + sr() * 0.6).normalize() });
  });
  // Scattered pre-existing shards and beads in the mid-ground so the field reads as regolith.
  for (let i = 0; i < 70; i++) {
    const isGlass = i % 6 === 0;
    const m = new THREE.Mesh(isGlass ? new THREE.IcosahedronGeometry(1, 1) : shardGeometry(500 + i), isGlass ? GRAIN.glass : (i % 2 ? GRAIN.moon : GRAIN.moonLight));
    const s = isGlass ? 0.08 + sr() * 0.08 : 0.12 + sr() * 0.22; m.scale.setScalar(s); m.position.set((sr() - 0.5) * 16, s * 0.7, (sr() - 0.5) * 14); m.rotation.set(sr() * 3, sr() * 3, sr() * 3); m.castShadow = m.receiveShadow = true; g.add(m);
  }
  // Giant boot for "every step kicks them up".
  const boot = new THREE.Group(); boot.name = 'boot';
  const sole = box(2.4, 0.5, 4.2, 0x3a3a3e, 0.12); sole.position.y = 0.25; boot.add(sole);
  const upper = box(2.2, 1.6, 3.6, 0xb9b7b0, 0.2); upper.position.set(0, 1.25, -0.2); boot.add(upper);
  const shin = box(1.9, 3, 2.3, 0xf2f1ec, 0.18); shin.position.set(0, 3.4, -0.9); boot.add(shin);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.22, 8, 16), mat(0x3a66c9, { metalness: 0.15, roughness: 0.5 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.1, -0.9); boot.add(ring);
  boot.traverse((o) => { if (o.isMesh) o.castShadow = true; }); boot.visible = false; g.add(boot);
  const kick = createDustSystem([{ t: 22.75, x: 0, y: 0.15, z: 1.6, n: 90, spread: 2.2, up: 1.6, vz: 1.2 }, { t: 22.75, x: 0, y: 0.1, z: -2.6, n: 40, spread: 1.5, up: 1.1, vz: -1.0 }], { seed: 9, size: 0.14, life: 1.3, shard: true, material: GRAIN.moonLight, g: G });
  g.add(kick);

  const sun = new THREE.DirectionalLight(0xfff4e0, 3.0); sun.position.set(-6, 12, 5); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; g.add(sun);
  g.add(new THREE.HemisphereLight(0x8b93a8, 0x2a2a2e, 0.5));
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.8); rim.position.set(6, 4, -8); g.add(rim);

  function update(t, cam) {
    stars.position.copy(cam.position);
    kick.update(t);
    for (const B of boulders) {
      const dt = t - B.imp.t;
      const approach = dt > -0.5 && dt < 0;
      B.met.visible = approach; B.trail.visible = approach;
      if (approach) {
        const d = -dt * 14; B.met.position.set(B.imp.x - B.dir.x * d, 0.8 - B.dir.y * d, B.imp.z - B.dir.z * d);
        B.trail.position.copy(B.met.position).addScaledVector(B.dir, -2.6); B.trail.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), B.dir);
      }
      B.b.visible = dt < 0;
      B.flash.visible = dt >= 0 && dt < 0.25; if (B.flash.visible) { B.flash.position.set(B.imp.x, 0.8, B.imp.z); B.flash.scale.setScalar(0.4 + dt * 10); B.flash.material.opacity = 0.9 * (1 - dt / 0.25); }
      for (const p of B.pieces) {
        p.m.visible = dt >= 0;
        if (dt >= 0) {
          // closed-form ballistic arc; the piece stops where it lands (y = its size) and stays there
          const tl = (p.vy + Math.sqrt(p.vy * p.vy + 2 * G * (0.8 - p.s * 0.8))) / G; const u = Math.min(dt, tl);
          p.m.position.set(B.imp.x + p.vx * u, Math.max(p.s * 0.8, 0.8 + p.vy * u - 0.5 * G * u * u), B.imp.z + p.vz * u);
          p.m.rotation.set(p.rx + p.rs * u, p.rz, p.rs * 0.7 * u);
        }
      }
    }
    // Boot descends from above and plants at 22.75, then lifts away.
    boot.visible = t >= 22.2;
    if (boot.visible) {
      const down = easeIn(span(t, 22.2, 22.75)), up = easeOut(span(t, 23.1, 23.86));
      boot.position.set(0, lerp(7, 0, down) + up * 4, -0.5); boot.rotation.x = -0.35 * (1 - down) + 0.3 * up;
    }
    // ---- camera ----
    if (t < 15.01) {
      // Match the Earth framing exactly, but still: the cut itself says "neither".
      dolly(cam, t, 13.51, 15.01, [1.2, 1.3, 4.6], [1.0, 1.25, 4.5], [1.0, 0.4, 0], [0.8, 0.4, 0]);
    } else if (t < 19.6) {
      // Slow orbit over the field as impacts land across it.
      orbit(cam, t, 15.01, 19.6, [0, 0.5, -0.5], 7.5, 3.2, 0.35, 1.35, 0.5);
    } else if (t < 22.2) {
      // Close orbit on the freshest shards and glass beads.
      orbit(cam, t, 19.6, 22.2, [-0.3, 0.25, -2.4], 2.6, 1.1, 2.0, 2.9, 0.2);
    } else {
      // Low angle on the boot coming down, grains flying toward us.
      dolly(cam, t, 22.2, 23.86, [3.6, 1.6, 8.0], [4.2, 2.0, 8.6], [0, 2.0, -0.5], [0, 2.2, 0]);
    }
  }
  function captions(t, cap) {
    cap.draw('NO WIND\nNO WATER', t, 13.7, 15.0, { y: 1480, size: 74 });
    cap.draw('BILLIONS OF YEARS\nOF IMPACTS', t, 16.0, 19.2, { y: 1500, size: 60 });
  }
  return { group: g, update, captions, background: 0x000000 };
}
