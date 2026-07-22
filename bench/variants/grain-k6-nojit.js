import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k6-nojit',
	description: 'K=6 (13 taps), jitter amplitude x0.0',
	patches: [withTaps(6), withJitterScale(0.0)]
});
