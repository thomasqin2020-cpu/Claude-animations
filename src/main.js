import * as THREE from 'three';
import { FPS, WIDTH, HEIGHT, makeTimeline } from './timeline.js';
import { createCaptions } from './captions.js';
import { validateScene } from './validate.js';
import { buildPlaceholder } from './scenes/placeholder.js';

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
scene.background = new THREE.Color(0x9ed3f0);
scene.fog = new THREE.Fog(0x9ed3f0, 18, 60);
const camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 0.1, 200);

const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
sun.position.set(6, 12, 5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 50;
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x4f6b3a, 0.9));
const rim = new THREE.DirectionalLight(0xcfe8ff, 0.8); rim.position.set(-6, 5, -6); scene.add(rim);

// ---------------------------------------------------------------------------
// Scenes. Each has [start, end) in seconds and an update(localT, camera).
// ---------------------------------------------------------------------------
const placeholder = buildPlaceholder(); scene.add(placeholder.group);
const timeline = makeTimeline([
  { name: 'placeholder', start: 0, end: 8, node: placeholder.group, update: placeholder.update }
]);

// Fit the vertical frame on screen for preview; the drawing buffer stays 1080x1920.
function fitStage() {
  const s = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  const stage = document.getElementById('stage');
  stage.style.width = WIDTH + 'px'; stage.style.height = HEIGHT + 'px';
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
window.addEventListener('resize', fitStage); fitStage();

// ---------------------------------------------------------------------------
// Deterministic seek: render exactly one frame of the master timeline.
// ---------------------------------------------------------------------------
function renderFrame(frame) {
  const t = frame / FPS;
  const active = timeline.sceneAt(t);
  for (const s of timeline.scenes) s.node.visible = (s === active);
  active.update(t - active.start, camera, t);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  captions.clear();
  if (active.captions) active.captions(t - active.start, captions);
}

window.__anim = {
  fps: FPS, width: WIDTH, height: HEIGHT, frames: timeline.frames, duration: timeline.duration,
  seek: (f) => { renderFrame(f); return true; },
  validate: () => { const r = validateScene(scene); r.triangles = renderer.info.render.triangles; return r; },
  // Returns the composited frame (3D + captions) as a PNG data URL.
  capture: () => {
    const out = document.createElement('canvas'); out.width = WIDTH; out.height = HEIGHT;
    const ctx = out.getContext('2d');
    ctx.drawImage(glCanvas, 0, 0); ctx.drawImage(document.getElementById('captions'), 0, 0);
    return out.toDataURL('image/png');
  }
};

// Preview mode (?preview=1): play through in real time, looping. Still frame-indexed,
// so what you see matches the render frame for frame.
const params = new URLSearchParams(location.search);
if (params.get('preview')) {
  const t0 = performance.now();
  const loop = () => { const f = Math.floor(((performance.now() - t0) / 1000) * FPS) % timeline.frames; renderFrame(f); requestAnimationFrame(loop); };
  loop();
} else {
  renderFrame(Number(params.get('frame') || 0));
}
window.__animReady = true;
window.__dbg = { scene, camera, renderer };
