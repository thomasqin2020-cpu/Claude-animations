# Moon Dust: shot plan and narration guide

Idea 40 from the research batch. Script style: shocking fact opening, then a step-by-step
simulation. 89 words, 36.2 s with the generated narration (Kokoro `am_michael`, speed 1.1).

Cue times come from `src/narration.js`, which `scripts/tts.py` regenerates from
`script/narration.txt`. Every cut below is keyed to a cue, so re-recording the voice
and re-running the TTS script re-times the whole video.

| Time (s) | Voiceover | Scene | What is on screen | Camera |
| --- | --- | --- | --- | --- |
| 0.00 - 3.60 | After eight hours on the Moon, Apollo 12's suits were more worn than training suits used for a hundred hours. | A surface | Astronaut bounds toward camera from the lander, Earth over the horizon, dust puffs at each footfall | Low wide, slow dolly left |
| 3.60 - 7.36 | (same line) | A surface | Medium-close tracking on the legs; dark abrasion patches fade in above the boots. Text: 8 HOURS OUTSIDE / WORN LIKE 100 HOURS | Tracking, legs |
| 7.36 - 9.00 | The culprit was dust. | A surface | Astronaut stops; boot kicks a large dust burst | Push in on the boot (zoom into the micro world) |
| 9.00 - 13.51 | On Earth, wind and water tumble sand into smooth, rounded grains. | B earth micro | Rounded sand grains roll downstream, wind streaks, a wave front washes over them | Low macro, lateral dolly |
| 13.51 - 15.01 | The Moon has neither. | C moon micro | Same framing, grey and still. Text: NO WIND / NO WATER | Near-static match cut |
| 15.01 - 19.60 | For billions of years, meteorite impacts have smashed its rock into jagged shards and tiny glass fragments. | C moon micro | Three meteorites streak in and shatter boulders into shards and glass beads. Text: BILLIONS OF YEARS OF IMPACTS | Slow orbit over the field |
| 19.60 - 22.20 | (same line) | C moon micro | Close orbit on the freshest shards and beads | Tight orbit |
| 22.20 - 23.86 | Every step kicks them up. | C moon micro | Giant boot plants in the field, shards launch on ballistic arcs (no atmosphere: nothing floats) | Low angle |
| 23.86 - 25.65 | They grind through fabric, | D damage | Fabric weave cutaway; shards saw between fibres, two fibres snap. Text: FABRIC | Slow dolly down |
| 25.65 - 26.85 | scratch visors, | D damage | Gold visor fills the frame; scratches draw across it. Text: VISOR | Slow drift |
| 26.85 - 28.19 | and jam the wrist locks. | D damage | Wrist ring turns, grains fill the gap, ring stutters and stalls. Text: WRIST LOCK | Slow push |
| 28.19 - 32.48 | Brushing clears the coarse grains. The fine ones cling to everything. | E surface | Astronaut crouches and brushes the shin; coarse shards fly off, fine specks stay and glint. Text: FINE DUST STAYS | Side medium-close |
| 32.48 - 36.18 | Two more moonwalks, and the suits could have lost pressure. | E surface | Astronaut stands; pull back to full shot with lander and Earth. Gauge: SUIT PRESSURE drops. Text: 2 MORE MOONWALKS | Pull back to wide |

## Fact basis

- Apollo 12 suits more worn after 8 hours than training suits after 100 hours; worn through the outer layer into the Mylar above the boots; one or two more EVAs could have caused a pressure failure. Gaier, NASA/TM-2005-213610, "The Effects of Lunar Dust on EVA Systems During the Apollo Missions" (2005).
- Visor sunshade too scratched to see well (Apollo 17); gauge dials unreadable (Apollo 16); wrist rings and hose connectors needed much more force to operate. Same report.
- Nylon brush effective on coarse grains, not on fine grains; dust adhered and could not be brushed off. Same report.
- Lunar grains are jagged and glassy because there is no wind or water weathering; impact-formed glass. NASA NTRS 20230000758 (abrasion testing of spacesuit fabrics with lunar simulants) and general lunar regolith literature.

Simplifications: the grain and fibre scenes are scaled up schematic views, not measured
geometry. The "suit pressure" gauge is a visual metaphor for the report's warning, not a
telemetry reading.
