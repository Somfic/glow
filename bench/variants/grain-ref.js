// Converged reference: 97 taps instead of 13. The tap loop always spans
// fi in [-1,1] and normalizes by wsum, so raising K does not change the blur —
// it just samples the same integral far more finely. This is the noise-free
// image the shipping shader is a noisy estimate of, and every other variant is
// scored by how far it sits from this.
import { makeGrainVariant, withTaps } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-ref',
	description: 'REFERENCE: K=48 (97 taps) — converged, noise-free anchor',
	patches: [withTaps(48)]
});
