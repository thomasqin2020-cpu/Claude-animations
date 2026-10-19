import * as THREE from 'three';
import { FPS, WIDTH, HEIGHT, makeTimeline } from './timeline.js';
import { createCaptions } from './captions.js';
import { validateScene } from './validate.js';
import { NARRATION } from './narration.js';
import { buildSurface } from './scenes/surface.js';
import { buildEarthMicro } from './scenes/earthMicro.js';
import { buildMoonMicro } from './scenes/moonMicro.js';
import { buildDamage } from './scenes/damage.js';

// ---------------------------------------------------------------------------
// Renderer: fixed 1080x1920 drawing buffer regardless of window size so the
// preview and the headless render see exactly the same pixels.
// ---------------------------------------------------------------------------
const glCanvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const captions = createCaptions(document.getElementById('captions'));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 0.05, 300);

// ---------------------------------------------------------------------------
// Scenes, scheduled on the narration cue times (see script/narration.txt and
// src/narration.js). Cue N = NARRATION.cues[N].start.
// ---------------------------------------------------------------------------
const C = NARRATION.cues.map((c) => c.start);
const surface = buildSurface(), earthMicro = buildEarthMicro(), moonMicro = buildMoonMicro(), damage = buildDamage();
for (const s of [surface, earthMicro, moonMicro, damage]) scene.add(s.group);
const END = Math.ceil(NARRATION.duration * FPS) / FPS;
const timeline = makeTimeline([
  { name: 'A surface walk',  start: 0,     end: C[2],  scene: surface,    bg: 0x000000 },
  { name: 'B earth micro',   start: C[2],  end: C[3],  scene: earthMicro, bg: earthMicro.background },
  { name: 'C moon micro',    start: C[3],  end: C[6],  scene: moonMicro,  bg: 0x000000 },
  { name: 'D damage',        start: C[6],  end: C[7],  scene: damage,     bg: damage.background },
  { name: 'E brush + payoff', start: C[7], end: END,   scene: surface,    bg: 0x000000 }
]);

function fitStage() {
  const s = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  const stage = document.getElementById('stage');
  stage.style.width = WIDTH + 'px'; stage.style.height = HEIGHT + 'px';
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
window.addEventListener('resize', fitStage); fitStage();

const bg = new THREE.Color();
function renderFrame(frame) {
  const t = frame / FPS;
  const active = timeline.sceneAt(t);
  for (const s of timeline.scenes) s.scene.group.visible = false;
  active.scene.group.visible = true;
  scene.background = bg.set(active.bg);
  // Scene update functions take absolute time: cue times are global, so this keeps the code readable.
  active.scene.update(t, camera);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  captions.clear();
  if (active.scene.captions) active.scene.captions(t, captions);
}

window.__anim = {
  fps: FPS, width: WIDTH, height: HEIGHT, frames: Math.round(END * FPS), duration: END,
  seek: (f) => { renderFrame(f); return true; },
  validate: () => { const r = validateScene(scene); r.triangles = renderer.info.render.triangles; return r; },
  capture: () => {
    const out = document.createElement('canvas'); out.width = WIDTH; out.height = HEIGHT;
    const ctx = out.getContext('2d');
    ctx.drawImage(glCanvas, 0, 0); ctx.drawImage(document.getElementById('captions'), 0, 0);
    return out.toDataURL('image/png');
  }
};
window.__dbg = { scene, camera, renderer, timeline };

const params = new URLSearchParams(location.search);
if (params.get('preview')) {
  // Real-time preview with the narration playing in sync (frame-indexed, so it matches the render).
  const audio = new Audio('/audio/narration.wav'); audio.loop = true;
  const start = () => { audio.play(); const t0 = performance.now(); const loop = () => { renderFrame(Math.floor(((performance.now() - t0) / 1000) * FPS) % timeline.frames); requestAnimationFrame(loop); }; loop(); };
  document.body.addEventListener('click', start, { once: true });
  renderFrame(0);
} else {
  renderFrame(Number(params.get('frame') || 0));
}
window.__animReady = true;
