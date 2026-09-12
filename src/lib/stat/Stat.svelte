<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';
	import type {
		AnimatedNumberFormat,
		AnimatedNumberMode
	} from '../animated-number/AnimatedNumber.svelte';

	/** `sm` sits in a toolbar or a table cell, `md` is the dashboard tier, `lg`
	 *  is the one figure a view leads with. */
	export type StatSize = 'sm' | 'md' | 'lg';

	/** `surface` is the bordered capsule; `plain` drops the frame for a grid of
	 *  stats that already sits inside a Card and doesn't want a box per cell. */
	export type StatVariant = 'surface' | 'plain';

	/** Which way is good news. `none` keeps the delta in neutral ink — use it
	 *  for a figure where neither direction is an improvement (headcount, a
	 *  temperature), because coloring it green implies a goal that isn't there. */
	export type StatDirection = 'up' | 'down' | 'none';

	export type StatProps = {
		/** Caption above the value. Sentence case, no trailing colon. */
		label?: string;
		/** The figure itself. `children` overrides it. */
		value?: string | number;
		/**
		 * Custom value content, for anything a string can't carry — an
		 * `AnimatedNumber`, a formatted duration, a glyph. Replaces `value`.
		 */
		children?: Snippet;
		/** Trailing unit, set small and uppercase: BPM, %, MB, req/s. */
		unit?: string;
		/** Lucide icon before the value. */
		icon?: IconProp;
		/**
		 * Animate changes to `value`. On by default: a stat is the one element on
		 * a dashboard that changes under the reader, and a value that swaps
		 * silently is a change they miss. Mounting never animates — only a change
		 * to an already-rendered value does — so a static tile pays nothing for
		 * this.
		 *
		 * Rendered through `AnimatedValue`: a number counts to its new value, a
		 * string crossfades to it. (Not a typewriter reveal — `Typewriter` is for
		 * text *arriving*, which is a different event from a value *changing*.)
		 */
		animate?: boolean;
		/**
		 * Formats an animated numeric value. Default is an `Intl.NumberFormat`
		 * pinned to the decimals `value` has, which also adds group separators —
		 * pass one of your own for a figure that must not have them (a year, an
		 * id, a port).
		 */
		format?: AnimatedNumberFormat;
		/**
		 * How an animated value moves: `tween` re-formats the whole number each
		 * frame, `odometer` rolls each digit on its own wheel. Tween is the
		 * default because it is the quieter of the two and a dashboard usually
		 * has more than one stat on it; reach for the odometer where the number
		 * is the thing being watched. Pairs well with `pad` — a padded odometer
		 * carries into its leading wheel instead of growing a digit.
		 */
		mode?: AnimatedNumberMode;
		/**
		 * Minimum integer digits for an animated value, zero-padded and dimmed:
		 * `pad={3}` holds three digits open so a counter crossing 99 → 100 keeps
		 * the tile exactly as wide as it was.
		 */
		pad?: number;
		/** Signed change. `0` renders as flat rather than as good news. */
		delta?: number;
		/** What the delta is measured against — "vs last week". */
		deltaLabel?: string;
		/** Which direction earns the success colour. Defaults to `up`. */
		goodDirection?: StatDirection;
		/** Formats `delta`. Default is a signed integer percentage. */
		formatDelta?: (delta: number) => string;
		/**
		 * A small mark under the value. Pass a snippet to draw it yourself, or
		 * `true` to let the tile keep its own history: every numeric `value` it
		 * is handed is recorded and plotted, with the newest sample pulsing so a
		 * series that is still arriving is distinguishable from one that stopped.
		 *
		 * `true` plots only what this tile has actually seen, so it starts empty
		 * and fills in — it cannot show history from before it mounted. Pass the
		 * snippet with your own data where that history matters, and where the
		 * series should survive a remount.
		 */
		trend?: Snippet | true;
		/** How many samples a `trend={true}` sparkline keeps. */
		trendLength?: number;
		/**
		 * Fixed-width digits. Off by default: `tabular-nums` gives every digit
		 * the width of a `0`, which reads loose at display sizes. Turn it on for
		 * a column of stats whose values must line up vertically.
		 *
		 * Only reaches a value this component renders as plain text — a string,
		 * or a number with `animate={false}`. An animated number sets its own
		 * tabular figures and has to: the digits would shuffle sideways mid-count
		 * otherwise, and the odometer measures its wheels at `1ch`.
		 */
		tabular?: boolean;
		size?: StatSize;
		variant?: StatVariant;
		class?: string;
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import AnimatedValue from '../animated-value/AnimatedValue.svelte';
	import Sparkline from '../charts/Sparkline.svelte';

	let {
		label,
		value,
		children,
		unit,
		icon,
		animate = true,
		format,
		mode = 'tween',
		pad,
		delta,
		deltaLabel,
		goodDirection = 'up',
		formatDelta,
		trend,
		trendLength = 24,
		tabular = false,
		size = 'md',
		variant = 'surface',
		class: className,
		style
	}: StatProps = $props();

	const iconSize = $derived(size === 'sm' ? 14 : size === 'lg' ? 22 : 16);

	// Only recorded for `trend === true`, and only for numbers: a string has
	// nothing to plot, and a tile that is not drawing a trend should not be
	// paying to remember one.
	// Samples carry a monotonic x rather than being bare numbers, so each one
	// keeps its identity as the window slides. Plotting bare numbers would make a
	// sample's x its array index, which shifts on every push — and a series whose
	// points change identity underneath it cannot be morphed, only redrawn.
	let history = $state<{ x: number; y: number }[]>([]);
	let sample = 0;
	$effect(() => {
		const next = value;
		if (trend !== true || typeof next !== 'number') return;
		untrack(() => {
			// The same number arriving twice is still a sample — it is what keeps
			// a flat stretch flat rather than collapsing it to a single point.
			history = [...history, { x: sample++, y: next }].slice(-Math.max(2, trendLength));
		});
	});

	const trendWidth = $derived(size === 'sm' ? 64 : size === 'lg' ? 120 : 88);
	const trendHeight = $derived(size === 'sm' ? 16 : size === 'lg' ? 32 : 24);

	const direction = $derived(
		delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
	);

	// Neutral when nothing improves in either direction, and when the change is
	// flat — a 0% delta painted green reads as a win that didn't happen.
	const tone = $derived(
		direction === 'flat' || goodDirection === 'none'
			? 'flat'
			: direction === goodDirection
				? 'good'
				: 'bad'
	);

	const deltaText = $derived(
		delta === undefined
			? ''
			: formatDelta
				? formatDelta(delta)
				: `${delta > 0 ? '+' : ''}${Math.round(delta)}%`
	);
</script>

<div
	class={['stat', `size-${size}`, `variant-${variant}`, className].filter(Boolean).join(' ')}
	{style}
>
	{#if label}
		<span class="stat-label">{label}</span>
	{/if}

	<span class="stat-row">
		{#if icon}
			<span class="stat-icon"
				><Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? iconSize} /></span
			>
		{/if}
		<span class="stat-value" class:tabular>
			{#if children}
				{@render children()}
			{:else if animate && value !== undefined}
				<AnimatedValue {value} {format} {mode} {pad} />
			{:else}{value}{/if}
		</span>
		{#if unit}
			<span class="stat-unit">{unit}</span>
		{/if}
	</span>

	{#if trend === true}
		{#if history.length > 1}
			<span class="stat-trend">
				<Sparkline
					data={history}
					width={trendWidth}
					height={trendHeight}
					tone="trend"
					dot
					pulse
					morph
					label="{label ?? 'Value'} over the last {history.length} samples"
				/>
			</span>
		{:else}
			<!-- One sample is not a trend. The box is held open anyway, so the tile
			     does not grow the moment a second value lands. -->
			<span class="stat-trend" style="height: {trendHeight}px; width: {trendWidth}px"></span>
		{/if}
	{:else if trend}
		<span class="stat-trend">{@render trend()}</span>
	{/if}

	{#if delta !== undefined}
		<!-- The arrow is not decoration: the direction has to survive the colour
		     being unavailable (CVD, forced-colors, a greyscale print). -->
		<span class="stat-delta tone-{tone}">
			<Icon
				name={direction === 'up' ? 'ArrowUp' : direction === 'down' ? 'ArrowDown' : 'Minus'}
				size={size === 'lg' ? 16 : 12}
			/>
			<span>{deltaText}</span>
			{#if deltaLabel}<span class="stat-delta-label">{deltaLabel}</span>{/if}
		</span>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.stat {
		display: inline-flex;
		flex-direction: column;
		gap: 0.25rem;
		box-sizing: border-box;
	}

	.variant-surface {
		padding: 0.35rem 0.75rem;
		border-radius: $radius-md;
		background: var(--glow-fg-soft);
		border: 1px solid var(--glow-border-color);
	}

	.stat-label {
		font-size: $text-xs;
		font-weight: $weight-medium;
		line-height: 1.2;
		color: $text-secondary;
	}

	.stat-row {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.stat-icon {
		display: flex;
		align-self: center;
		color: $text-secondary;
	}

	.stat-value {
		font-size: 1.35rem;
		font-weight: $weight-bold;
		// Matches the line box `AnimatedValue` normalises both of its paths to, so
		// a tile is the same height animated or not, numeric or not.
		line-height: 1.2;
		color: $text-primary;

		// Proportional figures by default — see the `tabular` prop.
		&.tabular {
			font-variant-numeric: tabular-nums;
		}
	}

	.stat-unit {
		font-size: $text-xs;
		font-weight: $weight-medium;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: $text-secondary;
	}

	.stat-trend {
		display: flex;
	}

	.stat-delta {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: $text-xs;
		font-weight: $weight-medium;
		line-height: 1;
		color: $text-secondary;

		&.tone-good {
			color: var(--glow-color-success);
		}

		&.tone-bad {
			color: var(--glow-color-danger);
		}
	}

	.stat-delta-label {
		color: $text-muted;
		font-weight: $weight-normal;
	}

	.size-sm {
		.stat-value {
			font-size: $text-base;
		}
	}

	.size-lg {
		gap: 0.35rem;

		&.variant-surface {
			padding: 0.75rem 1rem;
		}

		.stat-label {
			font-size: $text-sm;
		}

		.stat-value {
			font-size: 2.25rem;
		}

		.stat-unit {
			font-size: $text-sm;
		}
	}
</style>
