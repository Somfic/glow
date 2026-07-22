import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16-jit05',
	description: 'K=16 (33 taps), white jitter x0.5',
	patches: [withTaps(16), withJitterScale(0.5)]
});
