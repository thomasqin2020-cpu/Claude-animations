// 2D caption layer drawn on an overlay canvas. Kept inside the vertical safe area
// (top 15% and bottom 25% avoided) so YouTube UI never covers it.
import { WIDTH as W0, HEIGHT as H0, span, easeOut } from './timeline.js';

export function createCaptions(canvas, WIDTH = W0, HEIGHT = H0) {
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const alphaIn = (t, start, end) => Math.min(easeOut(span(t, start, start + 0.25)), 1 - easeOut(span(t, end - 0.25, end)));
  return {
    ctx,
    clear() { ctx.clearRect(0, 0, WIDTH, HEIGHT); },
    draw(text, t, start, end, opts = {}) {
      if (t < start || t > end) return;
      const alpha = alphaIn(t, start, end);
      const y = opts.y ?? HEIGHT * 0.76, size = opts.size ?? 76;
      const pop = 1 + 0.06 * (1 - easeOut(span(t, start, start + 0.25)));
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.translate(opts.x ?? WIDTH / 2, y); ctx.scale(pop, pop);
      ctx.font = `800 ${size}px "Inter", "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      const lines = String(text).split('\n');
      lines.forEach((line, i) => {
        const yy = (i - (lines.length - 1) / 2) * size * 1.18;
        ctx.lineWidth = size * 0.24; ctx.strokeStyle = 'rgba(8,10,16,0.88)'; ctx.strokeText(line, 0, yy);
        ctx.fillStyle = opts.color ?? '#ffffff'; ctx.fillText(line, 0, yy);
      });
      ctx.restore();
    },
    // Horizontal gauge with a label; value is 0..1 and already a function of t.
    gauge(label, value, t, start, end, opts = {}) {
      if (t < start || t > end) return;
      const alpha = alphaIn(t, start, end);
      const w = 640, h = 46, x = (WIDTH - w) / 2, y = opts.y ?? HEIGHT * 0.70;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.font = `800 46px "Inter", "Helvetica Neue", Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(8,10,16,0.88)'; ctx.strokeText(label, WIDTH / 2, y - 14); ctx.fillStyle = '#fff'; ctx.fillText(label, WIDTH / 2, y - 14);
      ctx.fillStyle = 'rgba(8,10,16,0.85)'; roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 14); ctx.fill();
      const col = value > 0.5 ? '#5bd36b' : value > 0.25 ? '#f0c34a' : '#e5483c';
      ctx.fillStyle = col; roundRect(ctx, x, y, Math.max(8, w * value), h, 10); ctx.fill();
      ctx.restore();
    }
  };
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
