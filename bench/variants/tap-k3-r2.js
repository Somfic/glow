// K=3 (7 taps) with an R2 (generalised-golden-ratio) low-discrepancy quad
// jitter instead of IGN. Same idea as tap-k3-ign -- replace the white-noise
// hash with a sequence whose values are evenly spread over any local
// neighbourhood -- but R2's lattice directions are the plastic-constant pair
// rather than IGN's, so it should not favour one screen diagonal. Direct A/B
// against tap-k3-ign at identical cost and identical tap count.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k3-r2',
	description: 'K=3 (7 taps) + R2 low-discrepancy quad jitter (A/B vs IGN)',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=3;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(dot(jq, vec2(0.7548776662,0.5698402910)))-0.5;'
		)
});
