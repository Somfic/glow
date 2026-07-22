// combo-max — fastest combination that still reads as the same design.
//
// *** DELIBERATE LOOK CHANGE. This is not a drop-in replacement. ***
//
// All three tracks stacked: LUT + K=2 (5 taps) + half-res field with 16-stripe
// temporal banding, dither at full res. Identical to combo-lut-tap-banded; it
// exists under its own name because that is the deliverable.
//
// What changes visually: the folds, their placement, the palette and the
// overall composition are the baseline's — a still at arm's length reads as the
// same image. Up close the difference is grain. The tap-jitter speckle is
// generated at half resolution and magnified 2x, and K=2 makes that speckle
// much stronger to begin with, so the surface goes from a fine sparkle to a
// coarse, obviously pixel-scale stipple. PSNR 26 dB, and unlike some of the
// other entries in this table that number is honest: it looks different.
//
// Use it where the shader is a background at low opacity, behind content, or on
// a device that cannot afford the safe variant. Do not use it as the hero.
import { makeComboRes } from './combo-lut-banded.js';

export default makeComboRes({
	name: 'combo-max',
	description: 'MAX (look change): LUT + K=2 taps + half-res 16-stripe banding; coarse grain',
	scale: 2,
	bands: 16,
	taps: true
});
