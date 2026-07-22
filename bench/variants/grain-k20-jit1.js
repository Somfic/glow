import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k20-jit1',
	description: 'K=20 (41 taps), full white jitter',
	patches: [withTaps(20), withJitterScale(1)]
});
