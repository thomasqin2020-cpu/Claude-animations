// Scene-graph checks run before rendering. Fails loudly on duplicated or missing
// body parts, overlapping character roots, or NaN transforms.
import * as THREE from 'three';

const REQUIRED = { head: 1, torso: 1, upperArmL: 1, upperArmR: 1, handL: 1, handR: 1, thighL: 1, thighR: 1, footL: 1, footR: 1, eye: 2 };

export function validateHumanoid(root) {
  const counts = {};
  root.traverse((o) => { if (o.name) counts[o.name] = (counts[o.name] || 0) + 1; });
  const problems = [];
  for (const [k, n] of Object.entries(REQUIRED)) if ((counts[k] || 0) !== n) problems.push(`${root.name}: expected ${n} ${k}, found ${counts[k] || 0}`);
  return problems;
}

export function validateScene(scene) {
  const problems = [];
  const chars = [];
  scene.traverse((o) => {
    if (o.userData.kind === 'humanoid') chars.push(o);
    if ([o.position.x, o.position.y, o.position.z, o.scale.x].some((v) => !Number.isFinite(v))) problems.push(`NaN transform on ${o.name || o.type}`);
  });
  for (const c of chars) problems.push(...validateHumanoid(c));
  // Two visible characters at the same spot are almost always an accidental duplicate.
  const vis = chars.filter((c) => { let v = true; c.traverseAncestors((a) => { if (!a.visible) v = false; }); return v && c.visible; });
  const wp = new THREE.Vector3();
  const pts = vis.map((c) => c.getWorldPosition(wp.clone()));
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
    if (pts[i].distanceTo(pts[j]) < 0.3) problems.push(`characters ${vis[i].name} and ${vis[j].name} overlap`);
  return { problems, characterCount: vis.length };
}
