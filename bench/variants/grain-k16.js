import { makeGrainVariant, withTaps } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16',
	description: 'tap count K=16 (33 taps) vs the shipping 13',
	patches: [withTaps(16)]
});
