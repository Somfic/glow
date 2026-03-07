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
		value = '',
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

	let internalValue = $state('');
	let inputElement: HTMLInputElement;

	$effect(() => {
		internalValue = value ?? '';
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

	function clearValue() {
		internalValue = '';
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
		value={internalValue}
		{placeholder}
		{disabled}
		autocomplete={autocomplete}
		oninput={handleInput}
		onfocus={onFocus}
		onblur={onBlur}
		onkeydown={onKeydown}
	/>
	{#if clearable && internalValue}
		<button type="button" class="clear-btn" onclick={clearValue} tabindex="-1">
			<Icon name="X" size={16} />
		</button>
	{/if}
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.input {
  font-size: 1rem;
  border: 1px solid #30313C;
  border-radius: 12px;
  background-color: #1e1f29;
  padding: 0.5em 1em;
  color: #eee;
}
.input:focus-within {
  outline: none;
  border-color: #8B6DED;
  box-shadow: 0 0 0 2px rgba(139, 109, 237, 0.3);
}
.input.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.input input {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  width: 100%;
}
.input input:focus {
  outline: none;
}
.input input:disabled {
  cursor: not-allowed;
}
.input input::placeholder {
  color: rgba(238, 238, 238, 0.5);
}
.text-input {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}
.text-input > :global(svg) {
  color: #eee;
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
  color: rgba(238, 238, 238, 0.5);
  border-radius: 12px;
}
.clear-btn:hover {
  color: #eee;
  background: rgba(238, 238, 238, 0.1);
}
.clear-btn :global(svg) {
  color: inherit;
}</style>
