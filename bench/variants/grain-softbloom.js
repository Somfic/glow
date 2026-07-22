// Same 13 taps, but the bloom threshold is widened from (0.55,1.0) to
// (0.35,1.15). The bloom term is the highest-variance quantity in the loop
// because it is nearly binary per tap.
import { makeGrainVariant, withSoftBloom } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-softbloom',
	description: 'K=6 + widened bloom threshold (0.35,1.15) to cut its variance',
	patches: [withSoftBloom('0.35', '1.15')]
});
