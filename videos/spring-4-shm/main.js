// Spring Force 4: mass on a spring, omega = sqrt(k/m), vertical spring. C[n] = start of line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildOscillator } from './scenes/oscillator.js';
import { buildRecorder } from './scenes/recorder.js';
import { buildVertical } from './scenes/vertical.js';

const C = NARRATION.cues.map((c) => c.start);
const osc = buildOscillator(C), rec = buildRecorder(C), vert = buildVertical(C);

runVideo({
  narration: NARRATION,
  audio: '/videos/spring-4-shm/audio/narration.wav',
  scenes: [
    { name: 'oscillator', start: 0,    end: C[2], scene: osc,  bg: osc.background },
    { name: 'recorder',   start: C[2], end: C[5], scene: rec,  bg: rec.background },
    { name: 'two lanes',  start: C[5], end: C[6], scene: osc,  bg: osc.background },
    { name: 'vertical',   start: C[6],            scene: vert, bg: vert.background }
  ]
});
