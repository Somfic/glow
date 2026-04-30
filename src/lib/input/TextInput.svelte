<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import { cursor } from '../cursor/cursor.svelte.js';
	import { registerShortcut } from '../util/shortcut.svelte.js';

	interface Props {
		id?: string;
		value?: string;
		placeholder?: string;
		icon?: IconProp;
		loading?: boolean;
		disabled?: boolean;
		clearable?: boolean;
		autocomplete?: AutoFill;
		prefix?: Snippet;
		suffix?: Snippet;
		shortcut?: string;
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
		loading = false,
		disabled = false,
		clearable = false,
		autocomplete,
		prefix,
		suffix,
		shortcut,
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

	$effect(() => {
		if (!shortcut || disabled) return;
		return registerShortcut(shortcut, () => inputElement?.focus());
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
	use:cursor={icon ? { state: 'text', iconName: resolveIcon(icon).name } : { state: 'text' }}
>
	{#if loading}
		<span class="spinner"></span>
	{:else if icon}
		<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? '1em'} />
	{/if}
	{#if prefix}<span class="affix prefix">{@render prefix()}</span>{/if}
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
	{#if suffix}
		<span class="affix suffix">{@render suffix()}</span>
	{:else if shortcut}
		<span class="affix suffix"><Kbd size="sm">{shortcut}</Kbd></span>
	{/if}
	{#if clearable && value}
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

	.text-input {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;

		> :global(svg) {
			color: $fg;
			flex-shrink: 0;
		}
	}

	.affix {
		display: inline-flex;
		align-items: center;
		color: rgba($fg, 0.5);
		flex-shrink: 0;
		font-size: 0.9em;
	}

	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid rgba($fg, 0.2);
		border-top-color: $primary;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
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
