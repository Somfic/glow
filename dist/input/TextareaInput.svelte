<script lang="ts">
	import Icon from '../icon/Icon.svelte';

	interface Props {
		id?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		rows?: number;
		clearable?: boolean;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
	}

	let {
		id,
		value = '',
		placeholder,
		disabled = false,
		rows = 4,
		clearable = false,
		onChange,
		onFocus,
		onBlur
	}: Props = $props();

	let internalValue = $state('');
	let textareaElement: HTMLTextAreaElement;

	$effect(() => {
		internalValue = value ?? '';
	});

	function handleInput(e: Event) {
		const newValue = (e.target as HTMLTextAreaElement).value;
		internalValue = newValue;
		onChange?.(newValue);
	}

	function clearValue() {
		internalValue = '';
		onChange?.('');
		textareaElement?.focus();
	}
</script>

<div class="input textarea-input" class:disabled>
	<textarea
		{id}
		bind:this={textareaElement}
		value={internalValue}
		{placeholder}
		{disabled}
		{rows}
		oninput={handleInput}
		onfocus={onFocus}
		onblur={onBlur}
	></textarea>
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
  position: relative;
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
.input textarea {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  width: 100%;
  resize: vertical;
  min-height: 3em;
}
.input textarea:focus {
  outline: none;
}
.input textarea:disabled {
  cursor: not-allowed;
}
.input textarea::placeholder {
  color: rgba(238, 238, 238, 0.5);
}
.textarea-input {
  display: flex;
  gap: 0.4em;
}
.clear-btn {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: none;
  border: none;
  padding: 0.25em;
  cursor: pointer;
  color: rgba(238, 238, 238, 0.5);
  border-radius: 12px;
  flex-shrink: 0;
}
.clear-btn:hover {
  color: #eee;
  background: rgba(238, 238, 238, 0.1);
}
.clear-btn :global(svg) {
  color: inherit;
}</style>
