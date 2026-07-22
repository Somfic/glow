// Same 256x256 lattice LUT as lut-r8-256, but stored as R16F instead of R8.
// Isolates the cost of the format: 2 bytes/texel instead of 1 (so half the
// texels per cache line) against ~11 bits of mantissa instead of 8 for the
// hash value. R16F is texture-filterable in core WebGL2, so the sampler still
// does the bilinear mix.
import { makeLutVariant, warpedBody } from './lut-r8-256.js';

const N = 256;
const OFF = 128;

export default makeLutVariant({
	name: 'lut-r16f-256',
	description: '256x256 R16F lattice LUT, pre-warped — format cost vs R8',
	n: N,
	off: OFF,
	half: true,
	body: warpedBody(N, OFF)
});
