// Clamped-tower toothpick suspension bridge: how it carries load and how it fails. Silent.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildBridge } from './scenes/bridge.js';

const C = NARRATION.cues.map((c) => c.start);
const bridge = buildBridge(C);

runVideo({
  narration: NARRATION,
  audio: '',
  subtitles: false,
  scenes: [{ name: 'A bridge', start: 0, scene: bridge, bg: 0x141b28 }]
});
