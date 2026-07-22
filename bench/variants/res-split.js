// res-split — split by frequency. The low-frequency signal (lum / hue / bloom,
// i.e. the 13-tap pat() loop) is computed at 1/4 linear resolution into an
// RGBA16F target; the vignette, palette lookup, tonemap, saturation and dither
// — everything that is per-output-pixel rather than per-signal — run at full
// resolution from the upsampled fields.
//
// Versus res-quarter (which interpolates the *final colour*) this interpolates
// before the palette + tonemap, so the nonlinearities are evaluated at native
// resolution and the dither/quantize sees a continuously varying colour.
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-split',
	description: 'lum/hue/bloom field at 1/4 res (RGBA16F); palette+tonemap+vignette+dither at full res',
	scale: 4,
	fields: true
});
