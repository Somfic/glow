<script lang="ts" module>
	import type { IconProp } from '../icon/Icon.svelte';

	export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outlined' | 'dashed' | 'danger';

	export type ButtonSize = 'sm' | 'md' | 'lg';

	export type ButtonShape = 'default' | 'circle';

	export type ButtonAction = {
		label?: string;
		icon?: IconProp;
		variant?: ButtonVariant;
		size?: ButtonSize;
		shape?: ButtonShape;
		count?: number;
		shortcut?: string;
		onclick: () => void;
	};
</script>

<script lang="ts">
	import { type Snippet, getContext } from 'svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import { registerShortcut } from '../util/shortcut.svelte.js';
	import { cursor, setCursorLoading } from '../cursor/cursor.svelte.js';
	import { tooltip, type TooltipParams } from '../tooltip/tooltip.svelte.js';

	type BaseProps = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		shape?: ButtonShape;
		count?: number;
		shortcut?: string;
		onclick?: () => void | Promise<void>;
		disabled?: boolean;
		loading?: boolean;
		/** 0-100. While loading, renders a progress bar along the bottom of the button. */
		progress?: number;
		/** Text shown inside the button while loading, in place of the label. */
		progressLabel?: string;
		image?: string;
		selected?: boolean;
		fullWidth?: boolean;
		/**
		 * Accessible name. Only needed for an icon-only button, where there is
		 * no label for a screen reader to read — a `tooltip` is not a name.
		 */
		ariaLabel?: string;
		/** Tooltip text, or the same options object the `tooltip` action takes. */
		tooltip?: TooltipParams;
		class?: string;
		style?: string;
		children?: Snippet;
	};

	type WithIcon = BaseProps & {
		icon: IconProp;
		label?: string;
	};

	type WithLabel = BaseProps & {
		label: string;
		icon?: IconProp;
	};

	type WithChildren = BaseProps & {
		icon?: IconProp;
		label?: string;
	};

	const group = getContext<{ defaultVariant: ButtonVariant } | undefined>('button-group');

	let {
		label,
		icon,
		image,
		variant: variantProp,
		size = 'md',
		shape = 'default',
		count,
		shortcut,
		onclick,
		disabled = false,
		loading: manualLoading = false,
		progress,
		progressLabel,
		selected = false,
		fullWidth = false,
		ariaLabel,
		tooltip: tooltipText,
		class: className,
		style,
		children
	}: WithIcon | WithLabel | WithChildren = $props();

	// If only an icon is given and no variant is explicitly set, render bare
	// (no border/background). Otherwise default to primary.
	let isIconOnly = $derived(!!icon && !label && !children);
	let isBare = $derived(isIconOnly && variantProp === undefined && !group?.defaultVariant);
	let variant: ButtonVariant = $derived(variantProp ?? group?.defaultVariant ?? 'primary');

	// A string stays a string for callers; an options object lets one override
	// `position` (and `delay`) while still getting the button's own defaults for
	// everything it doesn't name.
	let tooltipParams: TooltipParams = $derived(
		typeof tooltipText === 'object'
			? { useCursor: false, position: 'top', ...tooltipText }
			: { content: tooltipText ?? '', useCursor: false, position: 'top' }
	);

	let promiseLoading = $state(false);
	let loading = $derived(promiseLoading || manualLoading);
	let isActiveCursorButton = $state(false);

	let clampedProgress = $derived(
		progress === undefined ? undefined : Math.min(100, Math.max(0, progress))
	);
	// The bar sits on the bottom edge, so it has nowhere to go on a circle.
	let showProgress = $derived(loading && clampedProgress !== undefined && shape !== 'circle');
	// While loading with a progress label, the label takes over the content in flow
	// (instead of the centred spinner over hidden content).
	let showProgressLabel = $derived(loading && !!progressLabel);

	// Only update cursor loading if this button is the active one
	$effect(() => {
		if (isActiveCursorButton) {
			setCursorLoading(loading);
		}
	});

	$effect(() => {
		if (!shortcut || disabled || loading) return;
		return registerShortcut(shortcut, () => {
			handleClick();
		});
	});

	async function handleClick() {
		if (!onclick || promiseLoading) return;

		// Mark this button as the active cursor button
		isActiveCursorButton = true;

		const result = onclick();
		if (result instanceof Promise) {
			promiseLoading = true;
			setCursorLoading(true);
			try {
				await result;
			} finally {
				promiseLoading = false;
				setCursorLoading(false);
				// Clear active state after loading completes
				isActiveCursorButton = false;
			}
		} else {
			// Non-async click, immediately clear active state
			isActiveCursorButton = false;
		}
	}
</script>

{#snippet tail()}
	{#if label}<span class="label">{label}</span>{:else if children}{@render children()}{/if}
	{#if count !== undefined}<span class="count">{count}</span>{/if}
	{#if shortcut}<Kbd size="sm">{shortcut}</Kbd>{/if}
{/snippet}

<button
	class={[isBare ? 'bare' : variant, `size-${size}`, `shape-${shape}`, className].filter(Boolean).join(' ')}
	{style}
	class:selected
	class:loading={loading && !icon && !showProgressLabel}
	class:full-width={fullWidth}
	class:icon-only={isIconOnly}
	class:has-progress={showProgress}
	onclick={handleClick}
	disabled={disabled || loading}
	aria-label={ariaLabel}
	aria-busy={loading}
	use:cursor={disabled || loading
		? { state: 'default' }
		: icon
			? { state: 'pointer', iconName: resolveIcon(icon).name, variant }
			: { state: 'pointer', content: label, variant }}
	use:tooltip={tooltipParams}
>
	{#if icon}
		{#if loading}
			<span class="spinner"></span>
		{:else if image}
			<img src={image} alt="" class="button-image" />
		{:else}
			<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? '1em'} />
		{/if}
		{#if showProgressLabel}
			<span class="swap">
				<span class="swap-item ghost" aria-hidden="true">{@render tail()}</span>
				<span class="swap-item"><span class="label">{progressLabel}</span></span>
			</span>
		{:else}
			{@render tail()}
		{/if}
	{:else if showProgressLabel}
		<!-- Keep the idle content in place (invisible) so the button never shrinks
		     below its original width while the progress label is showing. -->
		<span class="swap">
			<span class="swap-item ghost" aria-hidden="true">
				{#if image}
					<img src={image} alt="" class="button-image" />
				{/if}
				{@render tail()}
			</span>
			<span class="swap-item">
				<span class="spinner"></span>
				<span class="label">{progressLabel}</span>
			</span>
		</span>
	{:else}
		{#if loading}<span class="spinner"></span>{/if}
		<span class="content" class:hidden={loading}>
			{#if image}
				<img src={image} alt="" class="button-image" />
			{/if}
			{@render tail()}
		</span>
	{/if}
	{#if showProgress}
		<span
			class="progress-track"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={clampedProgress}
			aria-valuetext={progressLabel}
		>
			<span class="progress-fill" style="width: {clampedProgress}%"></span>
		</span>
	{/if}
</button>

<style lang="scss">
	@use 'sass:color' as color;
	@use '../style/theme.scss' as *;

	button {
		@include control-frame;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		font-weight: $weight-bold;
		cursor: pointer;
		transition: background-color var(--glow-dur-fast) var(--glow-ease-out);

		// Everything below is in `em`, so a size is mostly a font-size. The
		// paddings are not a straight scale though: lg buys relatively more
		// horizontal room than md, so sm gives some back — otherwise a short
		// label at 14px reads as a lozenge rather than a smaller button.
		// Radius stays `$radius` at every step; there is one radius token and
		// shrinking it here is what would break the family resemblance.
		&.size-sm {
			font-size: $text-sm;
			padding: 0.45em 0.6em;
			height: calc(2em + 2px);
			gap: 0.3em;
		}

		&.size-lg {
			font-size: 1.125rem;
			padding: 0.6em 1.25em;
			height: calc(2.4em + 2px);
			gap: 0.5em;
		}

		&.shape-circle {
			border-radius: 50%;
			padding: 0;
			aspect-ratio: 1;
			min-width: 0;
			min-height: 0;

			// Not 30px: a circle is roomier than the square at every step
			// (md 34→40, lg 45→56), and 28px is where a lone icon stops
			// clearing the 24×24 minimum target with any margin at all.
			&.size-sm {
				width: 32px;
				height: 32px;
			}
			&.size-md {
				width: 40px;
				height: 40px;
			}
			&.size-lg {
				width: 56px;
				height: 56px;
			}
		}

		&.bare {
			background: transparent;
			border-color: transparent;
			color: inherit;
			padding: 0.4em;
			height: auto;
			min-width: calc(1lh + 0.8em);
			min-height: calc(1lh + 0.8em);

			&:hover,
			&.cursor-hover {
				background: $tertiary-hover;
			}

			&:active {
				background: $tertiary-active;
			}
		}

		.count {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 1.4em;
			padding: 0 0.45em;
			font-size: 0.85em;
			font-weight: $weight-semibold;
			// currentColor, not white — on a light button the text is black and a
			// white-alpha badge would wash out into the background.
			background: color-mix(in srgb, currentColor 12%, transparent);
			border-radius: $radius-full;
			margin-left: 0.15em;
		}

		.content {
			display: inline-flex;
			align-items: center;
			gap: 0.4em;

			&.hidden {
				visibility: hidden;
			}
		}

		.label {
			transform: translateY(0.03em);
		}

		// Stacks the idle content and the progress content in one grid cell, so the
		// button sizes to whichever is wider and never shrinks mid-load.
		.swap {
			display: inline-grid;
			align-items: center;
			justify-items: center;
		}

		.swap-item {
			grid-area: 1 / 1;
			display: inline-flex;
			align-items: center;
			gap: 0.4em;
			white-space: nowrap;

			&.ghost {
				visibility: hidden;
			}
		}

		&.loading .spinner {
			position: absolute;
		}

		&.primary {
			background-color: var(--glow-primary);
			// Text flips to black or white depending on how light the primary is, so
			// a near-white (or consumer-retinted) primary stays readable.
			@include contrast-color(var(--glow-primary));
			// Interaction lays a sheet of that same contrast colour over the fill,
			// so hover/press always move *away* from whatever the accent is. The
			// -hover/-active tokens can't cover this case: they mix toward
			// --glow-fg, and an accent already at --glow-fg has nowhere to go.
			// Fallback for no relative-colour support is the tokens.
			&:hover,
			&.cursor-hover {
				background-color: var(--glow-primary-hover);
			}

			&:active {
				background-color: var(--glow-primary-active);
			}

			@include state-layer(var(--glow-primary));
		}

		&.secondary {
			background-color: var(--glow-secondary);
			@include contrast-color(var(--glow-secondary));

			&:hover,
			&.cursor-hover {
				background-color: var(--glow-secondary-hover);
			}

			&:active {
				background-color: var(--glow-secondary-active);
			}

			@include state-layer(var(--glow-secondary));
		}

		&.ghost {
			color: inherit;
			background-color: $tertiary;
			border-color: transparent;
			backdrop-filter: blur(8px);

			&:hover,
			&.cursor-hover {
				background-color: $tertiary-hover;
				color: var(--glow-fg);
			}

			&:active {
				background-color: $tertiary-active;
				color: var(--glow-fg);
			}
		}

		&.outlined {
			color: inherit;
			background-color: $tertiary;
			// The subtle border tier is ~1.4:1 against the surface, which reads as
			// a hairline rather than an edge. An outlined button's border *is* its
			// affordance, so it takes the tier that clears 3:1.
			border: $border-strong;

			&:hover,
			&.cursor-hover {
				background-color: $tertiary-hover;
				color: var(--glow-fg);
			}

			&:active {
				background-color: $tertiary-active;
				color: var(--glow-fg);
			}
		}

		&.dashed {
			color: color-mix(in oklab, var(--glow-fg) 60%, transparent);
			background: transparent;
			border-style: dashed;
			border-color: color-mix(in oklab, var(--glow-fg) 20%, transparent);

			&:hover,
			&.cursor-hover {
				color: var(--glow-fg);
				border-color: color-mix(in oklab, var(--glow-fg) 40%, transparent);
				background: color-mix(in oklab, var(--glow-fg) 4%, transparent);
			}

			&:active {
				background: color-mix(in oklab, var(--glow-fg) 8%, transparent);
			}
		}

		&.danger {
			background-color: color-mix(in oklab, var(--glow-color-danger) 10%, transparent);
			color: var(--glow-color-danger);
			border-color: color-mix(in oklab, var(--glow-color-danger) 20%, transparent);

			&:hover,
			&.cursor-hover {
				background-color: color-mix(in oklab, var(--glow-color-danger) 18%, transparent);
			}

			// Was 7% — below the 10% resting tint, so pressing appeared to
			// deselect the button. Pressed is the strongest step everywhere else.
			&:active {
				background-color: color-mix(in oklab, var(--glow-color-danger) 26%, transparent);
			}
		}

		// Disabled paints explicit tiers rather than fading the whole element.
		// `opacity` dims the border and any accent in lockstep and compounds with
		// tokens that are already translucent, so a disabled ghost button used to
		// end up at half of an already-8% wash.
		&:disabled {
			background-color: var(--glow-bg-disabled);
			background-image: none;
			border-color: var(--glow-border-disabled);
			color: var(--glow-fg-disabled);
			pointer-events: none;

			.count {
				background: var(--glow-bg-disabled);
			}
		}

		&.selected {
			outline: 2px solid var(--glow-primary);
			outline-offset: 2px;

			// A neutral fill only makes sense where there isn't one already —
			// a selected primary button keeps its accent and just gains the ring.
			&.ghost,
			&.outlined,
			&.dashed,
			&.bare {
				background-color: $tertiary-selected;
			}
		}

		&.icon-only {
			padding: 0.5em;
			min-width: calc(1lh + 1em);
			min-height: calc(1lh + 1em);
		}

		&.full-width {
			width: 100%;
		}

		.button-image {
			width: 1.5em;
			height: 1.5em;
			border-radius: 50%;
			object-fit: cover;
		}

		// Clip the bar to the button's own (inner) border radius so it can sit
		// flush against the bottom edge without poking out of the corners.
		&.has-progress {
			overflow: hidden;
		}

		.progress-track {
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 3px;
			background: color-mix(in srgb, currentColor 18%, transparent);
			overflow: hidden;
			pointer-events: none;
		}

		// 3px on a 30px button is a visible band rather than a hairline.
		&.size-sm .progress-track {
			height: 2px;
		}

		&.size-lg .progress-track {
			height: 4px;
		}

		.progress-fill {
			display: block;
			height: 100%;
			background: currentColor;
			transition: width var(--glow-dur-base) var(--glow-ease-out);
		}

		.spinner {
			width: 1em;
			height: 1em;
			border: 2px solid currentColor;
			border-top-color: transparent;
			border-radius: 50%;
			animation: spin calc(var(--glow-dur-glacial) * 1.6) linear infinite;
			opacity: 0.8;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	// A 1ms collapse would strobe the loop rather than stop it, so the ring
	// freezes instead.
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
