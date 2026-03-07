<script lang="ts">
	import { fly } from 'svelte/transition';
	import Icon from '../icon/Icon.svelte';
	import type { SelectOption } from './types.js';

	interface Props {
		id?: string;
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		onChange?: (value: string[]) => void;
	}

	let {
		id,
		options,
		value = [],
		placeholder = 'Select...',
		disabled = false,
		clearable = false,
		onChange
	}: Props = $props();

	let internalValue = $state<string[]>([]);
	let isOpen = $state(false);

	$effect(() => {
		internalValue = value ?? [];
	});

	function toggleOption(optionValue: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const newValue = internalValue.includes(optionValue)
			? internalValue.filter((v) => v !== optionValue)
			: [...internalValue, optionValue];

		internalValue = newValue;
		onChange?.(newValue);

		// Keep dropdown open for multiselect
		isOpen = true;
	}

	function getSelectedOptions(): SelectOption[] {
		return internalValue
			.map((v) => options.find((opt) => opt.value === v))
			.filter((opt): opt is SelectOption => opt !== undefined);
	}

	function removeValue(valueToRemove: string) {
		const newValue = internalValue.filter((v) => v !== valueToRemove);
		internalValue = newValue;
		onChange?.(newValue);
	}

	function clearAll(e: MouseEvent) {
		e.stopPropagation();
		internalValue = [];
		onChange?.([]);
	}
</script>

<div class="input multiselect-input" class:disabled class:open={isOpen}>
	<div
		{id}
		class="multiselect-trigger"
		role="button"
		tabindex={disabled ? -1 : 0}
		onclick={() => !disabled && (isOpen = !isOpen)}
		onblur={() => setTimeout(() => (isOpen = false), 150)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				!disabled && (isOpen = !isOpen);
			}
		}}
	>
		{#if internalValue.length > 0}
			<div class="chips">
				{#each getSelectedOptions() as opt}
					<span class="chip">
						<span class="chip-label">{opt.label}</span>
						<button
							type="button"
							class="chip-remove"
							onclick={(e) => {
								e.stopPropagation();
								removeValue(opt.value);
							}}
						>
							<Icon name="X" size={12} />
						</button>
					</span>
				{/each}
			</div>
		{:else}
			<span class="multiselect-value placeholder">{placeholder}</span>
		{/if}
		<div class="actions">
			{#if clearable && internalValue.length > 0}
				<button type="button" class="clear-btn" onclick={clearAll}>
					<Icon name="X" size={16} />
				</button>
			{/if}
			<span class="chevron">
				<Icon name="ChevronDown" size={16} />
			</span>
		</div>
	</div>

	{#if isOpen}
		<div class="multiselect-dropdown" transition:fly={{ duration: 150, y: -8 }}>
			{#each options as option}
				{@const isSelected = internalValue.includes(option.value)}
				<button
					type="button"
					class="multiselect-option"
					class:selected={isSelected}
					onmousedown={(e) => toggleOption(option.value, e)}
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
		height: 2.5em;

		&:disabled {
			cursor: not-allowed;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.25em;
		flex-shrink: 0;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.25em;
		cursor: pointer;
		color: rgba($fg, 0.5);
		border-radius: $radius;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.chevron {
		display: flex;
		align-items: center;
		color: rgba($fg, 0.5);
		transition: transform 0.2s ease;
		padding: 0.25em;
		border-radius: $radius;
		cursor: pointer;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.chips {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25em;
		flex: 1;
		overflow: hidden;
		align-items: center;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		background: $secondary;
		border-radius: calc($radius - 2px);
		padding: 0.2em 0.4em;
		font-size: 0.875em;
		user-select: none;
	}

	.chip-label {
		color: $fg;
	}

	.chip-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: rgba($fg, 0.6);
		border-radius: 50%;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.multiselect-input.open .chevron {
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
