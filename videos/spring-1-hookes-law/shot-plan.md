# Spring Force 1: Hooke's law, and why it's linear (37.09 s)

Narration: Kokoro `am_michael`, speed 1.05. Cue times from `narration.js`. Constants: k = 10 N/m,
scene scale 2.5 units per metre, force arrows 0.16 units per newton.

Scenes: **bench** (dark-navy lab, wall anchor, horizontal spring, 1 kg block on a track, ruler),
**well** (graph panel with an asymmetric potential-energy curve and a ball).

| Time (s) | Voiceover | Scene | On screen | Camera |
| --- | --- | --- | --- | --- |
| 0.00 to 2.80 | "Pull a spring a distance x," | bench | Block at x = 0. Teal applied-force arrow grows and drags the block right to x = 0.20 m. | Medium side shot, slow push in |
| 2.80 to 6.16 | "...it pulls back with a force F equals negative k x." | bench | Green x arrow along the ruler. Coral spring-force arrow from the block toward the wall, length ∝ kx (2.0 N). Caption at 4.4: F = −kx | Hold |
| 6.16 to 10.89 | "The minus sign means the force always points back toward equilibrium." | bench | Block swings to −0.20 m and +0.20 m twice; displacement and force arrows flip together, always opposite. Caption: x > 0 → F < 0, x < 0 → F > 0 | 3/4 high angle |
| 10.89 to 14.42 | "k is the stiffness, measured in newtons per meter." | bench, two lanes | Thin coil k = 10 below, thick coil k = 40 on a shelf above, both stretched 0.20 m; arrows 2 N vs 8 N. Caption: [k] = N/m | Fixed, tall framing |
| 14.42 to 16.32 | "But why is the force linear?" | bench | Push in on the coils, which glow amber. Caption: F ∝ x ? | Fast dolly in, cut |
| 16.32 to 19.00 | "Near any stable equilibrium..." | well | Asymmetric (Morse-shaped) U(x) draws left to right; ball rolls in and settles at the bottom. | Front on panel |
| 19.00 to 21.79 | "...expand the potential energy as a Taylor series." | well | Caption: U(x) = U(0) + U′(0)x + ½U″(0)x² + … | Slight dolly in |
| 21.79 to 24.00 | "The slope is zero there," | well | Amber tangent line at the bottom flashes and lies flat. Caption: U(0) = 0, U′(0) = 0 | Dolly toward the bottom |
| 24.00 to 27.29 | "...so the first term that matters is one half k x squared." | well | Dashed green parabola overlays the curve and hugs it near the bottom. Caption: U ≈ ½kx², k ≡ U″(0) > 0 | Hold close |
| 27.29 to 31.35 | "Take negative d U d x, and Hooke's law falls right out." | well | Balls at three offsets with coral downhill arrows, length ∝ x. Caption: F = −dU/dx = −kx | Hold |
| 31.35 to 34.00 | "That is also why it only holds for small stretches," | well | Ball pushed far out; red elastic-limit line; gap between curve and parabola shaded red beyond it. | Pull back to the full curve |
| 34.00 to 37.09 | "...below the elastic limit." | bench | Spring overstretched to 0.50 m and released: coils stay opened (permanent set), block settles short of zero. Caption: valid for small x | Wide, end |

## Fact basis (brief section 1.1)

U(x) = U(0) + U′(0)x + ½U″(0)x² + …; equilibrium gives U′(0) = 0; choose U(0) = 0; k ≡ U″(0) > 0 for
a stable minimum; drop cubic and higher terms for small x, so U ≈ ½kx² and F = −dU/dx = −kx. The
well drawn in the video is a Morse-shaped curve (1 − e^(−ax))², so its asymmetry shows the cubic
term failing first on the stretch side.
