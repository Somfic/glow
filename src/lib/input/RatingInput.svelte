<script lang="ts">
	import Icon, { resolveIcon, type IconProp } from '../icon/Icon.svelte';

	interface Props {
		id?: string;
		/** Current rating. Snapped to `step`, clamped to 0…`max`. */
		value?: number;
		max?: number;
		/** Granularity. `0.5` enables half-icon ratings; `1` is whole icons only. */
		step?: number;
		/** The icon drawn for each unit. Default is a star. */
		icon?: IconProp;
		/** Accessible name for the group. */
		label?: string;
		disabled?: boolean;
		/** Displays the rating without accepting input — for showing someone else's score. */
		readonly?: boolean;
		/** Icon size in pixels. Load-bearing: the fill overlay clips against it. */
		size?: number;
		showValue?: boolean;
		onChange?: (value: number) => void;
	}

	let {
		id,
		value = $bindable(0),
		max = 5,
		step = 1,
		icon = 'Star',
		label = 'Rating',
		disabled = false,
		readonly = false,
		size = 20,
		showValue = false,
		onChange
	}: Props = $props();

	const glyph = $derived(resolveIcon(icon));
	const interactive = $derived(!disabled && !readonly);
	const items = $derived(Array.from({ length: max }, (_, i) => i + 1));

	// Hover preview lives beside the committed value rather than replacing it, so
	// backing out of the row (or losing the pointer to a scroll) can never leave a
	// value the user never chose.
	let preview = $state<number | null>(null);
	const previewing = $derived(preview !== null);

	function snap(n: number): number {
		const clamped = Math.min(max, Math.max(0, n));
		return Math.round(clamped / step) * step;
	}

	/** Percentage of item `i` that should be painted for rating `n`. */
	function fillOf(n: number, i: number): number {
		return Math.min(100, Math.max(0, (n - (i - 1)) * 100));
	}

	/** The rating the pointer is pointing at — the whole icon, or its near half. */
	function valueAt(e: PointerEvent | MouseEvent, i: number): number {
		if (step >= 1) return i;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const half = e.clientX - rect.left < rect.width / 2;
		return snap(half ? i - 0.5 : i);
	}

	function commit(next: number) {
		const snapped = snap(next);
		if (snapped === value) return;
		value = snapped;
		onChange?.(snapped);
	}

	function onPointerMove(e: PointerEvent, i: number) {
		// Touch and pen fire pointermove too, and a preview left behind by a tap
		// would outlive the finger. CSS hides the layer on those devices; this
		// keeps the state from being set in the first place.
		if (!interactive || e.pointerType !== 'mouse') return;
		preview = valueAt(e, i);
	}

	function onClick(e: MouseEvent, i: number) {
		if (!interactive) return;
		commit(valueAt(e, i));
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!interactive) return;
		let next: number | null = null;
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = value + step;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				next = value - step;
				break;
			case 'PageUp':
				next = value + 1;
				break;
			case 'PageDown':
				next = value - 1;
				break;
			case 'Home':
				// Home is the only way to get back to "unrated" from the keyboard;
				// the minimum of this slider is 0, not 1.
				next = 0;
				break;
			case 'End':
				next = max;
				break;
		}
		if (next === null) return;
		e.preventDefault();
		commit(next);
	}
</script>

<!--
	role="slider", not a radio group: with `step={0.5}` the values 0.5, 1.5, … are
	not discrete choices a radiogroup can name, and 0 ("unrated") would need a
	radio of its own that has nothing to render. One focusable slider with
	aria-valuetext reads correctly at every step size.
-->
<div
	class="rating-input"
	class:disabled
	class:readonly
	class:previewing
	style:--rating-size="{size}px"
>
	<div
		{id}
		class="rating-items"
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-valuetext="{value} out of {max}"
		aria-readonly={readonly || undefined}
		aria-disabled={disabled || undefined}
		aria-orientation="horizontal"
		onkeydown={onKeyDown}
		onpointerleave={() => (preview = null)}
		onblur={() => (preview = null)}
	>
		{#each items as i (i)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<span
				class="rating-item"
				onpointermove={(e) => onPointerMove(e, i)}
				onclick={(e) => onClick(e, i)}
			>
				<span class="glyph empty"><Icon {...glyph} size={`${size}px`} fill={false} /></span>
				<span class="glyph value" style:width="{fillOf(value, i)}%">
					<Icon {...glyph} size={`${size}px`} fill={true} />
				</span>
				<span class="glyph preview" style:width="{fillOf(preview ?? 0, i)}%">
					<Icon {...glyph} size={`${size}px`} fill={true} />
				</span>
			</span>
		{/each}
	</div>
	{#if showValue}
		<span class="rating-value">{preview ?? value}</span>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.rating-input {
		display: inline-flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.25em 0.75em;

		&.disabled {
			@include disabled-content;
		}
	}

	.rating-items {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.15em;
		border-radius: $radius;
		outline: none;

		&:focus-visible {
			box-shadow: $focus-ring;
		}
	}

	.rating-item {
		position: relative;
		display: inline-flex;
		line-height: 0;
		cursor: pointer;
	}

	.glyph {
		display: inline-flex;
		line-height: 0;
		transition: color var(--glow-dur-fast) var(--glow-ease-out);
	}

	.empty {
		color: color-mix(in oklab, var(--glow-fg) 22%, transparent);
	}

	// The two fill layers clip against a fixed-width glyph so a half value is a
	// half icon rather than a squashed one.
	.value,
	.preview {
		position: absolute;
		inset: 0;
		overflow: hidden;
		width: 0;
		color: var(--glow-primary);
		pointer-events: none;
		transition:
			width var(--glow-dur-fast) var(--glow-ease-out),
			opacity var(--glow-dur-fast) var(--glow-ease-out);

		:global(> .icon) {
			width: var(--rating-size);
			flex: none;
		}
	}

	.preview {
		// Off everywhere by default, so a touch device never paints a preview it
		// has no way to dismiss.
		display: none;
		color: color-mix(in oklab, var(--glow-primary) 55%, transparent);
	}

	@media (hover: hover) {
		.rating-input:not(.disabled):not(.readonly) {
			.preview {
				display: inline-flex;
			}

			// While previewing, the committed fill steps back rather than stacking
			// under the preview — two accents at different lengths read as one
			// ragged value.
			&.previewing .value {
				opacity: 0;
			}
		}

		.rating-input:not(.disabled):not(.readonly) .rating-item:hover .empty {
			color: color-mix(in oklab, var(--glow-fg) 34%, transparent);
		}
	}

	.rating-input.readonly .rating-item,
	.rating-input.disabled .rating-item {
		cursor: inherit;
	}

	.rating-input.disabled .value {
		color: var(--glow-fg-disabled);
	}

	.rating-value {
		min-width: 2ch;
		text-align: center;
		font-weight: $weight-semibold;
		color: var(--glow-fg);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
</style>
