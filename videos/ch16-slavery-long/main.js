// Chapter 16: Slavery, 1793 to 1860. Long-form 16:9 explainer. Every scene boundary and every
// beat is keyed to a narration line by its opening words (T.K / T.KE), so re-synthesizing the
// voice re-times the whole video.
import * as THREE from 'three';
import { runVideo } from '/src/app.js';
import { NARRATION } from './narration.js';
import { buildBattlefield, buildFourFarmers, buildGinShed, buildTitleCard, buildCaptionCard } from './scenes/openings.js';
import { buildJeffersonStudy, buildEmancipationMap, buildLedger, buildThroneRoom, buildGlobe, buildTwoPlatforms, buildCottonMaps, buildHarbor } from './scenes/economy.js';
import { buildPyramidScene, buildBigHouse, buildQuarters, buildTownStreet } from './scenes/society.js';
import { buildCourthouse, buildAuctionBlock, buildFieldRow } from './scenes/bondage.js';
import { buildTimelineRoad } from './scenes/resistance.js';
import { buildPrintingPress, buildLecternHall, buildTownSquare, buildCongress } from './scenes/politics.js';

const cueIndex = (prefix) => {
  const hits = NARRATION.cues.filter((c) => c.text.startsWith(prefix));
  if (hits.length !== 1) throw new Error(`cue prefix "${prefix}" matched ${hits.length} lines`);
  return hits[0].i;
};
export const T = {
  K: (p) => NARRATION.cues[cueIndex(p)].start,
  KE: (p) => NARRATION.cues[cueIndex(p)].end,
  END: NARRATION.duration
};

const battlefield = buildBattlefield(T), farmers = buildFourFarmers(T), gin = buildGinShed(T), title = buildTitleCard(T), card = buildCaptionCard(T);
const jefferson = buildJeffersonStudy(T), emap = buildEmancipationMap(T), ledger = buildLedger(T), throne = buildThroneRoom(T), globe = buildGlobe(T), platforms = buildTwoPlatforms(T), maps = buildCottonMaps(T), harbor = buildHarbor(T);
const pyramid = buildPyramidScene(T), bigHouse = buildBigHouse(T), quarters = buildQuarters(T), street = buildTownStreet(T);
const court = buildCourthouse(T), auction = buildAuctionBlock(T), field = buildFieldRow(T);
const road = buildTimelineRoad(T);
const press = buildPrintingPress(T), hall = buildLecternHall(T), square = buildTownSquare(T), congress = buildCongress(T);
const black = { group: new THREE.Group(), update: (t, cam) => { cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0); }, background: 0x000000 };

// [name, scene, start cue prefix]; each entry ends where the next begins.
const order = [
  ['S0 battlefield', battlefield, null],
  ['S0 farmers', farmers, 'Roughly three'],
  ['S0 rewind', gin, 'To answer that'],
  ['S0 title', title, 'This is Chapter'],
  ['S1 jefferson', jefferson, 'In the seventeen eighties'],
  ['S1 map', emap, 'The North was already'],
  ['S1 gin', gin, 'Then, in seventeen ninety-three'],
  ['S1 ledger', ledger, 'The numbers tell'],
  ['S1 jefferson 2', jefferson, 'The prediction had been'],
  ['S2 throne', throne, 'By the eighteen forties'],
  ['S2 pies', ledger, 'Look at what cotton'],
  ['S2 globe', globe, 'The South grew more'],
  ['S2 platforms', platforms, 'But the money did not stay'],
  ['S3 maps', maps, 'Put two maps'],
  ['S3 harbor', harbor, 'Where did these four million'],
  ['S3 quarters', quarters, 'Most of the growth'],
  ['S3 maps 2', maps, 'And because the Atlantic'],
  ['S3 ledger', ledger, 'By eighteen sixty, planters held'],
  ['S4 farmers', farmers, 'Now the question'],
  ['S4 big house', bigHouse, 'In eighteen fifty, only'],
  ['S4 pyramid', pyramid, 'Below them were tens'],
  ['S4 farmers 2', farmers, 'So back to the question'],
  ['S4 pyramid 2', pyramid, 'Partly fear'],
  ['S5 throne', throne, 'The Cotton Kingdom looked'],
  ['S5 ledger', ledger, 'The economy was built'],
  ['S5 harbor', harbor, 'And the system kept'],
  ['S5 platforms', platforms, 'So the North gained'],
  ['S6 pyramid', pyramid, 'Not every Black southerner'],
  ['S6 street', street, 'Some traced their freedom'],
  ['S6 platforms', platforms, 'And the North was not a refuge'],
  ['S7 pyramid', pyramid, 'So how did enslaved'],
  ['S7 courthouse', court, 'Enslaved people had no political'],
  ['S7 post', quarters, 'Floggings were common'],
  ['S7 auction', auction, 'The auction was the heart'],
  ['S7 quarters', quarters, 'And yet'],
  ['S7 card', card, 'The conditions of slavery'],
  ['S8 field', field, 'Enslaved people resisted every day'],
  ['S8 road', road, 'In eighteen hundred, an enslaved man'],
  ['S8 pyramid', pyramid, 'None of these rebellions'],
  ['S8 big house', bigHouse, "Turner's revolt failed"],
  ['S9 platforms', platforms, 'Opposition to slavery'],
  ['S9 globe', globe, 'The first organized plan'],
  ['S9 press', press, 'The eighteen thirties brought'],
  ['S9 hall', hall, 'And then there was Frederick'],
  ['S10 square day', square, 'Before eighteen thirty'],
  ['S10 square night', { ...square, background: 0x1c2030 }, 'After eighteen thirty'],
  ['S10 big house', bigHouse, 'Nat Turner, first of all'],
  ['S10 platforms', platforms, 'Then the Nullification'],
  ['S10 square', square, 'And southern preachers'],
  ['S10 ledger', ledger, 'Slave states tightened'],
  ['S10 congress', congress, 'In Congress, southerners'],
  ['S10 platforms 2', platforms, 'And the North?'],
  ['S11 farmers', farmers, 'Which brings us back'],
  ['S11 battlefield', battlefield, 'In eighteen sixty-one, the country'],
  ['black', black, '@end']
];
const starts = order.map(([, , p]) => (p === null ? 0 : p === '@end' ? T.KE('In eighteen sixty-one, the country') : T.K(p)));
const scenes = order.map(([name, scene, p], i) => ({ name, scene, start: starts[i], end: starts[i + 1], bg: scene.background }));

runVideo({ narration: NARRATION, audio: '/videos/ch16-slavery-long/audio/narration.wav', scenes, width: 1920, height: 1080 });
