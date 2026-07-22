import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k10-halfjit',
	description: 'K=10 (21 taps), jitter amplitude x0.5',
	patches: [withTaps(10), withJitterScale(0.5)]
});
