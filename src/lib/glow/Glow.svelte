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

	// sRGB hex → linear-light RGB, matching Paper Design's colour handling.
	function srgbToLinear(c: number): number {
		return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	}

	function hexToLinear(hex: string): [number, number, number] {
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

		function pushColors() {
			const list = colors.slice(0, 5);
			const flat = new Float32Array(20);
			for (let i = 0; i < list.length; i++) {
				const [r, g, b] = hexToLinear(list[i]);
				flat.set([r, g, b, 1], i * 4);
			}
			// Pad remaining slots with the last colour so palette() never reads garbage.
			for (let i = list.length; i < 5; i++) flat.set([...flat.subarray((list.length - 1) * 4, (list.length - 1) * 4 + 4)], i * 4);
			gl.uniform4fv(uColors, flat);
			gl.uniform1f(uNcols, Math.max(1, Math.min(5, list.length)));
		}

		function pushStatics() {
			pushColors();
			gl.uniform3fv(uBack, hexToLinear(bgColor));
			gl.uniform3fv(uShadow, hexToLinear(shadowColor));
			gl.uniform1f(uSoftness, softness);
			gl.uniform1f(uSaturation, saturation);
			gl.uniform1f(uNoise, noise);
			gl.uniform1f(uRotation, rotation);
			gl.uniform1f(uFolds, zoom);
			gl.uniform1f(uRibbon, ribbon);
			gl.uniform1f(uRibbonWidth, ribbonWidth);
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

		function loop(now: number) {
			if (!running) return;
			if (!started) {
				last = now;
				lastDraw = now;
				started = true;
			}
			const dt = (now - last) / 1000;
			last = now;
			elapsed += dt * speed; // advance by real time so speed stays accurate

			// Throttle the expensive draw to the target fps; the rAF tick itself is cheap.
			const interval = fps > 0 ? 1000 / fps : 0;
			if (now - lastDraw >= interval) {
				lastDraw = now;
				draw();
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
			if (shouldAnimate()) start();
			else {
				stop();
				draw();
			}
		}

		applyProps = () => {
			pushStatics();
			resize();
			if (!running) draw(); // reflect appearance changes while paused/frozen
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
