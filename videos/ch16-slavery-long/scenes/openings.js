// Openings family: battlefield (S0.1, S0.2, S11.4), four farmers (S0.3, S0.4, S4.1, S4.4, S4.5, S11.3),
// gin shed (S0.5, S1.3), title card (S0.6), caption card (S7.8).
import * as THREE from 'three';
import { PAL, CAP, lights, ground, backdrop, person, place, sign, tree, musket, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed, orbit } from '/src/camera.js';
import { createPyramid } from './society.js';

// ---------------------------------------------------------------- battlefield
export function buildBattlefield(T) {
  const g = new THREE.Group(); g.name = 'scene_battlefield';
  lights(g, [-7, 6, 9], { sun: 1.6, sunColor: 0xffc9a0, fill: 0.7, skyColor: 0xd9a58a, groundColor: 0x2a2a28, shadowSize: 14 });
  g.add(ground(60, 60, 0x4a5440));
  const hills = box(60, 2.2, 6, 0x3a4436, 0.3); hills.position.set(0, 0.4, -14); g.add(hills);
  for (let i = 0; i < 6; i++) g.add(tree(-12 + i * 5 + (i % 2) * 1.5, -11 - (i % 3), 2.2 + (i % 2) * 0.6, 20 + i));
  const S = [], N = [];
  for (let i = 0; i < 6; i++) {
    const s = person('soldierS', { id: i }); place(s, -2.6 - (i % 2) * 0.9, -2.2 + i * 0.9, Math.PI / 2); g.add(s.root); S.push(s);
    const n = person('soldierN', { id: i }); place(n, 2.6 + (i % 2) * 0.9, -2.2 + i * 0.9, -Math.PI / 2); g.add(n.root); N.push(n);
  }
  const all = [...S, ...N];
  all.forEach((r, i) => { const m = musket(1.1); m.position.set(0.08, -0.3, 0.06); r.arms.R.elbow.add(m); r.musket = m; });
  // grey markers that replace the figures (S0.2)
  const markers = []; const mm = mat(0x9a9a98, { roughness: 0.9 });
  for (let i = 0; i < 84; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.08), mm); k.castShadow = true;
    k.position.set(-6 + (i % 12) * 1.1 + ((Math.floor(i / 12)) % 2) * 0.5, 0.25, -3.5 + Math.floor(i / 12) * 1.1); k.visible = false; g.add(k); markers.push(k); }
  // smoke drifts: closed form
  const smoke = []; const sm = glowMat(PAL.smoke, { transparent: true, opacity: 0.55, intensity: 0.05 });
  const r = rng(5);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 + r() * 0.5, 7, 6), sm); s.userData = { x: -8 + r() * 16, z: -6 + r() * 4, ph: r() * 6 }; g.add(s); smoke.push(s); }

  function update(t, cam) {
    const open = t < T.K('To answer that');
    const a = T.K('Over six hundred'), b = T.KE('Over six hundred');
    const fade = open ? span(t, a, b) : 0;                    // figures -> markers
    all.forEach((rg, i) => { rg.pose({ armR: -0.15, elbowR: -0.4, armL: 0.1 }); rg.root.scale.setScalar(Math.max(0.001, 1 - easeInOut(span(fade, 0.05 + i * 0.03, 0.4 + i * 0.03)))); rg.root.visible = rg.root.scale.x > 0.01; });
    markers.forEach((k, i) => { const u = easeOut(span(fade, 0.2 + (i / markers.length) * 0.7, 0.3 + (i / markers.length) * 0.7)); k.visible = u > 0.001; k.scale.y = Math.max(0.001, u); k.position.y = 0.25 * u; });
    smoke.forEach((s) => { const u = s.userData; s.position.set(u.x + Math.sin(t * 0.3 + u.ph) * 0.8, 1.6 + Math.sin(t * 0.5 + u.ph) * 0.4, u.z); s.scale.setScalar(1 + 0.15 * Math.sin(t * 0.7 + u.ph)); });
    if (open) dolly(cam, t, 0, T.K('To answer that'), [0, 3.0, 10.5], [0, 2.2, 7.0], [0, 1.0, -0.5], [0, 0.9, -0.5]);
    else dolly(cam, t, T.K('In eighteen sixty-one, the country'), T.END, [0, 3.0, 10.5], [0, 2.4, 8.5], [0, 1.0, -0.5]);
  }
  function captions(t, cap) {
    cap.draw('April 12, 1861', t, 0.4, T.KE('In April'), CAP);
    const a = T.K('Over six hundred'), b = T.KE('Over six hundred');
    if (t >= a && t < T.K('Here is the strange')) { const n = Math.round(620000 * easeOut(span(t, a, b))); cap.draw(n.toLocaleString('en-US') + ' dead', t, a, T.K('Here is the strange'), CAP); }
  }
  return { group: g, update, captions, background: 0xd98f6a };
}

// ---------------------------------------------------------------- four farmers
export function buildFourFarmers(T) {
  const g = new THREE.Group(); g.name = 'scene_fourFarmers';
  lights(g, [5, 9, 8], { shadowSize: 12 });
  g.add(ground(60, 60, PAL.south));
  g.add(backdrop(70, 12, PAL.southDark, -20, 5));
  for (let i = 0; i < 7; i++) { const p = box(0.12, 1.0, 0.12, PAL.woodDark, 0.02); p.position.set(-6 + i * 2, 0.5, -4); g.add(p); }
  const rail = box(13, 0.1, 0.1, PAL.woodDark, 0.02); rail.position.set(0, 0.8, -4); g.add(rail);
  for (let i = 0; i < 5; i++) g.add(tree(-9 + i * 4.5, -9 - (i % 2) * 2, 2.6, 30 + i));
  const F = [0, 1, 2, 3].map((i) => { const f = person('farmer', { id: i }); place(f, -2.4 + i * 1.6, 0, 0); g.add(f.root); return f; });
  F.forEach((f) => { const m = musket(1.1); m.position.set(0.08, -0.3, 0.06); f.arms.R.elbow.add(m); f.musket = m; m.visible = false; });
  const discs = F.map((f, i) => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), glowMat(0xfff2cc, { intensity: 0 })); d.rotation.x = -Math.PI / 2; d.position.set(f.root.position.x, 0.01, 0); g.add(d); return d; });
  // ladder (S4.5) from the farmers up to the right, and a distant big house silhouette
  const ladder = new THREE.Group(); ladder.name = 'ladder'; const rungs = [];
  for (let i = 0; i < 9; i++) { const rg = box(0.5, 0.06, 0.06, PAL.gold, 0.01); rg.position.set(0, i * 0.55, 0); ladder.add(rg); rungs.push(rg); }
  for (const s of [-1, 1]) { const rail = box(0.05, 4.6, 0.05, PAL.gold, 0.01); rail.position.set(s * 0.26, 2.2, 0); ladder.add(rail); }
  ladder.position.set(2.3, 0, -1.2); ladder.rotation.z = -0.28; ladder.visible = false; g.add(ladder);
  const house = new THREE.Group(); house.position.set(5.2, 3.3, -9);
  const hb = box(3.6, 2.2, 1.4, PAL.parch, 0.05); hb.position.y = 1.1; house.add(hb);
  const roof = box(4.0, 0.5, 1.8, PAL.woodDark, 0.04); roof.position.y = 2.4; house.add(roof);
  for (let i = 0; i < 4; i++) { const c = box(0.22, 2.1, 0.22, 0xffffff, 0.03); c.position.set(-1.3 + i * 0.87, 1.05, 0.75); house.add(c); }
  house.visible = false; g.add(house);
  const pyramid = createPyramid(); pyramid.group.position.set(0, 0, -7); pyramid.group.scale.setScalar(1.6); pyramid.group.visible = false; g.add(pyramid.group);

  function update(t, cam) {
    const s03 = T.K('Roughly three'), s04 = T.K('So why would'), s05 = T.K('To answer that');
    const s41 = T.K('Now the question'), s44 = T.K('So back to the question'), s45 = T.K('Partly hope'), s46 = T.K('Partly fear');
    const s113 = T.K('Which brings us back'), s114 = T.K('In eighteen sixty-one, the country');
    const inOpen = t < s05, inFour = t >= s41 && t < T.K('In eighteen fifty, only'), inBack = t >= s44 && t < s46, inEnd = t >= s113;
    // the fourth farmer (the one who owns) steps back and turns; the three lit stay forward
    const stepBack = inOpen ? easeInOut(span(t, s03 + 0.6, s03 + 2.2)) : inEnd ? 0 : 1;
    F.forEach((f, i) => {
      f.idle(t, i * 1.7);
      if (i === 3) { f.root.position.z = -1.6 * stepBack; f.root.rotation.y = Math.PI * 0.85 * stepBack; }
      f.musket.visible = (inOpen && t >= s04 + 0.3 && i < 3);
      if (f.musket.visible) f.pose({ armR: -0.25, elbowR: -0.35, armL: 0.05 });
      discs[i].material.emissiveIntensity = (i < 3 ? 0.55 : 0) * (inOpen ? easeOut(span(t, s03 + 0.6, s03 + 1.6)) : inBack ? 1 : inFour ? 1 : 0);
    });
    // S4.5: ladder, foot on the rung, look up
    const lad = t >= s45 && t < s46; ladder.visible = lad; house.visible = lad;
    if (lad) { const u = easeOut(span(t, s45, s45 + 1.2)); rungs.forEach((r, i) => { r.visible = i / rungs.length < u; }); ladder.scale.set(1, Math.max(0.001, u), 1);
      F[2].pose({ legL: -0.9, kneeL: 0.9, armL: -0.6, elbowL: -0.5, headPitch: -0.45, headYaw: -0.3, torsoYaw: -0.25 }); F[2].hips.position.y = 0.93 + 0.06 * u; }
    // S11.3: farmers, then the pyramid behind, then widest frame
    pyramid.group.visible = inEnd && t >= s113 + 1.2; pyramid.setSplit(0); pyramid.setGlow(-1, 0);
    if (inOpen) {
      if (t < s04) dolly(cam, t, s03, s04, [0, 1.5, 6.2], [0, 1.45, 5.8], [0, 1.0, 0]);
      else orbit(cam, t, s04, s05, [0, 1.0, 0], 6.0, 0.6, Math.PI / 2 + 0.05, Math.PI / 2 - 0.35, 1.0);
    } else if (inFour) fixed(cam, [0, 1.5, 6.2], [0, 1.0, 0]);
    else if (inBack) {
      if (t < s45) fixed(cam, [0, 1.5, 6.2], [0, 1.0, 0]);
      else dolly(cam, t, s45 + 0.4, s46, [0.4, 1.5, 6.2], [1.2, 2.6, 6.8], [0, 1.0, 0], [2.6, 2.8, -3]);
    } else dolly(cam, t, s113, s114, [0, 1.5, 6.2], [0, 4.5, 16], [0, 1.0, 0], [0, 1.8, -3]);
  }
  function captions(t, cap) {
    cap.draw('3 of 4 owned no one', t, T.K('Roughly three') + 1.0, T.K('So why would'), CAP);
    cap.draw('?', t, T.K('So why would') + 0.5, T.K('To answer that'), { y: 940, size: 110 });
    cap.draw('one in four', t, T.K('Add them all together') + 1.0, T.K('Which means three'), CAP);
    cap.draw('three in four', t, T.K('Which means three') + 0.3, T.K('Picture southern'), CAP);
    cap.draw('...can long endure?', t, T.K('Can a nation') + 1.0, T.K('In eighteen sixty-one, the country'), CAP);
  }
  return { group: g, update, captions, background: PAL.skyS };
}

// ---------------------------------------------------------------- gin shed
function ginMachine() {
  const g = new THREE.Group(); g.name = 'gin';
  const body = box(1.4, 0.8, 0.8, PAL.wood, 0.05); body.position.y = 0.75; g.add(body);
  for (const s of [-1, 1]) { const leg = box(0.1, 0.4, 0.7, PAL.woodDark, 0.02); leg.position.set(s * 0.6, 0.2, 0); g.add(leg); }
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 14), mat(0x8a7a6a, { roughness: 0.6 })); drum.rotation.z = Math.PI / 2; drum.position.set(0, 1.05, 0.1); drum.castShadow = true; g.add(drum);
  const crank = new THREE.Group(); crank.name = 'crank'; crank.position.set(0.82, 1.05, 0.1);
  const arm = box(0.06, 0.34, 0.06, 0x3a3a40, 0.01); arm.position.y = 0.17; crank.add(arm);
  const handle = box(0.06, 0.06, 0.4, 0x3a3a40, 0.01); handle.position.set(0, 0.34, 0.2); crank.add(handle);
  g.add(crank); g.crank = crank;
  return g;
}
export function buildGinShed(T) {
  const g = new THREE.Group(); g.name = 'scene_ginShed';
  lights(g, [4, 7, 8], { sun: 1.9, fill: 0.8, skyColor: 0xe0d2b0, groundColor: 0x3a2a1a, shadowSize: 8 });
  g.add(ground(30, 30, 0x5a4330));
  const wall = box(14, 5, 0.3, 0x7a5a3c, 0.05); wall.position.set(0, 2.5, -3); g.add(wall);
  for (let i = 0; i < 12; i++) { const pl = box(0.06, 5, 0.04, 0x5f4530, 0.01); pl.position.set(-6.5 + i * 1.2, 2.5, -2.8); g.add(pl); }
  const gin = ginMachine(); gin.position.set(1.6, 0, 0); g.add(gin);
  const cranker = person('enslaved', { id: 'gin' }); place(cranker, 3.0, 0.2, -Math.PI / 2); g.add(cranker.root);
  // before: hand picking at a table on the left
  const table = box(1.4, 0.08, 0.8, PAL.woodDark, 0.02); table.position.set(-2.4, 0.8, 0); g.add(table);
  for (const s of [-1, 1]) { const l = box(0.08, 0.8, 0.6, PAL.woodDark, 0.02); l.position.set(-2.4 + s * 0.6, 0.4, 0); g.add(l); }
  const picker = person('enslavedW', { id: 'pick' }); place(picker, -2.4, 0.7, 0); g.add(picker.root);
  const tinyPile = box(0.3, 0.18, 0.3, PAL.cotton, 0.06); tinyPile.position.set(-2.1, 0.93, 0); g.add(tinyPile);
  // after: cotton stream out of the gin into a growing pile
  const pile = new THREE.Group(); pile.position.set(0.3, 0, 0.9); g.add(pile);
  const pileBoxes = []; const r = rng(9);
  for (let i = 0; i < 40; i++) { const b = box(0.32 + r() * 0.2, 0.3, 0.32 + r() * 0.2, PAL.cotton, 0.08); const k = Math.floor(i / 8); b.position.set((i % 8 - 3.5) * 0.3 * (1 - k * 0.12), 0.15 + k * 0.3, (r() - 0.5) * 0.5); b.visible = false; pile.add(b); pileBoxes.push(b); }
  const stream = []; const sm = mat(PAL.cotton);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), sm); s.visible = false; g.add(s); stream.push(s); }
  // calendar for the rewind (S0.5)
  const years = [1861, 1850, 1840, 1830, 1820, 1810, 1800, 1793];
  const cal = new THREE.Group(); cal.position.set(0.8, 2.2, -2.6);
  const sheet = box(1.3, 0.9, 0.06, PAL.parch, 0.02); cal.add(sheet);
  const yl = years.map((y) => { const s = sign(String(y), { size: 0.5, bg: null, color: '#2a1a10' }); s.position.z = 0.05; s.visible = false; cal.add(s); return s; });
  g.add(cal);

  function update(t, cam) {
    const s05 = T.K('To answer that'), s06 = T.K('This is Chapter');
    const s13 = T.K('Then, in seventeen ninety-three'), s14 = T.K('The numbers tell');
    const rewind = t < s06;
    const working = rewind ? 0 : span(t, T.K('After it, one worker'), T.KE('Suddenly cotton'));
    const spin = rewind ? -t * 3 : t * (1 + 5 * working);
    gin.crank.rotation.x = spin;
    cranker.pose({ armR: -1.1 + 0.25 * Math.sin(spin), elbowR: -0.6, armL: -0.3, torsoYaw: 0.1 });
    picker.pose({ armL: -0.9 + 0.1 * Math.sin(t * 5), armR: -0.9 + 0.1 * Math.cos(t * 5), elbowL: -0.9, elbowR: -0.9, headPitch: 0.4 });
    picker.root.visible = !rewind; table.visible = !rewind; tinyPile.visible = !rewind;
    const grow = rewind ? 0 : easeOut(span(t, T.K('After it, one worker') + 0.5, T.KE('Suddenly cotton')));
    pileBoxes.forEach((b, i) => { b.visible = i / pileBoxes.length < grow; });
    stream.forEach((s, i) => { const u = ((t * 1.6 + i / stream.length) % 1); s.visible = !rewind && working > 0.05; s.position.set(1.2 - 0.9 * u, 0.9 - 0.4 * u * u, 0.3 + 0.6 * u); });
    cal.visible = rewind;
    if (rewind) { const u = span(t, s05 + 0.8, s06 - 0.2); const idx = Math.min(years.length - 1, Math.floor(u * years.length)); yl.forEach((s, i) => { s.visible = i === idx; }); }
    if (rewind) dolly(cam, t, s05, s06, [2.9, 1.9, 2.0], [1.6, 1.9, 3.8], [2.42, 1.15, 0.1], [1.2, 1.5, -0.6]);
    else dolly(cam, t, s13, s14, [0.2, 1.7, 7.0], [0.4, 1.6, 6.2], [0.2, 0.9, 0], [0.4, 0.9, 0]);
  }
  function captions(t, cap) {
    cap.draw('1793: the cotton gin', t, T.K('Then, in seventeen ninety-three') + 0.8, T.K('Before the gin'), CAP);
    cap.draw('50x per day', t, T.K('After it, one worker') + 0.8, T.K('Suddenly cotton'), CAP);
  }
  return { group: g, update, captions, background: 0x2a1e14 };
}

// ---------------------------------------------------------------- title and caption cards
export function buildTitleCard(T) {
  const g = new THREE.Group(); g.name = 'scene_title';
  lights(g, [3, 6, 8], { sun: 1.2 });
  const gin = ginMachine(); gin.position.set(0, -0.6, 0); g.add(gin);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0x1b1612)); dark.position.z = -6; g.add(dark);
  function update(t, cam) { gin.crank.rotation.x = t * 1.5; fixed(cam, [0, 1.2, 5.5], [0, 0.6, 0]); }
  function captions(t, cap) {
    cap.draw('Chapter 16', t, T.K('This is Chapter') + 0.2, T.K('In the seventeen eighties'), { y: 330, size: 80 });
    cap.draw('Slavery in the United States, 1793 to 1860', t, T.K('This is Chapter') + 0.9, T.K('In the seventeen eighties'), { y: 920, size: 54 });
  }
  return { group: g, update, captions, background: 0x1b1612 };
}
export function buildCaptionCard(T) {
  const g = new THREE.Group(); g.name = 'scene_captionCard';
  function update(t, cam) { fixed(cam, [0, 0, 5], [0, 0, 0]); }
  function captions(t, cap) {
    cap.draw('The conditions of slavery matter.', t, T.K('The conditions of slavery') + 0.2, T.K('Enslaved people resisted every day'), { y: 470, size: 60 });
    cap.draw('The existence of slavery matters more.', t, T.K('The existence of slavery') + 0.2, T.K('Enslaved people resisted every day'), { y: 620, size: 78 });
  }
  return { group: g, update, captions, background: 0x000000 };
}
