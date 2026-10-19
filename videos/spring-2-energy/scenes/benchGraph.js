// Part 2: bench (k = 10 N/m) with an F vs x graph panel mounted above it, so the block and the
// graph share one tall frame. Covers 0 to C6: pull, live trace, rectangle fails, strips,
// triangle, triangle flies into the spring, x1 -> x2 negative work.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createRuler } from '/src/props/ruler.js';
import { createLabel } from '/src/props/label.js';
import { createGraphPanel } from '/src/props/graphPanel.js';
import { lerp, easeInOut, easeOut, easeIn, span, pulse } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

export const UNIT = 2.5, FSCALE = 0.16, K = 10, NAT = 1.0, ANCHOR_X = -1.25, Y = 0.31;
const X1 = 0.20, X2 = 0.40;

export function buildBenchGraph(C) {
  const g = new THREE.Group(); g.name = 'scene_benchGraph';
  g.add(createLab({ benchWidth: 9 }));
  labLights(g, [5, 8, 7]);
  g.add(createAnchor(ANCHOR_X - 0.12, Y - 0.2));
  const spring = createSpring({ coils: 12, radius: 0.16, wire: 0.028, length: NAT, name: 'spring' });
  spring.rotation.z = -Math.PI / 2; spring.position.set(ANCHOR_X, Y, 0); g.add(spring);
  const block = createBlock('1 kg'); g.add(block);
  const ruler = createRuler({ from: -0.1, to: 0.5, unit: UNIT, step: 0.1 }); ruler.position.set(ANCHOR_X + NAT + 0.25, 0.07, 0.62); g.add(ruler);
  const fApplied = createArrow(LAB.teal, { label: 'pull', labelOffset: [0, -0.3, 0.2] }); g.add(fApplied);
  const fSpring = createArrow(LAB.coral, { label: 'F', labelOffset: [0, 0.3, 0.2] }); g.add(fSpring);

  // Graph panel above the bench: F (N) vs x (m)
  const panel = createGraphPanel({ width: 2.5, height: 3.0, pad: 0.55, x0: 0, x1: 0.5, y0: 0, y1: 5, xLabel: 'x (m)', yLabel: 'F (N)',
    xTicks: [{ v: 0, label: '0' }, { v: 0.2, label: '0.2' }, { v: 0.4, label: '0.4' }], yTicks: [{ v: 2, label: '2' }, { v: 4, label: '4' }] });
  panel.position.set(0, 2.45, -0.7); g.add(panel);
  const post = box(0.25, 1.3, 0.25, LAB.bench, 0.04); post.position.set(0, 0.6, -0.95); g.add(post);
  const line = panel.addCurve((x) => K * x, { color: LAB.coral, samples: 60, thickness: 0.04 });
  const dot = panel.marker(0, 0, LAB.coral, 0.07);
  const strips = panel.addStrips((x) => K * x, { max: 40, from: 0, to: X1, color: LAB.teal, opacity: 0.75 });
  const rect = panel.addArea([[0, 0], [X1, 0], [X1, K * X1], [0, K * X1]], { color: LAB.teal, opacity: 0.35 }); rect.setReveal(0);
  const crossMat = mat(LAB.red, { emissive: LAB.red, emissiveIntensity: 0.8 });
  const cross = new THREE.Group(); for (const s of [1, -1]) { const b = box(1.3, 0.05, 0.03, crossMat, 0.005); b.rotation.z = s * 0.75; cross.add(b); }
  cross.position.set(panel.toX(X1 / 2), panel.toY(K * X1 / 2), 0.08); cross.visible = false; panel.add(cross);
  const tri = panel.addArea([[0, 0], [X1, 0], [X1, K * X1]], { color: LAB.amber, opacity: 0.85 }); tri.setReveal(0);
  const baseLabel = createLabel('x', { size: 0.2, color: '#7bd389' }); baseLabel.position.set(panel.toX(X1 / 2), panel.toY(0) - 0.0 + 0.18, 0.1); baseLabel.visible = false; panel.add(baseLabel);
  const hLabel = createLabel('kx', { size: 0.2, color: '#ff6b5b' }); hLabel.position.set(panel.toX(X1) + 0.28, panel.toY(K * X1 / 2), 0.1); hLabel.visible = false; panel.add(hLabel);
  const trap = panel.addArea([[X1, 0], [X2, 0], [X2, K * X2], [X1, K * X1]], { color: LAB.red, opacity: 0.6 }); trap.setReveal(0);
  const trapLabel = createLabel('−0.60 J', { size: 0.22, color: '#ff8a80' }); trapLabel.position.set(panel.toX(0.3), panel.toY(1.2), 0.12); trapLabel.visible = false; panel.add(trapLabel);
  const m1 = createLabel('x₁', { size: 0.18, color: '#7bd389' }); m1.position.set(panel.toX(X1), panel.toY(0) - 0.38, 0.1); m1.visible = false; panel.add(m1);
  const m2 = createLabel('x₂', { size: 0.18, color: '#7bd389' }); m2.position.set(panel.toX(X2), panel.toY(0) - 0.38, 0.1); m2.visible = false; panel.add(m2);
  // Flying triangle: a copy of the triangle shape that leaves the panel and goes into the spring.
  const flyShape = new THREE.Shape(); flyShape.moveTo(0, 0); flyShape.lineTo(1, 0); flyShape.lineTo(1, 1); flyShape.closePath();
  const fly = new THREE.Mesh(new THREE.ShapeGeometry(flyShape), mat(LAB.amber, { emissive: LAB.amber, emissiveIntensity: 0.6, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  fly.visible = false; g.add(fly);
  const triW = panel.toX(X1) - panel.toX(0), triH = panel.toY(K * X1) - panel.toY(0);
  const triOrigin = new THREE.Vector3(panel.toX(0), panel.toY(0), 0.06); panel.localToWorld(triOrigin);

  function xOf(t) {
    if (t < 1.2) return 0;
    if (t < 5.5) return X1 * easeInOut(span(t, 1.2, 5.5));
    if (t < 20.3) return X1;
    if (t < 21.9) return lerp(X1, X2, easeInOut(span(t, 20.3, 21.9)));
    return X2;
  }
  function update(t, cam) {
    const x = xOf(t), xs = x * UNIT;
    spring.setLength(NAT + xs); block.position.x = ANCHOR_X + NAT + 0.25 + xs;
    const left = block.position.x - 0.25, right = block.position.x + 0.25;
    const pulling = t > 1.0 && t < 5.8;
    fApplied.set([right, Y - 0.1, 0.05], [1, 0, 0], pulling ? K * x * FSCALE : 0);
    const showF = t >= C[5] && t < C[6];
    fSpring.set([left, Y + 0.12, 0.05], [-1, 0, 0], showF ? K * x * FSCALE * easeOut(span(t, C[5], C[5] + 0.5)) : 0);
    // graph
    line.setProgress(t < C[5] ? x / 0.5 : easeInOut(span(t, C[5], C[5] + 0.6)) * (x / 0.5) + (1 - easeInOut(span(t, C[5], C[5] + 0.6))) * (X1 / 0.5));
    if (t >= C[5]) line.setProgress(Math.max(X1, x) / 0.5);
    dot.visible = t >= C[1] && t < C[6]; dot.position.set(panel.toX(x), panel.toY(K * x), 0.06);
    const rectOn = t >= 5.5 && t < C[2]; rect.setReveal(rectOn ? easeOut(span(t, 5.5, 6.1)) : 0); cross.visible = t >= 6.3 && t < C[2];
    const stripCount = t < C[2] ? 0 : t < C[2] + 1.1 ? 6 : t < C[2] + 2.3 ? 12 : t < C[3] ? 40 : 0; strips.setCount(stripCount);
    const triOn = t >= C[3] && t < C[4] + 0.5; tri.setReveal(triOn ? easeOut(span(t, C[3], C[3] + 0.5)) : 0);
    baseLabel.visible = hLabel.visible = t >= C[3] + 0.6 && t < C[4];
    // flying triangle from the panel into the spring (C4+0.5 to C5), spring glows as it arrives
    const flyOn = t >= C[4] + 0.5 && t < C[5] + 0.3;
    fly.visible = flyOn;
    if (flyOn) {
      const u = easeInOut(span(t, C[4] + 0.5, C[5] - 0.2));
      const target = new THREE.Vector3(ANCHOR_X + NAT * 0.5 + xs * 0.5, Y, 0.3);
      fly.position.lerpVectors(triOrigin, target, u); fly.scale.set(triW * (1 - 0.7 * u), triH * (1 - 0.7 * u), 1);
      fly.material.opacity = 0.9 * (1 - easeIn(span(t, C[5] - 0.4, C[5] + 0.3)));
    }
    spring.setGlow(t >= C[4] + 2.0 && t < C[5] + 1.5 ? 0.8 * easeOut(span(t, C[4] + 2.0, C[5])) * (1 - easeInOut(span(t, C[5] + 0.6, C[5] + 1.5))) : 0);
    m1.visible = m2.visible = t >= C[5];
    trap.setReveal(t >= 22.5 ? easeOut(span(t, 22.5, 23.3)) : 0); trapLabel.visible = t >= 25.5;
    // ---- camera ----
    if (t < C[1]) dolly(cam, t, 0, C[1], [1.4, 1.4, 7.6], [1.2, 1.5, 7.4], [-0.2, 0.5, 0], [-0.2, 0.7, 0]);
    else if (t < 5.5) dolly(cam, t, C[1], 5.5, [1.2, 1.5, 7.4], [0.5, 2.0, 8.0], [-0.2, 0.7, 0], [-0.1, 1.45, 0]);          // tilt up to include the panel
    else if (t < C[4]) dolly(cam, t, 5.5, C[4], [0.4, 2.3, 6.2], [0.2, 2.2, 5.6], [0, 2.05, -0.7], [0, 2.0, -0.7]);      // front on panel
    else if (t < C[5]) dolly(cam, t, C[4] + 0.4, C[5], [0.2, 2.2, 5.6], [0.9, 1.3, 7.0], [0, 2.0, -0.7], [0.0, 0.55, 0]);  // follow the triangle down
    else dolly(cam, t, C[5], C[5] + 1.2, [0.9, 1.3, 7.0], [0.5, 1.8, 8.3], [0.0, 0.55, 0], [-0.05, 1.05, -0.3]);           // tall frame: block + panel
  }
  function captions(t, cap) {
    cap.draw('W = ? J', t, 0.8, C[1] + 1.5, { y: 1500, size: 76 });
    cap.draw('W ≠ F·d   (F varies)', t, 5.8, C[2], { y: 1500, size: 60 });
    cap.draw('W = ∫₀ˣ kx′ dx′', t, C[2] + 0.3, C[3], { y: 1500, size: 70 });
    cap.draw('W = ½(x)(kx) = ½kx²', t, C[3] + 0.6, C[4], { y: 1500, size: 62 });
    cap.draw('U = ½kx²', t, C[4] + 2.4, C[5], { y: 1580, size: 72 });
    cap.gauge('ENERGY STORED  0.20 J', easeOut(span(t, C[4] + 2.0, C[5])), t, C[4] + 2.4, C[5], { y: 1460 });
    cap.draw('Wₛ = −∫ kx dx   from x₁ to x₂', t, 22.7, 25.5, { y: 1500, size: 54 });
    cap.draw('Wₛ = ½kx₁² − ½kx₂² = −ΔU', t, 25.5, C[6], { y: 1500, size: 56 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
