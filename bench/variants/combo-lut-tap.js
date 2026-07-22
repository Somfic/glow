// combo-lut-tap — LUT track x tap track, single pass.
//
// The two attack the SAME loop from opposite ends: the LUT makes each pat()
// cheap (one texture fetch instead of 4 hash12 per vnoise, i.e. 195 fetches
// instead of 780 hashes per pixel), the tap cut makes there be 2.6x fewer
// pat() calls. Composition is therefore expected to be sub-multiplicative:
// once the LUT has turned the shader from ALU-bound into texture-fetch-bound,
// removing taps removes fetches, which is still the dominant cost — so it
// should compose reasonably, but the fixed per-pixel overhead (setup, shading,
// dither) that the LUT exposed is now a larger share and does not shrink.
//
// MEASURED (2560x1440): LUT 5.27x, taps 2.45x, naive product 12.9x, actual
// 7.08x — 55% of the product. Fitting cost = F + taps*C across the three
// resolutions puts the resolution-independent floor F at ~2.4 ms and the LUT's
// per-tap cost C at ~0.56 ms (vs 3.74 ms for the baseline). F + 5C = 5.2 ms is
// the model's answer against 7.2 ms measured; either way the floor F, which
// neither optimization touches, is what eats the difference between 12.9x and
// 7x. Two optimizations on the same term cannot beat deleting that term.
//
// LUT: 256-cell lattice (2048^2 R8, 4 MB) rather than lut-ship-1024's 128-cell
// one. Same speed, same fidelity, but the wider lattice keeps every fetch in
// range for animation times far past the ~150 s where the 128-cell period
// starts to wrap. The shipping component animates indefinitely.
import { makeLutVariant, lutShader } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';

export const CELLS = 256;
export const OFF = 128;
export const S = 8;

// The K=2 + stratified-quad-jitter patch from tap-best, as a reusable pair of
// string substitutions so every combo applies exactly the same transform.
export function applyTaps(src) {
	const out = src
		.replace('const int K=6;', 'const int K=2;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*0.5);\n  float jit=fract(bayer4(jq)+0.03125+hash12(floor(jq*0.25)))-0.5;'
		);
	if (out === src) throw new Error('tap patch did not apply');
	return out;
}

export const lutTapFrag = applyTaps(lutShader(prewarpBody(CELLS, OFF, S)));

export default makeLutVariant({
	name: 'combo-lut-tap',
	description: 'LUT (2048^2 prewarp) + K=2 5-tap w/ stratified quad jitter',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	frag: lutTapFrag
});
