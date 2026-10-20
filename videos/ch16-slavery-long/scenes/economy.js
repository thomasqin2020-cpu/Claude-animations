// Economy family: Jefferson's study, emancipation map, the ledger, the throne room, the globe,
// the two platforms (South and North), the cotton maps, the harbor.
import * as THREE from 'three';
import { PAL, CAP, CAP2, lights, ground, backdrop, person, place, sign, tree, cottonRow, coinPile, book, chainLink, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed, orbit } from '/src/camera.js';
import { createArrow } from '/src/props/arrow.js';

// ---------------------------------------------------------------- Jefferson's study (S1.1, S1.5)
export function buildJeffersonStudy(T) {
  const g = new THREE.Group(); g.name = 'scene_jefferson';
  lights(g, [3, 5, 6], { sun: 1.4, sunColor: 0xffd9a8, fill: 0.55, skyColor: 0x8a7a66, groundColor: 0x2a1a10, shadowSize: 6 });
  g.add(ground(20, 20, 0x4a3324));
  const wall = box(12, 5, 0.3, 0x5a3f2c, 0.05); wall.position.set(0, 2.5, -2.5); g.add(wall);
  for (let i = 0; i < 5; i++) { const sh = box(1.8, 0.06, 0.3, PAL.woodDark, 0.01); sh.position.set(-3 + (i % 2) * 6, 1.2 + Math.floor(i / 2) * 0.7, -2.3); g.add(sh);
    for (let j = 0; j < 7; j++) { const b = box(0.18, 0.4 + (j % 3) * 0.06, 0.26, [0x6a2a2a, 0x2a4a6a, 0x4a5a2a, 0x8a6a2a][(i + j) % 4], 0.02); b.position.set(-3.75 + (i % 2) * 6 + j * 0.25, 1.45 + Math.floor(i / 2) * 0.7, -2.3); g.add(b); } }
  const desk = box(1.6, 0.08, 0.9, PAL.woodDark, 0.02); desk.position.set(0, 1.08, 0); g.add(desk);
  for (const s of [-1, 1]) { const l = box(0.1, 1.05, 0.8, PAL.woodDark, 0.02); l.position.set(s * 0.7, 0.53, 0); g.add(l); }
  const paper = box(0.5, 0.01, 0.65, PAL.parch, 0.003); paper.position.set(-0.2, 1.13, 0.1); g.add(paper);
  const candle = box(0.06, 0.3, 0.06, 0xf4ecd8, 0.01); candle.position.set(0.55, 1.27, -0.2); g.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), glowMat(0xffc040, { intensity: 2.0 })); flame.position.set(0.55, 1.46, -0.2); g.add(flame);
  const cl = new THREE.PointLight(0xffb060, 1.2, 4); cl.position.set(0.55, 1.6, 0.1); g.add(cl);
  const jeff = person('jefferson'); place(jeff, 0, -0.75, 0); g.add(jeff.root);
  const quill = box(0.02, 0.4, 0.02, 0xeeeeee, 0.005); quill.position.set(0.02, -0.3, 0.05); quill.rotation.x = -0.5; jeff.arms.R.elbow.add(quill);
  const chain = chainLink(9); chain.position.set(-0.05, 1.16, 0.32); g.add(chain);
  const links = chain.children;

  function update(t, cam) {
    const s11 = T.K('In the seventeen eighties'), s12 = T.K('The North was already');
    const s15 = T.K('The prediction had been'), s21 = T.K('By the eighteen forties');
    const first = t < s12;
    jeff.pose({ armR: -1.0 + 0.04 * Math.sin(t * 3), elbowR: -0.9, armL: -0.7, elbowL: -0.8, headPitch: 0.35, torsoPitch: 0.08 }); jeff.hips.position.y = 0.93;
    // chain loosens link by link in S1.1, snaps tight in S1.5
    const loose = first ? easeInOut(span(t, s11 + 1.0, s12 - 0.5)) : 1 - easeOut(span(t, T.K('Instead, the gin') + 0.2, T.K('Instead, the gin') + 0.6));
    links.forEach((l, i) => { l.position.x = i * (0.1 + 0.07 * loose * easeInOut(span(loose, i / links.length * 0.6, i / links.length * 0.6 + 0.4))); l.position.y = (i % 2) * 0.03 * loose; });
    const snap = !first && t > T.K('Instead, the gin') + 0.6 ? Math.sin((t - T.K('Instead, the gin')) * 40) * Math.exp(-(t - T.K('Instead, the gin') - 0.6) * 6) * 0.02 : 0;
    chain.position.z = 0.32 + snap;
    flame.scale.setScalar(1 + 0.15 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23));
    if (first) dolly(cam, t, s11, s12, [1.4, 1.9, 3.6], [1.1, 1.8, 3.2], [-0.1, 1.2, 0], [-0.1, 1.15, 0]);
    else dolly(cam, t, s15, s21, [1.4, 1.9, 3.6], [1.2, 1.7, 2.8], [-0.1, 1.2, 0], [-0.05, 1.15, 0.2]);
  }
  function captions(t, cap) {
    cap.draw('1780s', t, T.K('In the seventeen eighties') + 0.3, T.K('Revolutionary idealism'), CAP);
    cap.draw('Jefferson', t, T.K('Revolutionary idealism') + 1.5, T.K('Others made'), CAP);
  }
  return { group: g, update, captions, background: 0x2a1b12 };
}

// ---------------------------------------------------------------- emancipation map (S1.2)
export function buildEmancipationMap(T) {
  const g = new THREE.Group(); g.name = 'scene_emancipationMap';
  lights(g, [2, 10, 4], { sun: 1.8, fill: 0.9, shadowSize: 10 });
  g.add(ground(40, 40, 0x9ab0c0));
  const paper = box(16, 0.1, 10, PAL.parch, 0.05); paper.position.y = 0.05; g.add(paper);
  const states = [
    ['NY', 1799, -0.6, -0.9, 2.4, 2.0], ['VT', 1777, 1.4, -1.9, 0.7, 1.2], ['MA', 1780, 2.4, -0.9, 1.5, 0.7],
    ['PA', 1780, -0.9, 1.0, 2.6, 1.3], ['NJ', 1804, 1.0, 0.9, 0.6, 1.2], ['Old Northwest', 1787, -5.3, 0.3, 4.6, 3.2]
  ].map(([n, y, x, z, w, d]) => { const m = glowMat(0xd8c8a0); const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), m); b.castShadow = true; b.position.set(x, 0.2, z); g.add(b);
    const s = sign(n + ' ' + y, { size: 0.34, bg: 'rgba(20,30,20,0.8)' }); s.position.set(x, 0.75, z); s.visible = false; g.add(s); return { b, m, s, y }; });
  // Atlantic and the southern states left blank parchment
  const sea = box(5, 0.08, 10, 0x7f9fb7, 0.02); sea.position.set(5.6, 0.08, 1.5); g.add(sea);
  const green = new THREE.Color(0x5f9a5a), base = new THREE.Color(0xd8c8a0);
  function update(t, cam) {
    const a = T.K('Vermont banned'), b = T.KE('Vermont banned'), onw = T.K('The Northwest Ordinance');
    const at = { VT: a + 0.1, MA: lerp(a, b, 0.3), PA: lerp(a, b, 0.5), NY: lerp(a, b, 0.65), NJ: lerp(a, b, 0.8), 'Old Northwest': onw + 0.4 };
    states.forEach((st) => { const key = Object.keys(at).find((k) => st.s.name.includes(k)); const u = easeOut(span(t, at[key], at[key] + 0.5)); st.m.color.lerpColors(base, green, u); st.m.emissive.copy(green); st.m.emissiveIntensity = 0.25 * u; st.b.scale.y = 1 + u * 1.5; st.b.position.y = 0.2 * st.b.scale.y; st.s.visible = u > 0.5; });
    dolly(cam, t, T.K('The North was already'), T.K('Then, in seventeen ninety-three'), [0.5, 7.5, 5.5], [0.2, 6.2, 4.0], [-0.8, 0, 0], [-1.0, 0, -0.2]);
  }
  function captions(t, cap) { cap.draw('North: emancipation by 1804', t, T.K('The North was already') + 0.3, T.K('Vermont banned') + 1.5, CAP); }
  return { group: g, update, captions, background: 0x8ea4b6 };
}

// ---------------------------------------------------------------- the ledger (S1.4, S2.2, S3.6, S5.2, S10.7)
export function buildLedger(T) {
  const g = new THREE.Group(); g.name = 'scene_ledger';
  lights(g, [2, 9, 5], { sun: 1.9, fill: 0.9, shadowSize: 8 });
  g.add(ground(30, 30, 0x3a2a1c));
  const pages = [-1, 1].map((s) => { const p = box(3.2, 0.12, 4.4, PAL.parch, 0.03); p.position.set(s * 1.62, 0.1, 0); p.rotation.z = -s * 0.03; g.add(p); return p; });
  const spine = box(0.2, 0.2, 4.5, 0x4a2418, 0.03); spine.position.set(0, 0.08, 0); g.add(spine);
  for (let i = 0; i < 12; i++) { const ln = box(2.6, 0.005, 0.015, 0xc9b894, 0.001); ln.position.set(-1.62, 0.165, -1.9 + i * 0.35); g.add(ln); const r2 = ln.clone(); r2.position.x = 1.62; g.add(r2); }
  const uses = {};
  const use = (name) => { const u = new THREE.Group(); u.visible = false; g.add(u); uses[name] = u; return u; };
  // S1.4 bars: cotton tons and enslaved people
  const U1 = use('numbers'); const bar = (x, z, color, w = 0.5) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, 0.5), mat(color)); b.castShadow = true; b.position.set(x, 0.17, z); U1.add(b); return b; };
  const bC1 = bar(-2.4, -0.6, PAL.cotton), bC2 = bar(-1.0, -0.6, PAL.cotton, 0.9), bP1 = bar(0.9, -0.6, PAL.red), bP2 = bar(2.3, -0.6, PAL.red, 0.9);
  const lab = (txt, x, z, parent, size = 0.26) => { const s = sign(txt, { size, bg: null, color: '#2a1a10' }); s.position.set(x, 0.25, z); parent.add(s); return s; };
  lab('1790', -2.4, 0.4, U1); lab('1860', -1.0, 0.4, U1); lab('1790', 0.9, 0.4, U1); lab('1860', 2.3, 0.4, U1);
  const lC1 = lab('1,000 tons', -2.4, -1.5, U1), lC2 = lab('1,000,000 tons', -1.0, -1.5, U1), lP1 = lab('500,000', 0.9, -1.5, U1), lP2 = lab('4,000,000', 2.3, -1.5, U1);
  lab('cotton', -1.7, 1.0, U1, 0.3); lab('enslaved people', 1.6, 1.0, U1, 0.3);
  // S2.2 pies
  const U2 = use('pies'); const pies = [[1800, 0.071], [1820, 0.32], [1840, 0.516], [1860, 0.575]].map(([y, f], i) => {
    const x = -2.4 + i * 1.6; const grey = new THREE.Mesh(new THREE.CircleGeometry(0.6, 40), mat(0xb9ad94)); grey.rotation.x = -Math.PI / 2; grey.position.set(x, 0.18, -0.2); U2.add(grey);
    const wedge = new THREE.Mesh(new THREE.CircleGeometry(0.6, 40, Math.PI / 2, 0.001), glowMat(PAL.red, { intensity: 0.1 })); wedge.rotation.x = -Math.PI / 2; wedge.position.set(x, 0.19, -0.2); U2.add(wedge);
    const half = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.01, 0.03), glowMat(0xfff0a0, { intensity: 0 })); half.position.set(x, 0.2, -0.2); U2.add(half);
    lab(String(y), x, 0.7, U2); const pct = lab((f * 100).toFixed(1) + '%', x, -1.1, U2); return { x, f, wedge, half, pct }; });
  lab('cotton share of US exports', 0, -1.8, U2, 0.3);
  // S3.6 two billion
  const U3 = use('billion'); const bSl = bar(-0.9, -0.3, PAL.red, 1.2); U3.add(bSl); const bLd = bar(0.9, -0.3, 0x7a8a4a, 1.2); U3.add(bLd);
  const two = lab('$2,000,000,000', -0.9, 1.1, U3, 0.34); lab('in enslaved people', -0.9, 0.7, U3, 0.24); lab('all the land', 0.9, 0.7, U3, 0.24);
  // S5.2 price line
  const U4 = use('price'); const pts = 14; const seg = []; for (let i = 0; i < pts; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.06), mat(PAL.red)); s.visible = false; U4.add(s); seg.push(s); }
  const slider = person('planter', { id: 'ledger', scale: 0.45 }); U4.add(slider.root); lab('cotton price', 0, -1.8, U4, 0.3);
  const axis = box(5.2, 0.02, 0.03, 0x6a5a3a, 0.005); axis.position.set(0, 0.17, 1.2); U4.add(axis);
  // S10.7 law book with locks
  const U5 = use('law'); const law = book(2.2, 0.5, 3.0, 0x2a1a12); law.position.set(0, 0.42, 0); U5.add(law);
  const locks = []; for (let i = 0; i < 5; i++) { const l = new THREE.Group(); const body = box(0.26, 0.24, 0.12, PAL.gold, 0.03); l.add(body); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 10, Math.PI), mat(0x8a7a5a)); sh.position.y = 0.12; l.add(sh); l.position.set(1.15, 0.5, -1.2 + i * 0.6); l.visible = false; U5.add(l); locks.push(l); }
  lab('slave codes', 0, -1.5, U5, 0.34);

  function update(t, cam) {
    const k14 = T.K('The numbers tell'), k15 = T.K('The prediction had been');
    const k22 = T.K('Look at what cotton'), k23 = T.K('The South grew more');
    const k36 = T.K('By eighteen sixty, planters held'), k41 = T.K('Now the question');
    const k52 = T.K('The economy was built'), k53 = T.K('And the system kept');
    const k107 = T.K('Slave states tightened'), k108 = T.K('In Congress, southerners');
    const which = t < k15 ? 'numbers' : t < k23 ? 'pies' : t < k41 ? 'billion' : t < k53 ? 'price' : 'law';
    for (const [n, u] of Object.entries(uses)) u.visible = n === which;
    const setBar = (b, h) => { b.scale.y = Math.max(0.001, h); b.position.y = 0.17 + h / 2; };
    if (which === 'numbers') {
      const a = T.K('In seventeen ninety, the South'), b = T.K('By eighteen sixty, it was a million'), c = T.K('In the same seventy years');
      setBar(bC1, 0.12 * easeOut(span(t, a + 0.3, a + 1.2))); setBar(bC2, 2.4 * easeOut(span(t, b + 0.3, b + 1.6)));
      setBar(bP1, 0.3 * easeOut(span(t, c + 0.6, c + 1.4))); setBar(bP2, 2.4 * easeOut(span(t, c + 1.6, c + 3.0)));
      lC1.visible = t > a + 0.3; lC2.visible = t > b + 0.3; lP1.visible = t > c + 0.6; lP2.visible = t > c + 1.6;
      dolly(cam, t, k14, k15, [0, 4.4, 5.2], [0, 4.0, 4.6], [0, 0.6, -0.6], [0, 0.7, -0.6]);
    } else if (which === 'pies') {
      const lines = [T.K('In eighteen hundred, cotton'), T.K('By eighteen twenty'), T.K('By eighteen forty'), lerp(T.K('By eighteen forty'), T.KE('By eighteen forty'), 0.55)];
      pies.forEach((p, i) => { const u = easeOut(span(t, lines[i] + 0.3, lines[i] + 1.4)); const f = p.f * u; p.wedge.geometry.dispose(); p.wedge.geometry = new THREE.CircleGeometry(0.6, 40, Math.PI / 2, Math.max(0.001, f * Math.PI * 2)); p.half.material.emissiveIntensity = f > 0.5 ? 1.2 : 0; p.pct.visible = u > 0.9; });
      dolly(cam, t, lines[0], k23, [-2.0, 4.4, 2.4], [1.6, 4.4, 2.4], [-2.0, 0, -0.2], [1.6, 0, -0.2]);
    } else if (which === 'billion') {
      const u = easeOut(span(t, k36 + 0.6, k36 + 2.2)); setBar(bSl, 2.6 * u); setBar(bLd, 1.6 * easeOut(span(t, T.K('That was the single largest') + 0.8, T.K('That was the single largest') + 2.0))); two.visible = false;
      dolly(cam, t, k36, k41, [0, 4.2, 5.4], [0, 3.8, 4.8], [0, 0.8, -0.5]);
    } else if (which === 'price') {
      const u = span(t, T.K('When world cotton prices fell') + 0.2, T.KE('When world cotton prices fell'));
      const y = (i) => 1.0 - 0.4 * Math.pow(i / (pts - 1), 1.5) * 2.2;
      seg.forEach((s, i) => { const show = i / pts < 0.35 + 0.65 * u; s.visible = show; const z = 0.8 - y(i) * 1.6; s.position.set(-2.4 + i * 0.4, 0.2, z); s.rotation.y = -Math.atan2((y(i + 1 < pts ? i + 1 : i) - y(i)) * -1.6, 0.4); });
      const k = Math.max(0, Math.min(pts - 1, Math.floor((0.35 + 0.65 * u) * pts) - 1)); slider.root.position.set(-2.4 + k * 0.4, 0.2, 0.8 - y(k) * 1.6); slider.pose({ armL: -0.8, armR: -0.8, headPitch: 0.3, torsoPitch: 0.3 }); slider.hips.position.y = 0.93;
      dolly(cam, t, k52, k53, [0, 5.4, 2.6], [0, 4.6, 2.2], [0, 0, -0.1]);
    } else {
      locks.forEach((l, i) => { const a = k107 + 0.6 + i * 0.5; l.visible = t > a; const u = easeOut(span(t, a, a + 0.25)); l.scale.setScalar(0.6 + 0.4 * u); });
      dolly(cam, t, k107, k108, [0.6, 4.2, 2.6], [0.4, 3.8, 2.2], [0, 0.3, 0]);
    }
  }
  function captions(t, cap) {
    cap.draw('500,000 to 4,000,000 enslaved', t, T.K('In the same seventy years') + 1.8, T.K('The prediction had been'), CAP);
    cap.draw('$2,000,000,000 in people, 1860', t, T.K('By eighteen sixty, planters held') + 1.0, T.K('Now the question'), CAP);
    cap.draw('one crop', t, T.K('The economy was built') + 0.3, T.K('Planters overspeculated'), CAP);
  }
  return { group: g, update, captions, background: 0x2b2016 };
}

// ---------------------------------------------------------------- throne room (S2.1, S5.1)
export function buildThroneRoom(T) {
  const g = new THREE.Group(); g.name = 'scene_throne';
  lights(g, [3, 7, 7], { sun: 2.0, fill: 0.7, skyColor: 0xe8d8b8, groundColor: 0x2a1a10, shadowSize: 8 });
  g.add(ground(30, 30, 0x6a4a34));
  g.add(backdrop(30, 10, 0x8a2a2a, -6, 5));
  const dais = box(4, 0.5, 3, 0x9a8a6a, 0.05); dais.position.y = 0.25; g.add(dais);
  const seat = box(1.6, 0.5, 1.2, PAL.gold, 0.05); seat.position.set(0, 0.75, -0.3); g.add(seat);
  const back = box(1.6, 2.4, 0.3, PAL.gold, 0.05); back.position.set(0, 1.9, -0.9); g.add(back);
  for (const s of [-1, 1]) { const arm = box(0.25, 0.6, 1.1, PAL.gold, 0.04); arm.position.set(s * 0.75, 1.2, -0.3); g.add(arm); }
  const boll = new THREE.Group(); boll.position.set(0, 1.3, -0.2); const r = rng(4);
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.26 + r() * 0.1, 8, 7), mat(PAL.cotton)); s.castShadow = true; s.position.set((r() - 0.5) * 0.5, (r() - 0.3) * 0.4, (r() - 0.5) * 0.4); boll.add(s); }
  for (let i = 0; i < 4; i++) { const leaf = box(0.3, 0.05, 0.18, 0x4b6b3a, 0.02); leaf.position.set(Math.cos(i * 1.6) * 0.35, -0.3, Math.sin(i * 1.6) * 0.35); leaf.rotation.y = -i * 1.6; boll.add(leaf); }
  g.add(boll);
  const crown = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 16), mat(PAL.gold, { roughness: 0.4, emissive: PAL.gold, emissiveIntensity: 0.1 })); ring.rotation.x = Math.PI / 2; crown.add(ring);
  for (let i = 0; i < 6; i++) { const sp = box(0.1, 0.3, 0.1, PAL.gold, 0.02); sp.position.set(Math.cos(i * Math.PI / 3) * 0.34, 0.15, Math.sin(i * Math.PI / 3) * 0.34); crown.add(sp); }
  g.add(crown);
  const crack = new THREE.Group(); const cm = mat(0x1a0f0a);
  for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.08), cm); c.position.set(-1.2 + i * 0.4, 0.51, 1.0 + (i % 2) * 0.3 - 0.15); c.rotation.y = (i % 2 ? 1 : -1) * 0.6; c.visible = false; crack.add(c); }
  g.add(crack);
  function update(t, cam) {
    const s21 = T.K('By the eighteen forties'), s22 = T.K('Look at what cotton'), s51 = T.K('The Cotton Kingdom looked'), s52 = T.K('The economy was built');
    const first = t < s51;
    const down = first ? easeOut(span(t, s21 + 0.8, s21 + 2.4)) : 1;
    crown.position.set(0, 1.75 + (1 - down) * 1.6, -0.2); crown.rotation.y = t * 0.4;
    boll.rotation.y = t * 0.25;
    const cr = first ? 0 : easeOut(span(t, s51 + 1.0, s52)); crack.children.forEach((c, i) => { c.visible = i / 7 < cr; });
    if (first) dolly(cam, t, s21, s22, [0.8, 0.9, 5.2], [0.4, 1.2, 3.8], [0, 1.6, -0.2], [0, 1.5, -0.2]);
    else dolly(cam, t, s51, s52, [0.4, 1.2, 3.8], [0.2, 0.9, 2.6], [0, 1.4, -0.2], [0, 0.6, 0.9]);
  }
  function captions(t, cap) { cap.draw('Cotton is King', t, T.K('By the eighteen forties') + 1.2, T.K('Look at what cotton'), CAP); }
  return { group: g, update, captions, background: 0x5a1e1e };
}

// ---------------------------------------------------------------- globe (S2.3, S9.2)
const sph = (lat, lon, R) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return new THREE.Vector3(R * Math.cos(la) * Math.sin(lo), R * Math.sin(la), R * Math.cos(la) * Math.cos(lo)); };
export function buildGlobe(T) {
  const g = new THREE.Group(); g.name = 'scene_globe';
  lights(g, [6, 6, 8], { sun: 1.6, fill: 0.9, skyColor: 0xc8d8f0, groundColor: 0x202838, shadowSize: 6 });
  const R = 2.2; const globe = new THREE.Group(); g.add(globe);
  const sea = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), mat(0x3f6a9a, { roughness: 0.7 })); sea.receiveShadow = true; globe.add(sea);
  const land = (lat, lon, w, h, col = 0x8fa86a) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), mat(col)); b.castShadow = true; const p = sph(lat, lon, R + 0.02); b.position.copy(p); b.lookAt(0, 0, 0); b.rotateY(Math.PI); globe.add(b); return b; };
  land(45, -100, 1.6, 1.0); land(30, -88, 0.9, 0.5, 0xb09a6a); land(-10, -60, 0.9, 1.3); land(52, 10, 1.2, 0.7); land(53, -2, 0.3, 0.45, 0x9fb07a); land(8, 20, 1.3, 1.6); land(35, 95, 2.0, 1.1); land(-25, 135, 0.8, 0.6);
  const bale = new THREE.Group(); const bb = box(0.5, 0.35, 0.35, PAL.cotton, 0.06); bale.add(bb); for (const s of [-0.12, 0.12]) { const strap = box(0.52, 0.04, 0.37, PAL.woodDark, 0.01); strap.position.x = s; bale.add(strap); } bale.position.copy(sph(31, -89, R + 0.35)); bale.lookAt(0, 0, 0); globe.add(bale);
  const mkArc = (A, B, n, col) => { const pts = []; for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), mat(col, { emissive: col, emissiveIntensity: 0.6 })); const u = i / (n - 1); const v = sph(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, R + 0.08 + Math.sin(u * Math.PI) * 0.35); p.position.copy(v); p.visible = false; globe.add(p); pts.push(p); } return pts; };
  const toBritain = mkArc([31, -85], [53, -2], 26, PAL.cotton), toLiberia = mkArc([33, -80], [6, -10], 26, 0xf0c070);
  const mills = []; for (let i = 0; i < 3; i++) { const m = new THREE.Group(); const b = box(0.18, 0.28, 0.18, PAL.brick, 0.02); b.position.y = 0.14; m.add(b); const st = box(0.06, 0.4, 0.06, 0x3a3a3a, 0.01); st.position.set(0.05, 0.4, 0); m.add(st); const p = sph(53.5 + (i - 1) * 1.2, -2.5 + (i % 2) * 1.5, R + 0.04); m.position.copy(p); m.lookAt(0, 0, 0); m.rotateX(-Math.PI / 2); m.scale.setScalar(0.001); globe.add(m); mills.push(m); }
  const lib = sign('Liberia 1822', { size: 0.3 }); lib.position.copy(sph(6, -10, R + 0.7)); lib.visible = false; globe.add(lib);
  const ship = new THREE.Group(); const hull = box(0.36, 0.1, 0.14, PAL.woodDark, 0.02); ship.add(hull); const mast = box(0.03, 0.3, 0.03, PAL.woodDark, 0.005); mast.position.y = 0.18; ship.add(mast); const sail = box(0.02, 0.2, 0.16, PAL.cotton, 0.005); sail.position.set(0, 0.2, 0.04); ship.add(sail); ship.visible = false; globe.add(ship);

  function update(t, cam) {
    const s23 = T.K('The South grew more'), s24 = T.K('But the money did not stay');
    const s92 = T.K('The first organized plan'), s93 = T.K('The eighteen thirties brought');
    const first = t < s92;
    if (first) {
      const grow = easeOut(span(t, s23 + 0.3, s23 + 2.0)); bale.scale.setScalar(0.4 + 1.4 * grow); bale.visible = true;
      const line = span(t, T.K("Britain's textile mills"), T.K("Britain's textile mills") + 2.2); toBritain.forEach((p, i) => { p.visible = i / toBritain.length < line; }); toLiberia.forEach((p) => { p.visible = false; });
      mills.forEach((m, i) => { m.scale.setScalar(Math.max(0.001, easeOut(span(t, T.K("Britain's textile mills") + 1.6 + i * 0.3, T.K("Britain's textile mills") + 2.6 + i * 0.3)))); });
      lib.visible = false; ship.visible = false;
      // US South faces the camera at lon -89: rotate the globe so that lon points to +z, then orbit toward Britain
      const u = easeInOut(span(t, T.K("Britain's textile mills"), s24)); globe.rotation.y = (89 - 40 * u) * Math.PI / 180; globe.rotation.x = 0.35 - 0.1 * u;
      dolly(cam, t, s23, s24, [0, 0.6, 7.2], [0.4, 0.9, 5.6], [0, 0.2, 0], [0.2, 0.6, 0]);
    } else {
      bale.visible = false; toBritain.forEach((p) => { p.visible = false; }); mills.forEach((m) => m.scale.setScalar(0.001));
      const line = span(t, T.K('In eighteen seventeen the American') + 0.3, T.K('In eighteen twenty-two it founded') + 1.0); toLiberia.forEach((p, i) => { p.visible = i / toLiberia.length < line; });
      lib.visible = t > T.K('In eighteen twenty-two it founded') + 1.0;
      const sv = span(t, T.K('In eighteen seventeen the American') + 0.3, T.K('Over four decades')); ship.visible = sv > 0 && sv < 1; const k = Math.min(toLiberia.length - 1, Math.floor(sv * toLiberia.length)); ship.position.copy(toLiberia[k].position); ship.lookAt(0, 0, 0); ship.rotateX(Math.PI / 2);
      const u = easeInOut(span(t, s92, T.K('Over four decades'))); globe.rotation.y = (70 - 55 * u) * Math.PI / 180; globe.rotation.x = 0.2;
      const back = easeInOut(span(t, T.K('Most had no wish'), s93)); globe.rotation.y += back * 50 * Math.PI / 180;
      dolly(cam, t, s92, s93, [0.4, 0.9, 6.4], [0.2, 0.8, 6.0], [0.2, 0.3, 0], [0, 0.2, 0]);
    }
  }
  function captions(t, cap) {
    cap.draw("over half the world's cotton", t, T.K('The South grew more') + 0.8, T.K('That gave southern'), CAP);
    cap.draw('Britain', t, T.K("Britain's textile mills") + 0.5, T.K('But the money did not stay'), CAP);
    const a = T.K('Over four decades'), b = T.KE('Over four decades');
    if (t >= a && t < T.K('The eighteen thirties brought')) { const n = Math.round(15000 * easeOut(span(t, a + 0.3, b))); cap.draw(n.toLocaleString('en-US') + ' went   of 4,000,000', t, a, T.K('The eighteen thirties brought'), CAP); }
  }
  return { group: g, update, captions, background: 0x1c2436 };
}

// ---------------------------------------------------------------- two platforms (South left, North right)
export function buildTwoPlatforms(T) {
  const g = new THREE.Group(); g.name = 'scene_platforms';
  lights(g, [4, 9, 9], { sun: 2.0, fill: 0.85, shadowSize: 12 });
  const S = new THREE.Group(), N = new THREE.Group(); g.add(S, N);
  S.add(ground(7, 9, PAL.south)); N.add(ground(7, 9, PAL.north));
  const sideS = box(7, 2.5, 9, PAL.southDark, 0.08); sideS.position.y = -1.26; S.add(sideS);
  const sideN = box(7, 2.5, 9, PAL.northDark, 0.08); sideN.position.y = -1.26; N.add(sideN);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0x2c4a6a, { roughness: 0.6 })); water.rotation.x = -Math.PI / 2; water.position.y = -2.6; g.add(water);
  const chasm = new THREE.Mesh(new THREE.PlaneGeometry(2, 9), glowMat(PAL.red, { intensity: 0 })); chasm.rotation.x = -Math.PI / 2; chasm.position.y = -2.2; g.add(chasm);
  // South props
  for (let i = 0; i < 3; i++) S.add(cottonRow(-2.8, -3.2 + i * 1.0, 7, 0.6, 40 + i));
  const rows2 = []; for (let i = 0; i < 3; i++) { const r = cottonRow(-2.8, 0.4 + i * 1.0, 7, 0.6, 50 + i); r.scale.setScalar(0.001); S.add(r); rows2.push(r); }
  const planter = person('planter', { id: 'pS' }); place(planter, -1.4, 2.2, Math.PI / 2); S.add(planter.root);
  const planter2 = person('planter', { id: 'pS2' }); place(planter2, -2.6, 2.6, 0.6); planter2.root.visible = false; S.add(planter2.root);
  // North props
  const mill = new THREE.Group(); const mb = box(1.8, 1.4, 1.4, PAL.brick, 0.04); mb.position.y = 0.7; mill.add(mb); const stacks = []; for (let i = 0; i < 3; i++) { const st = box(0.22, 2.2, 0.22, 0x3a3a3a, 0.02); st.position.set(-0.5 + i * 0.5, 1.4 + 1.1, 0); st.scale.y = 0.001; mill.add(st); stacks.push(st); } mill.position.set(1.8, 0, -2.6); N.add(mill);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 14), mat(PAL.woodDark)); wheel.position.set(0.7, 0.6, -2.5); N.add(wheel);
  const banker = person('banker', { id: 'nb' }); place(banker, 0.9, 1.4, -Math.PI / 2); N.add(banker.root);
  const coins = coinPile(30); coins.position.set(1.8, 0, 1.2); N.add(coins);
  const bankBox = box(1.6, 1.3, 1.0, 0x6a6a72, 0.04); bankBox.position.set(2.4, 0.65, -0.4); N.add(bankBox); const bankSign = sign('BANK', { size: 0.28 }); bankSign.position.set(2.4, 1.6, -0.4); N.add(bankSign);
  const ship = new THREE.Group(); const hull = box(1.6, 0.4, 0.7, PAL.woodDark, 0.04); ship.add(hull); const mast = box(0.06, 1.4, 0.06, PAL.woodDark, 0.01); mast.position.y = 0.8; ship.add(mast); const sail = box(0.05, 0.9, 0.8, PAL.cotton, 0.01); sail.position.set(0, 0.95, 0); ship.add(sail);
  const bale = box(0.5, 0.35, 0.35, PAL.cotton, 0.06); bale.position.y = 0.37; ship.add(bale); ship.position.y = -2.4; g.add(ship);
  const northerners = [0, 1, 2].map((i) => { const n = person('northerner', { id: i }); place(n, 0.6 + i * 0.9, 2.6 - (i % 2) * 0.9, Math.PI); n.root.visible = false; N.add(n.root); return n; });
  const freeB = person('freeBlack', { id: 'walk' }); freeB.root.visible = false; g.add(freeB.root);
  const irish = person('irish', { id: 'block' }); place(irish, 0.9, 0.6, -Math.PI / 2); irish.root.visible = false; N.add(irish.root);
  const nosigns = ['NO ENTRY', 'NO VOTE', 'NO SCHOOL'].map((s, i) => { const p = new THREE.Group(); const post = box(0.08, 1.6, 0.08, PAL.woodDark, 0.01); post.position.y = 0.8; p.add(post); const l = sign(s, { size: 0.3, bg: 'rgba(120,20,20,0.9)' }); l.position.y = 1.75; p.add(l); p.position.set(0.5 + i * 0.3, 0, -1.6 + i * 1.2); p.scale.setScalar(0.001); N.add(p); return p; });
  const quaker = person('quaker', { id: 'q' }); place(quaker, 1.0, 1.8, 0.2); quaker.root.visible = false; N.add(quaker.root);
  const qsign = new THREE.Group(); const qpost = box(0.05, 1.0, 0.05, PAL.woodDark, 0.01); qpost.position.y = 0.5; qsign.add(qpost); const qb = box(0.9, 0.5, 0.04, PAL.parch, 0.01); qb.position.y = 1.1; qsign.add(qb); const ql = sign('no slavery', { size: 0.16, bg: null, color: '#2a1a10' }); ql.position.set(0, 1.1, 0.03); qsign.add(ql); qsign.position.set(0.04, -0.3, 0.1); qsign.rotation.x = -0.2; quaker.arms.L.elbow.add(qsign);
  const garrison = person('garrison', { id: 'pl' }); place(garrison, 0.9, 1.0, -Math.PI / 2); garrison.root.visible = false; N.add(garrison.root);
  const lincoln = person('lincoln', { id: 'l' }); lincoln.root.visible = false; g.add(lincoln.root);
  const plank = box(2.6, 0.12, 0.7, PAL.woodDark, 0.02); plank.position.set(0, -0.06, 0.6); plank.visible = false; g.add(plank);
  const list = new THREE.Group(); const lp = box(0.5, 0.7, 0.03, PAL.parch, 0.01); list.add(lp); const items = ['Union', 'abolition', 'tariff', 'railroad'].map((s, i) => { const l = sign(s, { size: 0.11, bg: null, color: '#2a1a10' }); l.position.set(0, 0.24 - i * 0.14, 0.03); list.add(l); return l; }); list.position.set(0.02, -0.3, 0.12); list.rotation.x = -0.4; lincoln.arms.L.elbow.add(list);
  const eagle = new THREE.Group(); for (const s of [-1, 1]) { const w = box(1.6, 0.06, 0.5, 0x101014, 0.02); w.position.x = s * 0.9; w.rotation.z = s * 0.2; eagle.add(w); } const eb = box(0.5, 0.1, 0.8, 0x101014, 0.02); eagle.add(eb); eagle.position.set(-3, 4.5, 0); eagle.visible = false; g.add(eagle);

  function update(t, cam) {
    const k24 = T.K('But the money did not stay'), k25 = T.K('Hold on to that'), k31 = T.K('Put two maps');
    const k54 = T.K('So the North gained'), k61 = T.K('Not every Black southerner');
    const k63 = T.K('And the North was not a refuge'), k64 = T.K('One observer'), k71 = T.K('So how did enslaved');
    const k91 = T.K('Opposition to slavery'), k92 = T.K('The first organized plan');
    const k104 = T.K('Then the Nullification'), k105 = T.K('And southern preachers');
    const k109 = T.K('And the North?'), k111 = T.K('Every proslavery argument'), k112 = T.K('Into that gap'), k113 = T.K('Which brings us back');
    const beat = t < k31 ? 'money' : t < k61 ? 'factories' : t < k71 ? 'refuge' : t < k92 ? 'quaker' : t < k105 ? 'eagle' : t < k111 ? 'dent' : t < k112 ? 'chasm' : 'lincoln';
    // gap: 0.9 until section 11, then widening a notch per line
    let gap = 0.9; if (t >= k111) { gap = 0.9 + 1.2 * easeOut(span(t, k111, k111 + 1.2)) + 1.2 * easeOut(span(t, T.K('Every abolitionist pamphlet'), T.K('Every abolitionist pamphlet') + 1.2)); }
    S.position.x = -3.5 - gap / 2; N.position.x = 3.5 + gap / 2; chasm.scale.x = gap / 2; chasm.material.emissiveIntensity = t >= k111 ? 0.9 : 0;
    planter.idle(t, 1); banker.idle(t, 2); northerners.forEach((n, i) => n.idle(t, 3 + i)); irish.idle(t, 6); quaker.idle(t, 7); garrison.idle(t, 8); planter2.idle(t, 9);
    planter2.root.visible = beat === 'eagle' || beat === 'factories'; banker.root.visible = beat === 'money' || beat === 'factories'; chasm.visible = t >= k111;
    const coinsN = beat === 'money' ? Math.floor(30 * easeOut(span(t, T.K('Northern bankers lent'), k25 + 0.5))) : 30; coins.setCount(coinsN);
    coins.children.forEach((c) => { c.material.emissiveIntensity = (beat === 'money' && t > k25) || beat === 'dent' ? 0.5 + 0.2 * Math.sin(t * 4) : 0.08; });
    // ship carries the bale South -> North during 'Northern shippers'
    const sv = span(t, T.K('Northern shippers') - 0.3, T.KE('Northern shippers') + 0.3); ship.visible = beat === 'money'; ship.position.set(lerp(-4.5, 4.5, sv), -2.4, 3.2 + Math.sin(t * 2) * 0.05); ship.rotation.z = Math.sin(t * 1.7) * 0.03;
    banker.pose({ armR: beat === 'money' && t > T.K('Northern bankers lent') ? -0.9 : 0, elbowR: -0.5 }); wheel.rotation.z = t * (beat === 'money' && t > T.K('New England mills') ? 2.5 : 0.6);
    const fac = beat === 'factories' ? easeOut(span(t, k54 + 0.3, k54 + 1.8)) : t > k54 ? 1 : 0; stacks.forEach((s, i) => { s.scale.y = Math.max(0.001, fac); s.position.y = 1.4 + 1.1 * fac; });
    const rw = beat === 'factories' ? easeOut(span(t, T.K('The South gained more cotton'), T.K('The South gained more cotton') + 1.2)) : t > k54 ? 1 : 0; rows2.forEach((r) => r.scale.setScalar(Math.max(0.001, rw)));
    if (beat === 'factories' && t > T.K('Southern planters watched')) planter.pose({ headYaw: -0.6, armR: 0.2, armL: 0.2, torsoYaw: -0.3 });
    // refuge: a free Black figure walks from the South toward the North, signs rise, the Irish laborer blocks
    freeB.root.visible = beat === 'refuge'; northerners.forEach((n) => { n.root.visible = beat === 'refuge' || beat === 'dent'; });
    if (beat === 'refuge') { const u = easeInOut(span(t, k63, k64 - 0.5)); freeB.root.position.set(lerp(-3.0, 0.4 + N.position.x - 3.5 - 0.2, u), 0, 0.6); freeB.root.rotation.y = Math.PI / 2; if (u < 0.98) freeB.walk(t, 0.9); else freeB.pose({ headPitch: 0.1 });
      nosigns.forEach((p, i) => { p.scale.setScalar(Math.max(0.001, easeOut(span(t, T.K('Several northern states') + i * 0.9 + 0.2, T.K('Several northern states') + i * 0.9 + 0.8)))); });
      irish.root.visible = t > T.K('Irish immigrants') - 0.2; irish.pose({ armL: -0.6, armR: -0.6, elbowL: -0.4, elbowR: -0.4 }); }
    else { irish.root.visible = false; nosigns.forEach((p) => p.scale.setScalar(0.001)); }
    quaker.root.visible = beat === 'quaker'; quaker.pose({ armL: -1.2, elbowL: -0.3, armR: 0.1 });
    eagle.visible = beat === 'eagle' && t > k104 + 0.3; if (eagle.visible) { const u = easeInOut(span(t, k104 + 0.3, k105)); eagle.position.set(lerp(-9, -1.5, u), 4.5, 0.5); eagle.rotation.z = Math.sin(t * 2) * 0.06; planter.pose({ headPitch: -0.6, armL: -0.3 }); planter2.pose({ headPitch: -0.6, armR: -0.4 }); }
    garrison.root.visible = beat === 'dent'; if (beat === 'dent') { garrison.pose({ armR: -1.1, elbowR: -0.4 }); const away = easeInOut(span(t, T.K('Most northerners disliked'), T.K('Most northerners disliked') + 1.2)); const back = easeInOut(span(t, T.K('But through the eighteen fifties'), k111 - 0.5)); northerners.forEach((n, i) => { n.root.rotation.y = Math.PI + Math.PI * away * (1 - (i < 2 ? back : 0)); }); }
    lincoln.root.visible = beat === 'lincoln'; plank.visible = beat === 'lincoln';
    if (beat === 'lincoln') { const u = easeInOut(span(t, k112, k112 + 2.5)); plank.scale.x = (gap + 1.4) / 2.6; lincoln.root.position.set(lerp(-gap / 2 - 1.6, 0, u), 0, 0.6); lincoln.root.rotation.y = Math.PI / 2; if (u < 0.98) lincoln.walk(t, 0.8); else lincoln.pose({ armL: -0.9, elbowL: -0.9, headPitch: 0.3 });
      const nudge = easeOut(span(t, T.K('He would keep abolition') + 1.5, T.K('He would keep abolition') + 2.5)); items[1].position.y = 0.24 - 0.14 + 0.1 * nudge; items[0].position.y = 0.24 + 0.04 * nudge; }
    // camera
    if (beat === 'money') { if (t < k25) fixed(cam, [0, 3.2, 12.5], [0, 0.3, 0]); else dolly(cam, t, k25, k31, [0, 3.2, 12.5], [3.0, 2.2, 6.0], [0, 0.3, 0], [5.3, 0.4, 1.2]); }
    else if (beat === 'factories') fixed(cam, [0, 3.2, 12.5], [0, 0.6, 0]);
    else if (beat === 'refuge') { if (t < k64) dolly(cam, t, k63, k64, [-1.5, 2.0, 7.5], [2.0, 2.0, 7.5], [-1.5, 0.8, 0], [2.0, 0.8, 0]); else fixed(cam, [0, 3.2, 12.5], [0, 0.6, 0]); }
    else if (beat === 'quaker') dolly(cam, t, k91, k92, [N.position.x + 1.0, 1.8, 7.0], [N.position.x + 1.0, 1.7, 6.0], [N.position.x + 1.0, 1.1, 1.8], [N.position.x + 1.0, 1.1, 1.8]);
    else if (beat === 'eagle') fixed(cam, [-1.5, 3.0, 12], [-1.5, 1.0, 0]);
    else if (beat === 'dent') fixed(cam, [1.5, 3.0, 11], [1.5, 0.6, 0]);
    else if (beat === 'chasm') dolly(cam, t, k111, k112, [0, 3.2, 12.5], [0, 2.6, 10], [0, 0.3, 0], [0, -0.3, 0]);
    else dolly(cam, t, k112, k113, [0, 2.6, 10], [0, 1.6, 5.5], [0, -0.3, 0], [0, 0.9, 0.6]);
  }
  function captions(t, cap) {
    cap.draw('South', t, T.K('But the money did not stay') + 0.3, T.K('Hold on to that'), { ...CAP, x: 520 });
    cap.draw('North', t, T.K('But the money did not stay') + 0.3, T.K('Hold on to that'), { ...CAP, x: 1400 });
    cap.draw('likes the individual, despises the race', t, T.K('One observer') + 1.6, T.K('So how did enslaved'), { y: 880, size: 40, x: 520 });
    cap.draw('likes the race, dislikes the individual', t, T.K('One observer') + 4.0, T.K('So how did enslaved'), { y: 880, size: 40, x: 1400 });
    cap.draw('Quakers, 1770s', t, T.K('Quakers had condemned') + 0.3, T.K('The first organized plan'), CAP);
    cap.draw('Nullification Crisis, 1832', t, T.K('Then the Nullification') + 0.6, T.K('Northern criticism'), CAP);
    cap.draw('$300,000,000 owed to the North', t, T.K('Southern planters owed') + 1.0, T.K('But through the eighteen fifties'), CAP);
    cap.draw('Lincoln', t, T.K('Into that gap') + 1.2, T.K('He would keep abolition'), CAP);
  }
  return { group: g, update, captions, background: 0xc9c0ae };
}

// ---------------------------------------------------------------- cotton maps (S3.1, S3.2, S3.5)
function southMap(red, seed) {
  const m = new THREE.Group(); const paper = box(7.6, 0.1, 5.2, PAL.parch, 0.05); paper.position.y = 0.05; m.add(paper);
  // simplified state blocks: [name, x, z, w, d]
  const st = [['MD', 2.3, -1.9, 0.9, 0.5], ['VA', 1.8, -1.2, 2.2, 0.9], ['NC', 2.0, -0.4, 2.4, 0.7], ['SC', 2.2, 0.4, 1.2, 0.8], ['GA', 1.1, 0.9, 1.3, 1.3], ['TN', 0.0, -0.6, 2.6, 0.6], ['AL', 0.1, 0.8, 1.0, 1.4], ['MS', -0.9, 0.8, 0.9, 1.4], ['LA', -1.5, 1.7, 1.4, 0.7], ['AR', -2.0, 0.3, 1.3, 1.0], ['KY', 0.3, -1.3, 2.4, 0.6]];
  const blocks = {};
  st.forEach(([n, x, z, w, d]) => { const b = box(w - 0.06, 0.14, d - 0.06, 0xd6c8a6, 0.02); b.position.set(x, 0.17, z); m.add(b); const l = sign(n, { size: 0.2, bg: null, color: '#4a3a2a' }); l.position.set(x, 0.3, z); m.add(l); blocks[n] = { x, z, w, d, b }; });
  const sea = box(2.0, 0.08, 5.2, 0x8fb0c8, 0.02); sea.position.set(3.9, 0.08, 0.3); m.add(sea);
  const dots = []; const r = rng(seed);
  for (let i = 0; i < 90; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), mat(red ? PAL.red : PAL.red)); d.position.y = 0.28; d.visible = false; m.add(d); dots.push(d); }
  m.blocks = blocks; m.dots = dots;
  return m;
}
export function buildCottonMaps(T) {
  const g = new THREE.Group(); g.name = 'scene_cottonMaps';
  lights(g, [2, 10, 5], { sun: 1.9, fill: 0.9, shadowSize: 10 });
  g.add(ground(50, 50, 0x5a4a3a));
  const left = southMap(false, 11), right = southMap(true, 12); left.position.x = -4.2; right.position.x = 4.2; g.add(left, right);
  const yl = sign('1820', { size: 0.5 }); yl.position.set(-4.2, 1.2, -3.0); g.add(yl); const yr = sign('1860', { size: 0.5 }); yr.position.set(4.2, 1.2, -3.0); g.add(yr);
  // dot positions: 1820 hugs the coast (SC, GA coast, a few river valleys); 1860 fills the black belt
  const r1 = rng(21), r2 = rng(22);
  const in1820 = [['SC', 10], ['GA', 6], ['VA', 3], ['NC', 2]], in1860 = [['SC', 12], ['GA', 16], ['AL', 18], ['MS', 18], ['LA', 10], ['NC', 6], ['TN', 6], ['AR', 4]];
  const lay = (m, spec, rr) => { let k = 0; for (const [n, c] of spec) { const b = m.blocks[n]; for (let i = 0; i < c && k < m.dots.length; i++, k++) m.dots[k].position.set(b.x + (rr() - 0.5) * (b.w - 0.3), 0.28, b.z + (rr() - 0.5) * (b.d - 0.3)); } return k; };
  const n1 = lay(left, in1820, r1), n2 = lay(right, in1860, r2);
  // S3.2 majority markers for MS and SC on the merged (right) map
  const pies = [['MS', 0.55], ['SC', 0.57]].map(([n, f]) => { const b = right.blocks[n]; const grp = new THREE.Group(); const base = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), mat(0xe8e0cc)); base.rotation.x = -Math.PI / 2; grp.add(base); const w = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24, Math.PI / 2, f * Math.PI * 2), mat(0x2a2320)); w.rotation.x = -Math.PI / 2; w.position.y = 0.005; grp.add(w); const l = sign(n + ' ' + Math.round(f * 100) + '%', { size: 0.22 }); l.position.y = 0.5; grp.add(l); grp.position.set(b.x, 0.5, b.z); grp.scale.setScalar(0.001); right.add(grp); return grp; });
  const dark = []; for (const n of ['SC', 'GA', 'AL', 'MS', 'LA']) { const b = right.blocks[n]; const d = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.1, 0.02, b.d - 0.1), glowMat(0x3a2a22, { intensity: 0 })); d.position.set(b.x, 0.26, b.z); d.visible = false; right.add(d); dark.push(d); }
  // S3.5 arrows upper South -> Deep South, with coffles walking
  const arrows = [[['VA', 'MS'], PAL.red], [['MD', 'AL'], PAL.red], [['VA', 'LA'], PAL.red]].map(([[a, b], c]) => { const ar = createArrow(c, { radius: 0.05, head: 0.3 }); right.add(ar); return { ar, a: right.blocks[a], b: right.blocks[b] }; });
  const coffle = [0, 1, 2].map((i) => { const p = person('enslaved', { id: 'cof' + i, scale: 0.45 }); p.root.visible = false; right.add(p.root); return p; });

  function update(t, cam) {
    const k31 = T.K('Put two maps'), k32 = T.K('In some of these counties'), k33 = T.K('Where did these four million');
    const k35 = T.K('And because the Atlantic'), k36 = T.K('By eighteen sixty, planters held');
    const first = t < k33;
    const spread1 = easeOut(span(t, T.K('In eighteen twenty, cotton production'), T.K('In eighteen twenty, cotton production') + 2.0));
    const spread2 = easeOut(span(t, T.K('By eighteen sixty, a wide band'), T.KE('By eighteen sixty, a wide band')));
    left.dots.forEach((d, i) => { d.visible = i < n1 * (first ? spread1 : 1); });
    right.dots.forEach((d, i) => { d.visible = i < n2 * (first ? spread2 : 1); });
    // merge: left slides out, right centres, on 'Historians call this'
    const merge = easeInOut(span(t, T.K('Historians call this'), T.K('Historians call this') + 1.6));
    const m = first ? merge : 1; left.position.x = -4.2 - 8 * m; right.position.x = 4.2 - 4.2 * m; yl.position.x = left.position.x; yr.position.x = right.position.x; yl.visible = m < 0.99;
    const d32 = first ? easeOut(span(t, k32, k32 + 1.5)) : 0; dark.forEach((d) => { d.visible = d32 > 0.01; d.material.opacity = 1; d.scale.setScalar(Math.max(0.001, d32)); });
    pies.forEach((p) => p.scale.setScalar(Math.max(0.001, first ? easeOut(span(t, T.K('In Mississippi and South Carolina') + 0.3, T.K('In Mississippi and South Carolina') + 1.2)) : 0)));
    const al = first ? 0 : easeOut(span(t, k35 + 0.4, T.K('Enslaved people were sold') + 1.0));
    arrows.forEach(({ ar, a, b }, i) => { const dx = b.x - a.x, dz = b.z - a.z; const L = Math.hypot(dx, dz); ar.set([a.x, 0.4, a.z], [dx, 0, dz], L * al); });
    coffle.forEach((p, i) => { const { a, b } = arrows[i % arrows.length]; const u = ((t * 0.12 + i * 0.33) % 1) * al; p.root.visible = !first && al > 0.2 && u > 0.06 && u < 0.95; p.root.position.set(lerp(a.x, b.x, u) + i * 0.25, 0.28, lerp(a.z, b.z, u) + i * 0.35); p.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); p.walk(t, 0.8); });
    if (first) { if (t < k32) dolly(cam, t, k31, k32, [0, 9.5, 5.5], [0, 8.6, 4.8], [0, 0, -0.5], [0, 0, -0.3]); else dolly(cam, t, k32, k33, [0, 8.6, 4.8], [-0.9, 4.2, 3.0], [0, 0, -0.3], [-0.9, 0, 0.8]); }
    else dolly(cam, t, k35, k36, [0.5, 9.0, 4.0], [0.3, 8.2, 3.2], [0.5, 0, -0.4], [0.3, 0, -0.2]);
  }
  function captions(t, cap) {
    cap.draw('the black belt', t, T.K('Historians call this') + 0.5, T.K('In some of these counties'), CAP);
    cap.draw('the internal slave trade', t, T.K('And because the Atlantic') + 1.5, T.K('By eighteen sixty, planters held'), CAP);
  }
  return { group: g, update, captions, background: 0x6a5848 };
}

// ---------------------------------------------------------------- harbor (S3.3, S5.3)
function bigShip(sailColor = PAL.cotton) {
  const s = new THREE.Group(); const hull = box(3.2, 0.9, 1.3, PAL.woodDark, 0.08); hull.position.y = 0.3; s.add(hull);
  for (const x of [-0.8, 0.6]) { const m = box(0.1, 3.0, 0.1, PAL.woodDark, 0.01); m.position.set(x, 2.2, 0); s.add(m); const sl = box(0.06, 1.6, 1.4, sailColor, 0.02); sl.position.set(x, 2.4, 0); s.add(sl); }
  return s;
}
export function buildHarbor(T) {
  const g = new THREE.Group(); g.name = 'scene_harbor';
  lights(g, [5, 8, 9], { sun: 1.9, fill: 0.9, skyColor: 0xcfe0f0, shadowSize: 14 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat(0x3f6a8a, { roughness: 0.55 })); water.rotation.x = -Math.PI / 2; water.position.y = -0.3; g.add(water);
  const dock = box(16, 0.6, 4, PAL.wood, 0.05); dock.position.set(0, 0, -6); g.add(dock);
  const pier = box(9, 0.5, 2.4, PAL.wood, 0.05); pier.position.set(0, -0.2, 2.6); g.add(pier);
  for (let i = 0; i < 4; i++) { const wh = box(2.2, 1.8, 1.6, [PAL.brick, PAL.parch, 0x8a7a6a, PAL.brick][i], 0.04); wh.position.set(-6 + i * 4, 1.2, -8.5); g.add(wh); const rf = box(2.5, 0.3, 1.9, PAL.woodDark, 0.04); rf.position.set(-6 + i * 4, 2.25, -8.5); g.add(rf); }
  const ship = bigShip(); g.add(ship);
  const gate = new THREE.Group(); for (const s of [-1, 1]) { const p = box(0.4, 4.5, 0.4, PAL.stone, 0.05); p.position.set(s * 5.5, 2.0, -1); gate.add(p); }
  const bar = box(11, 0.5, 0.3, PAL.red, 0.05); bar.position.set(0, 3.2, -1); bar.scale.x = 0.001; gate.add(bar); const gl = sign('1808', { size: 0.7 }); gl.position.set(0, 4.2, -1); gl.visible = false; gate.add(gl); g.add(gate);
  const small = new THREE.Group(); const sh = box(1.0, 0.3, 0.5, 0x4a3a2a, 0.03); small.add(sh); const sm = box(0.04, 1.0, 0.04, PAL.woodDark, 0.01); sm.position.y = 0.6; small.add(sm); const ss = box(0.03, 0.6, 0.5, 0xb9a98a, 0.01); ss.position.set(0, 0.7, 0); small.add(ss); small.position.y = -0.2; g.add(small);
  // S5.3 immigrant ships bend north (toward -x in this frame: North is screen left, with a sign)
  const imm = [0, 1, 2].map((i) => { const s = bigShip(0xdfe3e8); s.scale.setScalar(0.6); s.visible = false; g.add(s); return s; });
  const nsign = sign('NORTH', { size: 0.6, bg: 'rgba(60,75,95,0.9)' }); nsign.position.set(-9, 3.5, 2); nsign.visible = false; g.add(nsign);
  const ssign = sign('SOUTH', { size: 0.6, bg: 'rgba(150,120,70,0.9)' }); ssign.position.set(9, 3.5, 2); ssign.visible = false; g.add(ssign);
  const barN = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 1.0), mat(PAL.north)); barN.position.set(-3.0, 0.3, 2.6); barN.castShadow = true; barN.visible = false; g.add(barN);
  const barS = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 1.0), mat(PAL.south)); barS.position.set(3.0, 0.3, 2.6); barS.castShadow = true; barS.visible = false; g.add(barS);
  const lN = sign('North 18.7%', { size: 0.36 }); lN.visible = false; g.add(lN); const lS = sign('South 4.4%', { size: 0.36 }); lS.visible = false; g.add(lS);
  const imArrow = createArrow(0xdfe3e8, { radius: 0.06, head: 0.4 }); g.add(imArrow);

  function update(t, cam) {
    const k33 = T.K('Where did these four million'), k34 = T.K('Most of the growth');
    const k53 = T.K('And the system kept'), k54 = T.K('So the North gained');
    const first = t < k53;
    ship.visible = first; gate.visible = first;
    if (first) {
      const arrive = easeOut(span(t, k33, T.K('Not from Africa') + 0.5)); ship.position.set(lerp(-14, -2.5, arrive), -0.2 + Math.sin(t * 1.3) * 0.05, -3); ship.rotation.z = Math.sin(t * 1.1) * 0.02;
      const close = easeInOut(span(t, T.K('Congress outlawed') + 0.3, T.K('Congress outlawed') + 1.6)); bar.scale.x = Math.max(0.001, close); gl.visible = close > 0.9;
      const slip = span(t, T.K('Smuggling continued'), T.KE('Smuggling continued') + 0.5); small.visible = slip > 0 && slip < 1; small.position.set(lerp(-12, 4, slip), -0.2, -4.5 + 4.0 * slip);
      imm.forEach((s) => { s.visible = false; }); nsign.visible = ssign.visible = barN.visible = barS.visible = lN.visible = lS.visible = false; imArrow.set([0, 0, 0], [1, 0, 0], 0);
      dolly(cam, t, k33, k34, [0, 3.2, 12], [0, 2.8, 10], [0, 1.0, -2], [0, 1.2, -2]);
    } else {
      small.visible = false;
      imm.forEach((s, i) => { const u = span(t, T.K('Europeans heading') - 1.0 + i * 0.8, T.K('Europeans heading') + 2.5 + i * 0.8); s.visible = u > 0 && u < 1; const bend = easeInOut(span(u, 0.35, 1)); s.position.set(lerp(2 + i * 2, -14, bend), -0.2 + Math.sin(t + i) * 0.05, lerp(-5.5, -2.5, Math.min(1, u * 1.6)) + i * 0.6); s.rotation.y = -bend * 1.2; });
      nsign.visible = ssign.visible = t > T.K('Europeans heading');
      imArrow.set([2.5, 2.2, -3], [-1, 0, 0.05], 9 * easeOut(span(t, T.K('Europeans heading') + 0.5, T.K('Europeans heading') + 2.0)));
      const b = T.K('In eighteen sixty, only four point four'); const uN = easeOut(span(t, b + 2.2, b + 3.4)), uS = easeOut(span(t, b + 0.6, b + 1.6));
      barN.visible = uN > 0; barN.scale.y = Math.max(0.001, 3.6 * uN); barN.position.y = 0.3 + barN.scale.y / 2; lN.visible = uN > 0.8; lN.position.set(-3.0, 0.3 + barN.scale.y + 0.5, 2.6);
      barS.visible = uS > 0; barS.scale.y = Math.max(0.001, 0.85 * uS); barS.position.y = 0.3 + barS.scale.y / 2; lS.visible = uS > 0.8; lS.position.set(3.0, 0.3 + barS.scale.y + 0.5, 2.6);
      dolly(cam, t, k53, k54, [0, 3.6, 13], [0, 3.4, 12], [0, 1.0, -1], [0, 1.4, -1]);
    }
  }
  function captions(t, cap) {
    cap.draw('1808: Atlantic trade closed', t, T.K('Congress outlawed') + 1.8, T.K('Smuggling continued'), CAP);
    cap.draw('foreign-born, 1860', t, T.K('In eighteen sixty, only four point four') + 0.3, T.K('Germans and Irish'), CAP);
  }
  return { group: g, update, captions, background: 0xa9c4da };
}
