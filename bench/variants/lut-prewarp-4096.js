// Supersample sweep, top end: 16x (4096^2 R8 = 16 MB). Two questions at once —
// does the baked interpolant converge back to the exact LUT's fidelity, and does
// a 16 MB working set finally cost something in texture cache? (64x64 through
// 2048x2048 were all the same speed, so this is the last chance for the
// bandwidth story to show up.)
import { makeLutVariant } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';

const CELLS = 256;
const OFF = 128;
const S = 16;

export default makeLutVariant({
	name: 'lut-prewarp-4096',
	description: '4096^2 R8: smoothstep baked at 16x supersample (16 MB)',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	body: prewarpBody(CELLS, OFF, S)
});
