// Spring Force 2: work and elastic potential energy. C[n] = start of narration line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildBenchGraph } from './scenes/benchGraph.js';
import { buildTwins } from './scenes/twins.js';

const C = NARRATION.cues.map((c) => c.start);
const benchGraph = buildBenchGraph(C), twins = buildTwins(C);

runVideo({
  narration: NARRATION,
  audio: '/videos/spring-2-energy/audio/narration.wav',
  scenes: [
    { name: 'bench + graph', start: 0,    end: C[6], scene: benchGraph, bg: benchGraph.background },
    { name: 'twins',         start: C[6],             scene: twins,      bg: twins.background }
  ]
});
