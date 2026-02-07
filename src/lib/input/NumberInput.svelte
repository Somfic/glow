<script lang="ts">
	interface Props {
		value?: number;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		onChange?: (value: number) => void;
	}

	let { value, placeholder, min, max, step, disabled = false, onChange }: Props = $props();

	let internalValue = $state(value);

	$effect(() => {
		internalValue = value;
	});

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).valueAsNumber;
		if (!isNaN(val)) {
			internalValue = val;
			onChange?.(val);
		}
	}
</script>

<div class="input number-input" class:disabled>
	<input
		type="number"
		value={internalValue ?? ''}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		oninput={handleInput}
	/>
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

		input {
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			width: 100%;

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
</style>
