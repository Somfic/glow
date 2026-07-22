import { makeGrainVariant, withTaps } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k24',
	description: 'tap count K=24 (49 taps) vs the shipping 13',
	patches: [withTaps(24)]
});
