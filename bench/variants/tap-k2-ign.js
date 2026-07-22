// K=2 (5 taps, 2.5x fewer pat() calls) + interleaved-gradient-noise quad jitter.
// The end of the aggressive end of the curve: see tap-k3-ign.js for why the
// jitter has to stay quad-constant and why swapping the hash for IGN is free.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k2-ign',
	description: 'K=2 (5 taps) + interleaved-gradient-noise quad jitter',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=2;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(52.9829189*fract(dot(jq, vec2(0.06711056,0.00583715))))-0.5;'
		)
});
