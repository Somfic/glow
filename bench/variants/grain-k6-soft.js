import { makeGrainVariant, withSoftBloom } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k6-soft',
	description: 'K=6 (shipping taps) + soft bloom — is the bloom the variance?',
	patches: [withSoftBloom('0.35', '1.15')]
});
