import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k24-jit1',
	description: 'K=24 (49 taps), full white jitter',
	patches: [withTaps(24), withJitterScale(1)]
});
