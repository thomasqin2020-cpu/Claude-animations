// Shared constants for Part 4. Block centre sits at world x = 0 when the spring is unstretched.
export const UNIT = 2.5, FSCALE = 0.16, K = 10, M = 1.0, NAT = 1.0, ANCHOR_X = -1.25, Y = 0.31;
export const OMEGA = Math.sqrt(K / M);           // 3.162 rad/s
export const PERIOD = 2 * Math.PI / OMEGA;       // 1.987 s
