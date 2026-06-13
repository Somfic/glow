<script lang="ts">
	import type { SelectOption } from './types.js';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import { tooltip } from '../tooltip/tooltip.svelte.js';

	interface Props {
		id?: string;
		options: SelectOption[];
		value?: string;
		disabled?: boolean;
		clearable?: boolean;
		/** Show only each option's icon, with its label as tooltip/accessible
		 *  name. Options without an icon still fall back to their label text. */
		iconOnly?: boolean;
		onChange?: (value: string) => void;
	}

	let {
		id,
		options,
		value = '',
		disabled = false,
		clearable = false,
		iconOnly = false,
		onChange
	}: Props = $props();

	let internalValue = $state('');
	let containerEl: HTMLDivElement;
	let indicatorLeft = $state(0);
	let indicatorWidth = $state(0);
	let indicatorOpacity = $state(0);

	$effect(() => {
		internalValue = value ?? '';
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

		// Account for border width (1px from theme)
		const borderWidth = 1;
		indicatorLeft = buttonRect.left - containerRect.left - borderWidth;
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
	$effect(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver(() => measureIndicator());
		ro.observe(containerEl);
		return () => ro.disconnect();
	});

	let indicatorStyle = $derived(
		`left: ${indicatorLeft}px; width: ${indicatorWidth}px; opacity: ${indicatorOpacity};`
	);

	function selectOption(optionValue: string) {
		if (disabled) return;

		// If clearable and clicking the selected option, deselect it
		if (clearable && internalValue === optionValue) {
			internalValue = '';
			onChange?.('');
		} else {
			internalValue = optionValue;
			onChange?.(optionValue);
		}
	}
</script>

<div {id} bind:this={containerEl} class="radio-input" class:disabled>
	<div class="indicator" style={indicatorStyle}></div>
	{#each options as option}
		{@const showIconOnly = iconOnly && !!option.icon}
		<button
			type="button"
			class="radio-option"
			class:selected={internalValue === option.value}
			class:icon-only={showIconOnly}
			{disabled}
			aria-label={showIconOnly ? option.label : undefined}
			use:tooltip={showIconOnly ? option.label : ''}
			onclick={() => selectOption(option.value)}
		>
			{#if option.icon}
				{@const ic = resolveIcon(option.icon)}
				<Icon name={ic.name} size={ic.size ?? 16} color={ic.color} fill={ic.fill} />
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

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		background-color: var(--glow-primary);
		border-radius: calc($radius - $border-width);
		transition:
			left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.2s ease;
		z-index: 0;
		pointer-events: none;
		opacity: 0;
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
		color: rgba($fg, 0.7);
		font: inherit;
		font-size: 1rem;
		line-height: 1;
		font-weight: $weight-bold;
		cursor: pointer;
		transition: color 0.15s ease;
		white-space: nowrap;
		position: relative;
		z-index: 1;

		&:hover:not(:disabled):not(.selected) {
			color: var(--glow-fg);
		}

		&.selected {
			color: white;
		}

		&.icon-only {
			// Square-ish hit area when there's no text to set the width.
			padding: 0 0.7em;
		}

		&:disabled {
			cursor: not-allowed;
		}
	}
</style>
