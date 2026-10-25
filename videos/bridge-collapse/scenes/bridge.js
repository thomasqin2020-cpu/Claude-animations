// Units: 1 = 10 cm. x along span, y up, z across the bridge. Everything is a pure function of t.
import * as THREE from 'three';
import { box, mat } from '/src/materials.js';
import { lerp, easeInOut, easeIn, easeOut, span, pulse, rng, clamp01 } from '/src/timeline.js';
import { dolly } from '/src/camera.js';

const WOOD = 0xe8c27a, BLOCK = 0xc28d55, TABLE = 0x8a9099;
const DECK_Y = 1.05, TRUSS_H = 0.18, ZS = [-0.4, 0.4], TH = 0.045;
const X_IN = 1.465, X_OUT = 2.035, TOP_Y = 1.95, LOW_Y = 1.36;
const HANGER_X = [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05];
const unit = new THREE.BoxGeometry(1, 1, 1);
const X = new THREE.Vector3(1, 0, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3();

function setStick(m, a, b, th) {
  A.set(...a); B.set(...b); D.subVectors(B, A); const len = Math.max(1e-4, D.length());
  m.position.addVectors(A, B).multiplyScalar(0.5); m.scale.set(len, th, th);
  m.quaternion.setFromUnitVectors(X, D.normalize());
}
function stick(parent, a, b, material, th = TH) {
  const m = new THREE.Mesh(unit, material); m.castShadow = true; m.receiveShadow = true;
  setStick(m, a, b, th); parent.add(m); return m;
}
const rot = (px, py, rx, ry, a) => [px + rx * Math.cos(a) - ry * Math.sin(a), py + rx * Math.sin(a) + ry * Math.cos(a)];

export function buildBridge(C) {
  const T_LOAD = C[2], T_RAMP = C[3], T_SNAP = 14.0, T_DECK = 14.6, T_DROP = 15.7;
  const g = new THREE.Group(); g.name = 'scene_bridge';
  const wood = mat(WOOD, { roughness: 0.7 });

  // Tables and the test block (square frame).
  for (const s of [-1, 1]) {
    const top = box(4.7, 0.15, 6, TABLE, 0.02); top.position.set(s * 3.65, -0.075, 0); g.add(top);
    for (const lz of [-2.6, 2.6]) { const leg = box(0.2, 6, 0.2, 0x6b7078, 0.02); leg.position.set(s * 5.6, -3.15, lz); g.add(leg); }
  }
  for (const s of [-1, 1]) {
    const end = box(0.5, 1, 4, BLOCK, 0.015); end.position.set(s * 1.75, 0.5, 0); g.add(end);
    const side = box(3, 1, 0.5, BLOCK, 0.015); side.position.set(0, 0.5, s * 1.75); g.add(side);
  }

  // Deck: two halves hinged at the inner rim edges so the midspan break reads clearly.
  const halves = [-1, 1].map((s) => {
    const h = new THREE.Group(); h.position.set(s * 1.5, DECK_Y, 0); g.add(h);
    const lx = (wx) => wx - s * 1.5; // world x -> local x
    const x0 = s * 2.1, x1 = 0;
    for (const z of ZS) {
      stick(h, [lx(x0), 0, z], [lx(x1), 0, z], wood, 0.06);
      stick(h, [lx(s * 1.75), TRUSS_H, z], [lx(x1), TRUSS_H, z], wood);
      const nodes = [1.75, 1.4, 1.05, 0.7, 0.35, 0].map((v) => s * v);
      for (let i = 0; i < nodes.length - 1; i++) {
        stick(h, [lx(nodes[i]), i % 2 ? TRUSS_H : 0, z], [lx(nodes[i + 1]), i % 2 ? 0 : TRUSS_H, z], wood, 0.035);
        stick(h, [lx(nodes[i + 1]), 0, z], [lx(nodes[i + 1]), TRUSS_H, z], wood, 0.035);
      }
    }
    for (const v of [2.05, 1.75, 1.4, 1.05, 0.7, 0.35, 0.03]) stick(h, [lx(s * v), 0, -0.4], [lx(s * v), 0, 0.4], wood, 0.04);
    for (const [a, b] of [[1.75, 1.05], [1.05, 0.35]]) {
      stick(h, [lx(s * a), 0, -0.4], [lx(s * b), 0, 0.4], wood, 0.03);
      stick(h, [lx(s * a), 0, 0.4], [lx(s * b), 0, -0.4], wood, 0.03);
    }
    return h;
  });

  // Towers: per end, 4 columns straddling the end wall (inner deeper than outer).
  const towers = [-1, 1].map((s) => {
    const tw = new THREE.Group(); tw.position.set(s * 1.5, 1.0, 0); g.add(tw);
    const L = (wx, wy) => [wx - s * 1.5, wy - 1.0];
    for (const z of ZS) {
      const [ix, iy0] = L(s * X_IN, 0.2), [, ty] = L(0, TOP_Y), [ox, oy0] = L(s * X_OUT, 0.55);
      stick(tw, [ix, iy0, z], [ix, ty, z], wood, 0.07);
      stick(tw, [ox, oy0, z], [ox, ty, z], wood, 0.07);
      stick(tw, [ix, ty, z], [ox, ty, z], wood, 0.05);
      stick(tw, [ix, 0.25, z], [ox, ty - 0.05, z], wood, 0.035);
    }
    for (const xx of [s * X_IN, s * X_OUT]) {
      const [lxx] = L(xx, 0);
      stick(tw, [lxx, TOP_Y - 1.0, -0.4], [lxx, TOP_Y - 1.0, 0.4], wood, 0.05);
      stick(tw, [lxx, 0.55, -0.4], [lxx, 0.55, 0.4], wood, 0.04);
    }
    return tw;
  });

  // Fishing line: cables, hangers, bottom ties. Own materials so colour can track tension.
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xeef3ff, roughness: 0.4, emissive: 0x222222 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 0.4, emissive: 0x1a1a1a });
  const NSEG = 28;
  const cables = ZS.map(() => Array.from({ length: NSEG }, () => stick(g, [0, 0, 0], [1, 0, 0], lineMat, 0.022)));
  const hangers = ZS.map(() => HANGER_X.map(() => stick(g, [0, 0, 0], [1, 0, 0], lineMat, 0.014)));
  const ties = ZS.map(() => stick(g, [0, 0, 0], [1, 0, 0], tieMat, 0.016));

  // Load: plate, hook, bucket with growing sand.
  const plate = box(0.5, 0.03, 0.5, 0x9aa3ad, 0.01); g.add(plate);
  const hook = stick(g, [0, 0, 0], [1, 0, 0], mat(0x50565e, { metalness: 0.2, roughness: 0.4 }), 0.025);
  const bucket = new THREE.Group(); g.add(bucket);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.6, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x3d7bd9, side: THREE.DoubleSide, roughness: 0.6 }));
  shell.position.y = -0.3; shell.castShadow = true; bucket.add(shell);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), mat(0x2f62b0)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -0.6; bucket.add(bottom);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 1, 24), mat(0xd8b46a)); bucket.add(sand);

  // Failure effects: flash at the left joints, splinters at midspan.
  const flashes = ZS.map(() => { const f = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0 })); g.add(f); return f; });
  const R = rng(7);
  const shards = Array.from({ length: 26 }, () => {
    const m = box(0.09, 0.02, 0.02, WOOD, 0.005); g.add(m);
    return { m, vx: (R() - 0.5) * 2.4, vy: 1 + R() * 2, vz: (R() - 0.5) * 1.6, sp: (R() - 0.5) * 20, z: ZS[R() < 0.5 ? 0 : 1] };
  });

  // Lights.
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(7, 11, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; g.add(sun);
  g.add(new THREE.HemisphereLight(0xc8ddff, 0x3a3f4a, 1.1));

  const white = new THREE.Color(0xeef3ff), red = new THREE.Color(0xff3b2f), slackC = new THREE.Color(0xaab2bf);

  function state(t) {
    const L = t < T_LOAD ? 0 : lerp(0.15, 1, easeInOut(span(t, T_RAMP - 0.5, T_SNAP)));
    const snapped = t >= T_SNAP;
    const theta = !snapped || t < T_DECK ? 0.022 * L : 0.022 + 1.0 * easeIn(span(t, T_DECK, T_DROP));
    const phi = !snapped ? 0.04 * L : 0.04 * Math.exp(-6 * (t - T_SNAP)) * Math.cos(18 * (t - T_SNAP));
    return { L, snapped, theta, phi };
  }
  // World position of a point on the deck (side z, height above stringer yy) at world x.
  function deckPt(x, yy, theta) {
    const s = x < 0 ? -1 : 1; const a = s < 0 ? -theta : theta;
    const [wx, wy] = rot(s * 1.5, DECK_Y, x - s * 1.5, yy, a); return [wx, wy];
  }
  function towerTop(s, phi) { return rot(s * 1.5, 1.0, s * X_IN - s * 1.5, TOP_Y - 1.0, s * phi); }

  function update(t, cam) {
    const { L, snapped, theta, phi } = state(t);
    halves[0].rotation.z = -theta; halves[1].rotation.z = theta;
    towers[0].rotation.z = -phi; towers[1].rotation.z = phi;

    // Cable colour: white -> red with load; grey once slack.
    lineMat.color.copy(snapped ? slackC : white.clone().lerp(red, L));
    lineMat.emissive.set(snapped ? 0x111111 : 0x222222).lerp(red, snapped ? 0 : 0.35 * L * L);
    tieMat.color.copy(white).lerp(red, snapped ? 0 : 0.6 * L);

    const [lx0, ly0] = towerTop(-1, phi), [rx0, ry0] = towerTop(1, phi);
    const k = easeOut(span(t, T_SNAP, T_SNAP + 0.55));
    ZS.forEach((z, zi) => {
      const pts = [];
      for (let i = 0; i <= NSEG; i++) {
        const u = i / NSEG;
        const x = lerp(lx0, rx0, u);
        const yTaut = lerp(ly0, ry0, u) - 4 * (lerp(ly0, ry0, 0.5) - (LOW_Y - 0.06 * L)) * u * (1 - u);
        let p = [x, yTaut];
        if (snapped) {
          // Slack cable: left end recoils and the line drapes on the deck, still tied at the right tower.
          const xs = lerp(-1.4, rx0, u);
          const [, dy] = deckPt(xs === 0 ? 1e-3 : xs, TRUSS_H + 0.03, theta);
          const ys = u > 0.85 ? lerp(dy, ry0, (u - 0.85) / 0.15) : dy;
          const [dx] = deckPt(xs === 0 ? 1e-3 : xs, TRUSS_H + 0.03, theta);
          const whip = 0.5 * Math.sin(Math.PI * u) * pulse(t, T_SNAP, T_SNAP + 0.5) * (1 - u);
          p = [lerp(x, u > 0.85 ? xs : dx, k), lerp(yTaut, ys, k) + whip];
        }
        pts.push(p);
      }
      cables[zi].forEach((m, i) => setStick(m, [pts[i][0], pts[i][1], z], [pts[i + 1][0], pts[i + 1][1], z], 0.022));
      hangers[zi].forEach((m, hi) => {
        const hx = HANGER_X[hi] === 0 ? 1e-3 : HANGER_X[hi];
        const [dx, dy] = deckPt(hx, TRUSS_H, theta);
        const u = (HANGER_X[hi] + X_IN) / (2 * X_IN), j = Math.round(u * NSEG);
        const cy = snapped ? dy + 0.001 : pts[j][1];
        m.visible = !snapped || k < 0.9;
        setStick(m, [dx, dy, z], [snapped ? dx : pts[j][0], snapped ? lerp(cy, dy, k) + 0.001 : cy, z], 0.014);
      });
      setStick(ties[zi], [-X_IN + 0.04 * phi, 0.22, z], [X_IN - 0.04 * phi, 0.22, z], 0.016);
    });

    // Load hardware.
    const vis = t >= T_LOAD;
    plate.visible = hook.visible = bucket.visible = vis;
    const [tx, ty] = deckPt(-1e-3, 0, theta);
    const drop = Math.max(0, t - T_DROP);
    const appear = easeOut(span(t, T_LOAD, T_LOAD + 0.6));
    const by = ty - 2.0 - 10 * drop * drop + (1 - appear) * 1.2;
    const bx = drop > 0 ? tx + 0.3 * drop : tx;
    plate.position.set(tx, ty + 0.05, 0); plate.rotation.z = drop > 0 ? -0.5 : -theta * 0.5;
    if (drop > 0) plate.position.y = ty + 0.05 - 10 * drop * drop;
    setStick(hook, [bx, by, 0], [drop > 0 ? bx : tx, drop > 0 ? by + 2.0 : ty, 0], 0.025);
    bucket.position.set(bx, by, 0);
    const fill = 0.08 + 0.45 * L; sand.scale.y = fill; sand.position.y = -0.6 + fill / 2;

    // Flashes and splinters.
    flashes.forEach((f) => { const o = pulse(t, T_SNAP - 0.05, T_SNAP + 0.35); f.material.opacity = 0.85 * o; f.scale.setScalar(0.03 + 0.09 * o); });
    flashes[0].position.set(lx0, ly0, ZS[0]); flashes[1].position.set(lx0, ly0, ZS[1]);
    shards.forEach((sh) => {
      const dt = t - T_DECK - 0.15; sh.m.visible = dt > 0 && dt < 1.6;
      if (sh.m.visible) { sh.m.position.set(sh.vx * dt, DECK_Y + sh.vy * dt - 4.9 * dt * dt, sh.z + sh.vz * dt); sh.m.rotation.set(sh.sp * dt, sh.sp * 0.7 * dt, 0); }
    });

    // Camera.
    if (t < C[1]) dolly(cam, t, 0, C[1], [8.5, 5.2, 9.5], [6.8, 3.6, 8.2], [0, 0.4, 0], [0, 0.6, 0]);
    else if (t < C[2]) dolly(cam, t, C[1], C[2], [-0.2, 2.6, 3.6], [-0.6, 1.9, 3.0], [-1.75, 1.15, 0], [-1.75, 1.05, 0]);
    else if (t < C[4]) dolly(cam, t, C[2], C[4], [5.0, 4.6, 8.0], [4.2, 3.9, 6.9], [0, 0.6, 0], [0, 0.7, 0]);
    else if (t < C[5]) dolly(cam, t, C[4], C[5], [0.4, 2.7, 4.4], [0.9, 2.5, 4.8], [-0.9, 1.35, 0], [-0.6, 1.0, 0]);
    else dolly(cam, t, C[5], 21, [2.6, 7.2, 5.2], [4.6, 8.0, 7.2], [0, -0.3, 0], [0, 0.0, 0]);
  }

  function captions(t, cap) {
    const y = 1500;
    cap.draw('Clamped-tower\nsuspension bridge', t, 0.3, C[1], { y, size: 70 });
    cap.draw('8 columns straddle\nthe block walls', t, C[1] + 0.2, C[2], { y, size: 70 });
    cap.draw('Load → hangers →\ncable → towers', t, C[2] + 0.6, C[3], { y, size: 70 });
    cap.draw('Load rising:\ncable tension climbs', t, C[3] + 0.1, T_SNAP - 0.1, { y, size: 70, color: '#ffb3a8' });
    cap.draw('Glued joint at the\ntower top lets go', t, T_SNAP, C[5], { y, size: 70, color: '#ffd36b' });
    cap.draw('Deck alone can\'t hold it:\nsnaps at midspan', t, C[5], C[6], { y, size: 66 });
    cap.draw('Fix: wrap and lash\nevery cable joint', t, C[6] + 0.2, 21, { y, size: 70, color: '#9fe6a0' });
  }
  return { group: g, update, captions };
}
