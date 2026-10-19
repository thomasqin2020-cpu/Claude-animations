// Spring Force 3: tension in an ideal spring; series and parallel. C[n] = start of line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { DESIGN } from './narration-design.js';
import { buildStrand } from './scenes/strand.js';
import { buildRigs } from './scenes/rigs.js';
import { buildCompare } from './scenes/compare.js';

// Scenes are authored on the DESIGN cue times; the runtime warps the real narration onto them.
const C = DESIGN.cues.map((c) => c.start);
const strand = buildStrand(C), rigs = buildRigs(C), compare = buildCompare(C);

runVideo({
  narration: NARRATION,
  design: DESIGN,
  audio: '/videos/spring-3-tension/audio/narration.wav',
  scenes: [
    { name: 'strand',  start: 0,    end: C[3], scene: strand,  bg: strand.background },
    { name: 'rigs',    start: C[3], end: C[7], scene: rigs,    bg: rigs.background },
    { name: 'compare', start: C[7],            scene: compare, bg: compare.background }
  ]
});
