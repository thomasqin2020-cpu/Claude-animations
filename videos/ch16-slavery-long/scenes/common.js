// Shared palette, lights, people, and props for Chapter 16. 16:9 frame (1920x1080), 40 degree
// vertical FOV, so about 65 degrees horizontal: at distance d the frame is about 1.27 d wide.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createHumanoid } from '/src/characters/humanoid.js';
import { createLabel } from '/src/props/label.js';
import { rng, span, easeInOut, easeOut, lerp } from '/src/timeline.js';

export const PAL = {
  south: 0xd8c39b, southDark: 0xb08f5a, parch: 0xefe3c4, skyS: 0xead6ad,
  north: 0x8595ab, northDark: 0x46546a, skyN: 0xb7c3d2,
  red: 0xb5302a, ink: 0x1d1a22, night: 0x141826, dusk: 0x3a3450,
  gold: 0xd9a52a, coin: 0xe3b63f, green: 0x5f9a5a, wood: 0x6b4a2c, woodDark: 0x3f2b19,
  cotton: 0xf6f3ea, stone: 0x9a968d, grey: 0x707070, smoke: 0x8a8a90, brick: 0x8c4a3a
};
export const CAP = { y: 940, size: 54 };          // caption band: bottom third of a 1080 tall frame
export const CAP2 = { y: 880, size: 54 };

// Non-cached material whose emissive can be animated per object.
export function glowMat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: opts.roughness ?? 0.85, metalness: 0,
    emissive: opts.emissive ?? hex, emissiveIntensity: opts.intensity ?? 0, transparent: !!opts.transparent, opacity: opts.opacity ?? 1 });
}

export function lights(g, key = [6, 9, 7], opts = {}) {
  const sun = new THREE.DirectionalLight(opts.sunColor ?? 0xfff0dc, opts.sun ?? 2.2); sun.position.set(...key); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const s = opts.shadowSize ?? 10;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 60 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; g.add(sun);
  g.add(new THREE.HemisphereLight(opts.skyColor ?? 0xcfd8e6, opts.groundColor ?? 0x3a2f24, opts.fill ?? 0.9));
  const rim = new THREE.DirectionalLight(opts.rimColor ?? 0xb9c8ff, opts.rim ?? 0.6); rim.position.set(-6, 4, -5); g.add(rim);
  return sun;
}

export function ground(w, d, color, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
}
export function backdrop(w, h, color, z = -8, y) {
  const m = box(w, h, 0.3, color, 0.05); m.position.set(0, y ?? h / 2, z); m.receiveShadow = true; return m;
}

// People. Hats are extra meshes on the neck group; they are not named body parts, so the validator ignores them.
const SKIN = { white: 0xf1c9a5, whitePale: 0xf6dcc0, black: 0x5a3a24, blackDark: 0x3f2816, brown: 0x7a4f2c };
export function person(kind, opts = {}) {
  const K = {
    planter:    { skin: SKIN.white, hair: 0x3a2a1a, shirt: 0x1f1d26, pants: 0x2a2630, shoes: 0x14110f, accent: 0xf2efe6, hat: 'top' },
    farmer:     { skin: SKIN.white, hair: 0x6b4a2c, shirt: 0xbfa678, pants: 0x5b4a3a, shoes: 0x2a211b, hat: 'straw' },
    enslaved:   { skin: SKIN.black, hair: 0x120d0a, shirt: 0xa9937a, pants: 0x5a4a3c, shoes: 0x3a2e26 },
    enslavedW:  { skin: SKIN.brown, hair: 0x120d0a, shirt: 0xc9b39a, pants: 0x6b5a4a, shoes: 0x3a2e26 },
    child:      { skin: SKIN.black, hair: 0x120d0a, shirt: 0xb8a48c, pants: 0x5a4a3c, shoes: 0x3a2e26, scale: 0.6 },
    freeBlack:  { skin: SKIN.black, hair: 0x120d0a, shirt: 0x5a6e8a, pants: 0x2b3240, shoes: 0x1a1512, accent: 0xe8e2d2 },
    northerner: { skin: SKIN.whitePale, hair: 0x4a3a2a, shirt: 0x3f4b5c, pants: 0x2a303a, shoes: 0x1a1512, accent: 0xd9dee6, hat: 'bowler' },
    banker:     { skin: SKIN.whitePale, hair: 0x4a3a2a, shirt: 0x2c3340, pants: 0x1e2229, shoes: 0x1a1512, accent: 0xf0e8d0, hat: 'top' },
    irish:      { skin: SKIN.whitePale, hair: 0xa0522d, shirt: 0x6e7f6a, pants: 0x4a4a40, shoes: 0x2a211b, hat: 'cap' },
    preacher:   { skin: SKIN.white, hair: 0x9a9a9a, shirt: 0x151418, pants: 0x151418, shoes: 0x0f0d0c, accent: 0xffffff },
    quaker:     { skin: SKIN.whitePale, hair: 0x7a7a7a, shirt: 0x7d7d78, pants: 0x4a4a46, shoes: 0x2a211b, hat: 'broad' },
    garrison:   { skin: SKIN.whitePale, hair: 0xd8d2c0, shirt: 0x2a2a30, pants: 0x1e1e24, shoes: 0x1a1512, accent: 0xffffff },
    douglass:   { skin: SKIN.black, hair: 0x2a2320, shirt: 0x24222c, pants: 0x1c1a22, shoes: 0x14110f, accent: 0xf0ece0 },
    lincoln:    { skin: SKIN.whitePale, hair: 0x1a1512, shirt: 0x151418, pants: 0x151418, shoes: 0x0f0d0c, accent: 0xffffff, hat: 'stovepipe', scale: 1.12 },
    soldierN:   { skin: SKIN.white, hair: 0x4a3a2a, shirt: 0x2f4a8a, pants: 0x3b4e85, shoes: 0x1a1512, hat: 'kepi' },
    soldierS:   { skin: SKIN.white, hair: 0x6b4a2c, shirt: 0x9a9480, pants: 0x8a8470, shoes: 0x2a211b, hat: 'kepi' },
    overseer:   { skin: SKIN.white, hair: 0x5a3a1a, shirt: 0x7a5a3a, pants: 0x3a2e26, shoes: 0x1a1512, hat: 'broad' },
    clerk:      { skin: SKIN.whitePale, hair: 0x3a2a1a, shirt: 0x4a4458, pants: 0x2a2630, shoes: 0x1a1512, accent: 0xe8e2d2 },
    woman:      { skin: SKIN.black, hair: 0x120d0a, shirt: 0x8a6a7a, pants: 0x5a4050, shoes: 0x3a2e26 },
    truth:      { skin: SKIN.black, hair: 0xe8e8e8, shirt: 0x5a5a62, pants: 0x3a3a42, shoes: 0x1a1512, accent: 0xffffff },
    jefferson:  { skin: SKIN.whitePale, hair: 0xd8c8a8, shirt: 0x6a2a2a, pants: 0xd8d2c0, shoes: 0x1a1512, accent: 0xffffff }
  }[kind];
  const rig = createHumanoid({ ...K, ...opts });
  rig.root.name = 'person_' + kind + (opts.id ?? '');
  if (K.hat) addHat(rig, K.hat, K.hat === 'straw' ? 0xd9c37a : K.hat === 'cap' ? 0x5a5a50 : K.hat === 'kepi' ? K.shirt : K.hat === 'broad' ? 0x3a3028 : 0x111014);
  const sc = opts.scale ?? K.scale ?? 1; if (sc !== 1) rig.root.scale.setScalar(sc);
  rig.kind = kind;
  return rig;
}
function addHat(rig, type, color) {
  const n = rig.neck;
  if (type === 'top' || type === 'stovepipe') {
    const h = type === 'stovepipe' ? 0.42 : 0.28;
    const brim = box(0.46, 0.04, 0.44, color, 0.01); brim.position.y = 0.42; n.add(brim);
    const crown = box(0.32, h, 0.3, color, 0.03); crown.position.y = 0.44 + h / 2; n.add(crown);
  } else if (type === 'straw' || type === 'broad') {
    const brim = box(0.6, 0.04, 0.58, color, 0.01); brim.position.y = 0.41; n.add(brim);
    const crown = box(0.3, 0.14, 0.28, color, 0.04); crown.position.y = 0.49; n.add(crown);
  } else if (type === 'bowler') {
    const brim = box(0.44, 0.04, 0.42, color, 0.01); brim.position.y = 0.42; n.add(brim);
    const crown = box(0.3, 0.16, 0.28, color, 0.07); crown.position.y = 0.5; n.add(crown);
  } else if (type === 'cap') {
    const crown = box(0.36, 0.1, 0.34, color, 0.04); crown.position.y = 0.44; n.add(crown);
    const peak = box(0.3, 0.03, 0.14, color, 0.01); peak.position.set(0, 0.41, 0.22); n.add(peak);
  } else if (type === 'kepi') {
    const crown = box(0.3, 0.14, 0.28, color, 0.03); crown.position.y = 0.46; n.add(crown);
    const peak = box(0.28, 0.03, 0.12, 0x1a1512, 0.01); peak.position.set(0, 0.4, 0.2); n.add(peak);
  }
}
export function place(rig, x, z, yaw = 0, y = 0) { rig.root.position.set(x, y, z); rig.root.rotation.y = yaw; return rig; }
export function idle(rig, t, seed = 0) { rig.idle(t, seed); }

// World-space sign (billboard sprite) for names, years, and short labels.
export function sign(text, opts = {}) {
  return createLabel(text, { size: opts.size ?? 0.32, color: opts.color ?? '#f4efe2', bg: opts.bg === undefined ? 'rgba(20,18,24,0.78)' : opts.bg, font: opts.font, depthTest: opts.depthTest });
}

// Flat scenery helpers.
export function tree(x, z, h = 2.4, seed = 1) {
  const g = new THREE.Group(); const r = rng(seed);
  const trunk = box(0.22, h * 0.45, 0.22, PAL.woodDark, 0.03); trunk.position.y = h * 0.225; g.add(trunk);
  for (let i = 0; i < 3; i++) { const s = 1.4 - i * 0.35; const c = box(s, s * 0.6, s, 0x4e7a3e, 0.12); c.position.y = h * 0.45 + i * s * 0.42 + 0.2; c.rotation.y = r() * 1.2; g.add(c); }
  g.position.set(x, 0, z); return g;
}
export function cottonRow(x0, z, n, spacing = 0.5, seed = 3) {
  const g = new THREE.Group(); const r = rng(seed);
  for (let i = 0; i < n; i++) { const p = box(0.3, 0.42, 0.3, 0x4b6b3a, 0.08); p.position.set(x0 + i * spacing, 0.21, z + (r() - 0.5) * 0.1); g.add(p);
    const b = box(0.16, 0.16, 0.16, PAL.cotton, 0.06); b.position.set(x0 + i * spacing, 0.5, z); g.add(b); }
  return g;
}
export function column(x, z, h = 3.2, w = 0.3) { const c = box(w, h, w, PAL.parch, 0.04); c.position.set(x, h / 2, z); return c; }
export function coinPile(n, seed = 7) {
  const g = new THREE.Group(); g.name = 'coinPile'; const r = rng(seed); const m = mat(PAL.coin, { roughness: 0.45, emissive: PAL.coin, emissiveIntensity: 0.08 });
  const coins = [];
  for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 10), m); c.castShadow = true;
    const k = Math.floor(i / 6); c.position.set((i % 6 - 2.5) * 0.24 + (r() - 0.5) * 0.06, 0.02 + k * 0.038, (r() - 0.5) * 0.3); c.rotation.y = r() * 3; coins.push(c); g.add(c); }
  g.setCount = (k) => { coins.forEach((c, i) => { c.visible = i < k; }); };
  return g;
}
export function book(w = 0.5, h = 0.08, d = 0.36, cover = 0x5a2a1e) {
  const g = new THREE.Group(); const c = box(w, h, d, cover, 0.01); g.add(c);
  const pages = box(w * 0.94, h * 0.7, d * 0.94, PAL.parch, 0.005); pages.position.x = 0.02; g.add(pages); return g;
}
export function musket(len = 1.2) {
  const g = new THREE.Group(); const barrel = box(0.05, len, 0.05, 0x3a3a40, 0.01); barrel.position.y = len / 2; g.add(barrel);
  const stock = box(0.08, len * 0.4, 0.1, PAL.woodDark, 0.02); stock.position.set(0, len * 0.2, 0.02); g.add(stock); return g;
}
export function chainLink(n = 8, color = 0x4a4a52) {
  const g = new THREE.Group(); const m = mat(color, { roughness: 0.5 });
  for (let i = 0; i < n; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 10), m); l.position.x = i * 0.1; l.rotation.y = (i % 2) * Math.PI / 2; g.add(l); }
  return g;
}
export { span, easeInOut, easeOut, lerp, rng, box, mat };
