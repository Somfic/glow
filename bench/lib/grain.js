// Helpers for the grain investigation.
//
// The visible speckle has three candidate sources in the shader, and these
// builders isolate each one so they can be measured separately:
//
//  1. TAP COUNT. The loop is a 13-sample estimate of a blur integral. Sampling
//     noise falls as ~1/sqrt(K), so the residual variance shows up as speckle.
//  2. THE JITTER. `jit = hash12(floor(gl_FragCoord.xy*0.5)) - 0.5` decorrelates
//     the taps, but it is WHITE noise evaluated per 2x2 quad — white noise
//     clumps, and the 2x2 granularity is literally a 2px block, which is what
//     reads as "pixel art". It must stay quad-uniform because the loop takes
//     dFdx/dFdy of the height field.
//  3. THE BLOOM TERM. `bloom += smoothstep(0.55, 1.0, lv) * w` is a near-binary
//     threshold applied per tap. A tap landing either side of the threshold
//     swings the result hard, so variance is highest exactly where the image is
//     bright — which is where the speckle is worst.
import { link, fullscreenTriangle, pushStandardUniforms } from './singlepass.js';
import { fragmentShader as shippedFrag, vertexShader } from './shippedShader.js';
import { bakeNoiseLut, LUT_SIZE } from './shippedLut.js';

// ── source fragments to patch ───────────────────────────────────────────────
// Matched by shape rather than exact text, so these keep working as the
// component's own K changes.
const K_SRC = /const int K=\d+;/;
const JIT_SRC = /[ \t]*float jit=[^\n]*;/;
const BLOOM_SRC = '    bloom+=smoothstep(0.55,1.0,lv)*w;';

// A 4x4 Bayer matrix over the QUAD grid (so it stays quad-uniform), plus a
// per-block phase rotation so the ordered pattern does not read as a fixed
// screen-door texture. Even, fine, and free — versus white noise, which clumps.
const BAYER_JIT = `  vec2 q=floor(gl_FragCoord.xy*0.5);
  vec2 b=mod(q,4.0);
  float bi=b.y*4.0+b.x;
  // closed form of the 4x4 Bayer matrix / 16
  float ax=b.x, ay=b.y;
  float xo=mod(ax+ay,2.0), yo=mod(ay,2.0);
  float bayer=(8.0*mod(ax+ay,2.0)+4.0*mod(ay,2.0)
              +2.0*mod(floor((ax+ay)/2.0),2.0)+mod(floor(ay/2.0),2.0))/16.0;
  // decorrelate blocks so the 4x4 cell is not visible as a repeating tile
  float phase=hash12(floor(q/4.0));
  float jit=fract(bayer+phase)-0.5;`;

export function patch(src, replacements) {
	let out = src;
	for (const [from, to] of replacements) {
		const found = typeof from === 'string' ? out.includes(from) : from.test(out);
		if (!found) throw new Error('patch target not found: ' + String(from).slice(0, 60));
		out = out.replace(from, to);
	}
	return out;
}

export const withTaps = (k) => [K_SRC, `const int K=${k};`];
export const withBayerJitter = () => [JIT_SRC, BAYER_JIT];
// Widen the bloom threshold so a tap crossing it contributes gradually instead
// of nearly all-or-nothing. Keeps the same bloom *mean*, cuts its variance.
export const withSoftBloom = (lo, hi) => [BLOOM_SRC, `    bloom+=smoothstep(${lo},${hi},lv)*w;`];

// Scale the jitter amplitude. The jitter exists to trade BANDING for NOISE: it
// decorrelates each pixel's tap positions so the discrete taps do not show as
// rings/combs. With few taps that trade is mandatory, but the banding it hides
// shrinks as K grows, so at high K the jitter may be buying nothing and costing
// visible speckle. s=0 removes it entirely.
// toFixed(3) matters: `${0.0}` stringifies to "0", which GLSL reads as an int
// literal and refuses to multiply with a float.
export const withJitterScale = (s) => [
	JIT_SRC,
	`  float jit=(hash12(floor(gl_FragCoord.xy*0.5))-0.5)*${s.toFixed(3)};`
];

// Builds a variant from the SHIPPED shader (so everything here is measured on
// top of the LUT that is already in the component).
export function makeGrainVariant({ name, description, patches = [] }) {
	const frag = patch(shippedFrag, patches);
	return {
		name,
		description,
		create(gl, w, h) {
			const program = link(gl, vertexShader, frag);
			gl.useProgram(program);
			const buf = fullscreenTriangle(gl, program);
			const tex = gl.createTexture();
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
			gl.uniform1i(gl.getUniformLocation(program, 'u_lut'), 0);
			const uTime = gl.getUniformLocation(program, 'u_time');
			let W = w,
				H = h;
			pushStandardUniforms(gl, program, W, H);
			return {
				resize(nw, nh) {
					W = nw;
					H = nh;
					gl.useProgram(program);
					pushStandardUniforms(gl, program, W, H);
				},
				render(t) {
					gl.useProgram(program);
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, tex);
					gl.bindBuffer(gl.ARRAY_BUFFER, buf);
					const aPos = gl.getAttribLocation(program, 'a_pos');
					gl.enableVertexAttribArray(aPos);
					gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
					gl.viewport(0, 0, W, H);
					gl.uniform1f(uTime, t);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
				},
				dispose() {
					gl.deleteTexture(tex);
					gl.deleteBuffer(buf);
					gl.deleteProgram(program);
				}
			};
		}
	};
}
