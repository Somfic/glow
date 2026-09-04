<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';

	/**
	 * `compact` fits inside a table cell, a combobox dropdown or a popover —
	 * anywhere the surrounding chrome already says what the region is.
	 * `default` is the panel/list tier. `roomy` is the full-page tier, where the
	 * empty state is the only thing on screen and has room to make its case.
	 */
	export type EmptyStateSize = 'compact' | 'default' | 'roomy';

	export type EmptyStateProps = {
		/** Lucide icon drawn above the title. Ignored when `illustration` is given. */
		icon?: IconProp;
		/** The headline. Say what isn't there, in the user's words. */
		title: string;
		/** One line under the title: why it's empty, or what to do about it. */
		description?: string;
		/** Custom mark in place of `icon` — an SVG, a spot illustration, an animated glyph. */
		illustration?: Snippet;
		/**
		 * The thing that fills the void. An empty state that only reports
		 * emptiness wastes the one moment the user is definitely looking at it,
		 * so this is a first-class slot rather than a footnote — put the create
		 * button, the import link, the "clear filters" reset here.
		 */
		action?: Snippet;
		/** Shorthand for the common single-button case; `action` overrides it. */
		actionLabel?: string;
		/** Handler for `actionLabel`. */
		onAction?: () => void;
		size?: EmptyStateSize;
		/**
		 * Announce to assistive tech when this appears. On by default because
		 * most empty states are the *result* of something — a search, a filter,
		 * a delete — and a silent swap leaves a screen reader user on a page
		 * that just went quiet. Turn it off for one that is present on load.
		 */
		live?: boolean;
		class?: string;
		style?: string;
	};
</script>

<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Button from '../button/Button.svelte';

	let {
		icon,
		title,
		description,
		illustration,
		action,
		actionLabel,
		onAction,
		size = 'default',
		live = true,
		class: className,
		style
	}: EmptyStateProps = $props();

	const iconSize = $derived(size === 'compact' ? 18 : size === 'roomy' ? 32 : 24);
</script>

<div
	class={['empty-state', `size-${size}`, className].filter(Boolean).join(' ')}
	role={live ? 'status' : undefined}
	{style}
>
	{#if illustration}
		<div class="es-mark">{@render illustration()}</div>
	{:else if icon}
		<!-- Decorative: the title already carries the meaning, so an icon label
		     would only make a screen reader say it twice. -->
		<div class="es-mark" aria-hidden="true">
			<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? iconSize} />
		</div>
	{/if}

	<!-- A <p>, not a heading: this renders inside a table cell, a dropdown and a
	     page body, and no single heading level is correct in all three. A page
	     that wants this in its outline gives the surrounding <section> the
	     heading. -->
	<p class="es-title">{title}</p>

	{#if description}
		<p class="es-description">{description}</p>
	{/if}

	{#if action}
		<div class="es-action">{@render action()}</div>
	{:else if actionLabel}
		<div class="es-action">
			<Button variant="primary" label={actionLabel} onclick={onAction} />
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: $space-xs;
		padding: var(--es-pad);
		min-height: var(--es-min-height);
		box-sizing: border-box;
		// Fades in rather than appearing hard, because an empty state usually
		// replaces content that was just there. Token-driven, so
		// prefers-reduced-motion collapses it.
		animation: empty-state-in var(--glow-dur-base) var(--glow-ease-out) both;
	}

	@keyframes empty-state-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	.es-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--es-mark-gap);
		color: $text-muted;
	}

	.es-title {
		margin: 0;
		font-family: $font-family-header;
		font-size: var(--es-title-size);
		font-weight: $weight-semibold;
		letter-spacing: -0.01em;
		color: $text-primary;
	}

	.es-description {
		margin: 0;
		max-width: 44ch;
		font-size: var(--es-description-size);
		line-height: 1.5;
		color: $text-secondary;
	}

	.es-action {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: $space-sm;
		margin-top: var(--es-action-gap);
	}

	// Compact drops to one visual line's worth of chrome: it lives inside a
	// table cell or a dropdown, where the container already has its own padding
	// and a tall block would push the surrounding UI around.
	.size-compact {
		--es-pad: #{$space-md};
		--es-min-height: 0;
		--es-mark-gap: 0;
		--es-title-size: #{$text-sm};
		--es-description-size: #{$text-xs};
		--es-action-gap: #{$space-sm};

		.es-title {
			font-weight: $weight-medium;
			color: $text-secondary;
		}
	}

	.size-default {
		--es-pad: #{$space-xl} #{$space-md};
		--es-min-height: 200px;
		--es-mark-gap: #{$space-xs};
		--es-title-size: #{$text-base};
		--es-description-size: #{$text-sm};
		--es-action-gap: #{$space-md};
	}

	.size-roomy {
		--es-pad: 4.5rem #{$space-lg};
		--es-min-height: 360px;
		--es-mark-gap: #{$space-sm};
		--es-title-size: #{$text-xl};
		--es-description-size: #{$text-base};
		--es-action-gap: #{$space-lg};
	}
</style>
