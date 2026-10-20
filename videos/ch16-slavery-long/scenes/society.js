// Society family: the big house (S4.2, S8.7, S10.3), the pyramid prop and scene (S4.3, S4.6, S6.1, S7.1, S8.6),
// the quarters (S3.4, S7.3, S7.5, S7.6, S7.7), the town street (S6.2).
import * as THREE from 'three';
import { PAL, CAP, CAP2, lights, ground, backdrop, person, place, sign, tree, column, chainLink, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed, orbit } from '/src/camera.js';

// ---------------------------------------------------------------- pyramid prop
// Layers bottom-up: 0 enslaved (3,200,000), 1 free Black (250,000), 2 plain folk (6,000,000), 3 slavocracy.
export function createPyramid() {
  const g = new THREE.Group(); g.name = 'pyramid';
  const spec = [[6.0, 1.1, 0x3a2f2b], [5.0, 0.3, 0x7a6450], [4.2, 1.0, PAL.south], [1.4, 0.55, PAL.gold]];
  const layers = []; let y = 0;
  spec.forEach(([w, h, c], i) => { const m = glowMat(c, { intensity: 0 }); const L = { halves: [], m, y, h, w };
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w / 2, h, 2.4), m); b.castShadow = b.receiveShadow = true; b.position.set(s * w / 4, y + h / 2, 0); b.userData.s = s; g.add(b); L.halves.push(b); }
    layers.push(L); y += h; });
  g.tiers = layers; g.height = y;
  g.setBuild = (k) => layers.forEach((L, i) => { const u = Math.max(0.001, Math.min(1, k - i)); L.halves.forEach((b) => { b.scale.y = u; b.position.y = L.y + L.h * u / 2; }); });
  g.setGlow = (i, k, color) => layers.forEach((L, j) => { L.m.emissiveIntensity = j === i ? k : 0; if (j === i && color !== undefined) L.m.emissive.set(color); });
  g.setSplit = (d) => layers.forEach((L) => L.halves.forEach((b) => { b.position.x = b.userData.s * (L.w / 4 + d / 2); }));
  g.setLift = (i, dy) => { const L = layers[i]; L.halves.forEach((b) => { b.position.y = L.y + L.h * b.scale.y / 2 + dy; }); };
  g.setBuild(4);
  return { group: g, setBuild: g.setBuild, setGlow: g.setGlow, setSplit: g.setSplit, setLift: g.setLift, layers };
}

// ---------------------------------------------------------------- pyramid scene
export function buildPyramidScene(T) {
  const g = new THREE.Group(); g.name = 'scene_pyramid';
  lights(g, [5, 9, 8], { sun: 2.0, fill: 0.9, shadowSize: 10 });
  g.add(ground(40, 40, 0xc9b894)); g.add(backdrop(40, 14, 0xb8a37c, -8, 7));
  const P = createPyramid(); g.add(P.group);
  const labels = [['3,200,000 enslaved', 0.55], ['250,000 free Black', 1.25], ['6,000,000 plain folk', 1.9], ['slavocracy', 2.7]].map(([s, y], i) => { const l = sign(s, { size: 0.3 }); l.position.set(3.3, y + 0.15, 1.4); l.visible = false; g.add(l); return l; });
  const farmer = person('farmer', { id: 'pyr' }); farmer.root.visible = false; g.add(farmer.root);
  const tiny = [0, 1, 2].map((i) => { const p = person('planter', { id: 'top' + i, scale: 0.38 }); place(p, -0.35 + i * 0.35, 0.3, 0, P.group.height); g.add(p.root); return p; });
  function update(t, cam) {
    const k43 = T.K('Below them were tens'), k44 = T.K('So back to the question');
    const k46 = T.K('Partly fear'), k51 = T.K('The Cotton Kingdom looked');
    const k61 = T.K('Not every Black southerner'), k62 = T.K('Some traced their freedom');
    const k71 = T.K('So how did enslaved'), k72 = T.K('Enslaved people had no political');
    const k86 = T.K('None of these rebellions'), k87 = T.K("Turner's revolt failed");
    const beat = t < k44 ? 'build' : t < k51 ? 'fear' : t < k62 ? 'free' : t < k72 ? 'base' : 'push';
    P.setSplit(0);
    if (beat === 'build') {
      // bottom-up as each layer is named: base on 'At the base', free on 'Below them, about', plain on 'Below them, the plain', top on 'At the very top'
      const times = [T.K('At the base'), T.K('Below them, about two hundred'), T.K('Below them, the plain folk'), T.K('At the very top')];
      // the narration names top first, so show a ghost outline: build all layers at 'Picture southern society', then light each when named
      const outline = easeOut(span(t, T.K('Picture southern society') + 0.3, T.K('Picture southern society') + 1.6)); P.setBuild(4 * outline);
      let glow = -1; times.forEach((tt, i) => { if (t >= tt && t < tt + 2.6) glow = i; }); P.setGlow(glow, glow >= 0 ? 0.35 : 0, 0xffe0a0);
      labels.forEach((l, i) => { l.visible = t >= times[i] + 0.4; });
      tiny.forEach((p) => { p.root.visible = t > T.K('At the very top') + 0.3; p.idle(t); });
      dolly(cam, t, k43, k44, [0.5, 2.4, 8.5], [1.5, 3.2, 11.5], [0, 1.2, 0], [0.4, 1.4, 0]);
    } else if (beat === 'fear') {
      P.setBuild(4); labels.forEach((l) => { l.visible = false; }); tiny.forEach((p) => { p.root.visible = true; p.idle(t); });
      farmer.root.visible = true; place(farmer, -0.8, 0.6, 0.3, P.layers[2].y + P.layers[2].h); farmer.pose({ headPitch: 0.6, armL: 0.2, armR: 0.2 });
      const red = 0.1 + 0.5 * easeOut(span(t, k46 + 0.5, k46 + 2.0)) + 0.3 * Math.max(0, Math.sin(t * 2.0)); P.setGlow(0, red, PAL.red);
      dolly(cam, t, k46, k51, [-1.5, 3.4, 7.5], [-1.2, 1.4, 6.5], [-0.8, 2.4, 0.6], [-0.6, 0.6, 0.6]);
    } else if (beat === 'free') {
      P.setBuild(4); farmer.root.visible = false; tiny.forEach((p) => { p.root.visible = true; p.idle(t); });
      P.setGlow(1, 0.3 + 0.6 * easeOut(span(t, k61 + 0.4, k61 + 1.5)), 0xffd890); labels.forEach((l, i) => { l.visible = i === 1 && t > k61 + 1.0; });
      dolly(cam, t, k61, k62, [0.5, 2.6, 9], [1.2, 1.8, 5.2], [0, 1.4, 0], [0.8, 1.25, 0]);
    } else if (beat === 'base') {
      P.setBuild(4); farmer.root.visible = false; tiny.forEach((p) => { p.root.visible = true; p.idle(t); });
      P.setGlow(0, 0.3 + 0.6 * easeOut(span(t, k71 + 0.3, k71 + 1.2)), 0xff9a70); labels.forEach((l, i) => { l.visible = i === 0 && t > k71 + 0.8; });
      dolly(cam, t, k71, k72, [0.5, 3.2, 9], [0.2, 0.6, 4.6], [0, 1.6, 0], [0, 0.5, 0]);
    } else {
      P.setBuild(4); farmer.root.visible = false; tiny.forEach((p) => { p.root.visible = true; p.idle(t); }); labels.forEach((l) => { l.visible = false; });
      const push = Math.max(0, Math.sin((t - k86) * 2.2)) * 0.08 * easeOut(span(t, k86, k86 + 1)); P.setLift(0, push); P.setLift(3, -push * 0.6); P.setGlow(0, 0.25 + push * 3, PAL.red);
      fixed(cam, [0.4, 2.2, 9.5], [0, 1.4, 0]);
    }
  }
  function captions(t, cap) {
    cap.draw('South, 1850: 9,250,000 people', t, T.K('In total, the South') + 0.4, T.K('In total, the South') + 3.2, CAP);
    cap.draw('40% of the United States', t, T.K('In total, the South') + 3.2, T.K('So back to the question'), CAP);
    cap.draw('a rung to stand on', t, T.K('Slavery gave him a rung') + 0.3, T.K('Take that away'), CAP);
    cap.draw('250,000 free Black southerners', t, T.K('By eighteen sixty about two hundred') + 0.8, T.K('Some traced their freedom'), CAP);
    cap.draw('no numbers, no weapons, no organization', t, T.K('They lacked numbers') + 0.3, T.K('As one historian'), CAP);
  }
  return { group: g, update, captions, background: PAL.skyS };
}

// ---------------------------------------------------------------- big house
export function buildBigHouse(T) {
  const g = new THREE.Group(); g.name = 'scene_bigHouse';
  const sun = lights(g, [6, 9, 9], { sun: 2.0, fill: 0.9, shadowSize: 12 });
  g.add(ground(60, 60, 0x9aa66a));
  const H = new THREE.Group(); g.add(H);
  const body = box(9, 5, 5, PAL.parch, 0.06); body.position.set(0, 2.5, -3); H.add(body);
  const roof = box(10, 1.2, 6, PAL.woodDark, 0.05); roof.position.set(0, 5.6, -3); H.add(roof);
  const porch = box(10, 0.4, 3, PAL.stone, 0.04); porch.position.set(0, 0.2, 0); H.add(porch);
  for (let i = 0; i < 6; i++) H.add(column(-4 + i * 1.6, 1.0, 4.8, 0.36));
  const ent = box(10.4, 0.5, 3.4, PAL.parch, 0.04); ent.position.set(0, 5.1, 0.9); H.add(ent);
  for (let i = 0; i < 4; i++) for (const yy of [1.6, 3.6]) { const w = box(0.8, 1.2, 0.1, 0x3a4a5a, 0.02); w.position.set(-3.6 + i * 2.4, yy, -0.45); H.add(w); }
  for (let i = 0; i < 6; i++) g.add(tree(-14 + i * 5.6 + (i % 2) * 2, -8 - (i % 3) * 2, 3.0 + (i % 2) * 0.8, 60 + i));
  const gents = [0, 1, 2, 3].map((i) => { const p = person('planter', { id: 'g' + i }); place(p, -1.2 + i * 0.8, 1.0 + (i % 2) * 0.5, 0.2 - (i % 2) * 0.6, 0.4); g.add(p.root); return p; });
  // window close-up (S8.7, S10.3): the right-hand upper window as a set piece
  const W = new THREE.Group(); W.position.set(3.6, 3.6, -0.45); g.add(W);
  const sill = box(1.0, 0.1, 0.4, PAL.parch, 0.02); sill.position.set(0, -0.62, 0.15); W.add(sill);
  const pistol = new THREE.Group(); const brl = box(0.3, 0.04, 0.04, 0x2a2a30, 0.005); pistol.add(brl); const grip = box(0.05, 0.14, 0.04, PAL.woodDark, 0.005); grip.position.set(-0.13, -0.08, 0); pistol.add(grip); pistol.position.set(0.1, -0.55, 0.2); pistol.rotation.y = 0.3; W.add(pistol);
  const candle = box(0.05, 0.22, 0.05, 0xf4ecd8, 0.01); candle.position.set(-0.3, -0.46, 0.2); W.add(candle); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), glowMat(0xffc040, { intensity: 2.5 })); flame.position.set(-0.3, -0.31, 0.2); W.add(flame);
  const cl = new THREE.PointLight(0xffb060, 1.6, 3); cl.position.set(-0.3, -0.2, 0.5); W.add(cl); cl.visible = false;
  const watcher = person('planter', { id: 'win', scale: 0.9 }); place(watcher, 3.6, -0.5, 0, 2.3); watcher.root.visible = false; g.add(watcher.root);
  const poster = new THREE.Group(); const pp = box(0.7, 0.9, 0.03, PAL.parch, 0.01); poster.add(pp); const sil = box(0.28, 0.32, 0.02, 0x2a2420, 0.08); sil.position.set(0, 0.1, 0.02); poster.add(sil); const pl = sign('$5,000', { size: 0.22, bg: null, color: '#5a1a10' }); pl.position.set(0, -0.3, 0.03); poster.add(pl); poster.position.set(2.5, 3.5, -0.4); poster.visible = false; g.add(poster);
  const night = new THREE.HemisphereLight(0x303a60, 0x101018, 0.5); night.visible = false; g.add(night);

  function update(t, cam) {
    const k42 = T.K('In eighteen fifty, only'), k43 = T.K('Below them were tens');
    const k87 = T.K("Turner's revolt failed"), k91 = T.K('Opposition to slavery');
    const k103 = T.K('Nat Turner, first of all'), k104 = T.K('Then the Nullification');
    const day = t < k43;
    sun.intensity = day ? 2.0 : 0.25; night.visible = !day; cl.visible = !day;
    gents.forEach((p, i) => { p.root.visible = day; p.idle(t, i); });
    watcher.root.visible = !day; watcher.pose({ headYaw: -0.3 + 0.15 * Math.sin(t * 0.8), armR: -0.4, elbowR: -0.6, armL: 0.1 });
    flame.scale.setScalar(1 + 0.15 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23));
    const post = !day && t >= T.K('Georgia offered'); poster.visible = post; if (post) { const u = easeOut(span(t, T.K('Georgia offered') + 0.3, T.K('Georgia offered') + 0.9)); poster.position.y = 3.5 + (1 - u) * 1.2; poster.rotation.z = (1 - u) * 0.4; }
    if (day) dolly(cam, t, k42, k43, [1.5, 0.8, 11], [0.6, 1.2, 8.5], [0, 2.4, 0], [0, 2.6, 0]);
    else if (t < k103) dolly(cam, t, k87, k91, [3.6, 3.4, 2.8], [3.6, 3.3, 2.2], [3.6, 3.1, -0.3]);
    else dolly(cam, t, k103, k104, [3.6, 3.3, 2.2], [3.0, 3.3, 2.6], [3.6, 3.1, -0.3], [3.0, 3.2, -0.4]);
  }
  function captions(t, cap) {
    cap.draw('1,733 families', t, T.K('In eighteen fifty, only') + 1.5, T.K('This tiny group'), CAP);
    cap.draw('the planter aristocracy', t, T.K('This tiny group') + 0.3, T.K('They held the bulk'), CAP);
    cap.draw('$5,000 for Garrison', t, T.K('Georgia offered') + 1.0, T.K('Then the Nullification'), CAP);
  }
  return { group: g, update, captions, background: PAL.skyS };
}

// ---------------------------------------------------------------- quarters
export function buildQuarters(T) {
  const g = new THREE.Group(); g.name = 'scene_quarters';
  const sun = lights(g, [5, 8, 8], { sun: 1.9, fill: 0.85, shadowSize: 12 });
  g.add(ground(60, 60, 0x8a7a52));
  const cabins = [0, 1, 2].map((i) => { const c = new THREE.Group(); const b = box(2.6, 2.0, 2.4, 0x7a5a3c, 0.04); b.position.y = 1.0; c.add(b); const r = box(3.0, 0.3, 2.8, PAL.woodDark, 0.04); r.position.y = 2.15; c.add(r); const d = box(0.7, 1.4, 0.1, 0x3a2a1c, 0.02); d.position.set(0, 0.7, 1.21); c.add(d); c.position.set(-4 + i * 4, 0, -2.5); g.add(c); return c; });
  for (let i = 0; i < 5; i++) { const f = box(0.08, 0.9, 0.08, PAL.woodDark, 0.01); f.position.set(-7 + i * 1.2, 0.45, 2.6); g.add(f); }
  // S3.4 family grows
  const man = person('enslaved', { id: 'fam1' }), woman = person('woman', { id: 'fam2' }); place(man, -0.6, 0.2, 0.2); place(woman, 0.5, 0.2, -0.2); g.add(man.root, woman.root);
  const kids = [0, 1, 2, 3].map((i) => { const k = person('child', { id: 'k' + i }); place(k, -1.6 + i * 1.1 + (i >= 2 ? 1.2 : 0), 1.2 + (i % 2) * 0.4, 0); k.root.visible = false; g.add(k.root); return k; });
  const cal = sign('1830', { size: 0.5 }); cal.position.set(0, 3.2, -1); g.add(cal);
  // S7.3 whip post
  const post = box(0.3, 2.4, 0.3, PAL.woodDark, 0.03); post.position.set(6.5, 1.2, 0.5); g.add(post);
  const whip = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 14), mat(0x3a2a1c)); whip.position.set(6.7, 1.6, 0.5); whip.rotation.y = Math.PI / 2; g.add(whip);
  const turned = person('enslaved', { id: 'turned' }); place(turned, 7.6, 0.9, Math.PI); g.add(turned.root);
  const redLight = new THREE.PointLight(PAL.red, 0, 8); redLight.position.set(6.5, 2.5, 2); g.add(redLight);
  // S7.5 evening gathering: fiddler, preacher on a stump, crowd
  const fiddler = person('enslavedW', { id: 'fid' }); place(fiddler, -2.6, 2.4, 0.9); g.add(fiddler.root);
  const fiddle = box(0.14, 0.4, 0.05, 0x7a3a1a, 0.02); fiddle.position.set(0.1, -0.3, 0.1); fiddle.rotation.x = -1.2; fiddler.arms.L.elbow.add(fiddle);
  const stump = box(0.8, 0.5, 0.8, PAL.woodDark, 0.04); stump.position.set(2.4, 0.25, 1.2); g.add(stump);
  const preacher = person('enslaved', { id: 'pr' }); place(preacher, 2.4, 1.2, -Math.PI / 2 + 0.3, 0.5); g.add(preacher.root);
  const crowd = [0, 1, 2, 3, 4].map((i) => { const p = person(i % 2 ? 'enslaved' : 'woman', { id: 'cr' + i }); place(p, -0.6 + (i % 3) * 0.9 + Math.floor(i / 3) * 0.45, 0.6 + Math.floor(i / 3) * 1.0 + (i % 2) * 0.2, Math.PI / 2 - 0.2); g.add(p.root); return p; });
  const pulse = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), glowMat(0xffd080, { intensity: 0, transparent: true, opacity: 0.5 })); pulse.rotation.x = -Math.PI / 2; pulse.position.set(0.4, 0.02, 1.2); g.add(pulse);
  const pulse2 = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), glowMat(0xffd080, { intensity: 0, transparent: true, opacity: 0.5 })); pulse2.rotation.x = -Math.PI / 2; pulse2.position.set(2.4, 0.52, 1.2); g.add(pulse2);
  const fire = new THREE.PointLight(0xffa050, 0, 12); fire.position.set(0.5, 1.5, 2); g.add(fire);
  // S7.6 mask
  const masker = person('enslaved', { id: 'mask' }); place(masker, -0.2, 1.0, 0.1); g.add(masker.root);
  const mask = new THREE.Group(); const mf = box(0.34, 0.36, 0.05, PAL.parch, 0.06); mask.add(mf); for (const s of [-1, 1]) { const e = box(0.07, 0.07, 0.02, 0x1a1a1a, 0.01); e.position.set(s * 0.08, 0.06, 0.035); mask.add(e); } for (let i = 0; i < 5; i++) { const m = box(0.05, 0.03, 0.02, 0x7a1a1a, 0.005); m.position.set(-0.1 + i * 0.05, -0.1 + Math.abs(i - 2) * 0.03, 0.035); mask.add(m); } mask.position.set(0, -0.34, 0.06); masker.arms.R.elbow.add(mask);
  const overseer = person('overseer', { id: 'ov' }); g.add(overseer.root);
  // S7.7 night: chained dancers
  const dancers = [0, 1, 2].map((i) => { const d = person(i === 1 ? 'enslavedW' : 'enslaved', { id: 'd' + i }); place(d, -1.4 + i * 1.4, 0.8, 0.2 - (i - 1) * 0.3); const ch = chainLink(6, 0x6a6a74); ch.position.set(-0.3, 0.1, 0.3); ch.children.forEach((l) => { l.material = glowMat(0x9a9aa8, { intensity: 0 }); }); d.root.add(ch); d.chain = ch; g.add(d.root); return d; });
  const moon = new THREE.HemisphereLight(0x3a4a7a, 0x101018, 0.6); moon.visible = false; g.add(moon);
  const sets = { family: [man.root, woman.root, cal, ...kids.map((k) => k.root)], post: [post, whip, turned.root], evening: [fiddler.root, stump, preacher.root, ...crowd.map((c) => c.root), pulse, pulse2], mask: [masker.root, overseer.root], night: dancers.map((d) => d.root) };
  const show = (name) => { for (const [n, arr] of Object.entries(sets)) arr.forEach((o) => { o.visible = n === name; }); };

  function update(t, cam) {
    const k34 = T.K('Most of the growth'), k35 = T.K('And because the Atlantic');
    const k73 = T.K('Floggings were common'), k74 = T.K('The auction was the heart');
    const k75 = T.K('And yet'), k76 = T.K('Survival sometimes'), k77 = T.K('A former slave named'), k78 = T.K('The conditions of slavery');
    const beat = t < k35 ? 'family' : t < k74 ? 'post' : t < k76 ? 'evening' : t < k77 ? 'mask' : 'night';
    show(beat);
    const evening = beat === 'evening' || beat === 'mask' || beat === 'night';
    sun.intensity = beat === 'night' ? 0.15 : evening ? 0.9 : 1.9; sun.color.set(evening ? 0xffb070 : 0xfff0dc); moon.visible = beat === 'night'; fire.intensity = beat === 'evening' ? 1.8 : 0; redLight.intensity = beat === 'post' ? 2.5 * (0.6 + 0.4 * Math.sin(t * 3)) : 0;
    if (beat === 'family') { man.idle(t, 1); woman.idle(t, 2); const years = [1810, 1820, 1830, 1840]; const u = span(t, k34 + 0.4, k35 - 0.4); const idx = Math.min(3, Math.floor(u * 4)); cal.visible = false; kids.forEach((k, i) => { const a = k34 + 0.6 + i * 1.0; k.root.visible = t > a; k.root.scale.setScalar(0.6 * easeOut(span(t, a, a + 0.5)) || 0.001); k.idle(t, 5 + i); }); cal.visible = true; cal.material.map = sign(String(years[idx]), { size: 0.5 }).material.map;
      dolly(cam, t, k34, k35, [0.2, 1.7, 7.5], [0.2, 1.6, 6.5], [0, 1.0, 0], [0, 0.9, 0]); }
    else if (beat === 'post') { turned.pose({ armL: 0.3, armR: 0.3, headPitch: 0.5, torsoPitch: 0.15 }); turned.hips.position.y = 0.93;
      if (t < T.K('Enslaved people who resisted')) dolly(cam, t, k73, T.K('Enslaved people who resisted'), [7.8, 1.7, 3.6], [7.4, 1.6, 3.0], [6.8, 1.3, 0.5]); else dolly(cam, t, T.K('Enslaved people who resisted'), k74, [9.5, 1.8, 3.6], [9.0, 1.6, 3.2], [7.3, 1.0, 0.6]); }
    else if (beat === 'evening') { fiddler.pose({ armL: -1.0, elbowL: -1.2, armR: -0.9 + 0.3 * Math.sin(t * 9), elbowR: -0.6, headPitch: 0.2 }); const call = Math.sin(t * 2.2) > 0; preacher.pose({ armR: call ? -1.4 : -0.6, elbowR: -0.3, armL: call ? -0.6 : -0.2, headPitch: -0.2 }); preacher.hips.position.y = 0.93;
      const call2 = t >= T.K('A distinctive African American'); crowd.forEach((c, i) => { c.pose({ armL: !call && call2 ? -0.9 : -0.1, armR: !call && call2 ? -0.9 : -0.1, headPitch: -0.15 }); c.hips.position.y = 0.93 + (!call && call2 ? 0.04 * Math.abs(Math.sin(t * 4.4)) : 0); });
      pulse.material.emissiveIntensity = call2 && !call ? 0.8 : 0; pulse2.material.emissiveIntensity = call2 && call ? 0.8 : 0;
      dolly(cam, t, k75, k76, [0.6, 2.0, 9.0], [0.8, 1.8, 7.8], [0.4, 1.0, 1.0], [0.6, 1.0, 1.0]); }
    else if (beat === 'mask') { const ov = span(t, k76 + 0.3, k77 - 0.3); overseer.root.position.set(lerp(-4.5, 4.5, ov), 0, -0.8); overseer.root.rotation.y = Math.PI / 2; overseer.walk(t, 0.8); const near = Math.abs(overseer.root.position.x - masker.root.position.x) < 2.2; const up = easeInOut(span(near ? 1 : 0, 0, 1)); masker.pose({ armR: near ? -1.9 : -0.5, elbowR: near ? -1.5 : -0.4, headYaw: near ? 0.2 : -0.3 }); masker.hips.position.y = 0.93;
      dolly(cam, t, k76, k77, [-0.6, 1.9, 3.4], [-0.3, 1.8, 2.8], [-0.2, 1.5, 1.0], [-0.1, 1.45, 1.0]); }
    else { dancers.forEach((d, i) => { const ph = t * 3.2 + i * 1.1; d.pose({ armL: -0.8 + 0.5 * Math.sin(ph), armR: -0.8 - 0.5 * Math.sin(ph), elbowL: -0.5, elbowR: -0.5, legL: 0.25 * Math.sin(ph), legR: -0.25 * Math.sin(ph), kneeL: 0.3, kneeR: 0.3, headYaw: 0.2 * Math.sin(ph * 0.5) }); d.hips.position.y = 0.93 + 0.08 * Math.abs(Math.sin(ph)); d.chain.children.forEach((l, j) => { l.material.emissiveIntensity = 0.3 + 0.7 * Math.max(0, Math.sin(ph * 2 + j)); }); });
      dolly(cam, t, k77, k78, [0.2, 1.9, 8.5], [0.2, 1.7, 7.5], [0, 1.0, 0.3]); }
  }
  function captions(t, cap) {
    cap.draw('natural increase', t, T.K('Most of the growth') + 0.6, T.K('And because the Atlantic'), CAP);
    cap.draw('Uncle Tom\'s Cabin, 1852', t, T.K('Abolitionists called this') + 2.5, T.K('And yet'), CAP);
    cap.draw('call and response', t, T.K('A distinctive African American') + 3.0, T.K('Survival sometimes'), CAP);
    cap.draw('John Little, formerly enslaved', t, T.K('A former slave named') + 0.5, T.K('The conditions of slavery'), CAP);
  }
  return { group: g, update, captions, background: 0xd7c6a0 };
}

// ---------------------------------------------------------------- town street (S6.2)
export function buildTownStreet(T) {
  const g = new THREE.Group(); g.name = 'scene_townStreet';
  lights(g, [5, 8, 8], { sun: 1.9, fill: 0.9, shadowSize: 10 });
  g.add(ground(40, 40, 0xb8a888));
  const fronts = [0, 1, 2, 3].map((i) => { const f = box(3.6, 3.2, 2.0, [PAL.brick, PAL.parch, 0x9a8a7a, PAL.brick][i], 0.04); f.position.set(-5.4 + i * 3.7, 1.6, -3); g.add(f); const w = box(1.2, 1.0, 0.1, 0x3a4a5a, 0.02); w.position.set(-5.4 + i * 3.7, 1.9, -1.95); g.add(w); return f; });
  const bench = box(1.8, 0.1, 0.8, PAL.woodDark, 0.02); bench.position.set(0, 0.9, 0); g.add(bench);
  for (const s of [-1, 1]) { const l = box(0.1, 0.9, 0.7, PAL.woodDark, 0.02); l.position.set(s * 0.8, 0.45, 0); g.add(l); }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 10), mat(PAL.wood)); barrel.position.set(1.6, 0.35, 0.3); barrel.castShadow = true; g.add(barrel);
  const artisan = person('freeBlack', { id: 'art' }); place(artisan, 0, -0.75, 0); g.add(artisan.root);
  const hammer = new THREE.Group(); const hh = box(0.04, 0.3, 0.04, PAL.woodDark, 0.005); hh.position.y = -0.15; hammer.add(hh); const head = box(0.14, 0.06, 0.06, 0x3a3a40, 0.01); head.position.y = -0.3; hammer.add(head); hammer.position.set(0, -0.3, 0.1); artisan.arms.R.elbow.add(hammer);
  const deed = new THREE.Group(); const dp = box(0.7, 0.9, 0.03, PAL.parch, 0.01); deed.add(dp); const dl = sign('FREE', { size: 0.22, bg: null, color: '#2a1a10' }); dl.position.set(0, 0.15, 0.03); deed.add(dl); const seal = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), mat(PAL.red)); seal.position.set(0, -0.25, 0.03); deed.add(seal); deed.position.set(-1.6, 2.2, -1.95); deed.scale.setScalar(0.001); g.add(deed);
  const fence = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const p = new THREE.Group(); const pk = box(0.12, 1.4, 0.12, 0x5a4a44, 0.01); pk.position.y = 0.7; p.add(pk); const a = (i / 8) * Math.PI * 2; p.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4 + 0.3); p.scale.y = 0.001; g.add(p); return p; });
  const tags = ['no vote', 'no court', 'no travel', 'no school'].map((s, i) => { const l = sign(s, { size: 0.26, bg: 'rgba(120,20,20,0.9)' }); const a = (i * 2 / 8) * Math.PI * 2; l.position.set(Math.cos(a) * 2.4, 1.6, Math.sin(a) * 2.4 + 0.3); l.visible = false; g.add(l); return l; });
  function update(t, cam) {
    const k62 = T.K('Some traced their freedom'), k63 = T.K('And the North was not a refuge');
    artisan.pose({ armR: -1.2 + 0.5 * Math.max(0, Math.sin(t * 6)), elbowR: -0.7, armL: -0.8, elbowL: -0.6, headPitch: 0.35 }); artisan.hips.position.y = 0.93;
    deed.scale.setScalar(Math.max(0.001, easeOut(span(t, k62 + 0.5, k62 + 1.2))));
    const f = span(t, T.K('But they lived as') + 0.3, T.KE('But they lived as')); fence.forEach((p, i) => { p.scale.y = Math.max(0.001, easeOut(span(f, i / 8, i / 8 + 0.25))); }); tags.forEach((l, i) => { l.visible = f > (i * 2) / 8 + 0.3; });
    dolly(cam, t, k62, k63, [1.0, 1.8, 5.2], [0.6, 1.9, 6.2], [0, 1.1, 0], [0, 1.0, 0]);
  }
  function captions(t, cap) { cap.draw('a third race', t, T.K('But they lived as') + 1.5, T.K('And the North was not a refuge'), CAP); }
  return { group: g, update, captions, background: PAL.skyS };
}
