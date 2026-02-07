<script lang="ts">
	import type { SelectOption } from './types.js';

	interface Props {
		options: SelectOption[];
		value?: string;
		disabled?: boolean;
		onChange?: (value: string) => void;
	}

	let { options, value = '', disabled = false, onChange }: Props = $props();

	let internalValue = $state(value);

	$effect(() => {
		internalValue = value;
	});

	function selectOption(optionValue: string) {
		if (disabled) return;
		internalValue = optionValue;
		onChange?.(optionValue);
	}
</script>

<div class="segmented-input" class:disabled>
	{#each options as option}
		<button
			type="button"
			class="segment"
			class:selected={internalValue === option.value}
			{disabled}
			onclick={() => selectOption(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.segmented-input {
		display: inline-flex;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		padding: 3px;
		gap: 2px;

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.segment {
		flex: 1;
		padding: 0.4em 0.8em;
		border: none;
		border-radius: calc($radius - 2px);
		background: transparent;
		color: rgba($fg, 0.7);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;

		&:hover:not(:disabled):not(.selected) {
			color: $fg;
			background-color: rgba($fg, 0.05);
		}

		&.selected {
			background-color: $primary;
			color: white;
		}

		&:disabled {
			cursor: not-allowed;
		}
	}
</style>
