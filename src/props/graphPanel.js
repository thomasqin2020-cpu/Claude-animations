import * as THREE from 'three';
import { box, mat } from '../materials.js';
import { createLabel } from './label.js';

// Flat graph panel in the XY plane (z = 0 face). Axes with ticks and labels, curves revealed
// by a 0..1 progress, Riemann strips, and filled areas. World units: panel is `w` by `h`.
export function createGraphPanel(opts = {}) {
  const w = opts.width ?? 3.2, h = opts.height ?? 2.6, pad = opts.pad ?? 0.35;
  const g = new THREE.Group(); g.name = opts.name ?? 'graph';
  const board = box(w, h, 0.08, opts.boardColor ?? 0x1a2030, 0.03); board.position.z = -0.05; board.receiveShadow = true; g.add(board);
  const axisMat = mat(0xd8dce6, { emissive: 0xd8dce6, emissiveIntensity: 0.3 });
  // data -> local: x in [x0,x1] -> [-w/2+pad, w/2-pad]; y in [y0,y1] -> [-h/2+pad, h/2-pad]
  const x0 = opts.x0 ?? 0, x1 = opts.x1 ?? 1, y0 = opts.y0 ?? 0, y1 = opts.y1 ?? 1;
  const ox = -w / 2 + pad, oy = -h / 2 + pad, sx = (w - 2 * pad) / (x1 - x0), sy = (h - 2 * pad) / (y1 - y0);
  const toX = (x) => ox + (x - x0) * sx, toY = (y) => oy + (y - y0) * sy;
  g.toX = toX; g.toY = toY;
  const xAxis = box(w - 2 * pad + 0.2, 0.03, 0.03, axisMat, 0.005); xAxis.position.set(toX(x0) + (w - 2 * pad) / 2 + 0.1 - 0.1, toY(y0), 0.01); g.add(xAxis);
  const yAxis = box(0.03, h - 2 * pad + 0.2, 0.03, axisMat, 0.005); yAxis.position.set(toX(x0), toY(y0) + (h - 2 * pad) / 2, 0.01); g.add(yAxis);
  if (opts.xLabel) { const l = createLabel(opts.xLabel, { size: 0.22, bg: null }); l.position.set(toX(x1) + 0.15, toY(y0) - 0.02, 0.05); g.add(l); }
  if (opts.yLabel) { const l = createLabel(opts.yLabel, { size: 0.22, bg: null }); l.position.set(toX(x0) + 0.3, toY(y1) + 0.05, 0.05); g.add(l); }
  for (const t of opts.xTicks ?? []) { const tk = box(0.02, 0.1, 0.02, axisMat, 0.004); tk.position.set(toX(t.v), toY(y0), 0.01); g.add(tk); if (t.label) { const l = createLabel(t.label, { size: 0.16, bg: null }); l.position.set(toX(t.v), toY(y0) - 0.16, 0.05); g.add(l); } }
  for (const t of opts.yTicks ?? []) { const tk = box(0.1, 0.02, 0.02, axisMat, 0.004); tk.position.set(toX(x0), toY(t.v), 0.01); g.add(tk); if (t.label) { const l = createLabel(t.label, { size: 0.16, bg: null }); l.position.set(toX(x0) - 0.22, toY(t.v), 0.05); g.add(l); } }

  // Curve: instanced segments between consecutive sample points; setProgress reveals them.
  g.addCurve = (fn, opts2 = {}) => {
    const n = opts2.samples ?? 120, a = opts2.from ?? x0, b = opts2.to ?? x1, th = opts2.thickness ?? 0.035;
    const m = mat(opts2.color ?? 0xffffff, { emissive: opts2.color ?? 0xffffff, emissiveIntensity: 0.35, transparent: !!opts2.dashed, opacity: 1 });
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, th, th), m, n); inst.frustumCulled = false;
    const pts = []; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push(new THREE.Vector3(toX(x), toY(fn(x)), 0.03 + (opts2.z ?? 0))); }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), D = new THREE.Vector3(), UP = new THREE.Vector3(1, 0, 0);
    inst.setProgress = (p, range = [0, 1]) => {
      for (let i = 0; i < n; i++) {
        const u = i / n; const on = u <= p && u >= range[0] && u <= range[1] && (!opts2.dashed || i % 4 < 2);
        if (!on) { S.set(0, 0, 0); } else { S.set(pts[i].distanceTo(pts[i + 1]) + th * 0.6, 1, 1); }
        D.subVectors(pts[i + 1], pts[i]).normalize(); Q.setFromUnitVectors(UP, D); P.lerpVectors(pts[i], pts[i + 1], 0.5);
        inst.setMatrixAt(i, M.compose(P, Q, S));
      }
      inst.instanceMatrix.needsUpdate = true;
    };
    inst.pointAt = (x) => new THREE.Vector3(toX(x), toY(fn(x)), 0.05);
    inst.setProgress(opts2.progress ?? 1); g.add(inst); return inst;
  };
  // Riemann strips under fn between a and b; setCount(k) shows k strips of equal width.
  g.addStrips = (fn, opts2 = {}) => {
    const maxN = opts2.max ?? 40, a = opts2.from ?? x0, b = opts2.to ?? x1;
    const m = mat(opts2.color ?? 0x2ec4b6, { transparent: true, opacity: opts2.opacity ?? 0.7, emissive: opts2.color ?? 0x2ec4b6, emissiveIntensity: 0.2 });
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.02), m, maxN); inst.frustumCulled = false;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
    inst.setCount = (k) => {
      for (let i = 0; i < maxN; i++) {
        if (i >= k) { S.set(0, 0, 0); P.set(0, 0, 0); } else {
          const xa = a + (b - a) * i / k, xb = a + (b - a) * (i + 1) / k; const xm = (xa + xb) / 2; const hgt = fn(xb) - y0;   // right-endpoint rule
          S.set((toX(xb) - toX(xa)) * 0.92, hgt * sy, 1); P.set(toX(xm), toY(y0) + hgt * sy / 2, 0.02);
        }
        inst.setMatrixAt(i, M.compose(P, Q, S));
      }
      inst.instanceMatrix.needsUpdate = true;
    };
    inst.setCount(0); g.add(inst); return inst;
  };
  // Filled polygon from data-space points (array of [x,y]); returns a mesh with setReveal(0..1) scaling from the left edge.
  g.addArea = (points, opts2 = {}) => {
    const shape = new THREE.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(toX(x), toY(y)) : shape.moveTo(toX(x), toY(y)));
    const m = mat(opts2.color ?? 0x2ec4b6, { transparent: true, opacity: opts2.opacity ?? 0.6, emissive: opts2.color ?? 0x2ec4b6, emissiveIntensity: 0.25, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), m); mesh.position.z = 0.02 + (opts2.z ?? 0); mesh.renderOrder = 1;
    const minX = Math.min(...points.map((p) => toX(p[0])));
    mesh.setReveal = (r) => { mesh.visible = r > 0; mesh.scale.x = Math.max(1e-3, r); mesh.position.x = minX * (1 - mesh.scale.x); };
    g.add(mesh); return mesh;
  };
  g.marker = (x, y, color = 0xffffff, r = 0.06) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat(color, { emissive: color, emissiveIntensity: 0.5 })); s.position.set(toX(x), toY(y), 0.06); g.add(s); return s; };
  return g;
}
