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

<style lang="scss">
	@use '../style/theme.scss' as *;

	.input {
		font-size: 1rem;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		padding: 0.5em 1em;
		color: $fg;
		position: relative;

		&:focus-within {
			outline: none;
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		textarea {
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			width: 100%;
			resize: vertical;
			min-height: 3em;

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
		color: rgba($fg, 0.5);
		border-radius: $radius;
		flex-shrink: 0;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}

		:global(svg) {
			color: inherit;
		}
	}
</style>
