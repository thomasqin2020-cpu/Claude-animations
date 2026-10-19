// Part 1 well: potential-energy curve panel. Asymmetric (Morse-like) well with a ball,
// Taylor-expansion captions, tangent line, dashed parabola, downhill force arrows, and the
// red gap where the parabola fails.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, LAB } from '/src/props/lab.js';
import { createGraphPanel } from '/src/props/graphPanel.js';
import { createArrow } from '/src/props/arrow.js';
import { createLabel } from '/src/props/label.js';
import { lerp, easeInOut, easeOut, span, pulse } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

const A = 1.2; const U = (x) => Math.pow(1 - Math.exp(-A * x), 2);   // Morse-shaped well, U(0)=0, U'(0)=0
const KW = 2 * A * A;                                                   // U''(0)
const UP = (x) => 0.5 * KW * x * x;                                     // parabola
const X0 = -0.55, X1 = 1.6;

export function buildWell(C) {
  const g = new THREE.Group(); g.name = 'scene_well';
  g.add(createLab({ bench: false }));
  labLights(g, [4, 7, 8]);
  const panel = createGraphPanel({ width: 2.5, height: 3.4, pad: 0.55, x0: X0, x1: X1, y0: 0, y1: 1.6, xLabel: 'x', yLabel: 'U(x)', xTicks: [{ v: 0, label: '0' }] });
  panel.position.set(0, 2.45, 0); g.add(panel);
  const stand = box(0.3, 1.0, 0.3, LAB.bench, 0.04); stand.position.set(0, 0.35, -0.2); g.add(stand);
  const curve = panel.addCurve(U, { color: 0xffffff, samples: 140, thickness: 0.04 });
  const parabola = panel.addCurve(UP, { color: LAB.green, samples: 140, thickness: 0.035, dashed: true, from: -0.55, to: 1.05, z: 0.01 });
  // red gap between the curves on the stretch side, beyond the elastic limit at x = 0.75
  const gapPts = []; for (let i = 0; i <= 30; i++) { const x = 0.75 + (1.05 - 0.75) * i / 30; gapPts.push([x, UP(x)]); } for (let i = 30; i >= 0; i--) { const x = 0.75 + (1.05 - 0.75) * i / 30; gapPts.push([x, U(x)]); }
  const gap = panel.addArea(gapPts, { color: LAB.red, opacity: 0.55, z: 0.005 }); gap.setReveal(0);
  const limit = box(0.02, 2.2, 0.02, mat(LAB.red, { emissive: LAB.red, emissiveIntensity: 0.6 }), 0.002); limit.position.set(panel.toX(0.75), panel.toY(0.7), 0.03); limit.visible = false; panel.add(limit);
  const limitLabel = createLabel('elastic limit', { size: 0.18, color: '#ff8a80' }); limitLabel.position.set(panel.toX(0.75) - 0.55, panel.toY(1.15), 0.06); limitLabel.visible = false; panel.add(limitLabel);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), mat(LAB.teal, { emissive: LAB.teal, emissiveIntensity: 0.4 })); ball.castShadow = true; panel.add(ball);
  const tangent = box(1.4, 0.03, 0.03, mat(LAB.amber, { emissive: LAB.amber, emissiveIntensity: 0.8 }), 0.004); tangent.position.set(panel.toX(0), panel.toY(0) + 0.0, 0.04); tangent.visible = false; panel.add(tangent);
  const probes = [-0.3, 0.35, 0.7].map((x, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(LAB.teal, { emissive: LAB.teal, emissiveIntensity: 0.4 })); b.position.copy(panel.pointAtCurve ? panel.pointAtCurve(x) : new THREE.Vector3(panel.toX(x), panel.toY(U(x)) + 0.07, 0.06)); b.visible = false; panel.add(b);
    const arr = createArrow(LAB.coral, { radius: 0.03, head: 0.12 }); panel.add(arr);
    return { x, b, arr, t0: C[6] + 0.3 + i * 1.0 };
  });

  function ballX(t) {
    // rolls in from the right and settles at the bottom with a decaying wobble
    if (t < 17.4) return 1.35;
    const u = t - 17.4; return 1.35 * Math.exp(-1.6 * u) * Math.cos(2.2 * u);
  }
  function update(t, cam) {
    curve.setProgress(easeInOut(span(t, C[4], 19.0)));
    ball.visible = t >= 17.3 && t < C[6]; if (ball.visible) { const x = ballX(t); ball.position.set(panel.toX(x), panel.toY(Math.min(1.05, U(x))) + 0.09, 0.06); }
    tangent.visible = t >= C[5] && t < 24.0; if (tangent.visible) tangent.material.emissiveIntensity = 0.5 + 0.6 * pulse(t, C[5], C[5] + 0.8);
    parabola.setProgress(t >= 24.0 ? easeInOut(span(t, 24.0, 25.6)) : 0);
    for (const p of probes) { const on = t >= p.t0 && t < C[7]; p.b.visible = on; const grow = easeOut(span(t, p.t0, p.t0 + 0.4)); const dir = p.x > 0 ? -1 : 1; p.arr.set([panel.toX(p.x), panel.toY(U(p.x)) + 0.07, 0.07], [dir, 0, 0], on ? Math.abs(p.x) * 1.1 * grow : 0); }
    const far = t >= C[7]; limit.visible = far; limitLabel.visible = far; gap.setReveal(far ? easeInOut(span(t, C[7] + 0.4, C[7] + 1.4)) : 0);
    if (far) { ball.visible = true; const x = lerp(0, 1.0, easeInOut(span(t, C[7], C[7] + 1.2))); ball.position.set(panel.toX(x), panel.toY(U(x)) + 0.09, 0.06); }
    // ---- camera ---- (lookAt sits low so the panel clears the caption band)
    const PY = 2.45;
    if (t < 19.0) dolly(cam, t, C[4], 19.0, [0.2, PY, 5.4], [0.1, PY, 5.0], [0, 2.0, 0], [0, 2.0, 0]);
    else if (t < C[5]) dolly(cam, t, 19.0, C[5], [0.1, PY, 5.0], [0.0, PY, 4.7], [0, 2.0, 0]);
    else if (t < 24.0) dolly(cam, t, C[5], 24.0, [0.0, PY, 4.7], [-0.1, PY - 0.4, 3.6], [0, 2.0, 0], [panel.toX(0), 1.65, 0]);
    else if (t < C[7]) dolly(cam, t, 24.0, C[7], [-0.1, PY - 0.4, 3.6], [0.0, PY - 0.3, 3.9], [panel.toX(0), 1.65, 0], [panel.toX(0.2), 1.7, 0]);
    else dolly(cam, t, C[7], 34.0, [0.0, PY - 0.3, 3.9], [0.3, PY, 5.4], [panel.toX(0.2), 1.7, 0], [0.2, 2.0, 0]);
  }
  function captions(t, cap) {
    cap.draw('U(x) = U(0) + U′(0)x + ½U″(0)x² + …', t, 19.0, C[5], { y: 1500, size: 50 });
    cap.draw('U(0) = 0,   U′(0) = 0', t, C[5] + 0.2, 24.0, { y: 1500, size: 62 });
    cap.draw('U ≈ ½kx²\nk ≡ U″(0) > 0', t, 24.2, C[6], { y: 1500, size: 62 });
    cap.draw('F = −dU/dx = −kx', t, C[6] + 0.3, C[7], { y: 1500, size: 70 });
    cap.draw('parabola fails for large x', t, C[7] + 0.5, 34.0, { y: 1500, size: 56 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
