import { makeGrainVariant, withTaps, withJitterScale } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16-jit1',
	description: 'K=16 (33 taps), FULL white jitter — the original trade point',
	patches: [withTaps(16), withJitterScale(1)]
});
