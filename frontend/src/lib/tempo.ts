// The drafting pen's shared clock (ported from drafted.html:1129-1143).
// `T` turns a beat fraction into ms; the construction pen moves at one
// constant speed (SPEED); pen starts land on the GRID so parallel strokes
// stay in sync.

export const BEAT = 500; // ms, 120 BPM

export function T(n: number): number {
  return n * 4 * BEAT;
}

export const SPEED = 400 / T(1 / 8); // px per ms
export const GRID = T(1 / 16); // phase starts land on this grid

export function q(ms: number): number {
  return Math.ceil(ms / GRID - 1e-6) * GRID;
}
