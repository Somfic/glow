import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k20-nojit',
	description: 'K=20 (41 taps), no jitter — deterministic sampling',
	patches: [withTaps(20), withJitterScale(0)]
});
