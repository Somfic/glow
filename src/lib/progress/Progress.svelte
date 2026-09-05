<script lang="ts" module>
	export type ProgressVariant = 'linear' | 'circular';

	export type ProgressSize = 'sm' | 'md' | 'lg';

	export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';
</script>

<script lang="ts">
	interface Props {
		/** Current amount of work done, between `min` and `max`. Omit it (or pass
		 *  `indeterminate`) for a bar that only says "something is happening". */
		value?: number;
		min?: number;
		max?: number;
		/** Forces the indeterminate animation even when a `value` is given —
		 *  useful while a job is between two known checkpoints. */
		indeterminate?: boolean;
		variant?: ProgressVariant;
		size?: ProgressSize;
		tone?: ProgressTone;
		/** Visible label above the bar (inside the ring, for `circular`). Also
		 *  names the progressbar for assistive tech. */
		label?: string;
		/** Show the numeric readout — the rounded percentage unless `format` says
		 *  otherwise. Defaults on for `circular`, where the ring alone is hard to
		 *  read to the percent; not at `sm`, where the text doesn't fit inside it. */
		showValue?: boolean;
		/** Renders the readout, and becomes `aria-valuetext`. Use it whenever the
		 *  raw number needs a unit to mean anything ("3 of 8 files"). */
		format?: (value: number, max: number) => string;
		class?: string;
		style?: string;
	}

	let {
		value,
		min = 0,
		max = 100,
		indeterminate = false,
		variant = 'linear',
		size = 'md',
		tone = 'primary',
		label,
		showValue,
		format,
		class: className,
		style
	}: Props = $props();

	const labelId = $props.id();

	// A missing value is as indeterminate as an explicit flag: a caller that
	// doesn't know the number can't fake one, and 0% would be a lie.
	let busy = $derived(indeterminate || value === undefined);

	let clamped = $derived(Math.min(max, Math.max(min, value ?? min)));
	let fraction = $derived(max === min ? 0 : (clamped - min) / (max - min));
	let percent = $derived(fraction * 100);

	let readout = $derived(format ? format(clamped, max) : `${Math.round(percent)}%`);
	// A bare `aria-valuenow` is only self-explanatory on a 0-100 scale. Any other
	// range, or a caller-supplied format, needs the text spelled out.
	let valueText = $derived(
		format ? readout : min === 0 && max === 100 ? undefined : `${clamped} of ${max}`
	);
	let showReadout = $derived(!busy && (showValue ?? (variant === 'circular' && size !== 'sm')));

	// Ring geometry, in the SVG's own 0-100 user space: `vector-effect` is not an
	// option for dash maths, so the stroke width is expressed there too and the
	// radius pulled in by half of it to keep the stroke inside the viewBox.
	const strokeWidth: Record<ProgressSize, number> = { sm: 12, md: 10, lg: 8 };
	let stroke = $derived(strokeWidth[size]);
	let radius = $derived(50 - stroke / 2);
	let circumference = $derived(2 * Math.PI * radius);
</script>

{#snippet head()}
	{#if label || showReadout}
		<div class="head">
			{#if label}<span class="label" id={labelId}>{label}</span>{/if}
			{#if showReadout}<span class="readout">{readout}</span>{/if}
		</div>
	{/if}
{/snippet}

<div
	class={['progress', `variant-${variant}`, `size-${size}`, `tone-${tone}`, className]
		.filter(Boolean)
		.join(' ')}
	{style}
>
	{#if variant === 'linear'}
		{@render head()}
		<div
			class="track"
			class:busy
			role="progressbar"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={busy ? undefined : clamped}
			aria-valuetext={busy ? undefined : valueText}
			aria-labelledby={label ? labelId : undefined}
		>
			<div class="fill" style={busy ? undefined : `width: ${percent}%`}></div>
		</div>
	{:else}
		<div
			class="ring"
			class:busy
			role="progressbar"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={busy ? undefined : clamped}
			aria-valuetext={busy ? undefined : valueText}
			aria-labelledby={label ? labelId : undefined}
		>
			<svg viewBox="0 0 100 100" aria-hidden="true">
				<circle class="ring-track" cx="50" cy="50" r={radius} stroke-width={stroke} />
				<circle
					class="ring-fill"
					cx="50"
					cy="50"
					r={radius}
					stroke-width={stroke}
					stroke-dasharray={circumference}
					stroke-dashoffset={busy ? circumference * 0.75 : circumference * (1 - fraction)}
				/>
			</svg>
			{#if showReadout}<span class="ring-readout">{readout}</span>{/if}
		</div>
		{#if label}<span class="ring-label" id={labelId}>{label}</span>{/if}
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.progress {
		// One custom property drives track, fill and readout, so a tone is a
		// single override rather than four.
		--progress-color: var(--glow-primary);

		&.tone-success {
			--progress-color: var(--glow-color-success);
		}
		&.tone-warning {
			--progress-color: var(--glow-color-warning);
		}
		&.tone-danger {
			--progress-color: var(--glow-color-danger);
		}
	}

	.progress.variant-linear {
		display: flex;
		flex-direction: column;
		gap: $space-xs;
		width: 100%;
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: $space-sm;
		font-size: $text-sm;
	}

	.label {
		color: $text-secondary;
	}

	.readout {
		color: $text-primary;
		font-weight: $weight-semibold;
		// The readout counts, and proportional digits make it twitch on every tick.
		font-variant-numeric: tabular-nums;
	}

	.track {
		position: relative;
		width: 100%;
		background: color-mix(in oklab, var(--glow-fg) 12%, transparent);
		border-radius: $radius-full;
		overflow: hidden;
	}

	.size-sm .track {
		height: 4px;
	}
	.size-md .track {
		height: 8px;
	}
	.size-lg .track {
		height: 12px;
	}

	.fill {
		height: 100%;
		width: 0;
		background: var(--progress-color);
		border-radius: inherit;
		transition: width var(--glow-dur-base) var(--glow-ease-out);
	}

	// The sliver travels 1.5 track-widths, so it enters and leaves rather than
	// stretching; the duration is a multiple of a motion token so reduced-motion
	// still reaches it (see the media query at the bottom).
	.track.busy .fill {
		width: 40%;
		transition: none;
		animation: progress-slide calc(var(--glow-dur-glacial) * 3) var(--glow-ease-in-out) infinite;
	}

	@keyframes progress-slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(250%);
		}
	}

	.progress.variant-circular {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: $space-xs;
	}

	.ring {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.size-sm .ring {
		width: 32px;
		height: 32px;
	}
	.size-md .ring {
		width: 48px;
		height: 48px;
	}
	.size-lg .ring {
		width: 64px;
		height: 64px;
	}

	svg {
		width: 100%;
		height: 100%;
		// SVG angles start at 3 o'clock; progress reads as starting from the top.
		transform: rotate(-90deg);
	}

	circle {
		fill: none;
	}

	.ring-track {
		stroke: color-mix(in oklab, var(--glow-fg) 12%, transparent);
	}

	.ring-fill {
		stroke: var(--progress-color);
		stroke-linecap: round;
		transition: stroke-dashoffset var(--glow-dur-base) var(--glow-ease-out);
	}

	.ring.busy svg {
		animation: progress-spin calc(var(--glow-dur-glacial) * 2) linear infinite;
	}

	.ring.busy .ring-fill {
		transition: none;
	}

	@keyframes progress-spin {
		from {
			transform: rotate(-90deg);
		}
		to {
			transform: rotate(270deg);
		}
	}

	.ring-readout {
		position: absolute;
		font-size: $text-xs;
		font-weight: $weight-semibold;
		font-variant-numeric: tabular-nums;
		color: $text-primary;
	}

	.size-lg .ring-readout {
		font-size: $text-sm;
	}

	.ring-label {
		font-size: $text-sm;
		color: $text-secondary;
	}

	// The duration tokens collapse to 1ms under reduced motion, which would turn
	// either loop into a strobe rather than stopping it. So the preference is
	// honoured the only way an indeterminate loop can be: the motion is dropped
	// and the busy state is carried by a static, dimmed fill instead.
	@media (prefers-reduced-motion: reduce) {
		.track.busy .fill {
			animation: none;
			width: 100%;
			opacity: 0.4;
		}

		.ring.busy svg {
			animation: none;
		}

		.ring.busy .ring-fill {
			opacity: 0.4;
		}
	}
</style>
