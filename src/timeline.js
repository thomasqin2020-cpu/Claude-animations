// Master timeline. Everything in the animation is a pure function of the frame
// index, so seeking to frame N always produces the same image.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// ---- easing ---------------------------------------------------------------
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => { t = clamp01(t); return 1 - (1 - t) * (1 - t) * (1 - t); };
export const easeIn = (t) => { t = clamp01(t); return t * t * t; };
export const smoother = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
// Normalised progress of t through [a, b].
export const span = (t, a, b) => clamp01((t - a) / (b - a));
// Smooth 0->1->0 pulse centred in [a, b].
export const pulse = (t, a, b) => { const u = span(t, a, b); return Math.sin(u * Math.PI); };

// ---- deterministic pseudo-random ------------------------------------------
// mulberry32: seeded so particle layouts are identical on every render.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- scene list -----------------------------------------------------------
// Each scene owns a time range [start, end) in seconds. The director picks the
// active scene for a given frame and hands it a local time so scene code never
// needs to know where it sits in the whole video.
export function makeTimeline(scenes) {
  const total = scenes.reduce((m, s) => Math.max(m, s.end), 0);
  return {
    scenes,
    duration: total,
    frames: Math.round(total * FPS),
    sceneAt(t) {
      for (const s of scenes) if (t >= s.start && t < s.end) return s;
      return scenes[scenes.length - 1];
    }
  };
}
