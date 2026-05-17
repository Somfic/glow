<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	type Props = {
		/** Primary line. Use the `children` snippet for fully-custom content. */
		title?: string;
		/** Secondary line shown below the title. */
		subtitle?: string;
		/** Small icon shown to the left of the subtitle. */
		subtitleIcon?: IconProp;
		/** Visually marks the row as the current selection. */
		active?: boolean;
		/** Render as `<a href>`. */
		href?: string;
		/** Render as `<button>` with click handler. */
		onclick?: (e: MouseEvent) => void;
		/** Snippet rendered to the left of the text (covers, avatars, icons). */
		leading?: Snippet;
		/** Snippet rendered to the right (trailing icon, badge, button). */
		trailing?: Snippet;
		/** Replaces the default title/subtitle layout when set. */
		children?: Snippet;
		class?: string;
		style?: string;
	};

	let {
		title,
		subtitle,
		subtitleIcon,
		active = false,
		href,
		onclick,
		leading,
		trailing,
		children,
		class: className,
		style
	}: Props = $props();

	const isInteractive = $derived(!!href || !!onclick);
</script>

{#snippet body()}
	{#if leading}
		<div class="leading">{@render leading()}</div>
	{/if}
	<div class="content">
		{#if children}
			{@render children()}
		{:else}
			{#if title}<div class="title">{title}</div>{/if}
			{#if subtitle}
				<div class="subtitle">
					{#if subtitleIcon}
						<Icon {...resolveIcon(subtitleIcon)} size={resolveIcon(subtitleIcon).size ?? 11} />
					{/if}
					<span>{subtitle}</span>
				</div>
			{/if}
		{/if}
	</div>
	{#if trailing}
		<div class="trailing">{@render trailing()}</div>
	{/if}
{/snippet}

{#if href}
	<a
		class={['list-item', className].filter(Boolean).join(' ')}
		class:active
		class:interactive={isInteractive}
		{href}
		{style}
	>
		{@render body()}
	</a>
{:else if onclick}
	<button
		type="button"
		class={['list-item', className].filter(Boolean).join(' ')}
		class:active
		class:interactive={isInteractive}
		{onclick}
		{style}
	>
		{@render body()}
	</button>
{:else}
	<div
		class={['list-item', className].filter(Boolean).join(' ')}
		class:active
		{style}
	>
		{@render body()}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.list-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 6px;
		background: transparent;
		border: none;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;

		&.interactive {
			cursor: pointer;
			transition: background 0.12s ease;

			&:hover {
				background: rgba($fg, 0.06);
			}
		}

		&.active {
			background: rgba($fg, 0.08);
		}
	}

	.leading,
	.trailing {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
	}

	.content {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.title {
		font-size: 0.875rem;
		font-weight: $weight-medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.subtitle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--glow-text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
