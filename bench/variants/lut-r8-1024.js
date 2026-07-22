// Size sweep, large end: 1024x1024 R8 = 1 MB. Far more than the ~200-cell
// coordinate span needs, so it can only lose (cache pressure), but it bounds
// how much of the 256 result is "small texture happens to be cache friendly".
import { makeLutVariant, warpedBody } from './lut-r8-256.js';

const N = 1024;
const OFF = 512;

export default makeLutVariant({
	name: 'lut-r8-1024',
	description: '1024x1024 R8 lattice LUT (1 MB) — cache-pressure end of the sweep',
	n: N,
	off: OFF,
	body: warpedBody(N, OFF)
});
