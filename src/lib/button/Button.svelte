<script lang="ts" module>
	import type { IconProp } from '../icon/Icon.svelte';

	export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outlined' | 'dashed' | 'danger';

	export type ButtonSize = 'md' | 'lg';

	export type ButtonShape = 'default' | 'circle';

	export type ButtonAction = {
		label?: string;
		icon?: IconProp;
		variant?: ButtonVariant;
		size?: ButtonSize;
		shape?: ButtonShape;
		count?: number;
		shortcut?: string;
		onclick: () => void;
	};
</script>

<script lang="ts">
	import { type Snippet, getContext } from 'svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import { registerShortcut } from '../util/shortcut.svelte.js';
	import { cursor, setCursorLoading } from '../cursor/cursor.svelte.js';
	import { tooltip } from '../tooltip/tooltip.svelte.js';

	type BaseProps = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		shape?: ButtonShape;
		count?: number;
		shortcut?: string;
		onclick?: () => void | Promise<void>;
		disabled?: boolean;
		loading?: boolean;
		image?: string;
		selected?: boolean;
		fullWidth?: boolean;
		tooltip?: string;
		class?: string;
		style?: string;
		children?: Snippet;
	};

	type WithIcon = BaseProps & {
		icon: IconProp;
		label?: string;
	};

	type WithLabel = BaseProps & {
		label: string;
		icon?: IconProp;
	};

	type WithChildren = BaseProps & {
		icon?: IconProp;
		label?: string;
	};

	const group = getContext<{ defaultVariant: ButtonVariant } | undefined>('button-group');

	let {
		label,
		icon,
		image,
		variant: variantProp,
		size = 'md',
		shape = 'default',
		count,
		shortcut,
		onclick,
		disabled = false,
		loading: manualLoading = false,
		selected = false,
		fullWidth = false,
		tooltip: tooltipText,
		class: className,
		style,
		children
	}: WithIcon | WithLabel | WithChildren = $props();

	// If only an icon is given and no variant is explicitly set, render bare
	// (no border/background). Otherwise default to primary.
	let isIconOnly = $derived(!!icon && !label && !children);
	let isBare = $derived(isIconOnly && variantProp === undefined && !group?.defaultVariant);
	let variant: ButtonVariant = $derived(variantProp ?? group?.defaultVariant ?? 'primary');

	let promiseLoading = $state(false);
	let loading = $derived(promiseLoading || manualLoading);
	let isActiveCursorButton = $state(false);

	// Only update cursor loading if this button is the active one
	$effect(() => {
		if (isActiveCursorButton) {
			setCursorLoading(loading);
		}
	});

	$effect(() => {
		if (!shortcut || disabled || loading) return;
		return registerShortcut(shortcut, () => {
			handleClick();
		});
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
	class={[isBare ? 'bare' : variant, `size-${size}`, `shape-${shape}`, className].filter(Boolean).join(' ')}
	{style}
	class:selected
	class:loading={loading && !icon}
	class:full-width={fullWidth}
	class:icon-only={isIconOnly}
	onclick={handleClick}
	disabled={disabled || loading}
	use:cursor={disabled || loading
		? { state: 'default' }
		: icon
			? { state: 'pointer', iconName: resolveIcon(icon).name, variant }
			: { state: 'pointer', content: label, variant }}
	use:tooltip={{ content: tooltipText ?? '', useCursor: false, position: 'top' }}
>
	{#if icon}
		{#if loading}
			<span class="spinner"></span>
		{:else if image}
			<img src={image} alt="" class="button-image" />
		{:else}
			<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? '1em'} />
		{/if}
		{#if label}<span class="label">{label}</span>{:else if children}{@render children()}{/if}
		{#if count !== undefined}<span class="count">{count}</span>{/if}
		{#if shortcut}<Kbd size="sm">{shortcut}</Kbd>{/if}
	{:else}
		{#if loading}<span class="spinner"></span>{/if}
		<span class="content" class:hidden={loading}>
			{#if image}
				<img src={image} alt="" class="button-image" />
			{/if}
			{#if label}<span class="label">{label}</span>{:else if children}{@render children()}{/if}
			{#if count !== undefined}<span class="count">{count}</span>{/if}
			{#if shortcut}<Kbd size="sm">{shortcut}</Kbd>{/if}
		</span>
	{/if}
</button>

<style lang="scss">
	@use 'sass:color' as color;
	@use '../style/theme.scss' as *;

	button {
		@include control-frame;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		font-weight: 700;
		cursor: pointer;
		transition: background-color 150ms ease;

		&.size-lg {
			font-size: 1.125rem;
			padding: 0.6em 1.25em;
			height: calc(2.4em + 2px);
			gap: 0.5em;
		}

		&.shape-circle {
			border-radius: 50%;
			padding: 0;
			aspect-ratio: 1;
			min-width: 0;
			min-height: 0;

			&.size-md {
				width: 40px;
				height: 40px;
			}
			&.size-lg {
				width: 56px;
				height: 56px;
			}
		}

		&.bare {
			background: transparent;
			border-color: transparent;
			color: inherit;
			padding: 0.4em;
			height: auto;
			min-width: calc(1lh + 0.8em);
			min-height: calc(1lh + 0.8em);

			&:hover,
			&.cursor-hover {
				background: rgba(255, 255, 255, 0.08);
			}

			&:active {
				background: rgba(255, 255, 255, 0.12);
			}
		}

		.count {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 1.4em;
			padding: 0 0.45em;
			font-size: 0.85em;
			font-weight: 600;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 999px;
			margin-left: 0.15em;
		}

		.content {
			display: inline-flex;
			align-items: center;
			gap: 0.4em;

			&.hidden {
				visibility: hidden;
			}
		}

		.label {
			transform: translateY(0.03em);
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

		&.ghost {
			color: inherit;
			background-color: $tertiary;
			border-color: transparent;
			backdrop-filter: blur(8px);

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

		&.outlined {
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

		&.dashed {
			color: rgba($fg, 0.6);
			background: transparent;
			border-style: dashed;
			border-color: rgba($fg, 0.2);

			&:hover,
			&.cursor-hover {
				color: $fg;
				border-color: rgba($fg, 0.4);
				background: rgba($fg, 0.04);
			}

			&:active {
				background: rgba($fg, 0.08);
			}
		}

		&.danger {
			$danger: #ef4444;
			background-color: rgba($danger, 0.1);
			color: $danger;
			border-color: rgba($danger, 0.2);

			&:hover,
			&.cursor-hover {
				background-color: rgba($danger, 0.18);
			}

			&:active {
				background-color: rgba($danger, 0.07);
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

		&.icon-only {
			padding: 0.5em;
			min-width: calc(1lh + 1em);
			min-height: calc(1lh + 1em);
		}

		&.full-width {
			width: 100%;
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
