import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k20-jit00',
	description: 'K=20 (41 taps), jitter x0.0 — break banding, minimise noise',
	patches: [withTaps(20), withJitterScale(0.0)]
});
