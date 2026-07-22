import { makeGrainVariant, withTaps, withBayerJitter } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-k16-bayer',
	description: 'K=16 (33 taps), ordered Bayer quad jitter',
	patches: [withTaps(16), withBayerJitter()]
});
