// 2D caption layer drawn on an overlay canvas. Kept inside the vertical safe area
// (top 15% and bottom 25% avoided) so YouTube UI never covers it.
import { WIDTH, HEIGHT, span, easeOut } from './timeline.js';

export function createCaptions(canvas) {
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
      ctx.translate(WIDTH / 2, y); ctx.scale(pop, pop);
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
    // Burned-in subtitle for the narration line active at REAL time t. Word-wrapped to the
    // central safe width, placed in the top band (below the Shorts title area). Words fill
    // from dim to white across the line's duration, a karaoke-style progress cue.
    subtitle(cues, t, opts = {}) {
      const cue = cues.find((c) => t >= c.start - 0.15 && t <= c.end + 0.35);
      if (!cue) return;
      const size = opts.size ?? 44, maxW = opts.maxWidth ?? 860, y0 = opts.y ?? 258;
      ctx.save();
      ctx.globalAlpha = Math.min(1, easeOut(span(t, cue.start - 0.15, cue.start + 0.1)), 1 - span(t, cue.end + 0.15, cue.end + 0.35));
      ctx.font = `800 ${size}px "Inter", "Helvetica Neue", Arial, sans-serif`;
      ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      const words = cue.text.split(/\s+/); const lines = []; let cur = [];
      for (const w of words) { const test = [...cur, w].join(' '); if (ctx.measureText(test).width > maxW && cur.length) { lines.push(cur); cur = [w]; } else cur.push(w); }
      if (cur.length) lines.push(cur);
      const progress = span(t, cue.start, cue.end) * words.length; let idx = 0;
      lines.forEach((ln, li) => {
        const text = ln.join(' '); const width = ctx.measureText(text).width; let x = WIDTH / 2 - width / 2; const y = y0 + (li - (lines.length - 1) / 2) * size * 1.25;
        for (const w of ln) {
          const lit = idx < progress; idx++;
          ctx.lineWidth = size * 0.22; ctx.strokeStyle = 'rgba(8,10,16,0.9)'; ctx.strokeText(w, x, y);
          ctx.fillStyle = lit ? (opts.color ?? '#ffffff') : 'rgba(255,255,255,0.45)'; ctx.fillText(w, x, y);
          x += ctx.measureText(w + ' ').width;
        }
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
