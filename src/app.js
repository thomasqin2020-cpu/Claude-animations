// Shared runtime for every video. A video's main.js calls runVideo() with its scene list;
// everything else (renderer, deterministic seek, capture, validation, preview) lives here.
import * as THREE from 'three';
import { FPS, WIDTH, HEIGHT, makeTimeline } from './timeline.js';
import { createCaptions } from './captions.js';
import { validateScene } from './validate.js';

/**
 * @param {object} cfg
 * @param {{name:string,start:number,end:number,scene:{group:THREE.Group,update:Function,captions?:Function},bg:number}[]} cfg.scenes
 * @param {{duration:number,cues:{start:number,end:number,text:string}[]}} cfg.narration
 * @param {string} cfg.audio  URL of the narration file for the preview player
 * @param {number} [cfg.fov]  vertical field of view in degrees (default 40)
 */
export function runVideo(cfg) {
  const glCanvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cfg.exposure ?? 1.05;

  const captions = createCaptions(document.getElementById('captions'));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov ?? 40, WIDTH / HEIGHT, 0.05, 300);
  for (const s of cfg.scenes) scene.add(s.scene.group);
  const END = Math.ceil(cfg.narration.duration * FPS) / FPS;
  const timeline = makeTimeline(cfg.scenes.map((s) => ({ ...s, end: s.end ?? END })));

  function fitStage() {
    const k = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
    const stage = document.getElementById('stage');
    stage.style.width = WIDTH + 'px'; stage.style.height = HEIGHT + 'px';
    stage.style.transform = `translate(-50%,-50%) scale(${k})`;
  }
  window.addEventListener('resize', fitStage); fitStage();

  const bg = new THREE.Color();
  function renderFrame(frame) {
    const t = frame / FPS;
    const active = timeline.sceneAt(t);
    // Several timeline entries may share one group (e.g. return to a location), so hide all, then show the active one.
    for (const s of timeline.scenes) s.scene.group.visible = false;
    active.scene.group.visible = true;
    scene.background = bg.set(active.bg ?? 0x000000);
    active.scene.update(t, camera);          // absolute time: cue times are global
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
    const audio = new Audio(cfg.audio); audio.loop = true;
    const start = () => { audio.play(); const t0 = performance.now(); const loop = () => { renderFrame(Math.floor(((performance.now() - t0) / 1000) * FPS) % timeline.frames); requestAnimationFrame(loop); }; loop(); };
    document.body.addEventListener('click', start, { once: true });
    renderFrame(0);
  } else {
    renderFrame(Number(params.get('frame') || 0));
  }
  window.__animReady = true;
}
