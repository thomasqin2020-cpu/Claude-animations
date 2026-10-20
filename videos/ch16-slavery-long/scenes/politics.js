// Politics family: printing press (S9.3, S9.4), lectern hall (S9.5 to S9.7), town square (S10.1, S10.2, S10.5, S10.6), congress (S10.8).
import * as THREE from 'three';
import { PAL, CAP, lights, ground, backdrop, person, place, sign, column, book, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed } from '/src/camera.js';

export function buildPrintingPress(T) {
  const g = new THREE.Group(); g.name = 'scene_press';
  lights(g, [4, 7, 8], { sun: 1.7, fill: 0.9, skyColor: 0xbcc8d8, groundColor: 0x202830, shadowSize: 10 });
  g.add(ground(40, 40, PAL.northDark)); g.add(backdrop(40, 10, 0x5a6878, -5, 5));
  const press = new THREE.Group(); press.position.set(0, 0, 0); g.add(press);
  const base = box(2.2, 0.8, 1.4, 0x3a3a40, 0.04); base.position.y = 0.4; press.add(base);
  for (const s of [-1, 1]) { const pl = box(0.2, 2.6, 0.2, 0x2a2a30, 0.02); pl.position.set(s * 0.9, 1.7, 0); press.add(pl); }
  const top = box(2.0, 0.3, 0.6, 0x2a2a30, 0.03); top.position.y = 3.0; press.add(top);
  const screw = box(0.15, 1.0, 0.15, 0x6a6a72, 0.02); screw.position.y = 2.3; press.add(screw);
  const platen = box(1.4, 0.2, 0.9, 0x4a4a52, 0.03); platen.position.y = 1.5; press.add(platen);
  const sheet = box(1.2, 0.03, 0.8, PAL.parch, 0.005); sheet.position.set(0, 0.82, 0); press.add(sheet);
  const head = sign('THE LIBERATOR', { size: 0.2, bg: null, color: '#1a1a1a' }); head.position.set(0, 0.86, 0); head.rotation.x = -Math.PI / 2; head.visible = false; press.add(head);
  const garrison = person('garrison', { id: 'pr' }); place(garrison, -2.6, 0.6, 0.6); g.add(garrison.root);
  const weed = new THREE.Group(); const stem = box(0.08, 0.9, 0.08, 0x3f6a2a, 0.01); stem.position.y = 0.45; weed.add(stem); for (let i = 0; i < 3; i++) { const lf = box(0.4, 0.05, 0.14, 0x4b7a3a, 0.02); lf.position.set((i - 1) * 0.2, 0.5 + i * 0.15, 0); lf.rotation.z = (i - 1) * 0.5; weed.add(lf); } const root = box(0.16, 0.5, 0.16, 0x6a4a2a, 0.03); root.position.y = -0.25; weed.add(root); weed.position.set(-3.4, 0, 1.4); g.add(weed);
  const trio = [['douglass', 'Walker 1829'], ['truth', 'Sojourner Truth'], ['freeBlack', 'Delany']].map(([k, s], i) => { const p = person(k, { id: 'trio' + i }); place(p, 1.6 + i * 1.3, 2.2, 0); p.root.visible = false; g.add(p.root); const l = sign(s, { size: 0.26 }); l.position.set(1.6 + i * 1.3, 2.4, 2.2); l.visible = false; g.add(l); return { p, l }; });
  const pamphlet = box(0.3, 0.4, 0.03, PAL.parch, 0.01); pamphlet.position.set(0, -0.3, 0.1); trio[0].p.arms.R.elbow.add(pamphlet);
  const banners = [['emancipation', -1], ["women's rights", 1]].map(([s, side]) => { const b = new THREE.Group(); const pole = box(0.04, 1.4, 0.04, PAL.woodDark, 0.005); pole.position.y = 0.5; b.add(pole); const l = sign(s, { size: 0.2, bg: 'rgba(60,60,80,0.9)' }); l.position.y = 1.3; b.add(l); b.position.set(0, -0.3, 0.05); trio[1].p.arms[side < 0 ? 'L' : 'R'].elbow.add(b); return b; });
  const africa = new THREE.Group(); const map = box(0.5, 0.6, 0.03, PAL.parch, 0.01); africa.add(map); const cont = box(0.26, 0.4, 0.02, 0x7a8a4a, 0.08); cont.position.z = 0.02; africa.add(cont); africa.position.set(0, -0.3, 0.1); trio[2].p.arms.L.elbow.add(africa);
  function update(t, cam) {
    const k93 = T.K('The eighteen thirties brought'), k94 = T.K('Black abolitionists'), k95 = T.K('And then there was Frederick');
    const stamp = Math.max(0, Math.sin(t * 2.6)); platen.position.y = 0.95 + 0.55 * stamp; screw.position.y = 2.3 - 0.2 * (1 - stamp); head.visible = t > T.K('William Lloyd Garrison') + 1.0 && stamp > 0.5;
    const pull = easeOut(span(t, T.K('William Lloyd Garrison') + 3.5, T.K('William Lloyd Garrison') + 5.0)); weed.position.y = pull * 0.9; weed.rotation.z = -pull * 0.6; garrison.pose({ armR: -1.2 + 0.4 * pull, elbowR: -0.9, armL: -0.5, torsoPitch: 0.25 - 0.2 * pull, headPitch: 0.3 }); garrison.hips.position.y = 0.93; garrison.root.visible = t < k94 + 0.5 || true;
    const names = [T.K("David Walker's Appeal"), T.K('Sojourner Truth'), T.K('Martin Delany')];
    trio.forEach(({ p, l }, i) => { const u = easeOut(span(t, names[i], names[i] + 0.8)); p.root.visible = t >= k94; p.root.position.z = 2.2 + 1.0 * u; p.idle(t, 10 + i); if (i === 0) p.pose({ armR: -1.3, elbowR: -0.4 }); if (i === 1) p.pose({ armL: -1.4, armR: -1.4, elbowL: -0.2, elbowR: -0.2 }); if (i === 2) p.pose({ armL: -1.2, elbowL: -0.6 }); l.visible = u > 0.6; });
    if (t < k94) dolly(cam, t, k93, k94, [-0.4, 1.9, 5.8], [-1.4, 1.8, 5.6], [-0.6, 1.2, 0.3], [-1.4, 1.1, 0.5]);
    else dolly(cam, t, k94, k95, [1.0, 1.8, 7.5], [3.6, 1.7, 6.8], [1.2, 1.0, 2.6], [3.6, 1.0, 2.6]);
  }
  function captions(t, cap) {
    cap.draw('The Liberator', t, T.K('William Lloyd Garrison') + 1.2, T.K('William Lloyd Garrison') + 3.5, CAP);
    cap.draw('American Anti-Slavery Society, 1833', t, T.K('In eighteen thirty-three he') + 0.8, T.K('Black abolitionists'), CAP);
  }
  return { group: g, update, captions, background: 0x6a7a8c };
}

export function buildLecternHall(T) {
  const g = new THREE.Group(); g.name = 'scene_lectern';
  lights(g, [3, 7, 8], { sun: 1.5, fill: 0.7, skyColor: 0xc8c0a8, groundColor: 0x202020, shadowSize: 10 });
  g.add(ground(40, 40, 0x5a4a3c)); g.add(backdrop(40, 10, 0x7a6a56, -5, 5));
  for (let i = 0; i < 4; i++) { const bench = box(6, 0.4, 0.5, PAL.woodDark, 0.03); bench.position.set(0, 0.45, 2.5 + i * 1.1); g.add(bench); }
  const lectern = new THREE.Group(); const lb = box(0.9, 1.2, 0.6, PAL.woodDark, 0.04); lb.position.y = 0.6; lectern.add(lb); const lt = box(1.0, 0.08, 0.7, PAL.wood, 0.02); lt.position.y = 1.22; lt.rotation.x = 0.25; lectern.add(lt); lectern.position.set(0, 0, 0); g.add(lectern);
  const stage = box(10, 0.3, 4, 0x6a5a4a, 0.03); stage.position.set(0, -0.15, -0.5); g.add(stage);
  const douglass = person('douglass', { id: 'main' }); g.add(douglass.root);
  const narr = book(0.5, 0.08, 0.36, 0x2a3a5a); narr.position.set(0, 1.5, 0.1); narr.scale.setScalar(0.001); g.add(narr); const nl = sign('Narrative, 1845', { size: 0.26 }); nl.position.set(0, 2.1, 0.2); nl.visible = false; g.add(nl);
  const garrison = person('garrison', { id: 'burn' }); place(garrison, 3.6, 0.4, -0.4); garrison.root.visible = false; g.add(garrison.root);
  const page = new THREE.Group(); const pg = box(0.4, 0.5, 0.02, PAL.parch, 0.01); page.add(pg); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 6), glowMat(0xff8020, { intensity: 2.2 })); fl.position.y = 0.3; page.add(fl); page.position.set(0, -0.34, 0.08); garrison.arms.R.elbow.add(page); page.fl = fl;
  const fireL = new THREE.PointLight(0xff9040, 0, 5); fireL.position.set(3.6, 1.6, 0.6); g.add(fireL);
  const boxes = ['1840 Liberty', '1848 Free Soil', '1850s Republican'].map((s, i) => { const b = new THREE.Group(); const bb = box(0.7, 0.5, 0.5, PAL.woodDark, 0.03); bb.position.y = 0.25; b.add(bb); const slot = box(0.4, 0.03, 0.08, 0x111111, 0.005); slot.position.y = 0.51; b.add(slot); const l = sign(s, { size: 0.22 }); l.position.y = 0.9; b.add(l); b.position.set(-1.6 + i * 1.6, 0, 1.6); b.visible = false; g.add(b); return b; });
  function update(t, cam) {
    const k95 = T.K('And then there was Frederick'), k96 = T.K('Garrison burned'), k97 = T.K('Douglass took a different'), k101 = T.K('Before eighteen thirty');
    const walk = easeInOut(span(t, T.K('Douglass escaped') , T.K('In eighteen forty-one he') + 1.0));
    douglass.root.position.set(lerp(-5.5, 0, walk), 0, lerp(1.5, -0.7, walk)); douglass.root.rotation.y = walk < 0.98 ? Math.PI / 2 - 0.3 : 0; if (walk < 0.98) douglass.walk(t, 1.0); else douglass.pose({ armR: -1.1 + 0.15 * Math.sin(t * 2), elbowR: -0.6, armL: -0.5, elbowL: -0.5, headPitch: -0.05 });
    const nb = easeOut(span(t, T.K('He lectured despite') + 2.5, T.K('He lectured despite') + 3.3)); narr.scale.setScalar(Math.max(0.001, nb)); narr.rotation.y = t * 0.8; nl.visible = nb > 0.8;
    const burn = t >= k96 - 0.3 && t < k97 + 0.5; garrison.root.visible = burn; garrison.pose({ armR: -1.4, elbowR: -0.3, headPitch: -0.2 }); fireL.intensity = burn ? 1.5 + 0.5 * Math.sin(t * 13) : 0; page.fl.scale.setScalar(1 + 0.3 * Math.sin(t * 17));
    boxes.forEach((b, i) => { const a = T.K('He backed the Liberty') + i * 1.3; const u = easeOut(span(t, a, a + 0.6)); b.visible = u > 0.01; b.position.z = 1.6 + (1 - u) * 3; });
    if (t < k96) dolly(cam, t, k95, k96, [-3.0, 1.6, 6.5], [0.2, 1.6, 5.2], [-3.0, 1.0, 0.5], [0, 1.0, -0.3]);
    else if (t < k97) dolly(cam, t, k96, k97, [0.2, 1.6, 5.2], [2.2, 1.6, 4.4], [0, 1.0, -0.3], [3.4, 1.1, -0.2]);
    else dolly(cam, t, k97, k101, [2.2, 1.6, 4.4], [0, 2.0, 5.5], [3.4, 1.1, -0.2], [0, 0.6, 1.2]);
  }
  function captions(t, cap) {
    cap.draw('Frederick Douglass', t, T.K('And then there was Frederick') + 0.8, T.K('Douglass escaped'), CAP);
    cap.draw('escaped 1838', t, T.K('Douglass escaped') + 0.8, T.K('In eighteen forty-one he'), CAP);
    cap.draw('Garrison, July 4, 1854', t, T.K('Garrison burned') + 1.0, T.K('Douglass took a different'), CAP);
    cap.draw('"Knowledge makes a man unfit to be a slave."', t, T.K('Knowledge, Douglass said') + 0.3, T.K('Before eighteen thirty'), { y: 940, size: 46 });
  }
  return { group: g, update, captions, background: 0x3c3128 };
}

export function buildTownSquare(T) {
  const g = new THREE.Group(); g.name = 'scene_townSquare';
  const sun = lights(g, [5, 8, 8], { sun: 1.9, fill: 0.9, shadowSize: 12 });
  g.add(ground(40, 40, PAL.south));
  for (let i = 0; i < 4; i++) { const f = box(3.4, 3.0, 2.0, [PAL.parch, PAL.brick, 0xc9b894, PAL.parch][i], 0.04); f.position.set(-5.5 + i * 3.7, 1.5, -4); g.add(f); const r = box(3.6, 0.3, 2.2, PAL.woodDark, 0.03); r.position.set(-5.5 + i * 3.7, 3.1, -4); g.add(r); }
  const table = box(1.4, 0.08, 0.8, PAL.woodDark, 0.02); table.position.set(0, 0.9, 0); g.add(table); for (const s of [-1, 1]) { const l = box(0.08, 0.9, 0.7, PAL.woodDark, 0.02); l.position.set(s * 0.6, 0.45, 0); g.add(l); }
  const A = person('planter', { id: 'dA' }), B = person('farmer', { id: 'dB' }); place(A, -0.9, 0, Math.PI / 2 + 0.2); place(B, 0.9, 0, -Math.PI / 2 - 0.2); g.add(A.root, B.root);
  const bookG = new THREE.Group(); const spine = box(0.06, 0.08, 0.5, 0x4a2a1e, 0.01); bookG.add(spine); const pages = [-1, 1].map((s) => { const pv = new THREE.Group(); const p = box(0.42, 0.04, 0.48, PAL.parch, 0.005); p.position.x = s * 0.21; pv.add(p); const c = box(0.44, 0.02, 0.5, 0x4a2a1e, 0.005); c.position.set(s * 0.21, -0.03, 0); pv.add(c); bookG.add(pv); return pv; }); const dl = sign('DEBATE', { size: 0.16, bg: null, color: '#2a1a10' }); dl.position.set(0, 0.06, 0); dl.rotation.x = -Math.PI / 2; bookG.add(dl); bookG.position.set(0, 0.98, 0); g.add(bookG);
  const night = new THREE.HemisphereLight(0x303a60, 0x101018, 0.6); night.visible = false; g.add(night);
  // S10.5 preacher on a crate; crowd
  const crate = box(0.9, 0.6, 0.9, PAL.wood, 0.04); crate.position.set(-3.5, 0.3, 1.5); g.add(crate);
  const preacher = person('preacher', { id: 'sq' }); place(preacher, -3.5, 1.5, 0.3, 0.6); g.add(preacher.root);
  const bible = book(0.4, 0.08, 0.3, 0x1a1a1a); bible.position.set(0, -0.34, 0.08); bible.rotation.x = -0.3; preacher.arms.R.elbow.add(bible);
  const crowd = [0, 1, 2, 3, 4].map((i) => { const p = person(i % 2 ? 'farmer' : 'planter', { id: 'sqc' + i }); place(p, -6.6 + Math.floor(i / 3) * 0.9, 1.0 + (i % 3) * 1.0 + Math.floor(i / 3) * 0.5, Math.PI / 2 + 0.2); g.add(p.root); return p; });
  // S10.6 portrait backdrop and the gaunt mill worker
  const portrait = new THREE.Group(); const frame = box(5.2, 3.6, 0.2, PAL.gold, 0.05); portrait.add(frame); const canvas = box(4.8, 3.2, 0.1, 0xb9a98a, 0.02); canvas.position.z = 0.1; portrait.add(canvas);
  const posed = [['planter', -1.2, 1.0], ['woman', 0.1, 0.9], ['enslaved', 1.2, 0.9], ['child', -0.5, 0.6]].map(([k, x, sc], i) => { const p = person(k, { id: 'port' + i, scale: sc * 0.95 }); place(p, x, 0.3, 0, -1.6); portrait.add(p.root); return p; });
  const pl = sign('"a family"', { size: 0.3, bg: 'rgba(40,30,20,0.85)' }); pl.position.set(0, -2.0, 0.3); portrait.add(pl); portrait.position.set(2.5, 8.5, 2.5); g.add(portrait);
  const worker = person('northerner', { id: 'gaunt' }); place(worker, 6.6, 0, 2.2, -0.4); worker.root.scale.set(0.7, 1.0, 0.7); worker.root.visible = false; g.add(worker.root);
  const wl = sign('"wage slave"', { size: 0.26, bg: 'rgba(40,40,60,0.85)' }); wl.position.set(6.6, 2.3, 2.2); wl.visible = false; g.add(wl);
  function update(t, cam) {
    const k101 = T.K('Before eighteen thirty'), k102 = T.K('After eighteen thirty'), k103 = T.K('Nat Turner, first of all');
    const k105 = T.K('And southern preachers'), k106 = T.K('Slavery was a positive good'), k107 = T.K('Slave states tightened');
    const beat = t < k103 ? 'debate' : t < k106 ? 'preach' : 'portrait';
    const dark = beat === 'debate' && t >= k102; night.visible = dark; sun.intensity = dark ? 0.3 : 1.9;
    const dbg = beat === 'debate'; A.root.visible = B.root.visible = table.visible = bookG.visible = dbg;
    if (dbg) { A.pose({ armR: -1.0 + 0.3 * Math.sin(t * 3), elbowR: -0.8, armL: -0.4, headYaw: 0.2 }); B.pose({ armR: -0.9 + 0.3 * Math.sin(t * 3 + 1.5), elbowR: -0.7, armL: -0.4, headYaw: -0.2 }); A.hips.position.y = B.hips.position.y = 0.93;
      const shut = easeInOut(span(t, k102 + 1.0, k102 + 1.5)); pages[0].rotation.z = -shut * Math.PI * 0.98; pages[1].rotation.z = 0; dl.visible = shut < 0.5; if (t > k102) { A.pose({ armL: 0.1, armR: 0.1, headPitch: 0.2 }); B.pose({ armL: 0.1, armR: 0.1, headPitch: 0.2 }); } }
    const pr = beat === 'preach' || beat === 'portrait'; preacher.root.visible = crate.visible = pr; crowd.forEach((c) => { c.root.visible = pr; });
    if (pr) { preacher.pose({ armR: -1.6 + 0.1 * Math.sin(t * 2), elbowR: -0.3, armL: -0.8, elbowL: -0.5, headPitch: -0.25 }); preacher.hips.position.y = 0.93; crowd.forEach((c, i) => { c.pose({ headPitch: -0.2 + 0.15 * Math.sin(t * 2.4 + i), armL: 0.1, armR: 0.1 }); c.hips.position.y = 0.93; }); }
    const pt = beat === 'portrait'; const down = pt ? easeInOut(span(t, k106 + 0.4, k106 + 2.0)) : 0; portrait.position.y = 8.5 - 6.3 * down; portrait.visible = pt; posed.forEach((p, i) => { p.pose({ armL: 0.1, armR: 0.1, headPitch: 0.05 }); p.hips.position.y = 0.93; });
    const wk = pt && t >= T.K('Enslaved people, they said'); worker.root.visible = wk; wl.visible = wk; worker.pose({ armL: 0.2, armR: 0.2, headPitch: 0.45, torsoPitch: 0.2 }); worker.hips.position.y = 0.93;
    if (beat === 'debate') dolly(cam, t, k101, k103, [0.2, 1.7, 5.5], [0.2, 1.6, 4.8], [0, 1.0, 0], [0, 0.95, 0]);
    else if (beat === 'preach') dolly(cam, t, k105, k106, [-1.2, 1.4, 7.5], [-1.6, 1.5, 6.5], [-4.2, 1.5, 1.8], [-4.2, 1.5, 1.8]);
    else dolly(cam, t, k106, k107, [-1.0, 1.6, 8.0], [1.5, 2.4, 13], [-1.0, 1.6, 2.0], [1.5, 1.8, 2.0]);
  }
  function captions(t, cap) {
    cap.draw('before 1830: "a necessary evil"', t, T.K('Before eighteen thirty') + 1.2, T.K('After eighteen thirty'), CAP);
    cap.draw('after 1830', t, T.K('After eighteen thirty') + 0.3, T.K('Nat Turner, first of all'), CAP);
    cap.draw('"a positive good"', t, T.K('Slavery was a positive good') + 0.3, T.K('The master-slave relationship'), CAP);
  }
  return { group: g, update, captions, background: PAL.skyS };
}

export function buildCongress(T) {
  const g = new THREE.Group(); g.name = 'scene_congress';
  lights(g, [3, 8, 8], { sun: 1.8, fill: 1.2, skyColor: 0xd0c8b8, groundColor: 0x202020, shadowSize: 10 });
  g.add(ground(40, 40, 0x6a5a4a)); g.add(backdrop(40, 10, 0x8a7a66, -6, 5));
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const d = box(3.4, 0.9, 0.7, PAL.woodDark, 0.03); d.position.set(s * 3.2, 0.45 + i * 0.4, 2.2 - i * 1.4); g.add(d); }
  const dais = box(5, 0.6, 2.2, PAL.woodDark, 0.04); dais.position.set(0, 0.3, -2); g.add(dais);
  const desk = box(2.6, 1.0, 0.9, 0x4a3a2c, 0.04); desk.position.set(0, 1.1, -2); g.add(desk);
  const drawer = box(0.8, 0.3, 0.1, 0x3a2a1c, 0.02); drawer.position.set(0.6, 1.0, -1.5); g.add(drawer);
  const clerk = person('clerk', { id: 'cong' }); place(clerk, 0, -2.4, 0, 0.6); g.add(clerk.root);
  const petition = box(0.5, 0.02, 0.65, PAL.parch, 0.005); petition.position.set(-3.0, 1.62, -1.6); g.add(petition);
  const pl = sign('petition', { size: 0.2, bg: null, color: '#2a1a10' }); pl.position.set(0, 0.03, 0); pl.rotation.x = -Math.PI / 2; petition.add(pl);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 7), mat(0x8a7a5a)); bag.scale.set(1, 0.9, 0.8); bag.position.set(3.2, 0.45, 1.2); bag.castShadow = true; g.add(bag);
  const bagL = sign('U.S. MAIL', { size: 0.2, bg: null, color: '#1a1a1a' }); bagL.position.set(3.2, 0.5, 1.65); g.add(bagL);
  const pams = []; const r = rng(31); for (let i = 0; i < 6; i++) { const p = box(0.3, 0.02, 0.4, PAL.parch, 0.005); p.position.set(3.2 + (r() - 0.5) * 0.8, 0.95 + i * 0.03, 1.2 + (r() - 0.5) * 0.6); p.rotation.y = r() * 1; p.visible = false; g.add(p); pams.push(p); }
  const flames = []; for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.14 + r() * 0.1, 7, 6), glowMat(0xff7020, { intensity: 2.2 })); f.position.set(3.2 + (r() - 0.5) * 0.8, 1.1, 1.2 + (r() - 0.5) * 0.6); f.visible = false; g.add(f); flames.push(f); }
  const fireL = new THREE.PointLight(0xff8040, 0, 6); fireL.position.set(3.2, 1.8, 1.4); g.add(fireL);
  const gagSign = sign('TABLED', { size: 0.34, bg: 'rgba(120,20,20,0.9)' }); gagSign.position.set(0.6, 2.4, -1.4); gagSign.visible = false; g.add(gagSign);
  function update(t, cam) {
    const k108 = T.K('In Congress, southerners'), k109 = T.K('And the North?');
    const slide = easeInOut(span(t, k108 + 0.5, k108 + 2.0)); const drop = easeInOut(span(t, k108 + 2.2, k108 + 3.0));
    petition.position.set(lerp(-3.0, 0.6, slide), 1.62 - 0.6 * drop, lerp(-1.6, -1.5, slide)); petition.visible = drop < 0.98; drawer.position.z = -1.5 + 0.35 * easeInOut(span(t, k108 + 1.8, k108 + 2.3)) - 0.35 * easeInOut(span(t, k108 + 3.0, k108 + 3.5)); gagSign.visible = t > k108 + 3.2;
    clerk.pose({ armR: -0.9 + 0.3 * slide, elbowR: -0.8, armL: -0.6, elbowL: -0.6, headPitch: 0.3 }); clerk.hips.position.y = 0.93;
    const m = T.K('In eighteen thirty-five southern'); const open = easeOut(span(t, m + 0.3, m + 1.2)); pams.forEach((p, i) => { p.visible = open > 0.1; p.position.y = 0.95 + i * 0.03 + open * 0.3; });
    const burn = easeOut(span(t, m + 1.5, m + 2.5)); flames.forEach((f, i) => { f.visible = burn > 0.05; f.scale.setScalar(Math.max(0.001, burn * (1 + 0.3 * Math.sin(t * 15 + i)))); }); fireL.intensity = burn * 2.5;
    pams.forEach((p) => { p.scale.setScalar(Math.max(0.001, 1 - burn * 0.9)); });
    if (t < m) dolly(cam, t, k108, m, [-0.5, 2.2, 3.5], [0.3, 2.0, 2.5], [-0.5, 1.4, -1.5], [0.5, 1.3, -1.6]);
    else dolly(cam, t, m, k109, [2.0, 1.6, 4.5], [3.0, 1.4, 3.6], [3.2, 0.9, 1.2], [3.2, 0.9, 1.2]);
  }
  function captions(t, cap) {
    cap.draw('the gag rule', t, T.K('In Congress, southerners') + 2.0, T.K('In eighteen thirty-five southern'), CAP);
    cap.draw('1835: abolitionist mail destroyed', t, T.K('In eighteen thirty-five southern') + 1.0, T.K('And the North?'), CAP);
  }
  return { group: g, update, captions, background: 0x4a3c30 };
}
