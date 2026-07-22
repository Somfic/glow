// K=3 (7 taps) with an exactly-stratified quad jitter.
//
// IGN is only *approximately* equidistributed. A 4x4 Bayer matrix indexed by the
// quad coordinate is exact: every 4x4 block of quads (8x8 pixels) uses each of
// the 16 evenly spaced tap phases exactly once, so no local neighbourhood can
// ever clump. The price of an exact ordered pattern is that it is regular and
// reads as a weave (see tap-k3-r2), so the phase of each 4x4 block is rotated by
// a per-block hash -- stratification stays perfect inside the block, and the
// blocks themselves are decorrelated, which breaks up the long diagonal
// structure IGN leaves behind.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k3-bayer',
	description: 'K=3 (7 taps) + 4x4-stratified quad jitter, per-block phase rotation',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=3;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(bayer4(jq)+0.03125+hash12(floor(jq*0.25)))-0.5;'
		)
});
