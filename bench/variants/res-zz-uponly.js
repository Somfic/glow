// DIAGNOSTIC (temporary): the full-res upsample+dither pass on its own, with
// the expensive field pass rendered once and then never again. Isolates the
// fixed per-frame cost that every res-* variant pays on top of its low-res
// pass. Not a real variant — the image freezes.
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-zz-uponly',
	description: 'DIAG: upsample+dither pass only (field frozen after frame 0)',
	scale: 2,
	temporal: { every: 1000000 }
});
