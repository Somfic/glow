import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16-nojit',
	description: 'K=16 (33 taps), jitter amplitude x0.0',
	patches: [withTaps(16), withJitterScale(0.0)]
});
