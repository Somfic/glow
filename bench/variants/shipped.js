// End-to-end check of what actually ships.
//
// Unlike lut-prewarp-2048 (which patches the baseline shader in the harness),
// this imports the REAL component shader and the REAL LUT module, type-stripped
// but otherwise byte-for-byte the files in src/lib/glow/. It is what catches a
// porting mistake — a mistyped sampling constant, a missing texture bind — that
// a re-implementation of the same idea would quietly get right.
//
// It must land on the baseline's speed AND fidelity, or the port is wrong.
import { link, fullscreenTriangle, pushStandardUniforms } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/shippedShader.js';
import { bakeNoiseLut, LUT_SIZE } from '../lib/shippedLut.js';

export default {
	name: 'shipped',
	description: 'SHIPPED CODE: real src/lib/glow shader + real noiseLut.ts',
	create(gl, w, h) {
		const program = link(gl, vertexShader, fragmentShader);
		gl.useProgram(program);
		const buf = fullscreenTriangle(gl, program);

		// Mirrors createNoiseTexture() in the component.
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
