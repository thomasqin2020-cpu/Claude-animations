// Spring Force 2: work and elastic potential energy. C[n] = start of narration line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { DESIGN } from './narration-design.js';
import { buildBenchGraph } from './scenes/benchGraph.js';
import { buildTwins } from './scenes/twins.js';

// Scenes are authored on the DESIGN cue times; the runtime warps the real narration onto them.
const C = DESIGN.cues.map((c) => c.start);
const benchGraph = buildBenchGraph(C), twins = buildTwins(C);

runVideo({
  narration: NARRATION,
  design: DESIGN,
  audio: '/videos/spring-2-energy/audio/narration.wav',
  scenes: [
    { name: 'bench + graph', start: 0,    end: C[6], scene: benchGraph, bg: benchGraph.background },
    { name: 'twins',         start: C[6],             scene: twins,      bg: twins.background }
  ]
});
