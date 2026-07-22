// Helper for the common case: a variant that is just "the same full-screen pass
// with a different fragment shader". Handles program compilation, the standard
// uniform block, and the full-screen triangle so variants only supply GLSL.
//
// A variant that needs more than one pass (half-res + upscale, temporal reuse,
// noise LUT textures, ...) should skip this and implement `create()` directly.

// Named parameter sets, so a variant can be judged under something other than
// the component defaults. `ribbon` in particular takes a completely different
// path through the shader (band shear, per-band softness and gain) and is what
// the demo page's third example uses.
export const PRESETS = {
	default: {},
	// src/routes/components/glow/+page.svelte, "Ribbon variations" #1.
	// A wide-gamut 5-stop ramp (dark purple -> violet -> pink -> orange -> yellow).
	// Noise in `hue` maps to a much larger colour swing across this ramp than
	// across a set of near-identical teals, so it is the harshest test of grain.
	violet: {
		colors: ['#1a0033', '#7c3aed', '#ec4899', '#f97316', '#fde047'],
		rotation: 30,
		zoom: 7
	},
	// src/routes/components/glow/+page.svelte, "Ribbon variations" #2.
	ribbon: {
		colors: ['#001b2e', '#006d77', '#83c5be', '#00d2ff'],
		bgColor: '#04121a',
		ribbon: 0.85,
		ribbonWidth: 1.3,
		rotation: 68,
		zoom: 11
	}
};

// The parameter set the harness renders with. Fixed across all variants so the
// image comparison is apples-to-apples. These are the Glow component defaults,
// overridden by whichever preset the run selected.
const BASE_PARAMS = {
	colors: ['#700000', '#008cff', '#75daff', '#ff0026', '#ff3626'],
	bgColor: '#121212',
	shadowColor: '#0a1c2a',
	softness: 1,
	saturation: 1,
	rotation: 52,
	zoom: 9,
	ribbon: 0,
	ribbonWidth: 1,
	noise: 0,
	// Universal 0..1 morph axis: 0 is the pattern's resting form, 1 is a
	// distinctly different but same-family form. Every pattern implements it, so
	// one prop can drive a state change across the whole set.
	morph: 0
};

// The harness stamps the chosen preset onto globalThis before any variant is
// imported, so every variant sees the same parameters without threading them
// through the variant API.
// Read through to globalThis on EVERY access rather than snapshotting at module
// evaluation. ES modules are cached, so a second import (a morph sweep, say)
// returns the same instance — a snapshot freezes the parameters at whatever the
// first batch used and every later batch silently re-renders the first image.
const liveParams = () => ({ ...BASE_PARAMS, ...(globalThis.__GLOW_PARAMS ?? {}) });
export const PARAMS = new Proxy(
	{},
	{
		get: (_, k) => liveParams()[k],
		has: (_, k) => k in liveParams(),
		ownKeys: () => Reflect.ownKeys(liveParams()),
		getOwnPropertyDescriptor: (_, k) => ({
			value: liveParams()[k],
			enumerable: true,
			configurable: true
		})
	}
);

function srgbToLinear(c) {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function hexToLinear(hex) {
	const h = hex.replace('#', '');
	const full =
		h.length === 3
			? h
					.split('')
					.map((ch) => ch + ch)
					.join('')
			: h;
	const n = parseInt(full.slice(0, 6), 16);
	return [
		srgbToLinear(((n >> 16) & 0xff) / 255),
		srgbToLinear(((n >> 8) & 0xff) / 255),
		srgbToLinear((n & 0xff) / 255)
	];
}

export function compile(gl, type, src) {
	const sh = gl.createShader(type);
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		throw new Error('shader compile failed: ' + gl.getShaderInfoLog(sh));
	}
	return sh;
}

export function link(gl, vs, fs) {
	const p = gl.createProgram();
	gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
	gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		throw new Error('program link failed: ' + gl.getProgramInfoLog(p));
	}
	return p;
}

export function fullscreenTriangle(gl, program) {
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(program, 'a_pos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
	return buf;
}

// Push the standard Glow uniform block. Missing uniforms are silently skipped,
// so a variant is free to drop any of them.
export function pushStandardUniforms(gl, program, w, h) {
	const u = (n) => gl.getUniformLocation(program, n);
	const colorBuf = new Float32Array(20);
	PARAMS.colors.slice(0, 5).forEach((hex, i) => {
		const [r, g, b] = hexToLinear(hex);
		colorBuf.set([r, g, b, 1], i * 4);
	});
	gl.uniform4fv(u('u_colors'), colorBuf);
	gl.uniform1f(u('u_ncols'), Math.min(5, PARAMS.colors.length));
	gl.uniform3fv(u('u_back'), hexToLinear(PARAMS.bgColor));
	gl.uniform3fv(u('u_shadow'), hexToLinear(PARAMS.shadowColor));
	gl.uniform1f(u('u_softness'), PARAMS.softness);
	gl.uniform1f(u('u_saturation'), PARAMS.saturation);
	gl.uniform1f(u('u_noise'), PARAMS.noise);
	gl.uniform1f(u('u_rotation'), PARAMS.rotation);
	gl.uniform1f(u('u_folds'), PARAMS.zoom);
	gl.uniform1f(u('u_ribbon'), PARAMS.ribbon);
	gl.uniform1f(u('u_ribbonWidth'), PARAMS.ribbonWidth);
	gl.uniform1f(u('u_morph'), PARAMS.morph);
	gl.uniform2f(u('u_resolution'), w, h);
}

export function makeSinglePassVariant({ name, description, vertexShader, fragmentShader }) {
	return {
		name,
		description,
		// Exposed so tooling can lift the GLSL back out — the live gallery embeds
		// these sources and runs the real shaders instead of shipping screenshots.
		vertexShader,
		fragmentShader,
		create(gl, w, h) {
			const program = link(gl, vertexShader, fragmentShader);
			gl.useProgram(program);
			const buf = fullscreenTriangle(gl, program);
			const uTime = gl.getUniformLocation(program, 'u_time');
			let W = w,
				H = h;
			pushStandardUniforms(gl, program, W, H);

			// The harness bumps this when it changes the parameter set, so a
			// long-lived instance picks up a new morph/preset without a rebuild.
			let seenParamsV = globalThis.__GLOW_PARAMS_V ?? 0;

			return {
				resize(nw, nh) {
					W = nw;
					H = nh;
					gl.useProgram(program);
					pushStandardUniforms(gl, program, W, H);
				},
				// Renders one frame for animation time `t` (seconds) into whatever
				// framebuffer is currently bound (the harness binds its own).
				render(t) {
					gl.useProgram(program);
					const pv = globalThis.__GLOW_PARAMS_V ?? 0;
					if (pv !== seenParamsV) {
						seenParamsV = pv;
						pushStandardUniforms(gl, program, W, H);
					}
					gl.bindBuffer(gl.ARRAY_BUFFER, buf);
					const aPos = gl.getAttribLocation(program, 'a_pos');
					gl.enableVertexAttribArray(aPos);
					gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
					gl.viewport(0, 0, W, H);
					gl.uniform1f(uTime, t);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
				},
				dispose() {
					gl.deleteBuffer(buf);
					gl.deleteProgram(program);
				}
			};
		}
	};
}
