<script lang="ts">
	import Icon, { type IconName } from '../icon/Icon.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		icon?: IconName;
		disabled?: boolean;
		autocomplete?: AutoFill;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
		onKeydown?: (e: KeyboardEvent) => void;
		inputRef?: (el: HTMLInputElement) => void;
	}

	let {
		value = '',
		placeholder,
		icon,
		disabled = false,
		autocomplete,
		onChange,
		onFocus,
		onBlur,
		onKeydown,
		inputRef
	}: Props = $props();

	let internalValue = $state(value);
	let inputElement: HTMLInputElement;

	$effect(() => {
		internalValue = value;
	});

	$effect(() => {
		if (inputElement && inputRef) {
			inputRef(inputElement);
		}
	});

	function handleInput(e: Event) {
		const newValue = (e.target as HTMLInputElement).value;
		internalValue = newValue;
		onChange?.(newValue);
	}
</script>

<div class="input text-input" class:disabled>
	{#if icon}
		<Icon name={icon} size={16} />
	{/if}
	<input
		type="text"
		bind:this={inputElement}
		value={internalValue}
		{placeholder}
		{disabled}
		autocomplete={autocomplete}
		oninput={handleInput}
		onfocus={onFocus}
		onblur={onBlur}
		onkeydown={onKeydown}
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

	.text-input {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;

		:global(svg) {
			color: $fg;
			flex-shrink: 0;
		}
	}
</style>
