import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k12-jit025',
	description: 'K=12 (25 taps), jitter x0.25 — break banding, minimise noise',
	patches: [withTaps(12), withJitterScale(0.25)]
});
