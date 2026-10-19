import * as THREE from 'three';
import { box, mat } from '../materials.js';

// Paper strip scrolling in -y (down) under a pen. Trace samples x(t_i) placed at
// y = -(t - t_i) * speed, so the trace is a closed-form function of t.
export function createChartRecorder(opts = {}) {
  const g = new THREE.Group(); g.name = 'recorder';
  const width = opts.width ?? 1.6, height = opts.height ?? 3.2, speed = opts.speed ?? 0.5, dt = opts.dt ?? 1 / 30, maxN = Math.ceil(height / speed / dt) + 2;
  const paper = box(width, height, 0.04, 0xf3efe4, 0.01); paper.position.y = -height / 2; paper.receiveShadow = true; g.add(paper);
  for (let i = 1; i < 8; i++) { const line = box(width * 0.96, 0.006, 0.01, mat(0xcfd6e0), 0.001); line.position.set(0, -height * i / 8, 0.025); g.add(line); }
  const axis = box(0.012, height, 0.01, mat(0x9aa3b5), 0.001); axis.position.set(0, -height / 2, 0.026); g.add(axis);
  const trace = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 6), mat(opts.color ?? 0x2ec4b6, { emissive: opts.color ?? 0x2ec4b6, emissiveIntensity: 0.5 }), maxN); trace.frustumCulled = false; g.add(trace);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 0);
  // xFn(t) in world units across the strip; t0 = when recording starts
  g.update = (t, xFn, t0) => {
    for (let i = 0; i < maxN; i++) {
      const ti = t - i * dt;
      if (ti < t0 || i * dt * speed > height) { trace.setMatrixAt(i, M.compose(Z, Q, Z)); continue; }
      P.set(xFn(ti), -i * dt * speed, 0.04); trace.setMatrixAt(i, M.compose(P, Q, S));
    }
    trace.instanceMatrix.needsUpdate = true;
  };
  return g;
}
