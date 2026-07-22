<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { fragmentShader, vertexShader } from './foldGradientShader.js';
	import { createNoiseTexture } from './noiseLut.js';

	let {
		// Colour stops, darkest → hottest (up to 5 are used).
		colors = ['#700000', '#008cff', '#75daff', '#ff0026', '#ff3626'],
		// Gap colour between the folded sheets.
		bgColor = '#121212',
		// Shadow edge tint.
		shadowColor = '#0a1c2a',
		softness = 1, // 0–2, edge blur
		saturation = 1, // 0–2, 0 = mono, 1 = natural
		rotation = 52, // drape angle, degrees
		zoom = 9, // 4–18, sheet size
		ribbon = 0, // 0–1, discrete strip blending
		ribbonWidth = 1, // strip width multiplier
		noise = 0, // 0–1, ordered dithering strength
		speed = 1, // animation speed (0 = frozen)
		maxPixelCount = 1_440_000,
		dprCap = 1.5, // cap device-pixel-ratio; soft output tolerates < native res
		fps = 0, // 0 = uncapped (vsync); set e.g. 30 to throttle GPU work
		// When > 0, prop changes ease to their new values over this many ms
		// (colours morph in HSL) instead of snapping. 0 = instant.
		transition = 0,
		class: className = '',
		children
	}: {
		colors?: string[];
		bgColor?: string;
		shadowColor?: string;
		softness?: number;
		saturation?: number;
		rotation?: number;
		zoom?: number;
		ribbon?: number;
		ribbonWidth?: number;
		noise?: number;
		speed?: number;
		maxPixelCount?: number;
		dprCap?: number;
		fps?: number;
		transition?: number;
		class?: string;
		children?: Snippet;
	} = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	// Assigned in onMount; called from the reactive effects below so prop changes
	// update the running GL context without tearing it down and re-creating it.
	let applyProps: (() => void) | null = null;
	let syncPlayback: (() => void) | null = null;

	// Static/appearance props → re-push uniforms + resize (redraws if paused).
	$effect(() => {
		void [
			colors,
			bgColor,
			shadowColor,
			softness,
			saturation,
			rotation,
			zoom,
			ribbon,
			ribbonWidth,
			noise,
			maxPixelCount,
			dprCap
		];
		applyProps?.();
	});

	// Playback props → start/stop the animation loop as needed.
	$effect(() => {
		void [speed, fps];
		syncPlayback?.();
	});

	type RGB = [number, number, number]; // linear-light RGB (what the shader wants)
	type Lab = [number, number, number]; // OKLab

	// sRGB 0–1 channel → linear-light, matching Paper Design's colour handling.
	function srgbToLinear(c: number): number {
		return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	}

	// Colours are interpolated in OKLab — a perceptually-uniform space — so a
	// morph between two muted colours stays muted instead of sweeping through the
	// neon yellows/cyans that linear-RGB or HSL-hue interpolation produce.
	function hexToOklab(hex: string): Lab {
		const h = hex.replace('#', '');
		const full =
			h.length === 3
				? h
						.split('')
						.map((ch) => ch + ch)
						.join('')
				: h;
		const n = parseInt(full.slice(0, 6), 16);
		const r = srgbToLinear(((n >> 16) & 0xff) / 255);
		const g = srgbToLinear(((n >> 8) & 0xff) / 255);
		const b = srgbToLinear((n & 0xff) / 255);
		const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
		const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
		const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
		return [
			0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
			1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
			0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
		];
	}

	// OKLab → linear-light RGB, clamped to a sane non-negative range (the shader
	// tonemaps from here, and out-of-gamut mixes can dip slightly negative).
	function oklabToLinear([L, a, bb]: Lab): RGB {
		const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
		const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
		const s_ = L - 0.0894841775 * a - 1.291485548 * bb;
		const l = l_ * l_ * l_;
		const m = m_ * m_ * m_;
		const s = s_ * s_ * s_;
		return [
			Math.max(0, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
			Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
			Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
		];
	}

	function lerpLab(a: Lab, b: Lab, t: number): Lab {
		return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
	}

	function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
		const sh = gl.createShader(type)!;
		gl.shaderSource(sh, src);
		gl.compileShader(sh);
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(sh) ?? 'shader compile failed');
		}
		return sh;
	}

	onMount(() => {
		const glCtx = canvas.getContext('webgl2', {
			antialias: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false
		});
		if (!glCtx) {
			console.warn('[Glow] WebGL2 is not available; rendering nothing.');
			return;
		}
		const gl: WebGL2RenderingContext = glCtx;

		const program = gl.createProgram()!;
		gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader));
		gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn('[Glow] program link failed:', gl.getProgramInfoLog(program));
			return;
		}
		gl.useProgram(program);

		// The noise lattice the shader samples instead of hashing per pixel. The
		// bake is ~12ms and is shared across every Glow on the page; the texture
		// itself belongs to this GL context. Bound once to unit 0 and left there,
		// since nothing else in this context ever uses a texture unit.
		const lut = createNoiseTexture(gl);
		if (!lut) {
			console.warn('[Glow] could not allocate the noise LUT; rendering nothing.');
			return;
		}
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, lut);
		gl.uniform1i(gl.getUniformLocation(program, 'u_lut'), 0);

		// Trivial second pass: copies the field target to the canvas. Kept separate
		// from the main program so the expensive shader never runs for the stripes
		// that are being reused this frame.
		const blitProgram = gl.createProgram()!;
		gl.attachShader(
			blitProgram,
			compile(
				gl,
				gl.VERTEX_SHADER,
				`#version 300 es\nin vec2 a_pos;\nvoid main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }\n`
			)
		);
		gl.attachShader(
			blitProgram,
			compile(
				gl,
				gl.FRAGMENT_SHADER,
				`#version 300 es
precision highp float;
uniform sampler2D u_src;
out vec4 fragColor;
void main(){ fragColor = texelFetch(u_src, ivec2(gl_FragCoord.xy), 0); }
`
			)
		);
		gl.linkProgram(blitProgram);
		if (!gl.getProgramParameter(blitProgram, gl.LINK_STATUS)) {
			console.warn('[Glow] blit program link failed:', gl.getProgramInfoLog(blitProgram));
			return;
		}
		gl.useProgram(blitProgram);
		gl.uniform1i(gl.getUniformLocation(blitProgram, 'u_src'), 0);
		const blitPos = gl.getAttribLocation(blitProgram, 'a_pos');
		gl.useProgram(program);

		// Full-screen triangle.
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(program, 'a_pos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

		const u = (name: string) => gl.getUniformLocation(program, name);
		const uTime = u('u_time');
		const uResolution = u('u_resolution');
		const uColors = u('u_colors');
		const uNcols = u('u_ncols');
		const uBack = u('u_back');
		const uShadow = u('u_shadow');
		const uSoftness = u('u_softness');
		const uSaturation = u('u_saturation');
		const uNoise = u('u_noise');
		const uRotation = u('u_rotation');
		const uFolds = u('u_folds');
		const uRibbon = u('u_ribbon');
		const uRibbonWidth = u('u_ribbonWidth');

		// ── Animated ("displayed") parameter state ───────────────────────────
		// The shader always draws from these values. When `transition > 0`, prop
		// changes ease toward their targets (see scheduleUpdate + loop) instead of
		// snapping; colours ease in OKLab.
		type Nums = {
			softness: number;
			saturation: number;
			noise: number;
			rotation: number;
			zoom: number;
			ribbon: number;
			ribbonWidth: number;
			ncols: number;
		};

		function targetNums(): Nums {
			return {
				softness,
				saturation,
				noise,
				rotation,
				zoom,
				ribbon,
				ribbonWidth,
				ncols: Math.max(1, Math.min(5, colors.length))
			};
		}
		// Up to 5 OKLab stops; short arrays are padded with their last colour so
		// palette() never reads garbage (and the tween has something to ease to).
		function targetColorsLab(): Lab[] {
			const list = colors.slice(0, 5);
			const out: Lab[] = [];
			for (let i = 0; i < 5; i++) {
				const hex = list[i] ?? list[list.length - 1] ?? '#000000';
				out.push(hexToOklab(hex));
			}
			return out;
		}

		let dispNums: Nums = targetNums();
		let dispColors: Lab[] = targetColorsLab();
		let dispBack: Lab = hexToOklab(bgColor);
		let dispShadow: Lab = hexToOklab(shadowColor);

		type Tween = {
			t0: number;
			dur: number;
			n0: Nums;
			nT: Nums;
			c0: Lab[];
			cT: Lab[];
			b0: Lab;
			bT: Lab;
			s0: Lab;
			sT: Lab;
		};
		let tween: Tween | null = null;

		const colorBuf = new Float32Array(20);
		function pushColors() {
			for (let i = 0; i < 5; i++) {
				const [r, g, b] = oklabToLinear(dispColors[i]);
				colorBuf.set([r, g, b, 1], i * 4);
			}
			gl.uniform4fv(uColors, colorBuf);
			gl.uniform1f(uNcols, dispNums.ncols);
		}

		function pushStatics() {
			pushColors();
			gl.uniform3fv(uBack, oklabToLinear(dispBack));
			gl.uniform3fv(uShadow, oklabToLinear(dispShadow));
			gl.uniform1f(uSoftness, dispNums.softness);
			gl.uniform1f(uSaturation, dispNums.saturation);
			gl.uniform1f(uNoise, dispNums.noise);
			gl.uniform1f(uRotation, dispNums.rotation);
			gl.uniform1f(uFolds, dispNums.zoom);
			gl.uniform1f(uRibbon, dispNums.ribbon);
			gl.uniform1f(uRibbonWidth, dispNums.ribbonWidth);
		}

		// ── temporal banding ────────────────────────────────────────────────
		// The shader is expensive per pixel, but the animation is slow: at speed 1
		// the noise domain drifts ~0.0013 units per frame, which is under a fifth
		// of an output pixel. So each frame recomputes only half the rows — 8 of 16
		// interleaved stripes — into a persistent target, and the other half stay
		// one frame (~16ms) old. Interleaving rather than splitting in two halves
		// keeps any staleness spread out instead of concentrated at one seam.
		//
		// This costs nothing spatially: every pixel is still computed at full
		// resolution with all taps. It is purely "compute it every other frame".
		const BANDS = 16;
		let fieldTex: WebGLTexture | null = null;
		let fieldFbo: WebGLFramebuffer | null = null;
		let frame = 0;
		// Set whenever the persisted field is stale or invalid and a partial
		// update would show wrong pixels: first frame, after a resize (the texture
		// is reallocated empty), and during a parameter tween (the un-updated
		// stripes would still hold the PREVIOUS colours and tear visibly).
		let needsFullRedraw = true;

		function allocField(w: number, h: number) {
			if (!fieldTex) {
				fieldTex = gl.createTexture();
				fieldFbo = gl.createFramebuffer();
			}
			gl.bindTexture(gl.TEXTURE_2D, fieldTex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTex, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			// The old contents are gone, so the next frame must fill every stripe.
			needsFullRedraw = true;
		}

		function resize() {
			const rect = canvas.getBoundingClientRect();
			const cssW = Math.max(1, rect.width);
			const cssH = Math.max(1, rect.height);
			// Render at min(dpr, dprCap) — a soft light gradient upscales cleanly,
			// so capping the pixel ratio buys a lot on retina for no visible cost.
			let ratio = Math.min(window.devicePixelRatio || 1, dprCap);
			ratio = Math.max(0.5, ratio);
			// Clamp total pixels so we never blow past maxPixelCount.
			const cap = Math.sqrt(maxPixelCount / (cssW * cssH));
			if (ratio > cap) ratio = cap;
			const w = Math.max(1, Math.round(cssW * ratio));
			const h = Math.max(1, Math.round(cssH * ratio));
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				allocField(w, h);
			} else if (!fieldTex) {
				allocField(w, h);
			}
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(program);
			gl.uniform2f(uResolution, canvas.width, canvas.height);
		}

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

		let raf = 0;
		let running = false;
		let started = false;
		let last = 0;
		let lastDraw = 0;
		let elapsed = 0;
		let visible = true; // in viewport (IntersectionObserver)
		let pageVisible = !document.hidden; // tab focused

		function draw() {
			const w = canvas.width;
			const h = canvas.height;

			// Pass 1: the expensive shader, into the persistent field target.
			gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFbo);
			gl.viewport(0, 0, w, h);
			gl.useProgram(program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, lut);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(aPos);
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
			gl.uniform1f(uTime, elapsed);

			if (needsFullRedraw) {
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				needsFullRedraw = false;
			} else {
				// Alternate which half of the stripes is refreshed each frame.
				gl.enable(gl.SCISSOR_TEST);
				for (let i = frame & 1; i < BANDS; i += 2) {
					const y0 = Math.floor((i * h) / BANDS);
					const y1 = Math.floor(((i + 1) * h) / BANDS);
					gl.scissor(0, y0, w, y1 - y0);
					gl.drawArrays(gl.TRIANGLES, 0, 3);
				}
				gl.disable(gl.SCISSOR_TEST);
			}
			frame++;

			// Pass 2: copy the field to the canvas. scale is 1:1, so this samples
			// exact texel centres and is a straight copy, not a resample.
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, w, h);
			gl.useProgram(blitProgram);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, fieldTex);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(blitPos);
			gl.vertexAttribPointer(blitPos, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		// Only animate when someone can actually see it and motion is wanted.
		function shouldAnimate() {
			return speed !== 0 && !reduceMotion.matches && visible && pageVisible;
		}
		// The loop must also run (regardless of speed) while a parameter tween is
		// in flight, so a colour/shape morph plays even on a frozen glow.
		function needsFrames() {
			if (!visible || !pageVisible) return false;
			return shouldAnimate() || tween !== null;
		}

		function lerp(a: number, b: number, t: number) {
			return a + (b - a) * t;
		}
		// Advance the active tween to progress p∈[0,1] (smoothstep-eased), writing
		// the interpolated values into the disp* state.
		function applyTween(p: number) {
			if (!tween) return;
			// ease-in-out cubic
			const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
			const { n0, nT, c0, cT, b0, bT, s0, sT } = tween;
			dispNums = {
				softness: lerp(n0.softness, nT.softness, e),
				saturation: lerp(n0.saturation, nT.saturation, e),
				noise: lerp(n0.noise, nT.noise, e),
				rotation: lerp(n0.rotation, nT.rotation, e),
				zoom: lerp(n0.zoom, nT.zoom, e),
				ribbon: lerp(n0.ribbon, nT.ribbon, e),
				ribbonWidth: lerp(n0.ribbonWidth, nT.ribbonWidth, e),
				ncols: lerp(n0.ncols, nT.ncols, e)
			};
			for (let i = 0; i < 5; i++) dispColors[i] = lerpLab(c0[i], cT[i], e);
			dispBack = lerpLab(b0, bT, e);
			dispShadow = lerpLab(s0, sT, e);
		}

		// Re-target the displayed values from the current props: either snap
		// (transition 0 / reduced motion) or ease from wherever disp* currently is.
		function scheduleUpdate() {
			const dur = reduceMotion.matches ? 0 : transition;
			const nT = targetNums();
			const cT = targetColorsLab();
			const bT = hexToOklab(bgColor);
			const sT = hexToOklab(shadowColor);
			if (dur > 0) {
				tween = {
					t0: performance.now(),
					dur,
					n0: dispNums,
					nT,
					c0: dispColors.map((c) => [...c] as Lab),
					cT,
					b0: [...dispBack] as Lab,
					bT,
					s0: [...dispShadow] as Lab,
					sT
				};
				sync(); // ensure the loop runs to drive the tween (even when frozen)
			} else {
				tween = null;
				dispNums = nT;
				dispColors = cT;
				dispBack = bT;
				dispShadow = sT;
				pushStatics();
				needsFullRedraw = true;
				if (!running) draw();
			}
		}

		function loop(now: number) {
			if (!running) return;
			if (!started) {
				last = now;
				lastDraw = now;
				started = true;
			}
			const dt = (now - last) / 1000;
			last = now;
			if (shouldAnimate()) elapsed += dt * speed; // advance by real time

			if (tween) {
				const p = tween.dur > 0 ? Math.min(1, (now - tween.t0) / tween.dur) : 1;
				applyTween(p);
				pushStatics();
				// Partial updates are invalid mid-tween: the stripes that are not
				// refreshed still hold the previous frame's colours, which during a
				// colour morph reads as banding rather than as staleness.
				needsFullRedraw = true;
				if (p >= 1) tween = null;
			}

			// Throttle the expensive draw to the target fps; the rAF tick itself is cheap.
			const interval = fps > 0 ? 1000 / fps : 0;
			if (now - lastDraw >= interval) {
				lastDraw = now;
				draw();
			}

			if (!needsFrames()) {
				stop();
				return;
			}
			raf = requestAnimationFrame(loop);
		}

		function start() {
			if (running) return;
			running = true;
			started = false;
			raf = requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		}

		// Run the loop only when it earns its keep; otherwise draw one static frame.
		function sync() {
			if (needsFrames()) start();
			else {
				stop();
				draw();
			}
		}

		applyProps = () => {
			resize();
			scheduleUpdate();
		};
		syncPlayback = () => sync();

		const ro = new ResizeObserver(() => {
			resize();
			if (!running) draw();
		});
		ro.observe(canvas);

		const io = new IntersectionObserver(
			(entries) => {
				visible = entries[0]?.isIntersecting ?? true;
				sync();
			},
			{ threshold: 0 }
		);
		io.observe(container);

		const onVisibility = () => {
			pageVisible = !document.hidden;
			sync();
		};
		document.addEventListener('visibilitychange', onVisibility);
		reduceMotion.addEventListener('change', sync);

		// Initial paint + kick off the loop if appropriate.
		pushStatics();
		resize();
		sync();

		return () => {
			stop();
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			reduceMotion.removeEventListener('change', sync);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteTexture(lut);
			gl.deleteProgram(blitProgram);
			if (fieldTex) gl.deleteTexture(fieldTex);
			if (fieldFbo) gl.deleteFramebuffer(fieldFbo);
		};
	});
</script>

<div class="glow {className}" bind:this={container}>
	<canvas bind:this={canvas} class="glow-canvas"></canvas>
	{#if children}
		<div class="glow-content">
			{@render children()}
		</div>
	{/if}
</div>

<style lang="scss">
	.glow {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.glow-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		pointer-events: none;
	}

	.glow-content {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
	}
</style>
