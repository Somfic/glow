// K=3 (7 taps) plus a better dither.
//
// The jitter that hides a low tap count is `jit`, and it MUST stay constant
// across a 2x2 derivative quad -- the loop calls dFdx(h), so a per-pixel jitter
// would make neighbouring fragments sample different offsets and turn the normal
// estimate into noise. That is why the baseline uses hash12(floor(coord*0.5)):
// white noise, one value per quad.
//
// White noise clumps: neighbouring quads often draw nearly the same offset,
// which is exactly when the missing taps become visible as a coherent smudge.
// Interleaved gradient noise over the same quad index is low-discrepancy in a
// local neighbourhood, so each quad's offset lands in a different part of the
// tap interval. Same cost (a fract/dot instead of a hash), better distribution.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k3-ign',
	description: 'K=3 (7 taps) + interleaved-gradient-noise quad jitter',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=3;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(52.9829189*fract(dot(jq, vec2(0.06711056,0.00583715))))-0.5;'
		)
});
