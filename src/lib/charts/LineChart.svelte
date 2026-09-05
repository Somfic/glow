<script lang="ts" module>
	import type { ChartDatum } from './chart.js';

	export interface LineSeries {
		/** Names the line in the legend, the tooltip and the data table. */
		label: string;
		data: ChartDatum[];
		/** Overrides the palette slot. Pass a `var(--glow-*)`, not a literal. */
		color?: string;
	}

	/**
	 * How the underlying numbers reach a screen reader.
	 * `hidden` — a visually hidden `<table>` (the default).
	 * `visible` — the same table, shown under the chart.
	 * `none` — only the summary; use it when the same data is already tabulated
	 * on the page and a second copy would just be noise.
	 */
	export type LineChartTable = 'hidden' | 'visible' | 'none';

	export interface LineChartProps {
		series: LineSeries[];
		/** The chart's accessible name, and its visible heading unless `showTitle` is off. */
		label: string;
		/** Extra context for the accessible description — units, period, source. */
		description?: string;
		/** Fixed pixel width. Omit it and the chart takes its container's. */
		width?: number;
		/** Height of the plot box, chrome included. */
		height?: number;
		/** Monotone cubic instead of a polyline. It never overshoots the data. */
		smooth?: boolean;
		/** Shade under each line. Best with one series; several stack up muddy. */
		area?: boolean;
		/** Point markers. `'auto'` draws them when they won't crowd the line. */
		points?: boolean | 'auto';
		grid?: boolean;
		xAxis?: boolean;
		yAxis?: boolean;
		legend?: boolean;
		showTitle?: boolean;
		/** Pin the y domain. `yMin={0}` is worth passing on nearly every chart of
		 *  counts: a non-zero baseline exaggerates the swings. */
		yMin?: number;
		yMax?: number;
		/** Roughly how many ticks per axis; the nice-number step decides the rest. */
		xTicks?: number;
		yTicks?: number;
		formatX?: (x: number) => string;
		formatY?: (y: number) => string;
		table?: LineChartTable;
		/** Message shown in place of the plot when there is nothing to draw. */
		emptyMessage?: string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import {
		SERIES_DASH,
		SERIES_SLOTS,
		areaPath,
		extentOf,
		formatNumber,
		linePath,
		markerPath,
		niceTicks,
		padExtent,
		scale,
		toPoints,
		watchWidth
	} from './chart.js';

	let {
		series,
		label,
		description,
		width,
		height = 260,
		smooth = false,
		area = false,
		points = 'auto',
		grid = true,
		xAxis = true,
		yAxis = true,
		legend = true,
		showTitle = true,
		yMin,
		yMax,
		xTicks = 6,
		yTicks = 5,
		formatX = formatNumber,
		formatY = formatNumber,
		table = 'hidden',
		emptyMessage = 'No data',
		class: className,
		style
	}: LineChartProps = $props();

	// One call, two ids: `$props.id()` may only be used once per component.
	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descId = `${uid}-desc`;

	let host: HTMLElement | undefined = $state();
	// A plausible width for SSR and the frame before the observer reports, so the
	// chart never paints at zero and then jumps.
	let measured = $state(640);
	let boxWidth = $derived(width ?? measured);

	$effect(() => {
		if (width !== undefined || !host) return;
		return watchWidth(host, (w) => (measured = w));
	});

	let normalised = $derived(series.map((s) => toPoints(s.data)));
	let xValues = $derived(
		[...new Set(normalised.flatMap((pts) => pts.map((p) => p.x)))].sort((a, b) => a - b)
	);
	let hasData = $derived(normalised.some((pts) => pts.some((p) => p.y !== null)));

	let domainY = $derived.by(() => {
		const data = extentOf(normalised.flatMap((pts) => pts.map((p) => p.y))) ?? { min: 0, max: 1 };
		const base = padExtent({ min: yMin ?? data.min, max: yMax ?? data.max });
		// A little headroom so the peak isn't welded to the top edge — but only
		// on the ends the caller left open.
		const pad = (base.max - base.min) * 0.08;
		return {
			min: yMin ?? base.min - pad,
			max: yMax ?? base.max + pad
		};
	});
	let domainX = $derived(padExtent(extentOf(xValues) ?? { min: 0, max: 1 }));

	let yTickValues = $derived(yAxis || grid ? niceTicks(domainY, yTicks) : []);
	let xTickIndices = $derived.by(() => {
		if ((!xAxis && !grid) || xValues.length === 0) return [];
		const step = Math.max(1, Math.ceil(xValues.length / Math.max(2, xTicks)));
		const out: number[] = [];
		for (let i = 0; i < xValues.length; i += step) out.push(i);
		// The last sample is the one a reader looks for, so it is always labelled —
		// but it replaces the previous tick rather than crowding up against it
		// when the count doesn't divide evenly.
		const last = xValues.length - 1;
		if (out[out.length - 1] !== last) {
			if (last - out[out.length - 1] <= step / 2) out.pop();
			out.push(last);
		}
		return out;
	});

	// Room for the widest y label, measured in characters rather than by laying
	// the text out: an 8px-per-character estimate at $text-xs is within a pixel
	// or two, and getting it exactly right would cost a synchronous reflow per
	// render for a gutter nobody can see.
	let padLeft = $derived(
		yAxis ? Math.min(80, 14 + Math.max(...yTickValues.map((t) => formatY(t).length), 2) * 8) : 8
	);
	let padBottom = $derived(xAxis ? 26 : 8);
	const padTop = 10;
	const padRight = 12;

	let plotWidth = $derived(Math.max(0, boxWidth - padLeft - padRight));
	let plotHeight = $derived(Math.max(0, height - padTop - padBottom));

	let sx = $derived(scale(domainX, padLeft, padLeft + plotWidth));
	let sy = $derived(scale(domainY, padTop + plotHeight, padTop));

	// A lone x value has no span to spread across, so every point would land on
	// the left edge; centring the column is the honest reading.
	let single = $derived(xValues.length === 1);
	let px = $derived((x: number) => (single ? padLeft + plotWidth / 2 : sx.of(x)));

	let laidOut = $derived(
		normalised.map((pts) =>
			pts.map((p) => ({ x: px(p.x), y: p.y === null ? null : sy.of(p.y), datum: p }))
		)
	);

	let showMarkers = $derived(
		points === 'auto' ? xValues.length <= 24 || series.length > 1 : points
	);

	let activeIndex: number | null = $state(null);
	let activeX = $derived(activeIndex === null ? null : xValues[activeIndex]);

	/** Value of each series at the crosshair's x, `null` where it has no sample. */
	let readouts = $derived.by(() => {
		if (activeX === null) return [];
		return series.map((s, i) => {
			const hit = normalised[i].find((p) => p.x === activeX);
			return { label: s.label, slot: i % SERIES_SLOTS, color: s.color, y: hit?.y ?? null };
		});
	});

	let liveReadout = $derived(
		activeX === null
			? ''
			: `${formatX(activeX)}: ${readouts
					.map((r) => `${r.label} ${r.y === null ? 'no data' : formatY(r.y)}`)
					.join(', ')}`
	);

	function nearestIndex(clientX: number, rect: DOMRect): number | null {
		if (!xValues.length) return null;
		if (single) return 0;
		const value = sx.invert(clientX - rect.left);
		let best = 0;
		let bestDistance = Infinity;
		for (let i = 0; i < xValues.length; i++) {
			const d = Math.abs(xValues[i] - value);
			if (d < bestDistance) {
				bestDistance = d;
				best = i;
			}
		}
		return best;
	}

	function onpointermove(event: PointerEvent) {
		const target = event.currentTarget as HTMLElement;
		activeIndex = nearestIndex(event.clientX, target.getBoundingClientRect());
	}

	function onkeydown(event: KeyboardEvent) {
		if (!xValues.length) return;
		const last = xValues.length - 1;
		const current = activeIndex ?? 0;
		let next: number | null = null;
		if (event.key === 'ArrowRight') next = Math.min(last, current + 1);
		else if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = last;
		else if (event.key === 'Escape') {
			activeIndex = null;
			return;
		} else return;

		event.preventDefault(); // arrows would otherwise scroll the page under the chart
		activeIndex = next;
	}

	let summary = $derived.by(() => {
		if (!hasData) return `${label}: ${emptyMessage}`;
		const parts = series.map((s, i) => {
			const ys = normalised[i].map((p) => p.y);
			const e = extentOf(ys);
			const last = [...ys].reverse().find((v) => v !== null);
			if (!e || last === undefined) return `${s.label}: no data`;
			return `${s.label}: from ${formatY(ys.find((v) => v !== null) as number)} to ${formatY(last as number)}, low ${formatY(e.min)}, high ${formatY(e.max)}`;
		});
		const range =
			xValues.length > 1 ? `${formatX(xValues[0])} to ${formatX(xValues[xValues.length - 1])}` : formatX(xValues[0]);
		return `${description ? description + '. ' : ''}${series.length} series over ${range}. ${parts.join('. ')}.`;
	});

	let tooltipX = $derived(activeX === null ? 0 : px(activeX));
	// Flip the tooltip to the other side of the crosshair once it would overflow,
	// rather than clamping it, so it never covers the point it is describing.
	let tooltipFlipped = $derived(tooltipX > padLeft + plotWidth * 0.6);
</script>

<figure
	class={['line-chart', className].filter(Boolean).join(' ')}
	{style}
	bind:this={host}
	aria-labelledby={titleId}
>
	<figcaption class="title" id={titleId} class:visually-hidden={!showTitle}>
		{label}
		{#if description && showTitle}<span class="description">{description}</span>{/if}
	</figcaption>

	{#if legend && series.length > 1}
		<ul class="legend">
			{#each series as s, i}
				<li style={`--series-color: ${s.color ?? `var(--glow-chart-${(i % SERIES_SLOTS) + 1})`}`}>
					<svg class="swatch" width="26" height="12" aria-hidden="true">
						<line
							x1="1"
							y1="6"
							x2="25"
							y2="6"
							stroke-dasharray={SERIES_DASH[i % SERIES_SLOTS] || undefined}
						/>
						<path d={markerPath(i % SERIES_SLOTS, 13, 6, 3.5)} />
					</svg>
					{s.label}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- The plot is an image that is also explorable, which the linter has no
	     role for: `img` is what makes a screen reader announce the name and the
	     summary instead of walking a tree of <path>s, and the tabindex is what
	     lets a keyboard user drive the crosshair. Anything genuinely interactive
	     (button, slider) would announce an affordance the chart does not have. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="plot"
		style={`height: ${height}px`}
		role="img"
		tabindex="0"
		aria-labelledby={titleId}
		aria-describedby={descId}
		{onpointermove}
		{onkeydown}
		onpointerleave={() => (activeIndex = null)}
		onblur={() => (activeIndex = null)}
	>
		<svg width={boxWidth} {height} viewBox="0 0 {boxWidth} {height}" aria-hidden="true">
			{#if hasData}
				{#if grid}
					<g class="grid">
						{#each yTickValues as tick}
							<line x1={padLeft} y1={sy.of(tick)} x2={padLeft + plotWidth} y2={sy.of(tick)} />
						{/each}
					</g>
				{/if}

				<line
					class="axis"
					x1={padLeft}
					y1={padTop + plotHeight}
					x2={padLeft + plotWidth}
					y2={padTop + plotHeight}
				/>

				{#if yAxis}
					<g class="tick-label y">
						{#each yTickValues as tick}
							<text x={padLeft - 8} y={sy.of(tick)} dominant-baseline="central" text-anchor="end">
								{formatY(tick)}
							</text>
						{/each}
					</g>
				{/if}

				{#if xAxis}
					<g class="tick-label x">
						{#each xTickIndices as i}
							<text
								x={px(xValues[i])}
								y={padTop + plotHeight + 16}
								dominant-baseline="hanging"
								text-anchor={i === 0 && !single ? 'start' : i === xValues.length - 1 && !single ? 'end' : 'middle'}
							>
								{formatX(xValues[i])}
							</text>
						{/each}
					</g>
				{/if}

				{#if activeX !== null}
					<line
						class="crosshair"
						x1={tooltipX}
						y1={padTop}
						x2={tooltipX}
						y2={padTop + plotHeight}
					/>
				{/if}

				{#each laidOut as pixels, i}
					<g
						class="series"
						style={`--series-color: ${series[i].color ?? `var(--glow-chart-${(i % SERIES_SLOTS) + 1})`}`}
					>
						{#if area}
							<path class="area" d={areaPath(pixels, padTop + plotHeight, smooth)} />
						{/if}
						<path
							class="line"
							d={linePath(pixels, smooth)}
							stroke-dasharray={SERIES_DASH[i % SERIES_SLOTS] || undefined}
						/>
						{#if showMarkers}
							{#each pixels as p}
								{#if p.y !== null}
									<path class="marker" d={markerPath(i % SERIES_SLOTS, p.x, p.y, 3.2)} />
								{/if}
							{/each}
						{/if}
						{#if activeX !== null}
							{@const hit = pixels.find((p) => p.datum.x === activeX && p.y !== null)}
							{#if hit}
								<path class="marker active" d={markerPath(i % SERIES_SLOTS, hit.x, hit.y as number, 4.5)} />
							{/if}
						{/if}
					</g>
				{/each}
			{/if}
		</svg>

		{#if !hasData}
			<p class="empty">{emptyMessage}</p>
		{/if}

		{#if activeX !== null}
			<div
				class="tooltip"
				class:flipped={tooltipFlipped}
				style={`left: ${tooltipX}px; top: ${padTop}px`}
			>
				<span class="tooltip-x">{formatX(activeX)}</span>
				{#each readouts as r}
					<span
						class="tooltip-row"
						style={`--series-color: ${r.color ?? `var(--glow-chart-${r.slot + 1})`}`}
					>
						<svg class="swatch" width="12" height="12" aria-hidden="true">
							<path d={markerPath(r.slot, 6, 6, 3.5)} />
						</svg>
						<span class="tooltip-label">{r.label}</span>
						<span class="tooltip-value">{r.y === null ? '—' : formatY(r.y)}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<p id={descId} class="visually-hidden">{summary}</p>
	<!-- Outside the role="img" subtree, whose children assistive tech ignores. -->
	<div class="visually-hidden" aria-live="polite">{liveReadout}</div>

	{#if table !== 'none' && hasData}
		<div class="data-table" class:visually-hidden={table === 'hidden'}>
			<table>
				<caption>{label} — data</caption>
				<thead>
					<tr>
						<th scope="col">x</th>
						{#each series as s}<th scope="col">{s.label}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each xValues as x}
						<tr>
							<th scope="row">{formatX(x)}</th>
							{#each normalised as pts}
								{@const hit = pts.find((p) => p.x === x)}
								<td>{hit === undefined || hit.y === null ? '—' : formatY(hit.y)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</figure>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.line-chart {
		// The series palette, as tokens so an app can retint it per theme without
		// touching the component. Every entry is an existing --glow-* colour: a
		// chart that hardcodes its own hues is exactly what this library exists to
		// avoid. Hue is never the only difference between two series — the stroke
		// dash and the marker shape carry it too (see SERIES_DASH / markerPath),
		// which is what keeps six lines apart for a dichromatic reader and in a
		// greyscale print.
		--glow-chart-1: var(--glow-primary);
		--glow-chart-2: var(--glow-color-info);
		--glow-chart-3: var(--glow-color-success);
		--glow-chart-4: var(--glow-color-warning);
		--glow-chart-5: var(--glow-color-danger);
		--glow-chart-6: color-mix(in oklab, var(--glow-primary) 45%, var(--glow-fg));

		margin: 0;
		display: flex;
		flex-direction: column;
		gap: $space-sm;
		width: 100%;
		color: $text-primary;
	}

	.title {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-family: $font-family-header;
		font-weight: $weight-semibold;
		font-size: $text-sm;
	}

	.description {
		font-weight: $weight-normal;
		font-size: $text-xs;
		color: $text-secondary;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: $space-xs $space-md;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: $text-xs;
		color: $text-secondary;

		li {
			display: flex;
			// The swatch is 12px tall against a ~16px line box, so centring it on
			// the text's box is what makes the two share a centre line.
			align-items: center;
			gap: $space-xs;
		}
	}

	.swatch {
		flex: none;
		overflow: visible;

		line {
			stroke: var(--series-color);
			stroke-width: 2;
		}

		path {
			fill: var(--series-color);
		}
	}

	.plot {
		position: relative;
		width: 100%;
		border-radius: $radius;
		outline-offset: 2px;

		&:focus-visible {
			outline: 2px solid var(--glow-primary);
		}
	}

	// Scoped to the plot: a bare `svg` rule would also stretch the legend and
	// tooltip swatches to fill their rows.
	.plot svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.grid line {
		stroke: var(--glow-border-color);
		stroke-width: 1;
	}

	.axis {
		stroke: var(--glow-border-strong);
		stroke-width: 1;
	}

	.tick-label text {
		fill: var(--glow-text-muted);
		font-size: 11px;
		font-family: $font-family;
		font-variant-numeric: tabular-nums;
	}

	.crosshair {
		stroke: var(--glow-border-strong);
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}

	.series {
		.line {
			fill: none;
			stroke: var(--series-color);
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		.area {
			fill: color-mix(in oklab, var(--series-color) 14%, transparent);
			stroke: none;
		}

		.marker {
			fill: var(--series-color);
			// Knocked out against the surface so overlapping markers stay countable.
			stroke: var(--glow-bg-surface);
			stroke-width: 1;
		}

		.marker.active {
			stroke-width: 2;
		}
	}

	.empty {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		font-size: $text-sm;
		color: $text-muted;
		border: 1px dashed var(--glow-border-color);
		border-radius: $radius;
	}

	.tooltip {
		position: absolute;
		z-index: 1;
		// Nudged clear of the crosshair it annotates.
		transform: translateX(10px);
		display: grid;
		gap: 2px;
		min-width: 7rem;
		padding: $space-xs $space-sm;
		background: var(--glow-surface-3);
		border: $border;
		border-radius: $radius;
		box-shadow: $shadow-md;
		font-size: $text-xs;
		// The pointer is already tracked on the plot; letting the tooltip take
		// events would make it flicker as the cursor entered it.
		pointer-events: none;
		transition: transform var(--glow-dur-fast) var(--glow-ease-out);
	}

	.tooltip.flipped {
		transform: translateX(calc(-100% - 10px));
	}

	.tooltip-x {
		color: $text-secondary;
		font-variant-numeric: tabular-nums;
	}

	.tooltip-row {
		display: grid;
		grid-template-columns: 12px 1fr auto;
		align-items: center;
		gap: $space-xs;
	}

	.tooltip-label {
		color: $text-secondary;
		white-space: nowrap;
	}

	.tooltip-value {
		font-weight: $weight-semibold;
		font-variant-numeric: tabular-nums;
	}

	.data-table {
		overflow-x: auto;

		table {
			border-collapse: collapse;
			font-size: $text-xs;
			font-variant-numeric: tabular-nums;
			// Wide enough that the caption doesn't wrap after every other word:
			// a caption does not stretch the table it sits above.
			min-width: min(100%, 20rem);
		}

		caption {
			text-align: left;
			padding-bottom: $space-xs;
			color: $text-secondary;
		}

		th,
		td {
			padding: 2px $space-sm;
			border-bottom: $border;
			text-align: right;
		}

		th[scope='row'] {
			text-align: left;
			font-weight: $weight-medium;
			color: $text-secondary;
		}
	}

	// Kept in the accessibility tree and out of the layout — `display: none` would
	// remove the description and the data table from both.
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
