// 2D caption layer drawn on an overlay canvas. Kept inside the vertical safe area
// (top 15% and bottom 25% avoided) so YouTube UI never covers it.
import { WIDTH, HEIGHT, span, easeOut } from './timeline.js';

export function createCaptions(canvas) {
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  return {
    clear() { ctx.clearRect(0, 0, WIDTH, HEIGHT); },
    // Draws `text` fading in over 0.3 s from `start`, out over 0.3 s before `end`.
    draw(text, t, start, end, opts = {}) {
      if (t < start || t > end) return;
      const a = Math.min(easeOut(span(t, start, start + 0.3)), easeOut(span(end, t, t + 0.3)) , 1);
      const alpha = Math.min(a, 1 - span(t, end - 0.3, end));
      const y = opts.y ?? HEIGHT * 0.78, size = opts.size ?? 72;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `800 ${size}px "Inter", "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const lines = String(text).split('\n');
      lines.forEach((line, i) => {
        const yy = y + (i - (lines.length - 1) / 2) * size * 1.2;
        ctx.lineWidth = size * 0.22; ctx.strokeStyle = 'rgba(10,14,24,0.85)'; ctx.strokeText(line, WIDTH / 2, yy);
        ctx.fillStyle = opts.color ?? '#ffffff'; ctx.fillText(line, WIDTH / 2, yy);
      });
      ctx.restore();
    }
  };
}
