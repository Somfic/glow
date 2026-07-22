// res-banded — temporal amortization with a *constant* per-frame cost. The
// half-res field is split into 16 horizontal stripes; each frame updates the 8
// stripes of one parity via the scissor rect, so every frame does exactly half
// of a half-res pass and no pixel is ever more than one frame stale.
//
// Unlike res-temporal there is no alternating expensive/cheap frame, so there
// is no frame-time sawtooth for vsync to trip over — the median GPU ms is the
// true per-frame cost. The stale stripes lag by 16 ms of animation, which at
// speed=1 is 0.00075 units of noise domain: the stripe boundaries do not read
// as tearing because the field barely moves between frames.
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-banded',
	description: 'Half-res field, 8 of 16 interleaved stripes updated per frame (constant cost) + full-res upsample',
	scale: 2,
	temporal: { bands: 16 }
});
