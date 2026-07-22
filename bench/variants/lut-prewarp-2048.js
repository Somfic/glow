// The best of both: keep vnoise's smoothstep interpolant, but pay no ALU for it.
//
// lut-r8-256 is exact but still runs floor/fract/smoothstep/address-rebuild
// around every fetch (~14 ops x 195 = 2700 ops/px). lut-nowarp-256 deletes all
// of that but swaps smoothstep for linear interpolation, which visibly moves
// the folds.
//
// Instead, *bake the interpolant*: store the lattice supersampled S=8x, where
// texel (a,b) already holds vnoise's smoothstep-interpolated value at
// (a/8, b/8). A raw hardware-bilinear fetch then reconstructs a piecewise-linear
// approximation of smoothstep with 8 segments per cell — max weight error
// ~0.009 vs 0.0039 for the R8 value quantization we already accept, i.e. the
// interpolant is no longer the dominant error.
//
// 256 lattice cells x 8 = 2048^2 R8 = 4 MB. The squaring still cannot be baked
// (vnoise squares *after* interpolation).
import { makeLutVariant, hash12 } from './lut-r8-256.js';

const CELLS = 256; // lattice period, same as lut-r8-256
const OFF = 128;
const S = 8; // supersample factor
const N = CELLS * S;

export function bakePrewarp(CELLS, OFF, S) {
	const N = CELLS * S;
	const data = new Float32Array(N * N);
	// hash row cache: H[i] for the two lattice rows in play.
	const row = (j) => {
		const r = new Float32Array(CELLS + 1);
		for (let i = 0; i <= CELLS; i++) r[i] = hash12(i - OFF, j - OFF);
		return r;
	};
	const sm = new Float32Array(S);
	for (let k = 0; k < S; k++) {
		const u = k / S;
		sm[k] = u * u * (3 - 2 * u);
	}
	let r0 = row(0);
	for (let jc = 0; jc < CELLS; jc++) {
		const r1 = row(jc + 1);
		for (let l = 0; l < S; l++) {
			const vy = sm[l];
			const dst = (jc * S + l) * N;
			for (let ic = 0; ic < CELLS; ic++) {
				const a0 = r0[ic],
					a1 = r0[ic + 1],
					b0 = r1[ic],
					b1 = r1[ic + 1];
				for (let k = 0; k < S; k++) {
					const vx = sm[k];
					const top = a0 + (a1 - a0) * vx;
					const bot = b0 + (b1 - b0) * vx;
					data[dst + ic * S + k] = top + (bot - top) * vy;
				}
			}
		}
		r0 = r1;
	}
	return data;
}

export const prewarpBody = (cells, off, s) => `float vnoise(vec2 p){
  float r=textureLod(u_lut, (p+${off}.0)*${(1 / cells).toFixed(10)}+${(0.5 / (cells * s)).toFixed(10)}, 0.0).r;
  return r*r;
}`;

export default makeLutVariant({
	name: 'lut-prewarp-2048',
	description: '2048^2 R8: smoothstep baked in (8x supersampled lattice), 1 fetch + 1 mul',
	n: N,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	body: prewarpBody(CELLS, OFF, S)
});
