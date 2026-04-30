<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	type Props = {
		title?: string;
		description?: string;
		href?: string;
		variant?: 'default' | 'primary' | 'secondary';
		disabled?: boolean;
		icon?: IconProp;
		accentColor?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		class?: string;
	};

	let {
		title,
		description,
		href,
		variant = 'default',
		disabled = false,
		icon,
		accentColor,
		padding = 'md',
		header,
		footer,
		children,
		class: className = ''
	}: Props = $props();

	// Convert accent color to CSS custom properties
	const accentStyle = $derived(accentColor
		? `--accent-bg: ${accentColor}1a; --accent-border: ${accentColor}4d;`
		: '');
</script>

{#snippet body()}
	{#if header}
		<div class="card-header">{@render header()}</div>
	{/if}
	<div class="card-body padding-{padding}">
		{#if icon}
			<div class="icon"><Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 24} /></div>
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
	{#if footer}
		<div class="card-footer">{@render footer()}</div>
	{/if}
{/snippet}

{#if href}
	<a
		class={['card sectioned', className].filter(Boolean).join(' ')}
		class:disabled
		class:has-accent={!!accentColor}
		data-variant={variant}
		{href}
		aria-disabled={disabled}
		tabindex={disabled ? -1 : 0}
		style={accentStyle}
	>
		{@render body()}
	</a>
{:else}
	<div
		class={['card sectioned', className].filter(Boolean).join(' ')}
		class:disabled
		class:has-accent={!!accentColor}
		data-variant={variant}
		style={accentStyle}
	>
		{@render body()}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.card {
		display: block;
		padding: 1.5rem;
		background: var(--glow-bg-surface);
		border: 1px solid $border-color;
		border-radius: $radius;
		text-decoration: none;
		transition: all 0.15s ease;
		height: 100%;

		&.sectioned {
			padding: 0;
			overflow: hidden;
		}

		&.has-accent {
			background: var(--accent-bg);
			border-color: var(--accent-border);
		}

		// Hover/focus styles only apply to clickable cards (anchors)
		&:is(a):hover:not(.disabled):not(.has-accent) {
			border-color: var(--glow-primary);
			background: rgba($primary, 0.05);
		}

		&:is(a):focus-visible {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}

		&:is(a)[data-variant='secondary']:hover:not(.disabled):not(.has-accent) {
			border-color: var(--glow-secondary);
			background: rgba($secondary, 0.05);
		}
	}

	.card-header,
	.card-footer {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.card-header {
		border-bottom: 1px solid $border-color;
	}

	.card-footer {
		border-top: 1px solid $border-color;
	}

	.card-body {
		&.padding-none {
			padding: 0;
		}
		&.padding-sm {
			padding: 0.75rem;
		}
		&.padding-md {
			padding: 1.5rem;
		}
		&.padding-lg {
			padding: 2rem;
		}
	}

	.icon {
		margin-bottom: 0.5rem;
		display: flex;
		color: var(--glow-fg);
	}

	.title {
		font-weight: 600;
		font-size: 1.125rem;
		color: var(--glow-fg);
		margin-bottom: 0.5rem;
	}

	.description {
		font-size: $text-sm;
		color: var(--glow-text-secondary);
	}
</style>
