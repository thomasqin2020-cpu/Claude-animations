import * as THREE from 'three';
import { box, mat } from '../materials.js';

// Simplified Apollo lunar module: octagonal descent stage on four legs, boxy ascent stage.
export function createLunarModule() {
  const g = new THREE.Group(); g.name = 'lunarModule';
  const foil = mat(0xc9a53a, { roughness: 0.5, metalness: 0.15 });
  const foilDark = mat(0x3a3f4a, { roughness: 0.7, metalness: 0.1 });
  const silver = mat(0xd8d9dc, { roughness: 0.5, metalness: 0.15 });
  const descent = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.5, 8), foil); descent.position.y = 1.6; descent.castShadow = descent.receiveShadow = true; g.add(descent);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.5, 8), foilDark); skirt.position.y = 0.6; g.add(skirt);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 0.7, 10), foilDark); nozzle.position.y = 0.55; g.add(nozzle);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = new THREE.Group(); leg.position.set(Math.cos(a) * 1.9, 1.3, Math.sin(a) * 1.9); leg.rotation.y = -a;
    const strut = box(0.16, 2.3, 0.16, silver, 0.03); strut.rotation.z = -0.55; strut.position.set(0.75, -0.75, 0); leg.add(strut);
    const brace = box(0.1, 1.5, 0.1, silver, 0.02); brace.rotation.z = -1.1; brace.position.set(0.9, -0.2, 0); leg.add(brace);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 10), silver); pad.position.set(1.95, -1.78, 0); pad.receiveShadow = true; leg.add(pad);
    g.add(leg);
  }
  const ascent = box(2.4, 1.6, 2.0, silver, 0.1); ascent.position.y = 3.2; g.add(ascent);
  const cabin = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.2, 8), silver); cabin.rotation.z = Math.PI / 2; cabin.position.set(0, 3.3, 0.6); cabin.castShadow = true; g.add(cabin);
  for (const s of [-1, 1]) { const w = box(0.4, 0.4, 0.1, mat(0x101418), 0.03); w.position.set(s * 0.45, 3.5, 1.62); w.rotation.x = -0.25; g.add(w); }
  const hatch = box(0.7, 0.7, 0.1, foilDark, 0.03); hatch.position.set(0, 2.9, 1.62); g.add(hatch);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), silver); dish.position.set(1.0, 4.2, -0.4); dish.rotation.x = Math.PI; g.add(dish);
  const dishPole = box(0.06, 0.6, 0.06, silver, 0.01); dishPole.position.set(1.0, 4.3, -0.4); g.add(dishPole);
  const ladder = new THREE.Group(); ladder.position.set(0, 1.3, 2.55); ladder.rotation.x = 0.0;
  for (let i = 0; i < 6; i++) { const rung = box(0.5, 0.05, 0.05, silver, 0.01); rung.position.y = -1.0 + i * 0.4; ladder.add(rung); }
  for (const s of [-1, 1]) { const rail = box(0.05, 2.3, 0.05, silver, 0.01); rail.position.set(s * 0.25, 0, 0); ladder.add(rail); }
  ladder.rotation.z = 0; ladder.rotation.x = -0.35; g.add(ladder);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
