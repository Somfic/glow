import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k14-nojit',
	description: 'K=14 (29 taps), no jitter — deterministic sampling',
	patches: [withTaps(14), withJitterScale(0)]
});
