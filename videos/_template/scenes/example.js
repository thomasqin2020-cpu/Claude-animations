// Scene module contract: build*() returns { group, update(t, camera), captions?(t, cap), background? }.
// `t` is absolute video time in seconds. Everything must be a pure function of t (no accumulation).
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createHumanoid } from '/src/characters/humanoid.js';
import { lerp, easeInOut, span, rng } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

export function buildExample() {
  const g = new THREE.Group(); g.name = 'scene_example';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0x6fa85a)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const hero = createHumanoid({ shirt: 0xd9542b }); hero.root.name = 'hero'; g.add(hero.root);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(6, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; g.add(sun);
  g.add(new THREE.HemisphereLight(0xbfe4ff, 0x4f6b3a, 0.9));

  function update(t, cam) {
    const p = easeInOut(span(t, 0, 4));
    hero.root.position.set(lerp(-2, 0, p), 0, lerp(2, 0, p));
    if (t < 4) hero.walk(t); else hero.idle(t);
    dolly(cam, t, 0, 6, [3, 2.2, 6], [2, 1.6, 4], [0, 1.1, 0]);
  }
  function captions(t, cap) { cap.draw('EXAMPLE', t, 1, 3, { y: 1500 }); }
  return { group: g, update, captions };
}
