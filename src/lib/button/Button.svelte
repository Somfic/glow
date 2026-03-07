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

<style lang="scss">
	@use 'sass:color' as color;
	@use '../style/theme.scss' as *;

	button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		padding: 0.5em 1em;
		font-size: 1rem;
		border: $border;
		border-radius: $radius;
		font-weight: 700;
		transition: background-color 150ms ease;

		.content {
			display: inline-flex;
			align-items: center;
			gap: 0.4em;

			&.hidden {
				visibility: hidden;
			}
		}

		&.loading .spinner {
			position: absolute;
		}

		&.primary {
			background-color: $primary;
			color: $fg;

			&:hover,
			&.cursor-hover {
				background-color: $primary-hover;
			}

			&:active {
				background-color: $primary-active;
			}
		}

		&.secondary {
			background-color: $secondary;
			color: $fg;

			&:hover,
			&.cursor-hover {
				background-color: $secondary-hover;
			}

			&:active {
				background-color: $secondary-active;
			}
		}

		&.ternary {
			color: inherit;
			background-color: $tertiary;

			&:hover,
			&.cursor-hover {
				background-color: $tertiary-hover;
				color: $fg;
			}

			&:active {
				background-color: $tertiary-active;
				color: $fg;
			}
		}

		&:disabled {
			opacity: 0.5;
			pointer-events: none;
		}

		&.selected {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}

		.button-image {
			width: 1.5em;
			height: 1.5em;
			border-radius: 50%;
			object-fit: cover;
		}

		.spinner {
			width: 1em;
			height: 1em;
			border: 2px solid currentColor;
			border-top-color: transparent;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			opacity: 0.8;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
