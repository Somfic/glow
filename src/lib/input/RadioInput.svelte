<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import type { RadioSelectOption } from './types.js';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import { tooltip } from '../tooltip/tooltip.svelte.js';

	type Props<T> = {
		id?: string;
		options: RadioSelectOption<T>[];
		value?: T;
		clearable?: boolean;
		disabled?: boolean;
		/** Show only each option's icon, with its label as tooltip/accessible
		 *  name. Options without an icon still fall back to their label text. */
		iconOnly?: boolean;
		/** Font size of the control. Its height, padding and icons are all in
		 *  `em`, so they follow. */
		size?: 'sm' | 'md' | 'lg';
		/** Fill the available width, every option sharing it equally. */
		fullWidth?: boolean;
		/** Accessible name of the group. A radiogroup without one is announced
		 *  as an unlabelled collection of radios. */
		label?: string;
		onChange?: (value: T | null) => void;
	};

	let {
		id,
		options,
		value,
		disabled = false,
		clearable = false,
		iconOnly = false,
		size = 'md',
		fullWidth = false,
		label,
		onChange
	}: Props<T> = $props();

	let internalValue: T | null = $state(null);
	let containerEl: HTMLDivElement;

	// Gate the indicator slide until after the first paint, so it snaps to the
	// selected option's box on load instead of animating in from left: 0.
	let mounted = $state(false);
	onMount(() => {
		requestAnimationFrame(() => {
			mounted = true;
		});
	});
	let indicatorLeft = $state(0);
	let indicatorWidth = $state(0);
	let indicatorOpacity = $state(0);

	$effect(() => {
		internalValue = value ?? null;
	});

	// Calculate indicator position and width
	let selectedIndex = $derived(options.findIndex((opt) => opt.value === internalValue));

	function measureIndicator() {
		if (!containerEl) return;

		if (selectedIndex === -1) {
			// Just fade out, keep position
			indicatorOpacity = 0;
			return;
		}

		const buttons = containerEl.querySelectorAll('.radio-option');
		const selectedButton = buttons[selectedIndex] as HTMLElement | undefined;

		if (!selectedButton) {
			indicatorOpacity = 0;
			return;
		}

		const containerRect = containerEl.getBoundingClientRect();
		const buttonRect = selectedButton.getBoundingClientRect();

		// Not laid out yet (e.g. first open inside a popover that hasn't been
		// positioned). Stay hidden; the ResizeObserver re-measures once it is.
		if (buttonRect.width === 0) {
			indicatorOpacity = 0;
			return;
		}

		// The indicator is placed against the container's *padding* box while the
		// rects are its border box, so the border comes off. `clientLeft` is
		// exactly the border width — a hardcoded 1 was right only for as long as
		// the border tier stayed 1px.
		indicatorLeft = buttonRect.left - containerRect.left - containerEl.clientLeft;
		indicatorWidth = buttonRect.width;
		indicatorOpacity = 1;
	}

	// Re-measure on selection change (reactive on selectedIndex).
	$effect(() => {
		selectedIndex;
		measureIndicator();
	});

	// Re-measure when the control is actually laid out or resized. This covers
	// the first open inside a popover/menu, where the initial rects are zero
	// until the container is positioned — the observer fires once on observe
	// and again whenever the size settles.
	//
	// Each option is observed as well as the container: an option can change
	// width without the container doing so — a webfont swapping in under a
	// fixed-width control, or a relabelled option — and the container-only
	// observer left the indicator on the old geometry in both cases.
	$effect(() => {
		if (!containerEl) return;
		options;
		const ro = new ResizeObserver(() => measureIndicator());
		ro.observe(containerEl);
		for (const el of containerEl.querySelectorAll('.radio-option')) ro.observe(el);
		return () => ro.disconnect();
	});

	let indicatorStyle = $derived(
		`left: ${indicatorLeft}px; width: ${indicatorWidth}px; opacity: ${indicatorOpacity};`
	);

	function selectOption(optionValue: T) {
		if (disabled) return;

		// If clearable and clicking the selected option, deselect it
		if (clearable && internalValue === optionValue) {
			internalValue = null;
			onChange?.(null);
		} else {
			internalValue = optionValue;
			onChange?.(optionValue);
		}
	}

	// The one tab stop. The selected option holds it; with nothing selected —
	// the `clearable` state — the first enabled option does, so the group stays
	// reachable. This is why the buttons carry a roving tabindex rather than
	// being N tab stops, which is what they were.
	let tabStopIndex = $derived(
		selectedIndex !== -1 ? selectedIndex : options.findIndex((opt) => !opt.disabled)
	);

	/** Next enabled option in `step` direction, wrapping. */
	function nextEnabled(from: number, step: number) {
		for (let i = 1; i <= options.length; i++) {
			const idx = (from + step * i + options.length * i) % options.length;
			if (!options[idx]?.disabled) return idx;
		}
		return from;
	}

	function focusOption(index: number) {
		containerEl?.querySelectorAll<HTMLElement>('.radio-option')[index]?.focus();
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		// Left/right and Home/End only. The group is horizontal, so up/down are
		// optional in the radio-group pattern — and PopoverMenu renders this
		// inline while listening on `document` for ArrowUp/ArrowDown to move its
		// own highlight, so claiming those keys here would fight the menu.
		const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		let target: number;
		if (step !== 0) {
			// From an empty group (cleared, with `clearable`) the first arrow press
			// has to land on an option rather than skip one: ArrowRight takes the
			// option that already holds focus, ArrowLeft the last. One press from
			// nothing-selected then always selects something, which is what someone
			// who just cleared it and changed their mind expects.
			const anchor = selectedIndex === -1 ? (step > 0 ? index - 1 : options.length) : index;
			target = nextEnabled(anchor, step);
		} else if (event.key === 'Home') {
			target = nextEnabled(-1, 1);
		} else if (event.key === 'End') {
			target = nextEnabled(options.length, -1);
		} else {
			return;
		}

		event.preventDefault();
		// Selection follows focus, as it does in a radio group — arrowing across a
		// segmented control without changing the value would leave the keyboard
		// user unable to pick anything. Compared against the current value rather
		// than routed through `selectOption`, so that arrowing onto the option
		// that is already selected cannot clear it: only a click means "clear".
		if (options[target] && options[target].value !== internalValue) {
			selectOption(options[target].value);
		}
		focusOption(target);
	}
</script>

<div
	{id}
	bind:this={containerEl}
	class="radio-input"
	class:disabled
	class:mounted
	class:full-width={fullWidth}
	data-size={size}
	role="radiogroup"
	aria-label={label}
	aria-disabled={disabled || undefined}
>
	<div class="indicator" style={indicatorStyle} aria-hidden="true"></div>
	{#each options as option, index}
		{@const showIconOnly = iconOnly && !!option.icon}
		<button
			type="button"
			class="radio-option"
			class:selected={internalValue === option.value}
			class:icon-only={showIconOnly}
			disabled={disabled || option.disabled}
			role="radio"
			aria-checked={internalValue === option.value}
			tabindex={index === tabStopIndex ? 0 : -1}
			aria-label={showIconOnly ? option.label : undefined}
			use:tooltip={option.tooltip ?? (showIconOnly ? option.label : '')}
			onclick={() => selectOption(option.value)}
			onkeydown={(e) => handleKeyDown(e, index)}
		>
			{#if option.icon}
				{@const ic = resolveIcon(option.icon)}
				<!-- `1em`, not 16: identical at the default size, but it keeps the
				     icon box and the label box the same height at every `size`, so
				     the two share a centre line instead of nearly sharing one. -->
				<Icon name={ic.name} size={ic.size ?? '1em'} color={ic.color} fill={ic.fill} />
			{/if}
			{#if !showIconOnly}
				<span>{option.label}</span>
			{/if}
		</button>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.radio-input {
		display: inline-flex;
		align-items: stretch;
		position: relative;
		border: $border;
		border-radius: $radius;
		background-color: var(--glow-bg-surface-element);
		gap: 1px;
		// Match the height of every other input control (see control-frame).
		height: calc(2em + 2px);
		font-size: 1rem;
		line-height: 1;

		// Only the font size moves: the height, padding and icons are all in
		// `em`, so the whole control scales off this one declaration.
		&[data-size='sm'] {
			font-size: $text-sm;
		}

		&[data-size='lg'] {
			font-size: $text-lg;
		}

		&.full-width {
			display: flex;
			width: 100%;
		}

		&.disabled {
			@include disabled-control;
		}
	}

	// A disabled group still has to show which option is selected, but keeping
	// the accent fill makes the brightest thing on the page a control nobody can
	// use — and it leaves the label at 38% ink over saturated purple. The pill
	// drops to a neutral wash, and the label to the disabled ink tier now that
	// it is no longer sitting on the accent.
	.radio-input.disabled .indicator {
		background-color: var(--glow-fg-soft-strong);
	}

	.radio-input.disabled .radio-option.selected {
		color: var(--glow-fg-disabled);
	}

	.indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		background-color: var(--glow-primary);
		border-radius: calc($radius - $border-width);
		// Only the opacity fade runs before mount; the slide is enabled once
		// mounted so the indicator snaps to the selected option on first paint.
		// Durations are tokens because that is what `prefers-reduced-motion`
		// collapses — with the bare 0.25s this used to carry, the slide kept
		// running for a user who had asked for it not to.
		transition: opacity var(--glow-dur-fast) var(--glow-ease-out);
		z-index: 0;
		pointer-events: none;
		opacity: 0;
	}

	.mounted .indicator {
		transition:
			left var(--glow-dur-base) var(--glow-ease-out),
			width var(--glow-dur-base) var(--glow-ease-out),
			opacity var(--glow-dur-fast) var(--glow-ease-out);
	}

	.radio-option {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		padding: 0 1em;
		border: none;
		background: transparent;
		color: color-mix(in oklab, var(--glow-fg) 70%, transparent);
		font: inherit;
		font-size: inherit;
		line-height: 1;
		font-weight: $weight-bold;
		cursor: pointer;
		transition: color var(--glow-dur-fast) var(--glow-ease-out);
		white-space: nowrap;
		position: relative;
		z-index: 1;

		&:hover:not(:disabled):not(.selected) {
			color: var(--glow-fg);
		}

		&.selected {
			// Sits on top of .indicator, so contrast against that fill rather
			// than against the track behind it.
			@include contrast-color(var(--glow-primary), $fallback: white);
		}

		&.icon-only {
			// Square-ish hit area when there's no text to set the width.
			padding: 0 0.7em;
		}

		&:disabled {
			cursor: not-allowed;

			// A disabled option used to render identically to an enabled one.
			// Not applied to the selected option, whose fill is the accent —
			// 38% ink over saturated purple is the worst contrast here; the
			// disabled *group* handles that case above, with the fill gone.
			&:not(.selected) {
				color: var(--glow-fg-disabled);
			}
		}

		// Visible keyboard focus, on the option rather than the group: the whole
		// point of the roving tabindex is that focus lands on one option.
		&:focus-visible {
			outline: 2px solid var(--glow-primary);
			outline-offset: 2px;
		}
	}
</style>
