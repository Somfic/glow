// Converged reference that ALSO has the softened bloom, so grain-softbloom can
// be scored on its noise alone rather than penalised for rendering a slightly
// different image.
import { makeGrainVariant, withTaps, withSoftBloom } from '../lib/grain.js';
export default makeGrainVariant({
	name: 'grain-ref-soft',
	description: 'REFERENCE for soft-bloom variants: K=48 + soft bloom',
	patches: [withTaps(48), withSoftBloom('0.35', '1.15')]
});
