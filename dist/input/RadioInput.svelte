<script lang="ts">
	import type { SelectOption } from './types.js';

	interface Props {
		id?: string;
		options: SelectOption[];
		value?: string;
		disabled?: boolean;
		clearable?: boolean;
		onChange?: (value: string) => void;
	}

	let { id, options, value = '', disabled = false, clearable = false, onChange }: Props = $props();

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

	$effect(() => {
		if (!containerEl) return;

		if (selectedIndex === -1) {
			// Just fade out, keep position
			indicatorOpacity = 0;
			return;
		}

		const buttons = containerEl.querySelectorAll('.radio-option');
		const selectedButton = buttons[selectedIndex] as HTMLElement;

		if (!selectedButton) {
			indicatorOpacity = 0;
			return;
		}

		const containerRect = containerEl.getBoundingClientRect();
		const buttonRect = selectedButton.getBoundingClientRect();

		// Account for border width (1px from theme)
		const borderWidth = 1;
		indicatorLeft = buttonRect.left - containerRect.left - borderWidth;
		indicatorWidth = buttonRect.width;
		indicatorOpacity = 1;
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
		<button
			type="button"
			class="radio-option"
			class:selected={internalValue === option.value}
			{disabled}
			onclick={() => selectOption(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.radio-input {
  display: inline-flex;
  position: relative;
  border: 1px solid #30313C;
  border-radius: 12px;
  background-color: #1e1f29;
  gap: 1px;
}
.radio-input.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: #8B6DED;
  border-radius: 11px;
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
}
.radio-option {
  flex: 1;
  padding: 0.5em 1em;
  border: none;
  background: transparent;
  color: rgba(238, 238, 238, 0.7);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s ease;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}
.radio-option:hover:not(:disabled):not(.selected) {
  color: #eee;
}
.radio-option.selected {
  color: white;
}
.radio-option:disabled {
  cursor: not-allowed;
}</style>
