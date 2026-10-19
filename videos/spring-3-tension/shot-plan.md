# Spring Force 3: tension in an ideal spring; series and parallel (35.23 s)

Narration: Kokoro `am_michael`, speed 1.05. Cue times from `narration.js`:
C0 0.35, C1 4.35, C2 8.77, C3 11.84, C4 16.96, C5 22.85, C6 27.25, C7 30.41, C8 32.66.

Scenes: **strand** (horizontal spring pulled at both ends), **rigs** (series rig at x = 0 and
parallel rig at x = +4.6 under one ceiling beam; the camera trucks right at C5), **compare**
(bar chart of stiffness).

| Time (s) | Voiceover | Scene | On screen | Camera |
| --- | --- | --- | --- | --- |
| 0.00 to C1 (4.35) | "In an ideal massless spring, tension is equal everywhere." | strand | Equal teal 3.0 N arrows pull both ends. A glowing amber probe ring slides along the coil; its readout says T = 3.0 N the whole way. | Dolly along the spring with the probe |
| C1 to 6.80 | "A net force on a massless piece..." | strand | Push in on one coil; a translucent purple slab marks the piece Δm. Free-body arrows T₁ (left) and T₂ (right), drawn unequal. Caption: T₂ − T₁ = (Δm)a | Close-up |
| 6.80 to C2 (8.77) | "...would mean infinite acceleration." | strand | Slab thins toward zero; arrows snap to equal length. Caption: Δm → 0 ⇒ T₁ = T₂ | Hold |
| C2 to C3 (8.77 to 11.84) | "So a spring pulls equally hard on both ends." | strand | Pull back: wall plate on the left, block on the right. Equal and opposite coral T arrows at the wall and at the block. Caption: same T at both ends | Wide |
| C3 to 14.20 | "Hang two springs in series, and each carries the full load," | rigs (series) | 3.0 N block hooks on; k₁ (thin blue) and k₂ (thick orange) stretch. Each coil carries a 3.0 N tension arrow. Natural-length marks stay as grey ticks. | Fixed, tall framing |
| 14.20 to C4 (16.96) | "...so the stretches add." | rigs (series) | Green brackets x₁ (0.75 units = 0.30 m) and x₂ (0.375 units = 0.15 m), then a summing bracket x. Captions: x₁ = 0.30 m, x₂ = 0.15 m, then x = x₁ + x₂ = 0.45 m | Hold |
| C4 to 19.50 | "That gives one over k effective..." | rigs (series) | Caption: F/kₛ = F/k₁ + F/k₂ | Gentle push in |
| 19.50 to C5 (22.85) | "...equals one over k one plus one over k two." | rigs (series) | Caption: 1/kₛ = 1/k₁ + 1/k₂; readout kₛ = 6.7 N/m above the beam | Hold |
| C5 to C6 (22.85 to 27.25) | "Side by side in parallel, they share one stretch, and their forces add." | rigs (parallel) | Truck right to the parallel rig. Load hangs ⅔ w toward the stiffer spring so the bar stays level. Both stretch 0.25 units = 0.10 m (one bracket); arrows 1.0 N and 2.0 N. Caption: F = k₁x + k₂x | Lateral truck, then hold |
| C6 to C7 (27.25 to 30.41) | "Now k effective is just k one plus k two." | rigs (parallel) | Caption: kₚ = k₁ + k₂; readout kₚ = 30 N/m above the beam | Hold |
| C7 to C8 (30.41 to 32.66) | "Series is softer than either spring." | compare | Bars grow: kₛ 6.7, k₁ 10, k₂ 20 N/m. kₛ bar pulses. | Front, slow pull back |
| C8 to end (32.66 to 35.23) | "Parallel is stiffer than both." | compare | kₚ bar rises to 30, past both; it pulses. | Pull back, end |

Arrow scale: 0.16 scene units per newton, as in Part 1. Two exceptions, both noted in the
code: the free-body close-up draws T₁ and T₂ at 0.6 of that scale so both fit the narrow
frame (only their ratio matters there), and the parallel rig draws 1.0 N and 2.0 N at twice
the scale so the 1.0 N arrow is legible (the 1:2 ratio is preserved).

## Fact basis

### Tension in an ideal spring

Free-body on a segment of mass Δm, tension T₁ pulling left and T₂ pulling right:

T₂ − T₁ = (Δm)a

Massless spring: Δm → 0. For any finite a:

**T₁ = T₂**

This holds even while the spring accelerates. A real spring with mass has tension varying
along its length, which is why Physics C problems specify "light" or "ideal" springs.

### Series

Same force F in each spring; stretches add:

x = x₁ + x₂ = F/k₁ + F/k₂

Define kₛ by x = F/kₛ:

F/kₛ = F/k₁ + F/k₂

**1/kₛ = 1/k₁ + 1/k₂**

Video numbers (k₁ = 10, k₂ = 20 N/m, F = 3.0 N): x₁ = 0.30 m, x₂ = 0.15 m, x = 0.45 m,
kₛ = 20/3 ≈ 6.7 N/m.

### Parallel

Same stretch x; forces add:

F = k₁x + k₂x

**kₚ = k₁ + k₂**

Video numbers: kₚ = 30 N/m, x = 3.0/30 = 0.10 m, forces 1.0 N and 2.0 N.

Level-bar condition. With springs a distance w apart and the load a distance p from spring 1,
torques about the load point balance:

k₁x·p = k₂x·(w − p)

p = k₂w/(k₁ + k₂) = (2/3)w

The load hangs two-thirds of the way toward the stiffer spring. Center it and the bar tilts,
and then the two springs no longer share one stretch. The rig in the video hangs the rod at
p = ⅔ w and labels it.
