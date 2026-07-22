// Size sweep, small end: 64x64 R8 = 4 KB, which fits in L1 texture cache
// several times over. The lattice coordinates the shader touches span roughly
// [-100,100], so a 64-period LUT *wraps* — the same random values recur every
// 64 lattice cells. Whether that is visible in the final image is the whole
// question; PSNR will be dominated by "different noise", so look at the PNG.
import { makeLutVariant, warpedBody } from './lut-r8-256.js';

const N = 64;
const OFF = 32;

export default makeLutVariant({
	name: 'lut-r8-64',
	description: '64x64 R8 lattice LUT (4 KB, cache-resident, tiles every 64 cells)',
	n: N,
	off: OFF,
	body: warpedBody(N, OFF)
});
