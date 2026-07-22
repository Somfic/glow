// Mirrors the SHIPPED component draw path exactly, including temporal banding:
// the expensive shader renders 8 of 16 interleaved stripes into a persistent
// full-resolution target each frame, then a trivial pass copies that target to
// the output. Every pixel is still computed at native resolution with all taps;
// half of them are one frame old.
//
// This exists to measure what banding buys on top of the real shader, so the
// number reflects the component rather than a re-implementation of the idea.
import { link, fullscreenTriangle, pushStandardUniforms } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/shippedShader.js';
import { bakeNoiseLut, LUT_SIZE } from '../lib/shippedLut.js';

const BANDS = 16;

const BLIT_VS = `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;
const BLIT_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
out vec4 fragColor;
void main(){ fragColor = texelFetch(u_src, ivec2(gl_FragCoord.xy), 0); }
`;

export default {
	name: 'shipped-banded',
	description: 'SHIPPED + temporal banding: 8 of 16 full-res stripes per frame',
	create(gl, w, h) {
		const program = link(gl, vertexShader, fragmentShader);
		gl.useProgram(program);
		const buf = fullscreenTriangle(gl, program);

		const lut = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, lut);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, LUT_SIZE, LUT_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, bakeNoiseLut());
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.uniform1i(gl.getUniformLocation(program, 'u_lut'), 0);
		const uTime = gl.getUniformLocation(program, 'u_time');

		const blit = link(gl, BLIT_VS, BLIT_FS);
		gl.useProgram(blit);
		gl.uniform1i(gl.getUniformLocation(blit, 'u_src'), 0);
		const blitPos = gl.getAttribLocation(blit, 'a_pos');

		let W = w,
			H = h,
			frame = 0,
			full = true;
		let tex = null,
			fbo = null;

		function alloc() {
			if (!tex) {
				tex = gl.createTexture();
				fbo = gl.createFramebuffer();
			}
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			full = true;
		}

		gl.useProgram(program);
		pushStandardUniforms(gl, program, W, H);
		alloc();

		return {
			resize(nw, nh) {
				W = nw;
				H = nh;
				gl.useProgram(program);
				pushStandardUniforms(gl, program, W, H);
				alloc();
			},
			render(t) {
				// The harness binds its own FBO as the output; remember it so the
				// copy pass lands where the harness expects to read pixels from.
				const out = gl.getParameter(gl.FRAMEBUFFER_BINDING);

				gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
				gl.viewport(0, 0, W, H);
				gl.useProgram(program);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, lut);
				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				const aPos = gl.getAttribLocation(program, 'a_pos');
				gl.enableVertexAttribArray(aPos);
				gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
				gl.uniform1f(uTime, t);

				if (full) {
					gl.drawArrays(gl.TRIANGLES, 0, 3);
					full = false;
				} else {
					gl.enable(gl.SCISSOR_TEST);
					for (let i = frame & 1; i < BANDS; i += 2) {
						const y0 = Math.floor((i * H) / BANDS);
						const y1 = Math.floor(((i + 1) * H) / BANDS);
						gl.scissor(0, y0, W, y1 - y0);
						gl.drawArrays(gl.TRIANGLES, 0, 3);
					}
					gl.disable(gl.SCISSOR_TEST);
				}
				frame++;

				gl.bindFramebuffer(gl.FRAMEBUFFER, out);
				gl.viewport(0, 0, W, H);
				gl.useProgram(blit);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				gl.enableVertexAttribArray(blitPos);
				gl.vertexAttribPointer(blitPos, 2, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			},
			dispose() {
				gl.deleteTexture(lut);
				gl.deleteTexture(tex);
				gl.deleteFramebuffer(fbo);
				gl.deleteBuffer(buf);
				gl.deleteProgram(program);
				gl.deleteProgram(blit);
			}
		};
	}
};
