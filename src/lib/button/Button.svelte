<script lang="ts">
	import { getContext } from 'svelte';
	import Icon, { type IconName } from '$lib/icon/Icon.svelte';

	type Variant = 'primary' | 'secondary' | 'ternary';

	type BaseProps = {
		variant?: Variant;
		onclick?: () => void;
		disabled?: boolean;
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
		selected = false
	}: WithIcon | WithLabel = $props();
</script>

<button class={variant} class:selected onclick={() => onclick?.()} {disabled}>
	{#if image}
		<img src={image} alt="" class="button-image" />
	{:else if icon}
		<Icon name={icon} size={16} />
	{/if}
	{label}
</button>

<style lang="scss">
	@use 'sass:color' as color;
	@use '../style/theme.scss' as *;

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.5em 1em;
		font-size: 1rem;
		border: none;
		border-radius: $radius;
		font-weight: 700;
		cursor: pointer;
		transition: background-color 150ms ease;

		&.primary {
			background-color: $primary;
			color: $fg;

			&:hover {
				background-color: $primary-hover;
			}

			&:active {
				background-color: $primary-active;
			}
		}

		&.secondary {
			background-color: $secondary;
			color: $fg;

			&:hover {
				background-color: $secondary-hover;
			}

			&:active {
				background-color: $secondary-active;
			}
		}

		&.ternary {
			color: inherit;
			background-color: $tertiary;

			&:hover {
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
			cursor: not-allowed;
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
	}
</style>
