import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k10-nojit',
	description: 'K=10 (21 taps), jitter amplitude x0.0',
	patches: [withTaps(10), withJitterScale(0.0)]
});
