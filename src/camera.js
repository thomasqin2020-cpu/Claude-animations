import * as THREE from 'three';
import { easeInOut, span } from './timeline.js';

// Eased dolly between two camera setups over [a, b]. Everything is a function of t.
const P = new THREE.Vector3(), L = new THREE.Vector3();
export function dolly(cam, t, a, b, from, to, lookFrom, lookTo = lookFrom, ease = easeInOut) {
  const u = ease(span(t, a, b));
  P.set(...from).lerp(L.set(...to), u); cam.position.copy(P);
  P.set(...lookFrom).lerp(L.set(...lookTo), u); cam.lookAt(P);
}
export function fixed(cam, pos, look) { cam.position.set(...pos); cam.lookAt(...look); }
// Orbit around `center` at `radius`, height `h`, angle sweeping from a0 to a1 over [a,b].
export function orbit(cam, t, a, b, center, radius, h, a0, a1, lookY = center[1]) {
  const u = easeInOut(span(t, a, b)); const ang = a0 + (a1 - a0) * u;
  cam.position.set(center[0] + Math.cos(ang) * radius, center[1] + h, center[2] + Math.sin(ang) * radius);
  cam.lookAt(center[0], lookY, center[2]);
}
