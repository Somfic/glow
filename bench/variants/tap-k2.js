// Tap-count track: K=2, i.e. 5 taps (from 13). See tap-k4.js for the rationale.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k2',
	description: 'K=2: 5 taps instead of 13, same span, weights renormalized',
	vertexShader,
	fragmentShader: fragmentShader.replace('const int K=6;', 'const int K=2;')
});
