<script lang="ts">
	import Icon from '../icon/Icon.svelte';

	interface Props {
		id?: string;
		value?: number;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		clearable?: boolean;
		onChange?: (value: number) => void;
	}

	let {
		id,
		value = $bindable<number | undefined>(undefined),
		placeholder,
		min,
		max,
		step,
		disabled = false,
		clearable = false,
		onChange
	}: Props = $props();

	let inputElement: HTMLInputElement;

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).valueAsNumber;
		if (!isNaN(val)) {
			value = val;
			onChange?.(val);
		}
	}

	function clearValue() {
		value = undefined;
		onChange?.(undefined as any);
		inputElement?.focus();
	}
</script>

<div class="input number-input" class:disabled>
	<input
		{id}
		type="number"
		bind:this={inputElement}
		value={value ?? ''}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		oninput={handleInput}
	/>
	{#if clearable && value !== undefined}
		<button type="button" class="clear-btn" onclick={clearValue} tabindex="-1">
			<Icon name="X" size={16} />
		</button>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.input {
		@include control-frame;
		background-color: $bg-surface-element;
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

		input {
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			line-height: inherit;
			width: 100%;
			padding: 0;
			margin: 0;

			&:focus {
				outline: none;
			}

			&:disabled {
				cursor: not-allowed;
			}

			&::placeholder {
				color: rgba($fg, 0.5);
			}
		}
	}

	.number-input {
		display: inline-flex;
		align-items: center;

		input {
			text-align: left;
			appearance: textfield;
			-moz-appearance: textfield;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				appearance: none;
				-webkit-appearance: none;
				margin: 0;
			}
		}
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
</style>
