// Combination: baked-smoothstep LUT + a 2-octave fbm.
//
// The size/format sweep showed the lattice LUT is not bandwidth-bound (64x64,
// 256x256 and 1024x1024 all land on the same ms), so the remaining cost is the
// *number of fetch instructions*: 13 taps x 5 fbm x 3 octaves = 195. Dropping
// the 3rd octave takes that to 130 and removes two m2 rotations per fbm. The
// 3rd octave carries 1/7 of fbm's amplitude, so the image shifts — this is the
// "how far does the fetch count actually move the needle" measurement.
import { makeLutVariant, lutShader } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';

const CELLS = 256;
const OFF = 128;
const S = 8;

const frag = lutShader(prewarpBody(CELLS, OFF, S)).replace(
	`  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;`,
	`  f+=0.2500*vnoise(p);
  return f/0.75;`
);

export default makeLutVariant({
	name: 'lut-2oct-prewarp',
	description: 'baked-smoothstep LUT + 2-octave fbm: 130 fetches/px instead of 195',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	frag
});
