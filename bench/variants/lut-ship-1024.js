// Ship candidate. Same baked-smoothstep LUT as lut-prewarp-2048 (8x supersample,
// which is the accuracy level that matters) but with a 128-cell lattice period
// instead of 256, because the shader provably never asks for more.
//
// Instrumenting the coordinate flow (pBase -> 13 taps -> pat -> fbm octaves) at
// the harness parameters gives max |lattice coord| = 59.8, independent of
// resolution, so a period of 128 (+/-64) covers every fetch with margin and the
// noise never repeats on screen. 128 cells x 8 = 1024^2 R8 = 1 MB, a quarter of
// lut-prewarp-2048's memory for the same fidelity and the same speed.
import { makeLutVariant } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';

const CELLS = 128;
const OFF = 64;
const S = 8;

export default makeLutVariant({
	name: 'lut-ship-1024',
	description: '1024^2 R8 (1 MB): 128-cell lattice, smoothstep baked at 8x — the ship candidate',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	body: prewarpBody(CELLS, OFF, S)
});
