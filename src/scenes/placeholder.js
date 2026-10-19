// Pipeline test scene. Replaced by the real story scenes once the script is supplied.
import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { createHumanoid } from '../characters/humanoid.js';
import { lerp, easeInOut, span, rng } from '../timeline.js';

export function buildPlaceholder() {
  const group = new THREE.Group(); group.name = 'scene_placeholder';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 1, 1), mat(0x6fa85a));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; group.add(ground);

  const r = rng(7);
  const stone = mat(0x8d8a84);
  for (let i = 0; i < 24; i++) {
    const s = 0.3 + r() * 0.5;
    const b = box(s, s * 0.6, s, stone, 0.08);
    b.position.set((r() - 0.5) * 16, s * 0.3, -3 - r() * 10);
    b.rotation.y = r() * Math.PI; group.add(b);
  }
  const tree = (x, z, h) => {
    const trunk = box(0.3, h, 0.3, 0x6b4a2b, 0.05); trunk.position.set(x, h / 2, z); group.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.55, 0), mat(0x2f7a3f));
    crown.position.set(x, h + h * 0.3, z); crown.castShadow = true; group.add(crown);
  };
  for (let i = 0; i < 10; i++) tree(-7 + i * 1.6 + (r() - 0.5), -8 - r() * 4, 1.6 + r() * 1.4);

  const hero = createHumanoid({ shirt: 0xd9542b, pants: 0x2b3a55 }); hero.root.name = 'hero'; group.add(hero.root);

  return {
    group, hero,
    update(t, cam) {
      const walkEnd = 4;
      const p = easeInOut(span(t, 0, walkEnd));
      hero.root.position.set(lerp(-2.5, 0, p), 0, lerp(2, 0, p));
      hero.root.rotation.y = t < walkEnd ? Math.atan2(2.5, -2) : 0;
      if (t < walkEnd) hero.walk(t); else hero.idle(t);
      // camera: slow dolly in from a wide 3/4 to a medium shot
      const c = easeInOut(span(t, 0, 6));
      cam.position.set(lerp(5, 2.2, c), lerp(3.2, 1.6, c), lerp(7, 3.6, c));
      cam.lookAt(hero.root.position.x, 1.0, hero.root.position.z);
    }
  };
}
