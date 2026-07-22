// Value-noise lookup table for the fold-gradient shader.
//
// `vnoise()` is exactly "bilinear interpolation of a random lattice", which a
// texture unit does for free — so the lattice is baked into a texture and the
// sampler does the mixing. That replaces 4 `hash12()` calls (~65 ALU ops) with
// one fetch, and the shader runs it ~195 times per pixel.
//
// Two details make the substitution faithful rather than merely similar:
//
//  1. `vnoise` smoothsteps the fractional coordinate (`u = u*u*(3-2u)`) before
//     mixing, while hardware filtering is linear. Rather than pay for the
//     smoothstep per fetch, the lattice is stored SUPERSAMPLED by `S`: texel
//     (a,b) already holds the smoothstep-interpolated value at (a/S, b/S). A
//     raw bilinear fetch then reconstructs smoothstep piecewise-linearly with S
//     segments per cell — max weight error ~0.009 against the ~0.0039 we
//     already accept from 8-bit value quantization, so the interpolant is not
//     the dominant error.
//
//  2. `vnoise` squares the *interpolated* value, and squaring does not commute
//     with mixing. The square therefore stays in the shader; only the lattice
//     itself is baked.
//
// The lattice is finite and centred: texel (i,j) holds `hash12(i-OFF, j-OFF)`.
// Coordinates beyond it wrap through GL_REPEAT into still-valid noise, so there
// is never a seam — the pattern simply stops matching an infinite lattice. The
// shader's coordinate span grows as `1/zoom` and with elapsed time, so CELLS is
// sized to cover a long-running animation rather than just the first frames.

const CELLS = 256; // lattice period in cells
const OFF = CELLS / 2; // centre, so negative coordinates are covered
const S = 8; // supersample factor per cell
export const LUT_SIZE = CELLS * S; // 2048 -> 4 MB as R8

// Sampling transform for the shader: p -> (p + OFF) / CELLS + 0.5 / (CELLS * S).
// The half-texel bias puts the bilinear weight at exactly the supersampled
// fraction, matching where the baked values were evaluated.
export const LUT_SCALE = 1 / CELLS;
export const LUT_OFFSET = OFF;
export const LUT_BIAS = 0.5 / (CELLS * S);

// `hash12` from the shader, replicated in float32 so the baked values match
// what the GPU would have computed. Math.fround is what makes this exact —
// JS doubles would drift from the shader's 32-bit arithmetic.
const f = Math.fround;
const C = f(0.1031);
const K = f(33.33);
const fr = (v) => f(v - Math.floor(v));

export function hash12(x, y) {
	let a = fr(f(x * C));
	let b = fr(f(y * C));
	const c0 = a; // p3.xyx — the .x and .z lanes are the same value
	const d = f(f(a * f(b + K)) + f(f(b * f(c0 + K)) + f(c0 * f(a + K))));
	a = f(a + d);
	b = f(b + d);
	const c = f(c0 + d);
	return fr(f(f(a + b) * c));
}

// One LUT serves every Glow instance on the page, so the bake is done once and
// the bytes are reused. Textures are per-GL-context and stay with the instance.
let cached = null;

// Bakes straight to bytes. Going via a Float32Array and quantizing in a second
// pass costs more in memory traffic than the interpolation itself does.
export function bakeNoiseLut() {
	if (cached) return cached;
	const n = LUT_SIZE;
	const out = new Uint8Array(n * n);

	// Smoothstep weights are the same for every cell, so they are computed once.
	const sm = new Float32Array(S);
	for (let k = 0; k < S; k++) {
		const u = k / S;
		sm[k] = u * u * (3 - 2 * u);
	}

	// Walk the lattice one row of cells at a time, keeping the two hash rows in
	// play. Each row is reused as the next row's top edge.
	const hashRow = (j) => {
		const r = new Float32Array(CELLS + 1);
		for (let i = 0; i <= CELLS; i++) r[i] = hash12(i - OFF, j - OFF);
		return r;
	};

	let top = hashRow(0);
	for (let jc = 0; jc < CELLS; jc++) {
		const bottom = hashRow(jc + 1);
		for (let l = 0; l < S; l++) {
			const vy = sm[l];
			const dst = (jc * S + l) * n;
			for (let ic = 0; ic < CELLS; ic++) {
				const a0 = top[ic];
				const a1 = top[ic + 1];
				const b0 = bottom[ic];
				const b1 = bottom[ic + 1];
				const base = dst + ic * S;
				for (let k = 0; k < S; k++) {
					const vx = sm[k];
					const t = a0 + (a1 - a0) * vx;
					const b = b0 + (b1 - b0) * vx;
					out[base + k] = (t + (b - t) * vy) * 255 + 0.5;
				}
			}
		}
		top = bottom;
	}

	cached = out;
	return out;
}

// Uploads the LUT as a single-channel 8-bit texture. LINEAR is what does the
// interpolation work, and REPEAT is what makes out-of-range coordinates wrap
// into valid noise instead of clamping to an edge streak.
export function createNoiseTexture(gl) {
	const tex = gl.createTexture();
	if (!tex) return null;
	const prevUnit = gl.getParameter(gl.ACTIVE_TEXTURE);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.R8,
		LUT_SIZE,
		LUT_SIZE,
		0,
		gl.RED,
		gl.UNSIGNED_BYTE,
		bakeNoiseLut()
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.activeTexture(prevUnit);
	return tex;
}
