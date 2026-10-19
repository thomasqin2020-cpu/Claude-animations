// Spring Force 3: tension in an ideal spring; series and parallel. C[n] = start of line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildStrand } from './scenes/strand.js';
import { buildRigs } from './scenes/rigs.js';
import { buildCompare } from './scenes/compare.js';

const C = NARRATION.cues.map((c) => c.start);
const strand = buildStrand(C), rigs = buildRigs(C), compare = buildCompare(C);

runVideo({
  narration: NARRATION,
  audio: '/videos/spring-3-tension/audio/narration.wav',
  scenes: [
    { name: 'strand',  start: 0,    end: C[3], scene: strand,  bg: strand.background },
    { name: 'rigs',    start: C[3], end: C[7], scene: rigs,    bg: rigs.background },
    { name: 'compare', start: C[7],            scene: compare, bg: compare.background }
  ]
});
