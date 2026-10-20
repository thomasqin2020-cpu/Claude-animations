// Part 3 strand (0 to C3): a horizontal spring pulled equally at both ends; a probe ring
// slides along reading the same tension; free-body on one coil; wall + block version.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { createLab, labLights, createAnchor, createBlock, LAB } from '/src/props/lab.js';
import { createSpring } from '/src/props/spring.js';
import { createArrow } from '/src/props/arrow.js';
import { createLabel } from '/src/props/label.js';
import { lerp, easeInOut, easeOut, span, pulse } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

const FSCALE = 0.16, F = 3.0;         // 3.0 N -> 0.48 units
const L = 1.6, X0 = -0.8, Y = 1.6;    // stretched spring from X0 to X0+L at height Y

export function buildStrand(C) {
  const g = new THREE.Group(); g.name = 'scene_strand';
  g.add(createLab({ bench: false })); labLights(g, [4, 7, 8]);
  const spring = createSpring({ coils: 14, radius: 0.16, wire: 0.03, length: L, name: 'strand' });
  spring.rotation.z = -Math.PI / 2; spring.position.set(X0, Y, 0); g.add(spring); spring.setLength(L);
  const pullL = createArrow(LAB.teal, { label: '3.0 N', labelOffset: [0, 0.32, 0] }); g.add(pullL);
  const pullR = createArrow(LAB.teal, { label: '3.0 N', labelOffset: [0, 0.32, 0] }); g.add(pullR);
  // probe ring with readout
  const probe = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 24), mat(LAB.amber, { emissive: LAB.amber, emissiveIntensity: 1.0 })); probe.rotation.y = Math.PI / 2; g.add(probe);
  const probeLabel = createLabel('T = 3.0 N', { size: 0.24, color: '#ffb347' }); g.add(probeLabel);
  // free-body slab on a short piece of the coil
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.46), mat(LAB.purple, { transparent: true, opacity: 0.35, emissive: LAB.purple, emissiveIntensity: 0.5 })); slab.position.set(X0 + L / 2, Y, 0); slab.visible = false; g.add(slab);
  const dmLabel = createLabel('Δm', { size: 0.2, color: '#c9b8ff' }); dmLabel.position.set(X0 + L / 2, Y - 0.5, 0.1); dmLabel.visible = false; g.add(dmLabel);
  const t1 = createArrow(LAB.coral, { label: 'T₁', labelSize: 0.11, labelOffset: [0, -0.2, 0.15] }); g.add(t1);
  const t2 = createArrow(LAB.coral, { label: 'T₂', labelSize: 0.11, labelOffset: [0, -0.2, 0.15] }); g.add(t2);
  // wall + block version
  const anchor = createAnchor(X0 - 0.14, Y - 0.2); anchor.visible = false; g.add(anchor);
  const block = createBlock(null, 0xd9b86a, 0.5); block.position.set(X0 + L + 0.25, Y - 0.31, 0); block.visible = false; g.add(block);
  const tWall = createArrow(LAB.coral, { label: 'T', labelOffset: [0, 0.32, 0] }); g.add(tWall);
  const tBlock = createArrow(LAB.coral, { label: 'T', labelOffset: [0, 0.32, 0] }); g.add(tBlock);
  const wallLabel = createLabel('on the wall', { size: 0.18, bg: null, color: '#ff6b5b' }); wallLabel.position.set(X0 + 0.25, Y + 0.6, 0.3); wallLabel.visible = false; g.add(wallLabel);
  const blockLabel = createLabel('on the block', { size: 0.18, bg: null, color: '#ff6b5b' }); blockLabel.position.set(X0 + L - 0.25, Y + 0.6, 0.3); blockLabel.visible = false; g.add(blockLabel);

  function update(t, cam) {
    const inPulls = t < C[2];
    const grow = easeOut(span(t, 0.2, 0.9));
    pullL.set([X0 - 0.02, Y, 0.0], [-1, 0, 0], inPulls ? F * FSCALE * grow : 0);
    pullR.set([X0 + L + 0.02, Y, 0.0], [1, 0, 0], inPulls ? F * FSCALE * grow : 0);
    // probe slides end to end during line 0, then parks and fades
    const pu = easeInOut(span(t, 0.9, 3.9));
    const px = X0 + 0.1 + (L - 0.2) * pu;
    probe.visible = t < C[1]; probe.position.set(px, Y, 0); probe.material.emissiveIntensity = 0.8 + 0.4 * Math.sin(t * 8);
    probeLabel.visible = t >= 0.9 && t < C[1]; probeLabel.position.set(px, Y + 0.55, 0.2);
    // free body C1 .. C2
    const fb = t >= C[1] && t < C[2];
    slab.visible = fb; dmLabel.visible = fb;
    const shrink = easeInOut(span(t, 6.8, 7.6));              // Δm -> 0: slab thins, arrows equalise
    slab.scale.set(lerp(1, 0.25, shrink), 1, 1);
    const unequal = 1 - easeInOut(span(t, 6.9, 7.3));
    const cx = X0 + L / 2, half = 0.11 * lerp(1, 0.25, shrink);
    // close-up: arrows drawn at 0.6 scale so both fit the narrow frame; only their ratio matters here
    t1.set([cx - half, Y - 0.1, 0.2], [-1, 0, 0], fb ? (F - 0.9 * unequal) * FSCALE * 0.6 : 0);
    t2.set([cx + half, Y - 0.1, 0.2], [1, 0, 0], fb ? (F + 0.9 * unequal) * FSCALE * 0.6 : 0);
    // wall + block from C2
    const wb = t >= C[2];
    anchor.visible = wb; block.visible = wb; wallLabel.visible = t >= C[2] + 0.9; blockLabel.visible = t >= C[2] + 0.9;
    const g2 = easeOut(span(t, C[2] + 0.2, C[2] + 0.9));
    tWall.set([X0 - 0.02, Y, 0.0], [1, 0, 0], wb ? F * FSCALE * g2 : 0);                   // spring pulls the wall toward the block
    tBlock.set([X0 + L + 0.02, Y, 0.0], [-1, 0, 0], wb ? F * FSCALE * g2 : 0);             // and the block toward the wall
    // ---- camera ----
    if (t < C[1]) { const cx2 = lerp(X0 + 0.2, X0 + L - 0.2, pu); dolly(cam, t, 0, C[1], [X0 + 0.2, Y + 0.3, 4.6], [X0 + L - 0.2, Y + 0.3, 4.6], [X0 + 0.2, Y - 0.05, 0], [X0 + L - 0.2, Y - 0.05, 0], (u) => easeInOut(span(0.9 + 3.0 * u, 0.9, 3.9))); }
    else if (t < C[2]) dolly(cam, t, C[1], C[1] + 1.0, [X0 + L / 2 + 0.3, Y + 0.3, 3.6], [X0 + L / 2 + 0.1, Y + 0.1, 2.6], [X0 + L / 2, Y - 0.05, 0], [X0 + L / 2, Y - 0.1, 0]);
    else dolly(cam, t, C[2], C[2] + 1.2, [X0 + L / 2 + 0.1, Y + 0.1, 2.6], [X0 + L / 2, Y + 0.5, 6.6], [X0 + L / 2, Y - 0.1, 0], [X0 + L / 2, Y - 0.25, 0]);
  }
  function captions(t, cap) {
    cap.draw('T₂ − T₁ = (Δm)a', t, C[1] + 0.3, 6.9, { y: 1500, size: 70 });
    cap.draw('Δm → 0  ⇒  T₁ = T₂', t, 6.9, C[2], { y: 1500, size: 66 });
    cap.draw('same T at both ends', t, C[2] + 0.6, C[3], { y: 1500, size: 60 });
  }
  return { group: g, update, captions, background: LAB.bg };
}
