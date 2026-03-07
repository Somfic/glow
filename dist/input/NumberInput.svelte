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
		value,
		placeholder,
		min,
		max,
		step,
		disabled = false,
		clearable = false,
		onChange
	}: Props = $props();

	let internalValue = $state<number | undefined>(undefined);
	let inputElement: HTMLInputElement;

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

	function clearValue() {
		internalValue = undefined;
		onChange?.(undefined as any);
		inputElement?.focus();
	}
</script>

<div class="input number-input" class:disabled>
	<input
		{id}
		type="number"
		bind:this={inputElement}
		value={internalValue ?? ''}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		oninput={handleInput}
	/>
	{#if clearable && internalValue !== undefined}
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
.number-input {
  display: inline-flex;
  align-items: center;
}
.number-input input {
  text-align: left;
  appearance: textfield;
  -moz-appearance: textfield;
}
.number-input input::-webkit-outer-spin-button, .number-input input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
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
}</style>
