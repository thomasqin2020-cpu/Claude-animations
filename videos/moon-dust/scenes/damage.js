// Scene D (23.86 - 28.19 s): three cutaways. Shards saw through fabric fibres, scratch the
// visor, and jam a wrist ring. Each is its own sub-group, switched on by time.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { shardGeometry, GRAIN } from '/src/props/grains.js';
import { rng, span, easeInOut, easeOut, lerp } from '/src/timeline.js';
import { dolly, fixed } from '/src/camera.js';
import { SUIT } from '/src/characters/astronaut.js';

export function buildDamage() {
  const g = new THREE.Group(); g.name = 'scene_damage';
  const key = new THREE.DirectionalLight(0xfff4e0, 2.6); key.position.set(-4, 8, 6); key.castShadow = true; Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; g.add(key);
  g.add(new THREE.HemisphereLight(0x9aa6c0, 0x33363c, 0.9));
  const rim = new THREE.DirectionalLight(0xbfd4ff, 1.0); rim.position.set(5, 3, -6); g.add(rim);

  // --- 1. Fabric weave ---
  const fabric = new THREE.Group(); fabric.name = 'fabric'; g.add(fabric);
  const fibreMat = mat(0xf2f1ec, { roughness: 0.8 }), fibreMat2 = mat(0xe3e1da, { roughness: 0.8 });
  const fibreGeo = new THREE.CylinderGeometry(0.16, 0.16, 8, 8);
  const fibres = [];
  for (let i = -6; i <= 6; i++) {
    const a = new THREE.Mesh(fibreGeo, fibreMat); a.rotation.z = Math.PI / 2; a.position.set(0, (i % 2) * 0.16, i * 0.4); a.castShadow = a.receiveShadow = true; fabric.add(a);
    const b = new THREE.Mesh(fibreGeo, fibreMat2); b.rotation.x = Math.PI / 2; b.position.set(i * 0.4, 0.16 + ((i + 1) % 2) * 0.16, 0); b.castShadow = b.receiveShadow = true; fabric.add(b);
  }
  // Two fibres that get cut: replaced by halves that separate after the cut time.
  const cuts = [];
  for (const [z, tc] of [[0.4, 24.9], [-0.8, 25.4]]) {
    const whole = new THREE.Mesh(fibreGeo, fibreMat); whole.rotation.z = Math.PI / 2; whole.position.set(0, 0.0, z); fabric.add(whole);
    const halfGeo = new THREE.CylinderGeometry(0.16, 0.16, 3.9, 8);
    const hl = new THREE.Mesh(halfGeo, fibreMat), hr = new THREE.Mesh(halfGeo, fibreMat); hl.rotation.z = Math.PI / 2; hr.rotation.z = Math.PI / 2;
    hl.position.set(-2.05, 0, z); hr.position.set(2.05, 0, z); hl.visible = hr.visible = false; fabric.add(hl, hr);
    cuts.push({ z, tc, whole, hl, hr });
  }
  const sawShards = [];
  const r = rng(61);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(shardGeometry(700 + i, 0.8), i % 2 ? GRAIN.moon : GRAIN.moonLight); const s = 0.22 + r() * 0.14; m.scale.setScalar(s); m.castShadow = true; fabric.add(m);
    sawShards.push({ m, x: -2 + i * 0.65, z: -1.2 + r() * 2.4, s, ph: r() * 6 });
  }
  // --- 2. Visor ---
  const visor = new THREE.Group(); visor.name = 'visor'; visor.visible = false; g.add(visor);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.2, Math.PI * 0.6), mat(SUIT.gold, { roughness: 0.3, metalness: 0.15, emissive: 0x7a5410, emissiveIntensity: 0.35 })); dome.castShadow = dome.receiveShadow = true; visor.add(dome);
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.18, 8, 32, Math.PI * 0.8), mat(SUIT.dark)); rimRing.rotation.y = -Math.PI * 0.1; rimRing.position.y = 0; visor.add(rimRing);
  const scratches = []; const sr = rng(62);
  for (let i = 0; i < 14; i++) {
    const len = 0.6 + sr() * 1.6; const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.02), mat(0xfff6dc, { emissive: 0xfff2c8, emissiveIntensity: 0.8 }));
    const ang = (sr() - 0.5) * 1.1, el = (sr() - 0.5) * 0.9;
    s.position.set(Math.cos(el) * Math.sin(ang) * 3.03, Math.sin(el) * 3.03, Math.cos(el) * Math.cos(ang) * 3.03); s.lookAt(0, 0, 0); s.rotateZ(sr() * Math.PI); s.scale.x = 0; visor.add(s);
    scratches.push({ s, t0: 25.75 + i * 0.07, len });
  }
  const visorShards = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(shardGeometry(800 + i, 0.7), GRAIN.moonLight); m.scale.setScalar(0.1 + sr() * 0.08); visor.add(m); visorShards.push({ m, ang: (sr() - 0.5) * 1.0, el: (sr() - 0.5) * 0.8, sp: 0.6 + sr() * 0.8 }); }
  // --- 3. Wrist ring ---
  const wrist = new THREE.Group(); wrist.name = 'wrist'; wrist.visible = false; g.add(wrist);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 3, 16), mat(SUIT.white)); sleeve.position.y = 1.9; sleeve.castShadow = sleeve.receiveShadow = true; wrist.add(sleeve);
  const glove = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 2.2, 16), mat(SUIT.grey)); glove.position.y = -1.3; glove.castShadow = glove.receiveShadow = true; wrist.add(glove);
  const ringMat = mat(SUIT.blue, { metalness: 0.15, roughness: 0.45 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.22, 10, 32), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.35; ring.castShadow = true; wrist.add(ring);
  const ringLower = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.18, 10, 32), mat(0x2b4c9a, { metalness: 0.15, roughness: 0.45 })); ringLower.rotation.x = Math.PI / 2; ringLower.position.y = -0.1; wrist.add(ringLower);
  for (let i = 0; i < 6; i++) { const tab = box(0.22, 0.18, 0.3, SUIT.dark, 0.03); const a = i / 6 * Math.PI * 2; tab.position.set(Math.cos(a) * 1.25, 0.35, Math.sin(a) * 1.25); tab.rotation.y = -a; ring.attach(tab); }
  const gapShards = []; const wr = rng(63);
  for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(shardGeometry(900 + i, 0.6), i % 3 ? GRAIN.moon : GRAIN.glass); const s = 0.05 + wr() * 0.07; m.scale.setScalar(s); const a = wr() * Math.PI * 2; m.position.set(Math.cos(a) * (1.0 + wr() * 0.3), 0.05 + wr() * 0.25, Math.sin(a) * (1.0 + wr() * 0.3)); m.rotation.set(wr() * 3, wr() * 3, 0); m.visible = false; wrist.add(m); gapShards.push({ m, t0: 26.9 + wr() * 0.9 }); }

  function update(t, cam) {
    const inFabric = t < 25.65, inVisor = t >= 25.65 && t < 26.85, inWrist = t >= 26.85;
    fabric.visible = inFabric; visor.visible = inVisor; wrist.visible = inWrist;
    if (inFabric) {
      const lt = t - 23.86;
      for (const s of sawShards) { s.m.position.set(s.x + Math.sin(lt * 7 + s.ph) * 0.25, 0.42 + s.s * 0.5 - Math.min(0.3, lt * 0.12), s.z); s.m.rotation.set(s.ph, lt * 3 + s.ph, 0); }
      for (const c of cuts) {
        const cut = t >= c.tc; c.whole.visible = !cut; c.hl.visible = c.hr.visible = cut;
        const u = easeOut(span(t, c.tc, c.tc + 0.5)); c.hl.position.x = -2.05 - 0.35 * u; c.hr.position.x = 2.05 + 0.35 * u; c.hl.rotation.y = 0.12 * u; c.hr.rotation.y = -0.12 * u;
      }
      dolly(cam, t, 23.86, 25.65, [1.8, 2.6, 4.2], [0.6, 1.9, 3.3], [0, 0.3, 0], [0, 0.2, -0.2]);
    } else if (inVisor) {
      for (const s of scratches) s.s.scale.x = easeOut(span(t, s.t0, s.t0 + 0.3));
      for (const v of visorShards) { const a = v.ang + (t - 25.65) * v.sp * 0.4; v.m.position.set(Math.cos(v.el) * Math.sin(a) * 3.1, Math.sin(v.el) * 3.1, Math.cos(v.el) * Math.cos(a) * 3.1); v.m.rotation.y = t * 5; }
      dolly(cam, t, 25.65, 26.85, [0.4, 0.3, 7.2], [-0.3, 0.1, 6.2], [0, 0.1, 3], [0, 0, 3]);
    } else {
      for (const s of gapShards) s.m.visible = t >= s.t0;
      // The ring tries to turn: smooth at first, then it stutters and stalls as grains fill the gap.
      const lt = t - 26.85; const jam = easeInOut(span(t, 27.3, 27.9));
      ring.rotation.y = lt * 1.4 * (1 - jam) + jam * (0.55 + Math.sin(lt * 40) * 0.02);
      wrist.rotation.z = 0.35;
      dolly(cam, t, 26.85, 28.19, [3.2, 1.6, 3.6], [2.6, 1.1, 3.0], [0, 0.3, 0], [0, 0.2, 0]);
    }
  }
  function captions(t, cap) {
    cap.draw('FABRIC', t, 24.0, 25.5, { y: 1500, size: 64 });
    cap.draw('VISOR', t, 25.75, 26.75, { y: 1500, size: 64 });
    cap.draw('WRIST LOCK', t, 26.95, 28.1, { y: 1500, size: 64 });
  }
  return { group: g, update, captions, background: 0x1b1f28 };
}
