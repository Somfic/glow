<script lang="ts">
	import { getContext } from 'svelte';
	import Icon, { type IconName } from '$lib/icon/Icon.svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'ternary';

	type BaseProps = {
		variant?: Variant;
		onclick?: () => void;
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
		variant = group?.defaultVariant ?? 'primary',
		onclick
	}: WithIcon | WithLabel = $props();
</script>

<button class={variant} onclick={() => onclick?.()}>
	{#if icon}
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
		color: $fg;
		cursor: pointer;
		transition: background-color 150ms ease;

		&.primary {
			background-color: $primary;

			&:hover {
				background-color: $primary-hover;
			}

			&:active {
				background-color: $primary-active;
			}
		}

		&.secondary {
			background-color: $secondary;

			&:hover {
				background-color: $secondary-hover;
			}

			&:active {
				background-color: $secondary-active;
			}
		}

		&.ternary {
			background-color: $tertiary;

			&:hover {
				background-color: $tertiary-hover;
			}

			&:active {
				background-color: $tertiary-active;
			}
		}
	}
</style>
