// Combination: more taps + ordered jitter + softened bloom.
import { makeGrainVariant, withTaps, withBayerJitter, withSoftBloom } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-fix',
	description: 'COMBINED: K=16 + Bayer quad jitter + soft bloom',
	patches: [withTaps(16), withBayerJitter(), withSoftBloom('0.35', '1.15')]
});
