// Track: trade ALU for texture bandwidth.
//
// vnoise() is 4 hash12 + 2 mix. hash12 is ~15 float ops, so one vnoise is ~65
// ALU ops. The whole thing is exactly "bilinear interpolation of a random
// lattice", which a texture unit does for free — so bake hash12 into a texture
// and let the sampler do the mixing.
//
// Two details make this EXACT rather than merely similar:
//   1. vnoise smoothsteps the fractional coordinate (u=u*u*(3-2u)) before
//      mixing, hardware filtering is linear. Fix: pre-warp the sample point.
//      Sampling at (ip + u' + 0.5)/N puts the bilinear weight at exactly u',
//      because the HW computes frac(coord*N - 0.5) = frac(ip + u') = u'.
//   2. vnoise returns r*r where r is the *interpolated* value. Squaring does
//      not commute with mixing, so the square must stay in the shader; only
//      the raw hash12 lattice can be baked.
//
// The lattice is finite, so the LUT is centred: texel (i,j) holds
// hash12(i-128, j-128). Every lattice coordinate the shader actually touches
// at the harness parameters lands inside [-128,127] (max |component| works out
// to ~100 at the 3rd octave of the domain-warp fbm), so the image is
// bit-comparable with the baseline apart from 8-bit value quantization.
// Coordinates outside that range wrap (GL_REPEAT) into still-valid noise.
import { link, fullscreenTriangle, pushStandardUniforms } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

const N = 256;
const OFF = 128;

// hash12 replicated in float32 so the LUT matches the GPU's own values.
const f = Math.fround;
const C = f(0.1031);
const K = f(33.33);
const fr = (v) => f(v - Math.floor(v));
export function hash12(x, y) {
	let a = fr(f(x * C));
	let b = fr(f(y * C));
	let c = a;
	const d = f(f(a * f(b + K)) + f(f(b * f(c + K)) + f(c * f(a + K))));
	a = f(a + d);
	b = f(b + d);
	c = f(c + d);
	return fr(f(f(a + b) * c));
}

export function makeLut(n, off) {
	const data = new Float32Array(n * n);
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) data[j * n + i] = hash12(i - off, j - off);
	}
	return data;
}

export function uploadLut(gl, data, n, { half = false } = {}) {
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	if (half) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, n, n, 0, gl.RED, gl.FLOAT, data);
	} else {
		const bytes = new Uint8Array(n * n);
		for (let i = 0; i < data.length; i++) bytes[i] = Math.round(data[i] * 255);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, n, n, 0, gl.RED, gl.UNSIGNED_BYTE, bytes);
	}
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	return tex;
}

const VNOISE_SRC = `float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}`;

// Shared shader builder: `body` is the replacement vnoise implementation.
export function lutShader(body) {
	const src = fragmentShader
		.replace('uniform float u_time;', 'uniform sampler2D u_lut;\nuniform float u_time;')
		.replace(VNOISE_SRC, body);
	if (src === fragmentShader) throw new Error('shader patch did not apply');
	return src;
}

export function makeLutVariant({ name, description, n, off, half, body, lutData, frag: fragSrc }) {
	const frag = fragSrc ?? lutShader(body);
	let cached = null;
	return {
		name,
		description,
		create(gl, w, h) {
			const program = link(gl, vertexShader, frag);
			gl.useProgram(program);
			const buf = fullscreenTriangle(gl, program);
			if (!cached) cached = lutData ? lutData(n, off) : makeLut(n, off);
			const tex = uploadLut(gl, cached, n, { half });
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

// Pre-warped fetch: bilinear weight == the smoothstepped fraction, so this is
// the same interpolation the baseline does, one texture fetch instead of four
// hash12 calls.
export const warpedBody = (n, off) => `float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=textureLod(u_lut, (ip+u+${off}.5)*${(1 / n).toFixed(10)}, 0.0).r;
  return r*r;
}`;

export default makeLutVariant({
	name: 'lut-r8-256',
	description: '256x256 R8 hash lattice LUT, smoothstep pre-warped (exact interp)',
	n: N,
	off: OFF,
	body: warpedBody(N, OFF)
});
