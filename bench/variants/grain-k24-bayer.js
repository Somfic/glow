import { makeGrainVariant, withTaps, withBayerJitter } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k24-bayer',
	description: 'K=24 (49 taps), ordered Bayer quad jitter',
	patches: [withTaps(24), withBayerJitter()]
});
