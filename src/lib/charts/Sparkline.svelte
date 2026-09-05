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
		/** Monotone cubic instead of a polyline. It never overshoots the data. */
		smooth?: boolean;
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
		smooth = false,
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
		const domainX = padExtent(
			extentOf(points.map((p) => p.x)) ?? { min: 0, max: 0 }
		);
		// A single sample has no x span to spread over; centring it is the only
		// honest reading, and padExtent above keeps the scale from dividing by 0.
		const single = points.length === 1;
		const sx = scale(domainX, inset, boxWidth - inset);
		const sy = scale(domainY, height - inset, inset);
		const pixels = points.map((p) => ({
			x: single ? boxWidth / 2 : sx.of(p.x),
			y: p.y === null ? null : sy.of(p.y)
		}));
		const lastPixel = [...pixels].reverse().find((p) => p.y !== null) ?? null;
		return {
			line: linePath(pixels, smooth),
			area: area ? areaPath(pixels, height - inset / 2, smooth) : '',
			lastPixel
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
		{#if geometry}
			{#if geometry.area}
				<path class="area" d={geometry.area} />
			{/if}
			<path class="line" d={geometry.line} stroke-width={strokeWidth} />
			{#if dot && geometry.lastPixel}
				<circle
					class="dot"
					cx={geometry.lastPixel.x}
					cy={geometry.lastPixel.y}
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

	.empty {
		stroke: var(--glow-border-color);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}
</style>
