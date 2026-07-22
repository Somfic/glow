// combo-lut-half-fields — LUT + half-res field in "fields" mode, but NO temporal
// banding: every field pixel is recomputed every frame.
//
// This isolates the fidelity cost of banding from the fidelity cost of half
// resolution. Banding's error is temporal (half the stripes are one frame
// stale), which a still snapshot can only partly show, so having the un-banded
// twin in the table is the only way to attribute the PSNR gap correctly.
import { makeComboRes } from './combo-lut-banded.js';

export default makeComboRes({
	name: 'combo-lut-half-fields',
	description: 'LUT half-res field every frame (no banding), full-res palette/tonemap/dither',
	scale: 2,
	bands: null,
	fields: true
});
