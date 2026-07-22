// combo-lut-banded-fields — same as combo-lut-banded but the half-res pass stops
// after the tap loop and writes raw lum/hue/bloom into an RGBA16F target; the
// full-res pass does the vignette, palette lookup, tonemap, saturation AND the
// dither at native resolution.
//
// Why this might be the better safe candidate: in "color" mode the palette and
// the filmic tonemap are evaluated at half resolution and then bilinearly
// blended, so a colour ramp crossing a fold boundary is interpolated in the
// wrong space and the tonemap's knee gets smeared. In "fields" mode only the
// scalar signal is interpolated and every non-linearity happens per output
// pixel. It costs a slightly heavier cheap pass (palette + tonemap instead of
// one fetch) but the cheap pass is what caps the win, so this is exactly the
// fidelity/speed knob worth measuring.
import { makeComboRes } from './combo-lut-banded.js';

export default makeComboRes({
	name: 'combo-lut-banded-fields',
	description: 'LUT half-res banded field (lum/hue/bloom in RGBA16F) + full-res palette/tonemap/dither',
	scale: 2,
	bands: 16,
	fields: true
});
