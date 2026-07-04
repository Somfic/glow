<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { fragmentShader, vertexShader } from './foldGradientShader.js';

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

	type RGB = [number, number, number];
	type HSL = [number, number, number];

	// sRGB 0–1 channel → linear-light, matching Paper Design's colour handling.
	function srgbToLinear(c: number): number {
		return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	}

	function hexToSrgb(hex: string): RGB {
		const h = hex.replace('#', '');
		const full =
			h.length === 3
				? h
						.split('')
						.map((ch) => ch + ch)
						.join('')
				: h;
		const n = parseInt(full.slice(0, 6), 16);
		return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
	}

	function srgbToHsl([r, g, b]: RGB): HSL {
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		const d = max - min;
		if (d < 1e-6) return [0, 0, l];
		const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		let h: number;
		if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		return [h / 6, s, l];
	}

	function hue2rgb(p: number, q: number, t: number): number {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}

	function hslToSrgb([h, s, l]: HSL): RGB {
		if (s <= 1e-6) return [l, l, l];
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
	}

	// Interpolate hue along the shortest path around the wheel.
	function lerpHue(a: number, b: number, t: number): number {
		let d = b - a;
		if (d > 0.5) d -= 1;
		else if (d < -0.5) d += 1;
		return (((a + d * t) % 1) + 1) % 1;
	}

	// Ease one HSL colour toward another. When an endpoint is desaturated its hue
	// is meaningless, so borrow the other endpoint's hue to avoid a grey detour.
	function lerpHsl(a: HSL, b: HSL, t: number): HSL {
		const h0 = a[1] < 1e-4 ? b[0] : a[0];
		const h1 = b[1] < 1e-4 ? a[0] : b[0];
		return [lerpHue(h0, h1, t), a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
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

		// Full-screen triangle.
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(program, 'a_pos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

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
		// snapping; colours ease in HSL.
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
		// Up to 5 HSL stops; short arrays are padded with their last colour so
		// palette() never reads garbage (and the tween has something to ease to).
		function targetColorsHsl(): HSL[] {
			const list = colors.slice(0, 5);
			const out: HSL[] = [];
			for (let i = 0; i < 5; i++) {
				const hex = list[i] ?? list[list.length - 1] ?? '#000000';
				out.push(srgbToHsl(hexToSrgb(hex)));
			}
			return out;
		}

		let dispNums: Nums = targetNums();
		let dispColors: HSL[] = targetColorsHsl();
		let dispBack: HSL = srgbToHsl(hexToSrgb(bgColor));
		let dispShadow: HSL = srgbToHsl(hexToSrgb(shadowColor));

		type Tween = {
			t0: number;
			dur: number;
			n0: Nums;
			nT: Nums;
			c0: HSL[];
			cT: HSL[];
			b0: HSL;
			bT: HSL;
			s0: HSL;
			sT: HSL;
		};
		let tween: Tween | null = null;

		const colorBuf = new Float32Array(20);
		function pushColors() {
			for (let i = 0; i < 5; i++) {
				const [r, g, b] = hslToSrgb(dispColors[i]);
				colorBuf.set([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), 1], i * 4);
			}
			gl.uniform4fv(uColors, colorBuf);
			gl.uniform1f(uNcols, dispNums.ncols);
		}

		function pushStatics() {
			pushColors();
			const [br, bg2, bb] = hslToSrgb(dispBack);
			gl.uniform3f(uBack, srgbToLinear(br), srgbToLinear(bg2), srgbToLinear(bb));
			const [sr, sg, sb] = hslToSrgb(dispShadow);
			gl.uniform3f(uShadow, srgbToLinear(sr), srgbToLinear(sg), srgbToLinear(sb));
			gl.uniform1f(uSoftness, dispNums.softness);
			gl.uniform1f(uSaturation, dispNums.saturation);
			gl.uniform1f(uNoise, dispNums.noise);
			gl.uniform1f(uRotation, dispNums.rotation);
			gl.uniform1f(uFolds, dispNums.zoom);
			gl.uniform1f(uRibbon, dispNums.ribbon);
			gl.uniform1f(uRibbonWidth, dispNums.ribbonWidth);
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
			}
			gl.viewport(0, 0, canvas.width, canvas.height);
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
			gl.uniform1f(uTime, elapsed);
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
			const e = p * p * (3 - 2 * p);
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
			for (let i = 0; i < 5; i++) dispColors[i] = lerpHsl(c0[i], cT[i], e);
			dispBack = lerpHsl(b0, bT, e);
			dispShadow = lerpHsl(s0, sT, e);
		}

		// Re-target the displayed values from the current props: either snap
		// (transition 0 / reduced motion) or ease from wherever disp* currently is.
		function scheduleUpdate() {
			const dur = reduceMotion.matches ? 0 : transition;
			const nT = targetNums();
			const cT = targetColorsHsl();
			const bT = srgbToHsl(hexToSrgb(bgColor));
			const sT = srgbToHsl(hexToSrgb(shadowColor));
			if (dur > 0) {
				tween = {
					t0: performance.now(),
					dur,
					n0: dispNums,
					nT,
					c0: dispColors.map((c) => [...c] as HSL),
					cT,
					b0: [...dispBack] as HSL,
					bT,
					s0: [...dispShadow] as HSL,
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
