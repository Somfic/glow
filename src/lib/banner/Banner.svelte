<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon, type IconName } from '../icon/Icon.svelte';

	type Variant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

	type Props = {
		variant?: Variant;
		/** Override the default variant icon. */
		icon?: IconProp;
		/** Plain-text label. Use `children` for custom content. */
		label?: string;
		/** Trailing actions (buttons, icons). */
		actions?: Snippet;
		/** Replaces `label` with custom content. */
		children?: Snippet;
		class?: string;
		style?: string;
	};

	let {
		variant = 'neutral',
		icon,
		label,
		actions,
		children,
		class: className,
		style
	}: Props = $props();

	const defaultIcons: Record<Variant, IconName> = {
		neutral: 'Info',
		info: 'Info',
		success: 'PartyPopper',
		warning: 'MessageCircleWarning',
		error: 'MessageCircleX'
	};

	const iconProp = $derived(icon ?? defaultIcons[variant]);
</script>

<div class={['banner', `variant-${variant}`, className].filter(Boolean).join(' ')} {style}>
	<div class="icon">
		<Icon {...resolveIcon(iconProp)} size={resolveIcon(iconProp).size ?? 16} />
	</div>
	<span class="content">
		{#if children}
			{@render children()}
		{:else if label}
			{label}
		{/if}
	</span>
	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.banner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: $radius;
		border: 1px solid;
		background: $bg-surface-element;
		color: $fg;
		font-size: $text-sm;
		font-family: $font-family;
		margin: 0.5em 0;

		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}
	}

	.variant-neutral {
		background: rgba($primary, 0.08);
		border-color: rgba($primary, 0.2);
		color: rgba($fg, 0.92);

		.icon {
			color: $primary;
		}
	}

	.variant-info {
		border-color: rgba(#6bb8e8, 0.3);
		.icon { color: #6bb8e8; }
	}
	.variant-success {
		border-color: rgba(#6be88b, 0.3);
		.icon { color: #6be88b; }
	}
	.variant-warning {
		border-color: rgba(#e8c86b, 0.3);
		.icon { color: #e8c86b; }
	}
	.variant-error {
		border-color: rgba(#e86b6b, 0.3);
		.icon { color: #e86b6b; }
	}

	.icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.content {
		flex: 1;
		line-height: 1.4;
		min-width: 0;
	}

	.actions {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 4px;
	}
</style>
