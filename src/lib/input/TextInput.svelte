<script lang="ts">
	import Icon, { type IconName } from '../icon/Icon.svelte';
	import { cursor } from '../cursor/cursor.svelte.js';

	interface Props {
		id?: string;
		value?: string;
		placeholder?: string;
		icon?: IconName;
		disabled?: boolean;
		clearable?: boolean;
		autocomplete?: AutoFill;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
		onKeydown?: (e: KeyboardEvent) => void;
		inputRef?: (el: HTMLInputElement) => void;
	}

	let {
		id,
		value = $bindable(''),
		placeholder,
		icon,
		disabled = false,
		clearable = false,
		autocomplete,
		onChange,
		onFocus,
		onBlur,
		onKeydown,
		inputRef
	}: Props = $props();

	let inputElement: HTMLInputElement;

	$effect(() => {
		if (inputElement && inputRef) {
			inputRef(inputElement);
		}
	});

	function handleInput(e: Event) {
		const newValue = (e.target as HTMLInputElement).value;
		value = newValue;
		onChange?.(newValue);
	}

	function clearValue() {
		value = '';
		onChange?.('');
		inputElement?.focus();
	}
</script>

<div
	class="input text-input"
	class:disabled
	use:cursor={icon ? { state: 'text', iconName: icon } : { state: 'text' }}
>
	{#if icon}
		<Icon name={icon} size={16} />
	{/if}
	<input
		{id}
		type="text"
		bind:this={inputElement}
		{value}
		{placeholder}
		{disabled}
		autocomplete={autocomplete}
		oninput={handleInput}
		onfocus={onFocus}
		onblur={onBlur}
		onkeydown={onKeydown}
	/>
	{#if clearable && value}
		<button type="button" class="clear-btn" onclick={clearValue} tabindex="-1">
			<Icon name="X" size={16} />
		</button>
	{/if}
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

		> :global(svg) {
			color: $fg;
			flex-shrink: 0;
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

		:global(svg) {
			color: inherit;
		}
	}
</style>
