// Baseline: the shipping Glow shader, verbatim from src/lib/glow/foldGradientShader.ts.
// Every other variant is measured against this one for both speed and image fidelity.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'baseline',
	description: 'Shipping shader: K=6 (13 taps) x pat() (5 fbm) x 3 octaves',
	vertexShader,
	fragmentShader
});
