// Best combination of this track.
//
// Findings it is built from:
//  * Cost is almost exactly linear in tap count (K=4 -> 1.43x vs 13/9=1.44,
//    K=3 -> 1.83x vs 13/7=1.86, K=2 -> 2.51x vs 13/5=2.60). The tap loop IS the
//    shader; nothing else is worth touching in this track.
//  * Per-tap lighting is only ~4% of frame time (tap-lighting-once), so hoisting
//    it out of the loop buys nothing and costs fidelity. Not used here.
//  * Reconstructing taps by interpolation (tap-interp) costs the same pat() budget
//    as simply using that many taps, but runs slower and looks no better. Not used.
//  * The only artifact that low K produces is NOISE from the per-quad tap-phase
//    jitter -- not banding, not loss of soft edges. So the whole quality budget
//    at low K goes into the dither, and the dither is free.
//
// Therefore: K=2 (5 taps) with an exactly stratified quad jitter. The 4x4 Bayer
// index over the quad grid guarantees each 8x8-pixel neighbourhood uses all 16
// tap phases exactly once (no clumping, which is what makes the white-noise hash
// look like salt-and-pepper at low K), and a per-4x4-block hash rotates the
// phase so the ordered pattern never reads as a weave.
//
// The jitter must stay constant across the 2x2 derivative quad: the loop calls
// dFdx(h)/dFdy(h) for the normal, so a per-pixel phase would make the four
// fragments of a quad sample different offsets and destroy the normal estimate.
// That is the hard constraint the whole dither design works around.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

export default makeSinglePassVariant({
	name: 'tap-best',
	description: 'K=2 (5 taps, 2.6x fewer pat()) + 4x4-stratified rotated quad jitter',
	vertexShader,
	fragmentShader: fragmentShader
		.replace('const int K=6;', 'const int K=2;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(bayer4(jq)+0.03125+hash12(floor(jq*0.25)))-0.5;'
		)
});
