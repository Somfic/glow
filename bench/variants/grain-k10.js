import { makeGrainVariant, withTaps } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k10',
	description: 'tap count K=10 (21 taps) vs the shipping 13',
	patches: [withTaps(10)]
});
