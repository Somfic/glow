// res-temporal — amortize the expensive pass over time. The half-res field is
// re-rendered only every 2nd frame; the intervening frame re-upsamples the
// texture it already has. `pat()` advances at u_time*0.045, so one frame at 60
// fps and speed=1 moves the noise domain by 0.00075 units — far below one
// low-res texel of motion — which is why reuse is invisible rather than a
// stutter.
//
// Caveat worth stating loudly: per-frame cost alternates expensive/cheap, so
// the harness's *median* GPU ms reports the cheap frame. Read the p95 column
// for the expensive one; the honest number is the mean of the two.
import { makeResVariant } from './res-half.js';

export default makeResVariant({
	name: 'res-temporal',
	description: 'Half-res field recomputed every 2nd frame, reused in between; full-res upsample every frame',
	scale: 2,
	temporal: { every: 2 }
});
