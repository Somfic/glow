// combo-lut-banded — LUT track x resolution track.
//
// These two are ORTHOGONAL, which is why this is the interesting one: the LUT
// makes each pixel of the field pass cheaper, banding makes fewer pixels run
// the field pass per frame (1/4 the pixels at half res, half of those per frame
// via 16 interleaved stripes = 1/8 of the baseline's field work). Neither
// removes work the other was going to remove, so this is the combination with
// the best chance of actually multiplying.
//
// The ceiling is the full-res upsample pass: it runs on every output pixel
// every frame and does a texture fetch + Bayer dither + quantize. It is
// irreducible, it does not benefit from either optimization, and once the field
// pass has been cut by ~40x it IS the frame. That is the term that caps the
// combined speedup well below 5.2 x 6.4.
//
// MEASURED (2560x1440): LUT 5.27x, res-banded 5.72x, naive product 30.1x,
// actual 19.8x — 66% of the product, the best composition of any pair here,
// which is what "orthogonal" is supposed to look like. The shortfall is exactly
// the cheap pass: ~1.0-1.3 ms of the 2.58 ms total is the full-res fetch +
// dither, and it is 100% overhead that the single-pass LUT variant does not pay
// at all.
//
// Fidelity note: combo-lut-half-fields (identical but with banding OFF) scores
// the SAME 34.2 dB. Every bit of the error is the half-resolution field; the
// temporal banding contributes nothing measurable. That is what motivates
// combo-safe, which keeps the banding and drops the downscale.
//
// This file also holds the shared multi-pass machinery for the other combos
// (they import `makeComboRes`), mirroring how res-half.js hosts the res-* ones.
// res-half.js itself is untouched; its GLSL is imported and string-patched.

import { link, pushStandardUniforms } from '../lib/singlepass.js';
import {
	vertexShader,
	passColor,
	passFields,
	upsampleColor,
	upsampleFields
} from './res-half.js';
import { uploadLut } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';
import { CELLS, OFF, S } from './combo-lut-tap.js';

const VNOISE_SRC = `float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}`;

// Swap the field pass's vnoise for the pre-warped LUT fetch.
export function lutPatch(src) {
	const out = src
		.replace('uniform float u_time;', 'uniform sampler2D u_lut;\nuniform float u_time;')
		.replace(VNOISE_SRC, prewarpBody(CELLS, OFF, S));
	if (out === src) throw new Error('lut patch did not apply');
	return out;
}

// K=2 + stratified quad jitter, adapted to the multi-pass field shader.
//
// CRITICAL: the jitter phase must be constant across the 2x2 derivative quad,
// because the loop takes dFdx(h)/dFdy(h) for the surface normal. In the field
// pass the quad key is floor(gl_FragCoord.xy*u_jit) with u_jit=0.5, exactly as
// in the single-pass case — u_jit is NOT rescaled to the output resolution.
// (Doing so is the bug the resolution agent hit: the derivative then measures
// the jitter, the normals blow up and the image comes out brighter and much
// grainier for only ~1.8 dB of PSNR.)
export function tapPatch(src) {
	const out = src
		.replace('const int K=6;', 'const int K=2;')
		.replace(
			'float jit=hash12(floor(gl_FragCoord.xy*u_jit))-0.5;',
			'vec2 jq=floor(gl_FragCoord.xy*u_jit);\n  float jit=fract(bayer4(jq)+0.03125+hash12(floor(jq*0.25)))-0.5;'
		);
	if (out === src) throw new Error('tap patch did not apply');
	return out;
}

function makeTarget(gl, w, h, half) {
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	if (half) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
	} else {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	const fbo = gl.createFramebuffer();
	const prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
	gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
	if (!ok) {
		gl.deleteFramebuffer(fbo);
		gl.deleteTexture(tex);
		return null;
	}
	return { tex, fbo };
}

let lutCache = null;

/**
 * Two-pass combo factory: same plumbing as res-half's makeResVariant, but the
 * field shader is built by composing patches.
 *   scale     linear downscale of the field pass (2 -> a quarter of the pixels)
 *   bands     null | B: update 1/2 the field rows per frame in B stripes
 *   fields    true -> field pass emits lum/hue/bloom, full-res pass does the
 *             palette/tonemap; false -> field pass emits final colour
 *   lut/taps/alu   which patches to apply to the field shader
 */
export function makeComboRes({
	name,
	description,
	scale = 2,
	bands = null,
	fields = false,
	lut = true,
	taps = false,
	alu = null
}) {
	let fieldSrc = fields ? passFields : passColor;
	if (lut) fieldSrc = lutPatch(fieldSrc);
	if (taps) fieldSrc = tapPatch(fieldSrc);
	if (alu) fieldSrc = alu(fieldSrc);
	const upSrc = fields ? upsampleFields : upsampleColor;

	return {
		name,
		description,
		create(gl, w, h) {
			const wantHalf = fields && !!gl.getExtension('EXT_color_buffer_float');
			const fieldProg = link(gl, vertexShader, fieldSrc);
			const upProg = link(gl, vertexShader, upSrc);

			let tex = null;
			if (lut) {
				if (!lutCache) lutCache = bakePrewarp(CELLS, OFF, S);
				tex = uploadLut(gl, lutCache, CELLS * S);
			}

			let W = w,
				H = h,
				lw = 0,
				lh = 0,
				target = null,
				frame = 0;

			const buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

			const uTimeField = gl.getUniformLocation(fieldProg, 'u_time');

			function setup(nw, nh) {
				W = nw;
				H = nh;
				lw = Math.max(1, Math.round(W / scale));
				lh = Math.max(1, Math.round(H / scale));
				if (target) {
					gl.deleteFramebuffer(target.fbo);
					gl.deleteTexture(target.tex);
				}
				target = makeTarget(gl, lw, lh, wantHalf) || makeTarget(gl, lw, lh, false);

				gl.useProgram(fieldProg);
				pushStandardUniforms(gl, fieldProg, lw, lh);
				// 0.5: one jitter phase per 2x2 quad of the FIELD pass. See tapPatch.
				gl.uniform1f(gl.getUniformLocation(fieldProg, 'u_jit'), 0.5);
				if (lut) gl.uniform1i(gl.getUniformLocation(fieldProg, 'u_lut'), 0);

				gl.useProgram(upProg);
				pushStandardUniforms(gl, upProg, W, H);
				gl.uniform1i(gl.getUniformLocation(upProg, 'u_src'), 0);
				frame = 0;
			}
			setup(w, h);

			function bindQuad(prog) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				const a = gl.getAttribLocation(prog, 'a_pos');
				gl.enableVertexAttribArray(a);
				gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
			}

			return {
				resize: setup,
				render(t) {
					const prevFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);

					gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
					gl.viewport(0, 0, lw, lh);
					gl.useProgram(fieldProg);
					bindQuad(fieldProg);
					gl.activeTexture(gl.TEXTURE0);
					if (lut) gl.bindTexture(gl.TEXTURE_2D, tex);
					gl.uniform1f(uTimeField, t);
					if (bands && frame > 0) {
						gl.enable(gl.SCISSOR_TEST);
						for (let i = frame & 1; i < bands; i += 2) {
							const y0 = Math.floor((i * lh) / bands);
							const y1 = Math.floor(((i + 1) * lh) / bands);
							if (y1 <= y0) continue;
							gl.scissor(0, y0, lw, y1 - y0);
							gl.drawArrays(gl.TRIANGLES, 0, 3);
						}
						gl.disable(gl.SCISSOR_TEST);
					} else {
						gl.drawArrays(gl.TRIANGLES, 0, 3);
					}

					gl.bindFramebuffer(gl.FRAMEBUFFER, prevFBO);
					gl.viewport(0, 0, W, H);
					gl.useProgram(upProg);
					bindQuad(upProg);
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, target.tex);
					gl.drawArrays(gl.TRIANGLES, 0, 3);

					frame++;
				},
				dispose() {
					gl.deleteBuffer(buf);
					gl.deleteProgram(fieldProg);
					gl.deleteProgram(upProg);
					if (tex) gl.deleteTexture(tex);
					if (target) {
						gl.deleteFramebuffer(target.fbo);
						gl.deleteTexture(target.tex);
					}
				}
			};
		}
	};
}

export default makeComboRes({
	name: 'combo-lut-banded',
	description: 'LUT field pass at half res, 8 of 16 stripes/frame, full-res dither (13 taps kept)',
	scale: 2,
	bands: 16
});
