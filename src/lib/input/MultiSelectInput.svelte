<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import type { SelectOption } from './types.js';

	interface Props {
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		disabled?: boolean;
		onChange?: (value: string[]) => void;
	}

	let { options, value = [], placeholder = 'Select...', disabled = false, onChange }: Props = $props();

	let internalValue = $state(value);
	let isOpen = $state(false);

	$effect(() => {
		internalValue = value;
	});

	function toggleOption(optionValue: string) {
		const newValue = internalValue.includes(optionValue)
			? internalValue.filter((v) => v !== optionValue)
			: [...internalValue, optionValue];

		internalValue = newValue;
		onChange?.(newValue);
	}

	function getSelectedLabels(): string {
		if (internalValue.length === 0) return placeholder;

		const selected = options
			.filter((opt) => internalValue.includes(opt.value))
			.map((opt) => opt.label);

		return selected.join(', ');
	}
</script>

<div class="input multiselect-input" class:disabled class:open={isOpen}>
	<button
		type="button"
		class="multiselect-trigger"
		{disabled}
		onclick={() => (isOpen = !isOpen)}
		onblur={() => setTimeout(() => (isOpen = false), 150)}
	>
		<span class="multiselect-value" class:placeholder={internalValue.length === 0}>
			{getSelectedLabels()}
		</span>
		<Icon name="ChevronDown" size={16} />
	</button>

	{#if isOpen}
		<div class="multiselect-dropdown">
			{#each options as option}
				{@const isSelected = internalValue.includes(option.value)}
				<button
					type="button"
					class="multiselect-option"
					class:selected={isSelected}
					onmousedown={() => toggleOption(option.value)}
				>
					<span class="checkbox" class:checked={isSelected}>
						{#if isSelected}
							<Icon name="Check" size={12} />
						{/if}
					</span>
					<span>{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.input {
		font-size: 1rem;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		color: $fg;

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.multiselect-input {
		position: relative;
		padding: 0;

		&.open {
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}
	}

	.multiselect-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		width: 100%;
		padding: 0.5em 1em;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		cursor: pointer;
		text-align: left;

		&:disabled {
			cursor: not-allowed;
		}

		:global(svg) {
			flex-shrink: 0;
			transition: transform 0.2s ease;
		}
	}

	.multiselect-input.open .multiselect-trigger :global(svg) {
		transform: rotate(180deg);
	}

	.multiselect-value {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.placeholder {
			color: rgba($fg, 0.5);
		}
	}

	.multiselect-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: -$border-width;
		right: -$border-width;
		max-height: 200px;
		overflow-y: auto;
		background-color: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.multiselect-option {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.5em 1em;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s ease;

		&:hover {
			background-color: $secondary;
		}

		&.selected {
			background-color: rgba($primary, 0.15);
		}
	}

	.checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: $border;
		border-radius: 4px;
		background-color: transparent;
		flex-shrink: 0;
		transition: all 0.15s ease;

		&.checked {
			background-color: $primary;
			border-color: $primary;
		}

		:global(svg) {
			color: white;
		}
	}
</style>
