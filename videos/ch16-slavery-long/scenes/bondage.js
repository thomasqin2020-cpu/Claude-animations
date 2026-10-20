// Bondage family: courthouse (S7.2), auction block (S7.4), field row (S8.1).
import * as THREE from 'three';
import { PAL, CAP, lights, ground, backdrop, person, place, sign, tree, column, cottonRow, book, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed } from '/src/camera.js';

export function buildCourthouse(T) {
  const g = new THREE.Group(); g.name = 'scene_courthouse';
  lights(g, [5, 8, 8], { sun: 1.8, fill: 0.9, shadowSize: 10 });
  g.add(ground(40, 40, 0xa09a86));
  const body = box(8, 5, 4, PAL.stone, 0.05); body.position.set(0, 2.5, -2); g.add(body);
  const ped = box(8.6, 1.2, 0.4, PAL.stone, 0.05); ped.position.set(0, 5.6, 0.2); ped.rotation.x = 0.0; g.add(ped);
  for (let i = 0; i < 5; i++) g.add(column(-3.2 + i * 1.6, 0.3, 5.0, 0.4));
  const steps = box(9, 0.3, 1.5, 0x8a867c, 0.03); steps.position.set(0, 0.15, 1.2); g.add(steps);
  const door = box(1.4, 2.4, 0.2, 0x3a2a1c, 0.03); door.position.set(0, 1.2, 0.05); g.add(door);
  const fig = person('enslaved', { id: 'court' }); place(fig, 0.3, 3.0, Math.PI); g.add(fig.root);
  const cert = new THREE.Group(); const cp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.03), glowMat(PAL.parch, { transparent: true, opacity: 1 })); cert.add(cp); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), mat(PAL.gold)); ring.position.set(0, 0.1, 0.03); cert.add(ring); const cl = sign('marriage', { size: 0.18, bg: null, color: '#3a2a1a' }); cl.position.set(0, -0.3, 0.03); cert.add(cl); cert.position.set(-1.8, 1.6, 2.4); g.add(cert);
  function update(t, cam) {
    const k72 = T.K('Enslaved people had no political'), k73 = T.K('Floggings were common');
    fig.pose({ armL: 0.15, armR: 0.15, headPitch: 0.1 }); fig.hips.position.y = 0.93;
    const knock = t >= T.K('They could not testify') && t < T.K('Their marriages'); if (knock) fig.pose({ armR: -1.1 + 0.3 * Math.sin(t * 8), elbowR: -0.8, headPitch: -0.1 });
    const dis = easeOut(span(t, T.K('Their marriages') + 0.8, T.K('Their marriages') + 3.0)); cert.visible = t >= T.K('Their marriages') - 0.2 && dis < 0.999; cp.material.opacity = 1 - dis; cert.children.forEach((c, i) => { if (i > 0) c.visible = dis < 0.5; }); cert.position.y = 1.6 + dis * 0.6;
    dolly(cam, t, k72, k73, [0.5, 2.2, 9], [0.0, 1.8, 6.5], [0, 2.0, 0], [-0.4, 1.6, 0.5]);
  }
  function captions(t, cap) { cap.draw('no testimony, no marriage, no recourse', t, T.K('Their marriages') + 1.5, T.K('Floggings were common'), CAP); }
  return { group: g, update, captions, background: 0xc9c4b2 };
}

export function buildAuctionBlock(T) {
  const g = new THREE.Group(); g.name = 'scene_auction';
  lights(g, [-4, 8, 8], { sun: 1.7, sunColor: 0xffe6c8, fill: 0.8, shadowSize: 10 });
  g.add(ground(40, 40, 0x8a8070));
  g.add(backdrop(30, 8, 0x7a6a5a, -6, 4));
  const block = box(2.4, 0.8, 2.0, PAL.woodDark, 0.04); block.position.set(0, 0.4, 0); g.add(block);
  const mother = person('woman', { id: 'mo' }); place(mother, -0.35, 0, 0, 0.8); g.add(mother.root);
  const child = person('child', { id: 'ch' }); place(child, 0.45, 0.1, 0, 0.8); g.add(child.root);
  const crowd = [0, 1, 2, 3, 4, 5].map((i) => { const s = i < 3 ? -1 : 1; const p = person('planter', { id: 'bid' + i }); place(p, s * (2.2 + (i % 3) * 0.9), 1.6 + (i % 2) * 1.0, s > 0 ? -Math.PI * 0.35 : Math.PI * 0.35); g.add(p.root); return p; });
  const auct = person('clerk', { id: 'auc' }); place(auct, 1.9, 0.6, -0.6); g.add(auct.root);
  const gavel = box(0.05, 0.3, 0.05, PAL.woodDark, 0.005); gavel.position.set(0, -0.3, 0.05); auct.arms.R.elbow.add(gavel);
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 2.0), glowMat(PAL.red, { intensity: 1.2 })); line.position.set(0.05, 0.82, 0); line.scale.z = 0.001; g.add(line);
  const bk = book(0.5, 0.08, 0.36, 0x3a2a4a); bk.position.set(3.2, 1.2, 1.5); bk.scale.setScalar(0.001); g.add(bk);
  const bl = sign("Uncle Tom's Cabin, 1852", { size: 0.26 }); bl.position.set(3.2, 1.9, 1.5); bl.visible = false; g.add(bl);
  const msSign = sign('to Mississippi', { size: 0.26 }), vaSign = sign('kept in Virginia', { size: 0.26 }); msSign.visible = vaSign.visible = false; g.add(msSign, vaSign);
  function update(t, cam) {
    const k74 = T.K('The auction was the heart'), k75 = T.K('And yet');
    const sep = easeInOut(span(t, T.K('Families were separated') + 0.8, T.KE('Families were separated')));
    line.scale.z = Math.max(0.001, easeOut(span(t, T.K('Families were separated'), T.K('Families were separated') + 0.8)));
    mother.root.position.x = -0.35 - 2.4 * sep; mother.root.position.y = 0.8 - 0.8 * easeOut(span(sep, 0.3, 0.7)); mother.pose({ armR: -0.9 - 0.4 * sep, elbowR: -0.3, armL: 0.1, headYaw: 0.5 * sep, headPitch: 0.1 });
    child.root.position.x = 0.45 + 2.0 * sep; child.root.position.y = 0.8 - 0.8 * easeOut(span(sep, 0.3, 0.7)); child.pose({ armL: -1.0 - 0.3 * sep, elbowL: -0.3, headYaw: -0.6 * sep });
    mother.hips.position.y = 0.93; child.hips.position.y = 0.93;
    msSign.visible = sep > 0.6; msSign.position.set(mother.root.position.x, 2.2, 0.2); vaSign.visible = sep > 0.6; vaSign.position.set(child.root.position.x, 1.6, 0.2);
    crowd.forEach((p, i) => { p.pose({ armR: i % 2 ? -1.2 + 0.2 * Math.sin(t * 2 + i) : 0, elbowR: -0.3, armL: 0.1, headPitch: -0.1 }); p.hips.position.y = 0.93; });
    auct.pose({ armR: -1.0 + 0.4 * Math.max(0, Math.sin(t * 5)), elbowR: -0.9, armL: -0.3 }); auct.hips.position.y = 0.93;
    const bu = easeOut(span(t, T.K('Abolitionists called this') + 2.5, T.K('Abolitionists called this') + 3.3)); bk.scale.setScalar(Math.max(0.001, 2.4 * bu)); bk.rotation.y = t * 0.6; bl.visible = bu > 0.8;
    dolly(cam, t, k74, k75, [0.2, 2.4, 8.0], [0.3, 2.0, 6.5], [0, 1.1, 0], [0.1, 1.0, 0.2]);
  }
  function captions(t, cap) { cap.draw('the auction', t, T.K('The auction was the heart') + 0.5, T.K('Families were separated'), CAP); }
  return { group: g, update, captions, background: 0xb5a890 };
}

export function buildFieldRow(T) {
  const g = new THREE.Group(); g.name = 'scene_fieldRow';
  const sun = lights(g, [5, 8, 8], { sun: 1.9, fill: 0.85, shadowSize: 12 });
  g.add(ground(60, 60, 0x7a6a44));
  for (let i = 0; i < 6; i++) g.add(cottonRow(-8, -4 + i * 1.3, 28, 0.6, 70 + i));
  const w1 = person('enslaved', { id: 'w1' }), w2 = person('enslavedW', { id: 'w2' }), w3 = person('enslaved', { id: 'w3' }); place(w1, -1.2, 0.3, 0.3); place(w2, 1.0, 0.0, -0.2); place(w3, 3.2, 0.4, 0.1); g.add(w1.root, w2.root, w3.root);
  const hoes = [w1, w2, w3].map((w) => { const h = new THREE.Group(); const sh = box(0.04, 1.2, 0.04, PAL.woodDark, 0.005); sh.position.y = -0.5; h.add(sh); const bl = box(0.2, 0.08, 0.03, 0x3a3a40, 0.01); bl.position.y = -1.1; h.add(bl); h.position.set(0, -0.3, 0.1); h.rotation.x = 0.4; w.arms.R.elbow.add(h); return h; });
  const broken = box(0.2, 0.08, 0.03, 0x3a3a40, 0.01); broken.visible = false; g.add(broken);
  const runner = person('enslaved', { id: 'run' }); g.add(runner.root);
  const night = new THREE.HemisphereLight(0x303a60, 0x101018, 0.6); night.visible = false; g.add(night);
  const basket = box(0.5, 0.35, 0.4, PAL.wood, 0.04); basket.position.set(-2.4, 0.18, 0.8); g.add(basket);
  function update(t, cam) {
    const k81 = T.K('Enslaved people resisted every day'), k82 = T.K('In eighteen hundred, an enslaved man');
    const slow = t >= T.K('They slowed the pace'); const rate = slow ? 1.4 : 4.0;
    [w1, w2, w3].forEach((w, i) => { const ph = t * rate + i; w.pose({ armR: -0.9 + 0.5 * Math.sin(ph), elbowR: -0.6, armL: -0.7 + 0.3 * Math.sin(ph), elbowL: -0.8, headPitch: 0.3, torsoPitch: 0.25 }); w.hips.position.y = 0.93; });
    const brk = t >= T.K('They took food') + 1.5; hoes[1].children[1].visible = !brk; broken.visible = brk; broken.position.set(1.1, 0.05, 0.5); broken.rotation.z = 0.6;
    const run = t >= T.K('They ran away') && t < T.K('They slowed the pace'); const dark = run; night.visible = dark; sun.intensity = dark ? 0.2 : 1.9;
    runner.root.visible = run; const u = span(t, T.K('They ran away') + 0.2, T.K('They slowed the pace')); runner.root.position.set(lerp(2.5, -6.5, u), 0, 2.2); runner.root.rotation.y = -Math.PI / 2; runner.walk(t, 1.8);
    [w1, w2, w3].forEach((w) => { w.root.visible = !run || w !== w1; });
    if (run) fixed(cam, [-1.0, 1.6, 7.5], [-1.0, 0.9, 0.5]);
    else if (t < T.K('They took food')) dolly(cam, t, k81, T.K('They took food'), [0.5, 1.7, 6.5], [0.8, 1.5, 5.5], [0.5, 0.9, 0], [0.8, 0.8, 0]);
    else dolly(cam, t, T.K('They took food'), k82, [1.8, 1.3, 4.0], [1.0, 1.8, 6.5], [1.1, 0.4, 0.4], [1.0, 0.9, 0]);
  }
  function captions(t, cap) { cap.draw('everyday resistance', t, T.K('They slowed the pace') + 0.3, T.K('And sometimes they rose up'), CAP); }
  return { group: g, update, captions, background: PAL.skyS };
}
