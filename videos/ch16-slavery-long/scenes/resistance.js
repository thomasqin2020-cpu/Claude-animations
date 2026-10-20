// Resistance family: the timeline road (S8.2 to S8.5): Richmond 1800, Charleston 1822, Southampton 1831, Amistad 1839.
import * as THREE from 'three';
import { PAL, CAP, lights, ground, person, place, sign, tree, glowMat, span, easeInOut, easeOut, lerp, rng, box, mat } from './common.js';
import { dolly, fixed } from '/src/camera.js';

export function buildTimelineRoad(T) {
  const g = new THREE.Group(); g.name = 'scene_timelineRoad';
  const sun = lights(g, [4, 7, 9], { sun: 1.2, sunColor: 0xffd0b0, fill: 0.95, skyColor: 0x9a8a9a, groundColor: 0x1a1a20, shadowSize: 16 });
  g.add(ground(80, 40, 0x3a3a34));
  const road = box(40, 0.1, 2.4, 0x8a7a66, 0.03); road.position.set(9, 0.05, 0); g.add(road);
  const roadGlow = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 2.5), glowMat(PAL.red, { intensity: 0 })); roadGlow.position.set(12, 0.05, 0); g.add(roadGlow);
  for (let i = 0; i < 8; i++) g.add(tree(-2 + i * 3.2, -4.5 - (i % 2) * 1.5, 2.4 + (i % 3) * 0.4, 80 + i));
  const stones = [['Richmond 1800', 0], ['Charleston 1822', 6], ['Southampton 1831', 12], ['Amistad 1839', 18]].map(([s, x]) => { const st = box(0.5, 0.9, 0.3, PAL.stone, 0.04); st.position.set(x, 0.45, 1.6); g.add(st); const l = sign(s, { size: 0.32 }); l.position.set(x, 2.1, 1.6); g.add(l); return st; });
  const gallows = (x) => { const G = new THREE.Group(); const p = box(0.18, 3.2, 0.18, PAL.woodDark, 0.02); p.position.y = 1.6; G.add(p); const b = box(1.6, 0.14, 0.14, PAL.woodDark, 0.02); b.position.set(0.7, 3.2, 0); G.add(b); const r = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), mat(0x8a7a5a)); r.position.set(1.2, 2.6, 0); G.add(r); G.position.set(x, 0, -1.6); G.scale.y = 0.001; g.add(G); return G; };
  const gal = [gallows(1.4), gallows(7.4), gallows(13.6)];
  const mkGroup = (x, n, seed) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => { const p = person(i % 3 === 1 ? 'enslavedW' : 'enslaved', { id: 'r' + seed + i }); place(p, x + (r() - 0.5) * 2.2, (r() - 0.5) * 1.4, Math.PI * 0.2 * (r() - 0.5)); const torch = new THREE.Group(); const st = box(0.04, 0.5, 0.04, PAL.woodDark, 0.005); st.position.y = -0.1; torch.add(st); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), glowMat(0xffa030, { intensity: 2.0 })); fl.position.y = 0.2; torch.add(fl); torch.position.set(0, -0.3, 0.05); p.arms.R.elbow.add(torch); p.torch = fl; g.add(p.root); return p; }); };
  const G1 = mkGroup(-0.6, 4, 101), G2 = mkGroup(5.4, 6, 102), G3 = mkGroup(11.0, 5, 103);
  const houses = [0, 1, 2].map((i) => { const h = new THREE.Group(); const b = box(1.4, 1.1, 1.2, PAL.parch, 0.03); b.position.y = 0.55; h.add(b); const r = box(1.6, 0.3, 1.4, PAL.woodDark, 0.03); r.position.y = 1.2; h.add(r); h.position.set(10 + i * 1.8, 0, -3.0 - (i % 2) * 0.8); g.add(h); return h; });
  const ship = new THREE.Group(); const hull = box(2.4, 0.7, 1.0, PAL.woodDark, 0.06); hull.position.y = 0.35; ship.add(hull); for (const x of [-0.6, 0.5]) { const m = box(0.08, 2.4, 0.08, PAL.woodDark, 0.01); m.position.set(x, 1.8, 0); ship.add(m); const sl = box(0.05, 1.3, 1.0, PAL.cotton, 0.02); sl.position.set(x, 1.9, 0); ship.add(sl); } ship.position.set(19.5, 0, -1.5); ship.scale.setScalar(0.001); g.add(ship);
  const night = new THREE.HemisphereLight(0x3a3a60, 0x101018, 0.7); g.add(night);
  const hang = (G, u) => { G.scale.y = Math.max(0.001, u); };
  function update(t, cam) {
    const k82 = T.K('In eighteen hundred, an enslaved man'), k83 = T.K('In eighteen twenty-two, Denmark'), k84 = T.K('Then, in August'), k85 = T.K('Eight years later'), k86 = T.K('None of these rebellions');
    const gather = (G, a, b) => { const u = easeOut(span(t, a, b)); G.forEach((p, i) => { p.root.visible = u > 0.02; p.idle(t, i); p.pose({ armR: -1.6 + 0.1 * Math.sin(t * 3 + i), elbowR: -0.4, armL: 0.1, headPitch: -0.1 }); p.torch.scale.setScalar(1 + 0.3 * Math.sin(t * 11 + i)); }); return u; };
    gather(G1, k82, k82 + 1.5); gather(G2, k83, k83 + 1.5); gather(G3, k84, k84 + 1.2);
    hang(gal[0], easeOut(span(t, T.K('Informers betrayed') + 0.5, T.K('Informers betrayed') + 1.5)));
    hang(gal[1], easeOut(span(t, T.K('Vesey and about thirty') + 0.3, T.K('Vesey and about thirty') + 1.3)));
    hang(gal[2], easeOut(span(t, T.K('The uprising was crushed') + 0.5, T.K('The uprising was crushed') + 1.5)));
    roadGlow.material.emissiveIntensity = t >= k84 ? 0.4 + 0.3 * Math.sin(t * 2.5) : 0;
    // Turner's group moves house to house
    if (t >= T.K('A semiliterate preacher')) { const u = span(t, T.K('A semiliterate preacher') + 0.5, T.K('Around sixty white')); G3.forEach((p, i) => { const k = Math.min(2, Math.floor(u * 3)); p.root.position.x = lerp(11.0, 10 + k * 1.8, 0.8) + (i - 2) * 0.5; p.root.position.z = -1.2 + (i % 2) * 0.5; p.walk(t, 1.2); p.pose({ armR: -1.6, elbowR: -0.4, legL: 0.4 * Math.sin(t * 6 + i), legR: -0.4 * Math.sin(t * 6 + i), kneeL: 0.3, kneeR: 0.3 }); p.hips.position.y = 0.93; }); }
    G3.forEach((p) => { p.root.visible = p.root.visible && t < T.K('The uprising was crushed') + 0.5; });
    G1.forEach((p) => { p.root.visible = p.root.visible && t < T.K('Informers betrayed') + 0.5; });
    G2.forEach((p) => { p.root.visible = p.root.visible && t < T.K('Vesey and about thirty') + 0.3; });
    ship.scale.setScalar(Math.max(0.001, easeOut(span(t, k85 + 0.3, k85 + 1.5))));
    if (t < k83) dolly(cam, t, k82, k83, [-2.0, 2.2, 7.5], [1.0, 2.2, 7.5], [-0.5, 1.0, 0], [1.5, 1.0, 0]);
    else if (t < k84) dolly(cam, t, k83, k84, [4.0, 2.2, 7.5], [7.0, 2.2, 7.5], [4.5, 1.0, 0], [7.5, 1.0, 0]);
    else if (t < k85) dolly(cam, t, k84, k85, [10.0, 2.2, 7.5], [11.5, 1.8, 5.5], [11.0, 1.0, 0], [12.0, 0.9, -0.5]);
    else dolly(cam, t, k85, k86, [12.5, 2.2, 7.5], [9.0, 5.5, 17], [12.0, 0.9, -0.5], [9.0, 1.0, -0.5]);
  }
  function captions(t, cap) {
    cap.draw('Gabriel, 1800', t, T.K('In eighteen hundred, an enslaved man') + 0.8, T.K('In eighteen twenty-two, Denmark'), CAP);
    cap.draw('Denmark Vesey, 1822', t, T.K('In eighteen twenty-two, Denmark') + 0.8, T.K('Then, in August'), CAP);
    cap.draw('Nat Turner, 1831', t, T.K('Then, in August') + 0.8, T.K('Around sixty white'), CAP);
    cap.draw('about 60 killed', t, T.K('Around sixty white') + 0.3, T.K('Eight years later'), CAP);
    cap.draw('Amistad, 1839', t, T.K('Eight years later') + 0.8, T.K('None of these rebellions'), CAP);
  }
  return { group: g, update, captions, background: 0x2a2434 };
}
