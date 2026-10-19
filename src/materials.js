import * as THREE from 'three';

// One flat-shaded material per colour, cached so repeated parts share GPU state.
const cache = new Map();
export function mat(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({
      color: hex, flatShading: true, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.0,
      emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: !!opts.transparent, opacity: opts.opacity ?? 1
    }));
  }
  return cache.get(key);
}

// Bevelled box: the workhorse of the "polished voxel" look. Rounded edges catch
// rim light so parts read as solid objects instead of flat cubes.
const geoCache = new Map();
export function bevelBox(w, h, d, r = 0.04, seg = 2) {
  const key = [w, h, d, r, seg].join(',');
  if (!geoCache.has(key)) {
    const rr = Math.min(r, w / 2, h / 2, d / 2);
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + rr, y);
    shape.lineTo(x + w - rr, y); shape.quadraticCurveTo(x + w, y, x + w, y + rr);
    shape.lineTo(x + w, y + h - rr); shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    shape.lineTo(x + rr, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - rr);
    shape.lineTo(x, y + rr); shape.quadraticCurveTo(x, y, x + rr, y);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * rr, bevelEnabled: true, bevelThickness: rr, bevelSize: rr, bevelSegments: seg, curveSegments: 3
    });
    g.translate(0, 0, -(d - 2 * rr) / 2);
    g.computeVertexNormals();
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}

export function box(w, h, d, color, r = 0.04) {
  const m = new THREE.Mesh(bevelBox(w, h, d, r), typeof color === 'number' ? mat(color) : color);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function disposeAll() {
  for (const g of geoCache.values()) g.dispose();
  for (const m of cache.values()) m.dispose();
  geoCache.clear(); cache.clear();
}
