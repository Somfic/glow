<script lang="ts">
	import { getContext } from 'svelte';
	import Icon, { type IconName } from '../icon/Icon.svelte';
	import { cursor, setCursorLoading } from '../cursor/cursor.svelte.js';

	type Variant = 'primary' | 'secondary' | 'ternary';

	type BaseProps = {
		variant?: Variant;
		onclick?: () => void | Promise<void>;
		disabled?: boolean;
		loading?: boolean;
		image?: string;
		selected?: boolean;
	};

	type WithIcon = BaseProps & {
		icon: IconName;
		label?: string;
	};

	type WithLabel = BaseProps & {
		label: string;
		icon?: IconName;
	};

	const group = getContext<{ defaultVariant: Variant } | undefined>('button-group');

	let {
		label,
		icon,
		image,
		variant = group?.defaultVariant ?? 'primary',
		onclick,
		disabled = false,
		loading: manualLoading = false,
		selected = false
	}: WithIcon | WithLabel = $props();

	let promiseLoading = $state(false);
	let loading = $derived(promiseLoading || manualLoading);
	let isActiveCursorButton = $state(false);

	// Only update cursor loading if this button is the active one
	$effect(() => {
		if (isActiveCursorButton) {
			setCursorLoading(loading);
		}
	});

	async function handleClick() {
		if (!onclick || promiseLoading) return;

		// Mark this button as the active cursor button
		isActiveCursorButton = true;

		const result = onclick();
		if (result instanceof Promise) {
			promiseLoading = true;
			setCursorLoading(true);
			try {
				await result;
			} finally {
				promiseLoading = false;
				setCursorLoading(false);
				// Clear active state after loading completes
				isActiveCursorButton = false;
			}
		} else {
			// Non-async click, immediately clear active state
			isActiveCursorButton = false;
		}
	}
</script>

<button
	class={variant}
	class:selected
	class:loading
	onclick={handleClick}
	disabled={disabled || loading}
	use:cursor={disabled || loading
		? { state: 'default' }
		: icon
			? { state: 'pointer', iconName: icon, variant }
			: { state: 'pointer', content: label, variant }}
>
	{#if loading}<span class="spinner"></span>{/if}
	<span class="content" class:hidden={loading}>
		{#if image}
			<img src={image} alt="" class="button-image" />
		{:else if icon}
			<Icon name={icon} size={16} />
		{/if}
		{label}
	</span>
</button>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: 0.5em 1em;
  font-size: 1rem;
  border: 1px solid #30313C;
  border-radius: 12px;
  font-weight: 700;
  transition: background-color 150ms ease;
}
button .content {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}
button .content.hidden {
  visibility: hidden;
}
button.loading .spinner {
  position: absolute;
}
button.primary {
  background-color: #8B6DED;
  color: #eee;
}
button.primary:hover, button.primary.cursor-hover {
  background-color: rgb(114.5268292683, 78.1975609756, 233.2024390244);
}
button.primary:active {
  background-color: rgb(90.0536585366, 47.3951219512, 229.4048780488);
}
button.secondary {
  background-color: rgb(32.28295, 29.28295, 46.62705);
  color: #eee;
}
button.secondary:hover, button.secondary.cursor-hover {
  background-color: rgb(29.054655, 26.354655, 41.964345);
}
button.secondary:active {
  background-color: rgb(25.82636, 23.42636, 37.30164);
}
button.ternary {
  color: inherit;
  background-color: transparent;
}
button.ternary:hover, button.ternary.cursor-hover {
  background-color: rgb(21.611245, 21.311245, 27.589755);
  color: #eee;
}
button.ternary:active {
  background-color: rgb(15.1278715, 14.9178715, 19.3128285);
  color: #eee;
}
button:disabled {
  opacity: 0.5;
  pointer-events: none;
}
button.selected {
  outline: 2px solid #8B6DED;
  outline-offset: 2px;
}
button .button-image {
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  object-fit: cover;
}
button .spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: 0.8;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}</style>
