import * as THREE from 'three';
import { box, mat } from '../materials.js';

// Stylised low-poly humanoid. Exactly: 1 head, 1 torso, 2 arms (upper+fore+hand),
// 2 legs (thigh+shin+foot). All joints are nested groups so limbs can never detach.
// Units: character stands ~1.8 m tall; feet rest on y = 0.
export function createHumanoid(opts = {}) {
  const skin = opts.skin ?? 0xf1c9a5, hair = opts.hair ?? 0x3b2a1a, shirt = opts.shirt ?? 0x3d7bd9,
        pants = opts.pants ?? 0x2b3a55, shoes = opts.shoes ?? 0x241c16, accent = opts.accent ?? shirt;
  const root = new THREE.Group(); root.name = 'humanoid';
  root.userData.kind = 'humanoid';

  // -- torso (hips -> chest) --
  const hips = new THREE.Group(); hips.name = 'hips'; hips.position.y = 0.93; root.add(hips);
  const pelvis = box(0.42, 0.22, 0.26, pants, 0.05); pelvis.name = 'pelvis'; pelvis.position.y = 0.02; hips.add(pelvis);
  const torso = box(0.48, 0.5, 0.3, shirt, 0.06); torso.name = 'torso'; torso.position.y = 0.38; hips.add(torso);
  const collar = box(0.5, 0.08, 0.32, accent, 0.03); collar.name = 'collar'; collar.position.y = 0.66; hips.add(collar);

  // -- head --
  const neck = new THREE.Group(); neck.name = 'neck'; neck.position.y = 0.68; hips.add(neck);
  const head = box(0.36, 0.36, 0.34, skin, 0.07); head.name = 'head'; head.position.y = 0.24; neck.add(head);
  const hairCap = box(0.38, 0.14, 0.36, hair, 0.05); hairCap.name = 'hair'; hairCap.position.y = 0.38; neck.add(hairCap);
  const hairBack = box(0.38, 0.22, 0.1, hair, 0.04); hairBack.position.set(0, 0.26, -0.14); neck.add(hairBack);
  const eyeMat = mat(0x1a1a1a);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), eyeMat); eye.name = 'eye';
    eye.position.set(s * 0.08, 0.26, 0.175); neck.add(eye);
  }

  // -- arms --
  const arms = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const shoulder = new THREE.Group(); shoulder.name = 'shoulder' + side; shoulder.position.set(s * 0.31, 0.6, 0); hips.add(shoulder);
    const upper = box(0.14, 0.34, 0.15, shirt, 0.04); upper.name = 'upperArm' + side; upper.position.y = -0.17; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.name = 'elbow' + side; elbow.position.y = -0.34; shoulder.add(elbow);
    const fore = box(0.12, 0.3, 0.13, skin, 0.04); fore.name = 'foreArm' + side; fore.position.y = -0.15; elbow.add(fore);
    const hand = box(0.12, 0.12, 0.1, skin, 0.03); hand.name = 'hand' + side; hand.position.y = -0.34; elbow.add(hand);
    arms[side] = { shoulder, elbow, hand };
  }

  // -- legs --
  const legs = {};
  for (const [side, s] of [['L', 1], ['R', -1]]) {
    const hip = new THREE.Group(); hip.name = 'hip' + side; hip.position.set(s * 0.12, -0.05, 0); hips.add(hip);
    const thigh = box(0.17, 0.42, 0.19, pants, 0.04); thigh.name = 'thigh' + side; thigh.position.y = -0.21; hip.add(thigh);
    const knee = new THREE.Group(); knee.name = 'knee' + side; knee.position.y = -0.42; hip.add(knee);
    const shin = box(0.15, 0.38, 0.17, pants, 0.04); shin.name = 'shin' + side; shin.position.y = -0.19; knee.add(shin);
    const foot = box(0.16, 0.1, 0.26, shoes, 0.03); foot.name = 'foot' + side; foot.position.set(0, -0.41, 0.05); knee.add(foot);
    legs[side] = { hip, knee };
  }

  const rig = { root, hips, neck, arms, legs, opts };
  rig.pose = (p) => applyPose(rig, p);
  rig.idle = (t, seed = 0) => idlePose(rig, t, seed);
  rig.walk = (t, speed = 1) => walkPose(rig, t, speed);
  return rig;
}

// Reset every joint, then apply named rotations (radians). Used as the base for all poses.
export function applyPose(rig, p = {}) {
  const z = (g) => g.rotation.set(0, 0, 0);
  z(rig.hips); z(rig.neck);
  for (const s of ['L', 'R']) { z(rig.arms[s].shoulder); z(rig.arms[s].elbow); z(rig.legs[s].hip); z(rig.legs[s].knee); }
  rig.hips.position.y = 0.93;
  rig.arms.L.shoulder.rotation.x = p.armL ?? 0; rig.arms.R.shoulder.rotation.x = p.armR ?? 0;
  rig.arms.L.shoulder.rotation.z = p.armLz ?? 0.05; rig.arms.R.shoulder.rotation.z = p.armRz ?? -0.05;
  rig.arms.L.elbow.rotation.x = p.elbowL ?? 0; rig.arms.R.elbow.rotation.x = p.elbowR ?? 0;
  rig.legs.L.hip.rotation.x = p.legL ?? 0; rig.legs.R.hip.rotation.x = p.legR ?? 0;
  rig.legs.L.knee.rotation.x = p.kneeL ?? 0; rig.legs.R.knee.rotation.x = p.kneeR ?? 0;
  rig.neck.rotation.y = p.headYaw ?? 0; rig.neck.rotation.x = p.headPitch ?? 0;
  rig.hips.rotation.y = p.torsoYaw ?? 0; rig.hips.rotation.x = p.torsoPitch ?? 0;
}

export function idlePose(rig, t, seed = 0) {
  const b = Math.sin(t * 1.6 + seed) * 0.012;           // breathing
  applyPose(rig, { armL: 0.04 * Math.sin(t * 1.3 + seed), armR: -0.04 * Math.sin(t * 1.3 + seed), headYaw: 0.05 * Math.sin(t * 0.7 + seed) });
  rig.hips.position.y = 0.93 + b;
}

export function walkPose(rig, t, speed = 1) {
  const w = t * 6.5 * speed, a = 0.55;
  const sw = Math.sin(w);
  applyPose(rig, {
    legL: sw * a, legR: -sw * a,
    kneeL: -Math.max(0, -Math.sin(w)) * 0.9, kneeR: -Math.max(0, Math.sin(w)) * 0.9,
    armL: -sw * 0.45, armR: sw * 0.45, elbowL: -0.35, elbowR: -0.35,
    torsoPitch: 0.04
  });
  rig.hips.position.y = 0.93 + Math.abs(Math.cos(w)) * 0.035;
}
