import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16-jit04',
	description: 'K=16 (33 taps), jitter x0.4 — break banding, minimise noise',
	patches: [withTaps(16), withJitterScale(0.4)]
});
