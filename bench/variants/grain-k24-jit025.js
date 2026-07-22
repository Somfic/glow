import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k24-jit025',
	description: 'K=24 (49 taps), white jitter x0.25',
	patches: [withTaps(24), withJitterScale(0.25)]
});
