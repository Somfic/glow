<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';

	type Props = {
		title?: string;
		description?: string;
		href?: string;
		variant?: 'default' | 'primary' | 'secondary';
		disabled?: boolean;
		icon?: IconName;
		iconSize?: number;
		accentColor?: string;
		children?: Snippet;
	};

	let {
		title,
		description,
		href,
		variant = 'default',
		disabled = false,
		icon,
		iconSize = 24,
		accentColor,
		children
	}: Props = $props();

	// Convert accent color to CSS custom properties
	const accentStyle = accentColor
		? `--accent-bg: ${accentColor}1a; --accent-border: ${accentColor}4d;`
		: '';
</script>

{#if href}
	<a
		class="card"
		class:disabled
		class:has-accent={!!accentColor}
		data-variant={variant}
		{href}
		aria-disabled={disabled}
		tabindex={disabled ? -1 : 0}
		style={accentStyle}
	>
		{#if icon}
			<div class="icon"><Icon name={icon} size={iconSize} /></div>
		{/if}
		{#if children}
			{@render children()}
		{:else}
			{#if title}
				<div class="title">{title}</div>
			{/if}
			{#if description}
				<div class="description">{description}</div>
			{/if}
		{/if}
	</a>
{:else}
	<div
		class="card"
		class:disabled
		class:has-accent={!!accentColor}
		data-variant={variant}
		style={accentStyle}
	>
		{#if icon}
			<div class="icon"><Icon name={icon} size={iconSize} /></div>
		{/if}
		{#if children}
			{@render children()}
		{:else}
			{#if title}
				<div class="title">{title}</div>
			{/if}
			{#if description}
				<div class="description">{description}</div>
			{/if}
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.card {
		display: block;
		padding: 1.5rem;
		background: $bg-surface;
		border: 1px solid $border-color;
		border-radius: $radius;
		text-decoration: none;
		transition: all 0.15s ease;
		height: 100%;

		&.has-accent {
			background: var(--accent-bg);
			border-color: var(--accent-border);
		}

		&:hover:not(.disabled):not(.has-accent) {
			border-color: $primary;
			background: rgba($primary, 0.05);
		}

		&:focus-visible {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}

		&[data-variant='secondary']:hover:not(.disabled):not(.has-accent) {
			border-color: $secondary;
			background: rgba($secondary, 0.05);
		}
	}

	.icon {
		margin-bottom: 0.5rem;
		display: flex;
		color: $fg;
	}

	.title {
		font-weight: 600;
		font-size: 1.125rem;
		color: $fg;
		margin-bottom: 0.5rem;
	}

	.description {
		font-size: $text-sm;
		color: $text-secondary;
	}
</style>
