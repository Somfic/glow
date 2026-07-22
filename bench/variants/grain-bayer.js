// Same 13 taps, but the jitter is an ordered 4x4 Bayer pattern over the quad
// grid with a per-block phase, instead of white noise. Free — it changes the
// DISTRIBUTION of the sampling error, not the amount of work.
import { makeGrainVariant, withBayerJitter } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-bayer',
	description: 'K=6 + ordered Bayer quad jitter (replaces white-noise jit)',
	patches: [withBayerJitter()]
});
