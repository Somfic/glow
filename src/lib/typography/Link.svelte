<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	let {
		href,
		external = false,
		variant = 'default',
		underline = 'hover',
		icon,
		onclick,
		style,
		class: className,
		children
	}: {
		href?: string;
		external?: boolean;
		variant?: 'default' | 'muted' | 'subtle';
		underline?: 'always' | 'hover' | 'never';
		icon?: IconProp;
		onclick?: (e: MouseEvent) => void;
		style?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<a
	{href}
	{onclick}
	class={['link', `variant-${variant}`, `underline-${underline}`, className].filter(Boolean).join(' ')}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	{style}
>
	{#if icon}
		<Icon {...resolveIcon(icon)} />
	{/if}
	{@render children()}
	{#if external}
		<Icon name="ExternalLink" size="0.85em" />
	{/if}
</a>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		color: var(--glow-primary);
		text-decoration: none;
		cursor: pointer;
		transition: color 150ms ease;

		&.variant-muted {
			color: var(--glow-text-secondary);
		}

		&.variant-subtle {
			color: inherit;
		}

		&.underline-always {
			text-decoration: underline;
		}

		&.underline-hover:hover {
			text-decoration: underline;
		}

		&:hover {
			color: var(--glow-primary-hover);

			&.variant-muted,
			&.variant-subtle {
				color: var(--glow-fg);
			}
		}
	}
</style>
