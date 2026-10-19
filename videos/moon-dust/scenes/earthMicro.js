// Scene B (9.0 - 13.51 s): microscopic beach. Wind streaks and a water wash tumble rounded grains.
import * as THREE from 'three';
import { mat } from '/src/materials.js';
import { roundGrainGeometry, GRAIN } from '/src/props/grains.js';
import { rng, span, easeInOut } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

export function buildEarthMicro() {
  const g = new THREE.Group(); g.name = 'scene_earthMicro';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 24, 24), GRAIN.sandDark); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const gp = ground.geometry.attributes.position; const gr = rng(5);
  for (let i = 0; i < gp.count; i++) gp.setZ(i, (gr() - 0.5) * 0.25); ground.geometry.computeVertexNormals(); g.add(ground);

  // Rounded grains rolling downstream (+x) while the wash passes over them.
  const r = rng(17); const grains = [];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(roundGrainGeometry(100 + i), i % 3 ? GRAIN.sand : GRAIN.sandDark);
    const s = 0.35 + r() * 0.5; m.scale.setScalar(s); m.castShadow = m.receiveShadow = true;
    m.userData = { x0: -6 + r() * 12, z: (r() - 0.5) * 6, s, speed: 0.9 + r() * 1.2, phase: r() * 6, ax: r() * 2 - 1, ay: r() * 2 - 1 };
    g.add(m); grains.push(m);
  }
  // Water wash: translucent blue sheet with a travelling wave front.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 60, 20), mat(0x4aa3e8, { transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.3; g.add(water);
  const wp = water.geometry.attributes.position; const wx = new Float32Array(wp.count); for (let i = 0; i < wp.count; i++) wx[i] = wp.getX(i);
  const foam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 40), mat(0xffffff, { transparent: true, opacity: 0.75, emissive: 0xffffff, emissiveIntensity: 0.3 })); g.add(foam);
  // Wind: thin streaks sweeping through the frame.
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.03, 0.03), mat(0xeaf6ff, { transparent: true, opacity: 0.7, emissive: 0xffffff, emissiveIntensity: 0.4 }), 40);
  const sr = rng(23); const sd = Array.from({ length: 40 }, () => ({ y: 0.6 + sr() * 3, z: (sr() - 0.5) * 8, off: sr() * 20, sp: 6 + sr() * 5 }));
  g.add(streaks);

  const sun = new THREE.DirectionalLight(0xfff2d8, 2.6); sun.position.set(5, 10, 4); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; g.add(sun);
  g.add(new THREE.HemisphereLight(0xbfe4ff, 0x9c7b4a, 1.0));

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  function update(t, cam) {
    const lt = t - 9.0;
    // Wave front rolls from -x to +x twice during the shot.
    const front = -8 + ((lt * 5.5) % 16);
    for (let i = 0; i < wp.count; i++) { const x = wx[i]; const d = x - front; wp.setZ(i, d < 0 ? 0.12 * Math.sin(x * 1.5 - lt * 6) : -0.5 - Math.min(0.5, d * 0.4)); }
    wp.needsUpdate = true; water.geometry.computeVertexNormals();
    foam.position.set(front, 0.35, 0);
    for (const m of grains) {
      const u = m.userData; const x = u.x0 + ((lt * u.speed + u.phase) % 14);
      m.position.set(x > 7 ? x - 14 : x, u.s * 0.95, u.z);
      m.rotation.set(u.ax + lt * u.speed * 1.4, u.phase, u.ay - lt * u.speed * 1.1);
    }
    sd.forEach((s, i) => { const x = -10 + ((lt * s.sp + s.off) % 20); P.set(x, s.y, s.z); streaks.setMatrixAt(i, M.compose(P, Q, S)); });
    streaks.instanceMatrix.needsUpdate = true;
    // Low macro angle, slow lateral dolly along the stream.
    dolly(cam, t, 9.0, 13.51, [-1.5, 1.1, 5.2], [1.2, 1.3, 4.6], [-0.5, 0.4, 0], [1.0, 0.4, 0]);
  }
  return { group: g, update, background: 0x9fd3f2 };
}
