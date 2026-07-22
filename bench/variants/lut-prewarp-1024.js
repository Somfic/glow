// Same baked-smoothstep trick as lut-prewarp-2048 but only 4x supersampled:
// 1024^2 R8 = 1 MB instead of 4 MB. Piecewise-linear smoothstep with 4 segments
// has ~0.035 max weight error (4x the R8 value quantization), so this isolates
// how much interpolant accuracy the image actually needs, and whether the
// smaller working set buys any cache win.
import { makeLutVariant } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';

const CELLS = 256;
const OFF = 128;
const S = 4;

export default makeLutVariant({
	name: 'lut-prewarp-1024',
	description: '1024^2 R8: smoothstep baked in at 4x supersample (1 MB)',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	body: prewarpBody(CELLS, OFF, S)
});
