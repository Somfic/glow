// res-split-half — the split-frequency scheme at 1/2 linear resolution, to
// separate "how much does the split cost/gain" from "how much does the
// downscale cost/gain".
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-split-half',
	description: 'lum/hue/bloom field at 1/2 res (RGBA16F); palette+tonemap+vignette+dither at full res',
	scale: 2,
	fields: true
});
