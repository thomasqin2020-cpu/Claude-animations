# Spring Force 4: spring plus mass gives simple harmonic motion (36.69 s)

Narration: Kokoro `am_michael`, speed 1.05. Cue times from `narration.js`:
C1 7.70, C2 11.87, C3 17.19, C4 21.06, C5 24.96, C6 27.72, C7 33.80.

Scenes: **oscillator** (bench, k = 10 N/m, m = 1.0 kg, A = 0.30 m, ω = √10 ≈ 3.16 rad/s, T ≈ 1.99 s; two-lane variant for the amplitude comparison), **recorder** (block on a raised beam with a pen tracing onto a paper strip scrolling down), **vertical** (the rig pivots 90° into a hanging spring).

| Time (s) | Voiceover | Scene | On screen | Camera |
| --- | --- | --- | --- | --- |
| 0.00 to 3.50 | "Attach a mass," | oscillator | 1 kg block pulled to x = 0.30 m and released at 1.5 s. | Medium side shot |
| 3.50 to C1 | "...Newton's second law says m times the second derivative of x equals negative k x." | oscillator | Block oscillating (about 3 cycles); coral −kx arrow updates live. Caption: m·d²x/dt² = −kx | Slow push in |
| C1 to C2 | "Acceleration is proportional to displacement, and opposite it." | oscillator | Slow motion (closed-form 0.3x time remap). Green displacement arrow from the equilibrium mark, purple acceleration arrow on the block, always opposite, lengths proportional. Caption: a = −(k/m)x | 3/4 angle |
| C2 to 15.00 | "The solution is x equals A cosine of omega t, plus a phase constant." | recorder | Pen traces a cosine onto the scrolling strip. Caption: x(t) = A cos(ωt + φ) | Tilt down to include the strip |
| 15.00 to C3 | (cont.) | recorder | Amber brackets mark A on the latest peak and one full cycle. | Hold |
| C3 to C4 | "Plug it in, and omega squared must equal k over m." | recorder | Captions in sequence: d²x/dt² = −ω²x → −mω²x = −kx → ω² = k/m | Hold |
| C4 to C5 | "So the period is two pi times the square root of m over k." | recorder | Period bracket pulses once per cycle, labelled T. Caption: T = 2π/ω = 2π√(m/k), T ≈ 1.99 s | Hold |
| C5 to C6 | "Notice what is missing: the amplitude." | oscillator (two lanes) | Second lane above with A = 0.10 m; both released together at C5 + 0.5 s and stay in phase. Caption: T independent of A | Fixed tall framing |
| C6 to 30.40 | "Hang the spring vertically," | vertical | Rig pivots 90° up into a hanging spring (1.3 s), dashed natural-length line appears, block lowered gently (1.4 s) to rest d below it. | Tilt up with the rotation, then hold |
| 30.40 to C7 | "...and gravity only shifts the equilibrium down by m g over k." | vertical | Green d bracket, kd (up) and mg (down) arrows balanced; caption kd = mg then d = mg/k ≈ 0.98 m. At 31.0 the block is pulled 0.30 m below the new equilibrium and released at 31.6. | Hold |
| C7 to end | "The period stays exactly the same." | vertical | Ghost horizontal oscillator above the beam, in phase with the hanging block. Caption: T = 2π√(m/k) | Pull back, end wide |

## Fact basis

Newton's second law on a frictionless horizontal surface: m·d²x/dt² = −kx. Trial solution x(t) = A cos(ωt + φ) gives d²x/dt² = −ω²x, so −mω²x = −kx and ω = √(k/m), T = 2π√(m/k). With k = 10 N/m and m = 1.0 kg: ω ≈ 3.16 rad/s, T ≈ 1.99 s. A and φ are set by initial conditions and never enter ω, so the period is amplitude-independent (true only because the force is exactly linear).

Vertical spring: equilibrium where kd = mg, so d = mg/k = (1.0)(9.8)/10 = 0.98 m. With y measured from the new equilibrium (down positive), m·d²y/dt² = mg − k(d + y) = −ky, so T = 2π√(m/k) is unchanged.

Simplifications: the kd and mg arrows are drawn at half the series force scale so they fit beside the block; the slow-motion beat is a time remap, not a change in the physics.
