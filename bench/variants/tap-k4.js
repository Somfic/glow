// Tap-count track: K=6 -> K=4, i.e. 13 taps -> 9 taps.
// fi=(i+jit)/K keeps the physical blur span identical; the tap spacing widens
// from 1/6 to 1/4 of the span and the Gaussian weights are re-normalized by the
// existing wsum, so this is a pure sample-count reduction with nothing else
// changed. The per-2x2-block `jit` already covers exactly one tap spacing at any
// K, so the dither strength scales automatically.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k4',
	description: 'K=4: 9 taps instead of 13, same span, weights renormalized',
	vertexShader,
	fragmentShader: fragmentShader.replace('const int K=6;', 'const int K=4;')
});
