<script lang="ts" module>
	import type { ChartDatum } from './chart.js';

	export type SparklineTone =
		| 'primary'
		| 'neutral'
		| 'success'
		| 'warning'
		| 'danger'
		| 'info'
		/** Green when the series ends above where it started, red when below,
		 *  neutral when it lands flat. */
		| 'trend';

	export interface SparklineProps {
		/** Bare numbers (x is the index) or `{ x, y }` points. `null` is a gap. */
		data: ChartDatum[];
		/** A pixel width, or `'fill'` to take the container's via a ResizeObserver. */
		width?: number | 'fill';
		height?: number;
		tone?: SparklineTone;
		/** Shade under the line. Off by default: at 24px tall a fill costs more
		 *  legibility than it adds, and the line is the whole point. */
		area?: boolean;
		/** Mark the last plottable sample, for "where it got to" beside a metric. */
		dot?: boolean;
		/** Pulse the `dot`, for a series that is still arriving. A halo ring
		 *  rather than the dot itself, so the last sample stays exactly where it
		 *  is and stays the same size — a marker that grows and shrinks is a
		 *  marker whose position you cannot read. */
		pulse?: boolean;
		/** Monotone cubic instead of a polyline. It never overshoots the data. */
		smooth?: boolean;
		/**
		 * Ease the line between one dataset and the next instead of repainting it.
		 * Opt-in: a sparkline whose data never changes pays nothing either way,
		 * and a *replaced* series — a different metric in the same box — should
		 * cut rather than glide, or the morph implies a continuity that is not
		 * there. Turn it on for a series that grows, like a live feed.
		 */
		morph?: boolean;
		/** Milliseconds for a `morph`. */
		morphDuration?: number;
		strokeWidth?: number;
		/** Pin the y domain — pass the same pair to every sparkline in a column
		 *  and they become comparable instead of each filling its own box. */
		min?: number;
		max?: number;
		/** The accessible name. Without one the chart is `aria-hidden`, on the
		 *  assumption it decorates a number that is already in the DOM. */
		label?: string;
		/** Formats the values named in the accessible description. */
		format?: (value: number) => string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import {
		areaPath,
		extentOf,
		formatNumber,
		linePath,
		padExtent,
		scale,
		toPoints,
		watchWidth
	} from './chart.js';

	let {
		data,
		width = 96,
		height = 24,
		tone = 'primary',
		area = false,
		dot = false,
		pulse = false,
		smooth = false,
		morph = false,
		morphDuration = 400,
		strokeWidth = 1.5,
		min,
		max,
		label,
		format = formatNumber,
		class: className,
		style
	}: SparklineProps = $props();

	let host: HTMLElement | undefined = $state();
	// The fallback is a real width rather than 0 so SSR and the first paint draw
	// a plausible line instead of flashing an empty box a frame before the
	// observer fires.
	let measured = $state(160);
	let boxWidth = $derived(width === 'fill' ? measured : width);

	$effect(() => {
		if (width !== 'fill' || !host) return;
		return watchWidth(host, (w) => (measured = w));
	});

	let points = $derived(toPoints(data));
	let values = $derived(points.map((p) => p.y));
	let dataExtent = $derived(extentOf(values));

	let first = $derived(values.find((v) => v !== null) ?? null);
	let last = $derived([...values].reverse().find((v) => v !== null) ?? null);

	let resolvedTone = $derived.by(() => {
		if (tone !== 'trend') return tone;
		if (first === null || last === null || last === first) return 'neutral';
		return last > first ? 'success' : 'danger';
	});

	// Half a stroke of inset top and bottom, plus room for the dot, so neither
	// gets clipped by the viewBox at the extremes of the data.
	let inset = $derived(Math.max(strokeWidth / 2, dot ? strokeWidth * 1.6 : 0) + 0.5);

	let geometry = $derived.by(() => {
		if (!dataExtent || boxWidth <= 0) return null;
		const domainY = padExtent({
			min: min ?? dataExtent.min,
			max: max ?? dataExtent.max
		});
		const domainX = padExtent(extentOf(points.map((p) => p.x)) ?? { min: 0, max: 0 });
		// A single sample has no x span to spread over; centring it is the only
		// honest reading, and padExtent above keeps the scale from dividing by 0.
		const single = points.length === 1;
		const sx = scale(domainX, inset, boxWidth - inset);
		const sy = scale(domainY, height - inset, inset);
		const pixels = points.map((p) => ({
			x: single ? boxWidth / 2 : sx.of(p.x),
			y: p.y === null ? null : sy.of(p.y)
		}));
		return { pixels };
	});

	// ── Morphing ──────────────────────────────────────────────────────────────
	// The tween carries the *points*, not the `d` string: two path strings only
	// interpolate when their command lists line up, which two arbitrary datasets
	// never do. A gap (`null`) has no position to tween through, so a series
	// containing one is drawn straight rather than morphed.
	let flat = $derived.by(() => {
		const pts = geometry?.pixels;
		if (!morph || !pts || pts.some((p) => p.y === null)) return null;
		return pts.flatMap((p) => [p.x, p.y as number]);
	});

	// Each point's identity, which is its x in *data* space. Matching on this
	// rather than on array position is the whole trick: in a sliding window,
	// index 3 holds a different sample after every push, so an index-matched
	// tween animates every sample towards its neighbour's value and the line
	// undulates like a wave. Matched by identity, a retained sample keeps its y
	// and only its pixel x moves — the line translates left intact, which is what
	// a scrolling series actually does.
	let keys = $derived(morph ? (points.map((p) => p.x) ?? null) : null);

	// Driven from JS, so the `prefers-reduced-motion` collapse the CSS tokens get
	// cannot reach it — the same reason `AnimatedNumber` reads the query itself.
	let reduced = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (reduced = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	// Interpolated by hand rather than with `Tween`. The morph has to be able to
	// *restart from a re-mapped position* — the same sample under a new array
	// index — and `set(start, { duration: 0 })` followed by `set(target)` does
	// not do that: the reset is not applied before the second call reads its
	// starting point, so the animation runs from the old positional array and
	// every sample slides towards its neighbour's value. That is the wave.
	let from: number[] = $state([]);
	let to: number[] = $state([]);
	let t = $state(1);
	let raf = 0;

	function run(nextFrom: number[], nextTo: number[], ms: number) {
		cancelAnimationFrame(raf);
		from = nextFrom;
		to = nextTo;
		if (ms <= 0) {
			t = 1;
			return;
		}
		t = 0;
		const started = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - started) / ms);
			t = cubicOut(p);
			if (p < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	}

	$effect(() => () => cancelAnimationFrame(raf));

	/** The frame on screen right now, flat. */
	let painted = $derived.by(() =>
		to.length === from.length ? to.map((v, i) => from[i] + (v - from[i]) * t) : to
	);

	/** The identities that frame belongs to. */
	let paintedKeys: number[] = [];
	let placed = false;

	$effect(() => {
		const target = flat;
		const targetKeys = keys;
		if (!target || !targetKeys) return;
		untrack(() => {
			if (!placed) {
				placed = true;
				paintedKeys = targetKeys;
				run(target, target, 0);
				return;
			}

			// Where each identity sits on screen right now — read from the painted
			// frame, so interrupting a morph continues from what the eye can see.
			const at = new Map<number, [number, number]>();
			for (let i = 0; i < paintedKeys.length && i * 2 + 1 < painted.length; i++) {
				at.set(paintedKeys[i], [painted[i * 2], painted[i * 2 + 1]]);
			}
			const tail =
				painted.length >= 2 ? [painted[painted.length - 2], painted[painted.length - 1]] : null;

			const next: number[] = [];
			for (let i = 0; i < targetKeys.length; i++) {
				const held = at.get(targetKeys[i]);
				if (held) next.push(held[0], held[1]);
				// A sample never drawn before enters from the end of the line rather
				// than from wherever index `i` used to be, so the newest reading grows
				// out of the series instead of flying in from the side.
				else if (tail) next.push(tail[0], tail[1]);
				else next.push(target[i * 2], target[i * 2 + 1]);
			}

			run(next, target, reduced ? 0 : morphDuration);
			paintedKeys = targetKeys;
		});
	});

	let drawn = $derived.by(() => {
		const pts = geometry?.pixels;
		if (!pts) return null;
		// Until a painted frame matches the data's shape, draw the real points — a
		// half-mapped array would misstate the values.
		if (!flat || painted.length !== flat.length) return pts;
		return Array.from({ length: painted.length / 2 }, (_, i) => ({
			x: painted[i * 2],
			y: painted[i * 2 + 1]
		}));
	});

	let paths = $derived.by(() => {
		if (!drawn) return null;
		return {
			line: linePath(drawn, smooth),
			area: area ? areaPath(drawn, height - inset / 2, smooth) : '',
			lastPixel: [...drawn].reverse().find((p) => p.y !== null) ?? null
		};
	});

	let description = $derived.by(() => {
		if (!label) return undefined;
		if (!dataExtent || first === null || last === null) return `${label}: no data`;
		const direction = last > first ? 'up' : last < first ? 'down' : 'flat';
		return `${label}: ${points.length} points, ${direction} from ${format(first)} to ${format(last)}, low ${format(dataExtent.min)}, high ${format(dataExtent.max)}`;
	});
</script>

<span
	bind:this={host}
	class={['sparkline', `tone-${resolvedTone}`, className].filter(Boolean).join(' ')}
	class:fill={width === 'fill'}
	{style}
>
	<svg
		width={boxWidth}
		{height}
		viewBox="0 0 {boxWidth} {height}"
		role={description ? 'img' : undefined}
		aria-label={description}
		aria-hidden={description ? undefined : 'true'}
	>
		{#if paths}
			{#if paths.area}
				<path class="area" d={paths.area} />
			{/if}
			<path class="line" d={paths.line} stroke-width={strokeWidth} />
			{#if dot && paths.lastPixel}
				{#if pulse}
					<circle
						class="pulse"
						cx={paths.lastPixel.x}
						cy={paths.lastPixel.y}
						r={strokeWidth * 1.4}
					/>
				{/if}
				<circle
					class="dot"
					cx={paths.lastPixel.x}
					cy={paths.lastPixel.y}
					r={strokeWidth * 1.4}
					stroke-width={strokeWidth * 0.8}
				/>
			{/if}
		{:else}
			<!-- Nothing plottable: a baseline rather than an empty box, so the
			     column still lines up and the absence reads as "no data". -->
			<line class="empty" x1="0" y1={height / 2} x2={boxWidth} y2={height / 2} />
		{/if}
	</svg>
</span>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.sparkline {
		--sparkline-color: var(--glow-primary);

		display: inline-block;
		line-height: 0;
		vertical-align: middle;

		&.fill {
			display: block;
			width: 100%;
		}

		&.tone-neutral {
			--sparkline-color: var(--glow-text-secondary);
		}
		&.tone-success {
			--sparkline-color: var(--glow-color-success);
		}
		&.tone-warning {
			--sparkline-color: var(--glow-color-warning);
		}
		&.tone-danger {
			--sparkline-color: var(--glow-color-danger);
		}
		&.tone-info {
			--sparkline-color: var(--glow-color-info);
		}
	}

	svg {
		display: block;
		overflow: visible;
	}

	.line {
		fill: none;
		stroke: var(--sparkline-color);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.area {
		fill: color-mix(in oklab, var(--sparkline-color) 18%, transparent);
		stroke: none;
	}

	.dot {
		fill: var(--sparkline-color);
		// Ringed in the surface colour so the dot stays a dot where the line
		// doubles back under it.
		stroke: var(--glow-bg-surface);
	}

	// Drawn under the dot and scaled from its own centre, so the pulse reads as a
	// halo leaving the marker rather than as the marker moving. `--glow-dur-*`
	// carries the `prefers-reduced-motion` collapse, but a 1ms loop still repeats
	// forever, so the animation is switched off outright there instead.
	.pulse {
		fill: var(--sparkline-color);
		transform-box: fill-box;
		transform-origin: center;
		animation: sparkline-pulse calc(var(--glow-dur-glacial) * 3) var(--glow-ease-out) infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
			opacity: 0;
		}
	}

	@keyframes sparkline-pulse {
		from {
			transform: scale(1);
			opacity: 0.5;
		}
		to {
			transform: scale(3);
			opacity: 0;
		}
	}

	.empty {
		stroke: var(--glow-border-color);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}
</style>
