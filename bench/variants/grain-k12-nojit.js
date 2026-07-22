import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k12-nojit',
	description: 'K=12 (25 taps), no jitter — deterministic sampling',
	patches: [withTaps(12), withJitterScale(0)]
});
