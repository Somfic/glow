<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import type { SelectOption } from './types.js';

	interface Props {
		id?: string;
		options: SelectOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		onChange?: (value: string) => void;
	}

	let { id, options, value = '', placeholder, disabled = false, onChange }: Props = $props();

	let internalValue = $state(value);

	$effect(() => {
		internalValue = value;
	});

	function handleChange(e: Event) {
		const newValue = (e.target as HTMLSelectElement).value;
		internalValue = newValue;
		onChange?.(newValue);
	}
</script>

<div class="input select-input" class:disabled>
	<select
		{id}
		value={internalValue}
		{disabled}
		onchange={handleChange}
	>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	<Icon name="ChevronDown" size={16} />
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.input {
		font-size: 1rem;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		padding: 0.5em 1em;
		color: $fg;

		&:focus-within {
			outline: none;
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		select {
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			width: 100%;
			cursor: pointer;
			appearance: none;
			padding-right: 1.5em;

			&:focus {
				outline: none;
			}

			&:disabled {
				cursor: not-allowed;
			}

			option {
				background-color: $bg-surface-element;
				color: $fg;
			}
		}
	}

	.select-input {
		display: inline-flex;
		align-items: center;
		position: relative;

		select {
			flex: 1;
		}

		:global(svg) {
			flex-shrink: 0;
			pointer-events: none;
			color: $fg;
		}
	}
</style>
