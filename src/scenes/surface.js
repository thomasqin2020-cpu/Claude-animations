// Scene A (0 - 9.0 s): astronaut walking on the Moon, wear revealed, dust kicked up.
// Scene E (28.19 - end): brushing the suit, fine dust stays, pressure payoff.
import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { createAstronaut, moonWalk } from '../characters/astronaut.js';
import { createLunarModule } from '../props/lunarModule.js';
import { createMoonTerrain, createEarth } from '../props/terrain.js';
import { createDustSystem, shardGeometry, GRAIN } from '../props/grains.js';
import { lerp, easeInOut, easeOut, span, pulse, rng } from '../timeline.js';
import { dolly, fixed } from '../camera.js';

const WALK_END = 7.0;
const START = new THREE.Vector3(-2.6, 0, -3.2), END = new THREE.Vector3(0.4, 0, 1.0);
const heroPos = (t) => START.clone().lerp(END, easeInOut(span(t, 0, WALK_END)));

export function buildSurface(cues) {
  const g = new THREE.Group(); g.name = 'scene_surface';
  g.add(createMoonTerrain());
  const lm = createLunarModule(); lm.position.set(-4.5, 0, -7); lm.rotation.y = 0.6; g.add(lm);
  const earth = createEarth(3.4); earth.position.set(-15.5, 17.5, -39); g.add(earth);
  // stars: static seeded points, far away
  const r = rng(99); const sp = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, b = r() * 0.9 + 0.05; sp.set([Math.cos(a) * Math.cos(b) * 120, Math.sin(b) * 120, Math.sin(a) * Math.cos(b) * 120], i * 3); }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false })); g.add(stars);

  const hero = createAstronaut(); g.add(hero.root);
  // Harsh single sun, no atmosphere: strong key, dim ambient, rim from Earthshine.
  const sun = new THREE.DirectionalLight(0xfff4e0, 3.2); sun.position.set(7, 13, 11); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; g.add(sun);
  g.add(new THREE.HemisphereLight(0x9aa6c0, 0x3a3a3e, 0.9));
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.9); rim.position.set(-6, 5, -8); g.add(rim);

  // Footstep dust: one burst per footfall along the walk, plus a big kick for "the culprit was dust".
  const events = [];
  for (let t = 0.35; t < WALK_END; t += 0.644) { const p = heroPos(t); events.push({ t, x: p.x, y: 0.03, z: p.z, n: 14, spread: 0.6, up: 0.8 }); }
  events.push({ t: 7.45, x: END.x + 0.15, y: 0.03, z: END.z + 0.2, n: 70, spread: 1.4, up: 1.3 });
  const dust = createDustSystem(events, { seed: 4, size: 0.045, life: 1.4 }); g.add(dust);
  // Brushing: coarse grains fly off the shin at each stroke.
  const brushEvents = [];
  for (let i = 0; i < 6; i++) brushEvents.push({ t: 28.7 + i * 0.62, x: END.x + 0.34, y: 0.3, z: END.z + 0.3, n: 16, spread: 1.6, up: 0.9, vx: 0.8 });
  const coarse = createDustSystem(brushEvents, { seed: 8, size: 0.022, life: 1.2, shard: true, material: GRAIN.moonLight, g: 1.62 }); g.add(coarse);

  // Brush prop held in the right hand.
  const brush = new THREE.Group(); brush.name = 'brush';
  const handle = box(0.05, 0.36, 0.05, 0xd8d9dc, 0.01); handle.position.y = -0.05; brush.add(handle);
  const head = box(0.08, 0.06, 0.2, 0x2c2c30, 0.01); head.position.set(0, -0.26, 0); brush.add(head);
  const bristles = box(0.08, 0.1, 0.2, 0xe8dcbf, 0.005); bristles.position.set(0, -0.34, 0); brush.add(bristles);
  brush.visible = false; hero.arms.L.elbow.add(brush); brush.position.set(0, -0.36, 0.05); brush.rotation.x = -0.4;

  // Fine dust that stays: static glinting specks on the lower legs (electrostatic cling).
  const fineGeo = new THREE.BufferGeometry(); const fr = rng(31); const fp = new Float32Array(160 * 3);
  for (let i = 0; i < 160; i++) fp.set([(fr() - 0.5) * 0.2, -0.42 + fr() * 0.42, (fr() - 0.5) * 0.22], i * 3);
  fineGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fineMat = new THREE.PointsMaterial({ color: 0xcfd6e6, size: 0.012, transparent: true, opacity: 0 });
  const fineL = new THREE.Points(fineGeo, fineMat), fineR = new THREE.Points(fineGeo, fineMat);
  hero.legs.L.knee.add(fineL); hero.legs.R.knee.add(fineR);

  function update(t, cam) {
    stars.position.copy(cam.position);
    earth.rotation.y = t * 0.02;
    dust.update(t); coarse.update(t);
    const standing = t >= WALK_END;
    const p = heroPos(t); hero.root.position.copy(p);
    hero.root.rotation.y = standing ? lerp(Math.atan2(END.x - START.x, END.z - START.z), 0.35, easeOut(span(t, WALK_END, WALK_END + 0.8))) : Math.atan2(END.x - START.x, END.z - START.z);
    brush.visible = t >= 28.0 && t < 32.6;

    if (t < WALK_END) moonWalk(hero, t, 1);
    else if (t < 28.0) hero.idle(t, 1);
    else if (t < 32.6) {
      // Bend forward and sweep the brush along the left shin; stroke rate matches the coarse-grain bursts.
      const bend = easeInOut(span(t, 28.0, 28.7)) * (1 - easeInOut(span(t, 32.1, 32.6)));
      const stroke = Math.sin((t - 28.7) / 0.62 * Math.PI * 2) * bend;
      // Crouch: thighs forward, knees bent, torso leaning over the left shin; right hand sweeps the brush.
      hero.pose({ torsoPitch: 0.6 * bend, legL: -1.9 * bend, legR: -1.9 * bend, kneeL: 1.3 * bend, kneeR: 1.3 * bend,
        armL: (-0.35 + stroke * 0.3) * bend, armLz: -0.1 * bend, elbowL: -0.15 * bend, armR: -0.4 * bend, armRz: -0.35 * bend, elbowR: -0.7 * bend, headPitch: 0.55 * bend, torsoYaw: 0.25 * bend });
      hero.hips.position.y = 0.93 - 0.35 * bend;
    } else hero.idle(t, 1);

    // Wear reveal 4.2 -> 7.0, full for the rest of the video. Dust coating grows with each step.
    hero.setWear(Math.max(easeInOut(span(t, 4.2, 7.0)), t > 28 ? 1 : 0));
    hero.setDust(Math.min(0.55, t / WALK_END * 0.45 + (t > 28 ? 0.1 : 0)));
    fineL.visible = fineR.visible = t > 29.2;
    fineMat.opacity = t > 29.2 ? Math.min(1, span(t, 29.2, 31.0)) * (0.7 + 0.3 * Math.sin(t * 9)) : 0;

    // ---- camera ----
    if (t < 3.6) {
      // Wide low establishing shot; astronaut walks toward us with the lander and Earth behind.
      dolly(cam, t, 0, 3.6, [2.2, 1.0, 6.5], [1.6, 1.1, 5.2], [p.x - 1.0, 1.4, p.z - 2], [p.x, 1.2, p.z]);
      cam.lookAt(p.x - 0.2 + 0.5 * (1 - span(t, 0, 3.6)), 1.5, p.z - 1);
    } else if (t < 7.36) {
      // Medium-close on the legs, tracking: the wear patches above the boots fade in.
      cam.position.set(p.x + 1.1, 0.55, p.z + 1.7); cam.lookAt(p.x, 0.42, p.z);
    } else if (t < 20) {
      // Push in on the boot and the kicked-up dust; this becomes the zoom into the micro world.
      dolly(cam, t, 7.36, 9.0, [p.x + 0.9, 0.5, p.z + 1.3], [p.x + 0.45, 0.12, p.z + 0.55], [p.x, 0.25, p.z], [p.x + 0.15, 0.03, p.z + 0.2], easeInOut);
    } else if (t < 32.6) {
      // Front three-quarter medium shot on the shin while brushing.
      dolly(cam, t, 28.19, 29.0, [p.x + 2.9, 0.9, p.z + 1.2], [p.x + 2.4, 0.6, p.z + 1.0], [p.x + 0.3, 0.6, p.z + 0.2], [p.x + 0.35, 0.45, p.z + 0.2]);
    } else {
      // Pull back to a full shot with the lander for the pressure payoff.
      dolly(cam, t, 32.6, 35.0, [p.x + 2.4, 0.6, p.z + 1.0], [p.x + 1.4, 1.3, p.z + 4.2], [p.x + 0.35, 0.45, p.z + 0.2], [p.x - 0.5, 0.6, p.z - 1.0]);
    }
  }
  function captions(t, cap) {
    cap.draw('8 HOURS OUTSIDE', t, 3.9, 5.4, { y: 1500 });
    cap.draw('WORN LIKE 100 HOURS', t, 5.4, 7.2, { y: 1500 });
    cap.draw('FINE DUST STAYS', t, 30.2, 32.3, { y: 1500, size: 70 });
    cap.gauge('SUIT PRESSURE', 1 - 0.78 * easeInOut(span(t, 33.0, 35.4)), t, 32.7, 36.4, { y: 1440 });
    cap.draw('2 MORE MOONWALKS', t, 32.7, 36.4, { y: 1560, size: 70 });
  }
  return { group: g, update, captions, hero };
}
