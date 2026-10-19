import * as THREE from 'three';
import { createHumanoid } from './humanoid.js';
import { box, mat } from '../materials.js';

// Apollo-style astronaut built on the validated humanoid rig: same joint tree, so every
// pose helper (walk/idle/applyPose) works unchanged. Colours are shared so the suit looks
// identical in every shot. Wear patches are children that fade in when the story needs them.
export const SUIT = { white: 0xf2f1ec, grey: 0xb9b7b0, gold: 0xd9a52a, dark: 0x2c2c30, red: 0xc43b2d, blue: 0x3a66c9 };

export function createAstronaut() {
  const rig = createHumanoid({ skin: SUIT.white, hair: SUIT.white, shirt: SUIT.white, pants: SUIT.white, shoes: SUIT.grey, accent: SUIT.grey });
  rig.root.name = 'astronaut';
  // Hide the human head details inside the helmet (they stay in the graph so validation still counts them).
  rig.neck.traverse((o) => { if (o.name === 'hair' || o.name === 'eye') o.visible = false; });
  const helmet = box(0.46, 0.46, 0.46, SUIT.white, 0.12); helmet.name = 'helmet'; helmet.position.y = 0.26; rig.neck.add(helmet);
  const visor = box(0.34, 0.26, 0.08, mat(SUIT.gold, { roughness: 0.3, metalness: 0.15, emissive: 0x7a5410, emissiveIntensity: 0.35 }), 0.05); visor.name = 'visor'; visor.position.set(0, 0.26, 0.22); rig.neck.add(visor);
  const visorRim = box(0.4, 0.32, 0.04, SUIT.dark, 0.03); visorRim.position.set(0, 0.26, 0.2); rig.neck.add(visorRim);

  // Life-support backpack
  const pack = box(0.44, 0.6, 0.26, SUIT.white, 0.06); pack.name = 'pack'; pack.position.set(0, 0.38, -0.28); rig.hips.add(pack);
  const packTop = box(0.3, 0.12, 0.2, SUIT.grey, 0.03); packTop.position.set(0, 0.72, -0.28); rig.hips.add(packTop);
  const antenna = box(0.03, 0.4, 0.03, SUIT.grey, 0.01); antenna.position.set(0.15, 0.95, -0.3); rig.hips.add(antenna);
  // Chest control unit and flag/stripes for identity
  const chest = box(0.26, 0.16, 0.1, SUIT.grey, 0.03); chest.position.set(0, 0.45, 0.19); rig.hips.add(chest);
  const chestLights = box(0.18, 0.05, 0.02, mat(SUIT.red, { emissive: SUIT.red, emissiveIntensity: 0.6 }), 0.01); chestLights.position.set(0, 0.47, 0.245); rig.hips.add(chestLights);
  const stripeL = box(0.15, 0.06, 0.16, SUIT.red, 0.01); stripeL.position.set(0, -0.3, 0); rig.arms.L.shoulder.add(stripeL);
  const stripeR = box(0.15, 0.06, 0.16, SUIT.red, 0.01); stripeR.position.set(0, -0.3, 0); rig.arms.R.shoulder.add(stripeR);
  // Rings at glove and boot joints (the "wrist locks" the script mentions)
  const ringGeo = new THREE.TorusGeometry(0.085, 0.025, 6, 12);
  for (const s of ['L', 'R']) {
    const r = new THREE.Mesh(ringGeo, mat(SUIT.blue, { roughness: 0.5, metalness: 0.15 })); r.name = 'wristRing' + s; r.rotation.x = Math.PI / 2; r.position.y = -0.3; r.castShadow = true;
    rig.arms[s].elbow.add(r);
    const glove = rig.root.getObjectByName('hand' + s); glove.material = mat(SUIT.grey);
    const bootRing = new THREE.Mesh(ringGeo, mat(SUIT.blue, { roughness: 0.5, metalness: 0.15 })); bootRing.rotation.x = Math.PI / 2; bootRing.scale.setScalar(1.25); bootRing.position.y = -0.36; rig.legs[s].knee.add(bootRing);
    const boot = rig.root.getObjectByName('foot' + s); boot.scale.set(1.15, 1.3, 1.15); boot.material = mat(SUIT.grey);
  }
  // Wear patches above the boots: dark abrasion that fades in via opacity.
  const wearMat = mat(0x4b4540, { transparent: true, opacity: 0 });
  rig.wear = [];
  for (const s of ['L', 'R']) for (const [y, w] of [[-0.3, 0.17], [-0.2, 0.12]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.215), wearMat); p.position.y = y; p.position.z = 0.0; p.renderOrder = 3; rig.legs[s].knee.add(p); rig.wear.push(p);
  }
  rig.setWear = (a) => { wearMat.opacity = a; };
  // Dust coating: grey tint on the lower legs via a second transparent shell.
  const dustMat = mat(0x8a8780, { transparent: true, opacity: 0 });
  rig.dustShells = [];
  for (const s of ['L', 'R']) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.4, 0.19), dustMat); sh.position.y = -0.19; sh.renderOrder = 2; rig.legs[s].knee.add(sh); rig.dustShells.push(sh);
  }
  rig.setDust = (a) => { dustMat.opacity = a; };
  return rig;
}

// Low-gravity walk: slower cadence, longer hang, exaggerated bounce.
export function moonWalk(rig, t, speed = 1) {
  rig.walk(t * 0.75, speed);
  const w = t * 0.75 * 6.5 * speed;
  rig.hips.position.y = 0.93 + Math.abs(Math.sin(w)) * 0.09;
}
