// Moon Dust (idea 40). Scenes are scheduled on narration cue times: C[n] is the start of line n.
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildSurface } from './scenes/surface.js';
import { buildEarthMicro } from './scenes/earthMicro.js';
import { buildMoonMicro } from './scenes/moonMicro.js';
import { buildDamage } from './scenes/damage.js';

const C = NARRATION.cues.map((c) => c.start);
const surface = buildSurface(), earthMicro = buildEarthMicro(), moonMicro = buildMoonMicro(), damage = buildDamage();

runVideo({
  narration: NARRATION,
  audio: '/videos/moon-dust/audio/narration.wav',
  scenes: [
    { name: 'A surface walk',   start: 0,    end: C[2], scene: surface,    bg: 0x000000 },
    { name: 'B earth micro',    start: C[2], end: C[3], scene: earthMicro, bg: earthMicro.background },
    { name: 'C moon micro',     start: C[3], end: C[6], scene: moonMicro,  bg: 0x000000 },
    { name: 'D damage',         start: C[6], end: C[7], scene: damage,     bg: damage.background },
    { name: 'E brush + payoff', start: C[7],             scene: surface,    bg: 0x000000 }
  ]
});
