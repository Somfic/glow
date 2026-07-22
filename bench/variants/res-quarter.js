// res-quarter — same two-pass scheme as res-half but the expensive pass runs at
// 1/4 linear resolution (1/16 the pixels). The upsample + dither pass stays at
// full resolution.
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-quarter',
	description: 'Full shader at 1/4 linear res (1/16 pixels) + bilinear upsample, dither at full res',
	scale: 4
});
