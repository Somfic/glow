// combo-safe — HEADLINE. The most aggressive combination that is still visually
// indistinguishable from the baseline.
//
// What is in it:
//   * LUT (2048^2 R8 pre-warped, 256-cell lattice)  — exact reproduction of
//     vnoise's smoothstep-interpolated lattice via one hardware-bilinear fetch.
//   * FULL-resolution field pass, 16 interleaved stripes, 8 updated per frame —
//     temporal amortization only.
//   * Dither/quantize at native resolution in the cheap pass.
//
// What is deliberately NOT in it, and why:
//   * Half resolution. res-banded / combo-lut-banded put the field pass at 1/2
//     linear res and upsample. The folds survive that perfectly — but the
//     shader's fine per-pixel speckle (the tap-jitter grain, which is a large
//     part of this design's texture) becomes half-res blobs stretched 2x. Side
//     by side against the baseline the grain is visibly chunkier. It is a good
//     trade, it is not an invisible one, so it does not belong in "safe".
//   * K=2 taps. Same story only louder: heavy cross-hatch grain everywhere.
//   * alu-best's transforms. Measured: combo-lut-alu 5.34x vs lut alone 5.36x
//     at 2560x1440 — identical inside noise. The LUT already took the win.
//
// So the only thing stacked on the LUT here is the one axis that costs NOTHING
// spatially: computing each field pixel every other frame instead of every
// frame. Every pixel is still computed at native resolution with all 13 taps;
// half of them are simply one frame (~16 ms) old. At the animation speed this
// shader runs, one frame of drift is 0.00075 units of noise domain — far below
// what the stripe boundary would need to read as tearing.
//
// scale=1 also means the "upsample" pass samples the field target 1:1 at exact
// texel centres, so the LINEAR filter is a pass-through and nothing is blurred.
import { makeComboRes } from './combo-lut-banded.js';

export default makeComboRes({
	name: 'combo-safe',
	description: 'SAFE: LUT + full-res field, 8 of 16 stripes/frame, full-res dither (no spatial loss)',
	scale: 1,
	bands: 16
});
