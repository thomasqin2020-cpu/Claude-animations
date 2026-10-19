import * as THREE from 'three';

// Billboard text label drawn to a canvas texture. Deterministic (no fonts loaded at runtime
// beyond the system sans). Size is the world-space height.
const cache = new Map();
export function createLabel(text, opts = {}) {
  const size = opts.size ?? 0.25, color = opts.color ?? '#ffffff', bg = opts.bg ?? 'rgba(10,12,20,0.75)';
  const key = [text, color, bg, opts.font].join('|');
  if (!cache.has(key)) {
    const c = document.createElement('canvas'); const ctx = c.getContext('2d');
    const font = opts.font ?? '700 96px "Helvetica Neue", Arial, sans-serif';
    ctx.font = font; const w = Math.ceil(ctx.measureText(text).width) + 56;
    c.width = w; c.height = 140;
    ctx.font = font; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    if (bg) { ctx.fillStyle = bg; roundRect(ctx, 4, 10, w - 8, 120, 26); ctx.fill(); }
    ctx.fillStyle = color; ctx.fillText(text, w / 2, 72);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
    cache.set(key, { tex, aspect: w / 140 });
  }
  const { tex, aspect } = cache.get(key);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: opts.depthTest ?? false }));
  sp.scale.set(size * aspect, size, 1); sp.renderOrder = 10; sp.name = 'label:' + text;
  return sp;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
