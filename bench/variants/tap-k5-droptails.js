// Quantify the outermost taps. The Gaussian is exp(-fi*fi*2.5) with fi=i/6, so
// the i=+/-6 pair has weight exp(-2.5)=0.0821 each against a weight sum of
// ~6.63 -> 1.24% of the image each, 2.5% for the pair. This variant drops just
// that pair (K=5, 11 taps) but keeps the ORIGINAL fi=i/6 spacing and span, so
// it isolates "how visible is the outer 2.5%" from "how visible is coarser
// sampling". Anything cheaper than this on the fidelity axis is paying for
// spacing, not for span.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-k5-droptails',
	description: 'Drop only the i=+/-6 tail taps (11 taps), original 1/6 spacing',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=5;')
		.replace('float fi=(float(i)+jit)/float(K);', 'float fi=(float(i)+jit)/6.0;')
});
