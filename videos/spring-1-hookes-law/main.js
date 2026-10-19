// Spring Force 1: Hooke's law and why it is linear. C[n] = start of narration line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildBench } from './scenes/bench.js';
import { buildWell } from './scenes/well.js';

const C = NARRATION.cues.map((c) => c.start);
const bench = buildBench(C), well = buildWell(C);

runVideo({
  narration: NARRATION,
  audio: '/videos/spring-1-hookes-law/audio/narration.wav',
  scenes: [
    { name: 'bench', start: 0,    end: C[4], scene: bench, bg: bench.background },
    { name: 'well',  start: C[4], end: 34.0, scene: well,  bg: well.background },
    { name: 'bench end', start: 34.0,       scene: bench, bg: bench.background }
  ]
});
