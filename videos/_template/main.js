// <TITLE>. Scenes are scheduled on narration cue times: C[n] is the start of line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildExample } from './scenes/example.js';

const C = NARRATION.cues.map((c) => c.start);
const example = buildExample();

runVideo({
  narration: NARRATION,
  audio: '/videos/<SLUG>/audio/narration.wav',
  scenes: [
    // start/end in seconds; omit end on the last entry to run to the end of the narration.
    { name: 'A example', start: 0, scene: example, bg: 0x101420 }
  ]
});
