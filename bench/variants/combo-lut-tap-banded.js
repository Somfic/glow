// combo-lut-tap-banded — all three tracks at once.
//
// Field work per frame vs baseline:
//   half res            1/4 of the pixels
//   16-stripe banding   1/2 of those pixels per frame   -> 1/8
//   K=2                 5 taps instead of 13            -> 1/20.8
//   LUT                 each tap ~5x cheaper            -> ~1/100
// The prediction was that the field pass would already be so small that the tap
// cut would be invisible next to the irreducible full-res upsample pass (one
// texture fetch + Bayer dither + quantize per output pixel per frame).
//
// MEASURED (2560x1440, same run as baseline): combo-lut-banded 2.58 ms,
// combo-lut-tap-banded 1.34 ms. The prediction was WRONG — the tap cut still
// buys 1.9x. Solving the two-term model, the cheap pass is ~1.0-1.3 ms at
// 3.69 MP and the LUT+banded field pass was still ~1.3 ms on top of it, i.e.
// the field had not yet stopped being the frame. After the tap cut it has:
// 51.0 / 1.3 = ~39x is the hard ceiling for anything built on a full-res cheap
// pass, and this variant measures 38.0x. There is nothing left to win here
// without attacking the cheap pass itself.
import { makeComboRes } from './combo-lut-banded.js';

export default makeComboRes({
	name: 'combo-lut-tap-banded',
	description: 'LUT + K=2 taps + half-res 16-stripe banding, full-res dither',
	scale: 2,
	bands: 16,
	taps: true
});
