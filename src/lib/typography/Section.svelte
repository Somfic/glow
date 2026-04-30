<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import Heading from './Heading.svelte';
	import Text from './Text.svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	let {
		title,
		subtitle,
		icon,
		level = 3,
		count,
		collapsible = false,
		open = $bindable(true),
		actions,
		onToggle,
		children,
		class: className,
		style
	}: {
		title: string;
		subtitle?: string;
		icon?: IconProp;
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		/** Numeric badge shown next to the title. */
		count?: number;
		/** Renders a chevron toggle on the right. The whole header becomes a button. */
		collapsible?: boolean;
		/** Open/closed state when collapsible. Bindable. */
		open?: boolean;
		/** Right-aligned snippet (buttons, icons). Renders before the chevron. */
		actions?: Snippet;
		/** Section content rendered below the header. Hidden when collapsed. */
		children?: Snippet;
		onToggle?: (open: boolean) => void;
		class?: string;
		style?: string;
	} = $props();

	function toggle() {
		open = !open;
		onToggle?.(open);
	}
</script>

<section class={['glow-section', className].filter(Boolean).join(' ')} {style}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svelte:element
		this={collapsible ? 'button' : 'header'}
		type={collapsible ? 'button' : undefined}
		class={['section-header', collapsible ? 'collapsible' : null].filter(Boolean).join(' ')}
		onclick={collapsible ? toggle : undefined}
		aria-expanded={collapsible ? open : undefined}
	>
		<div class="title-row">
			{#if icon}
				<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 18} />
			{/if}
			<Heading {level} class="section-title">{title}</Heading>
			{#if count !== undefined}
				<Text size="sm" variant="secondary" as="span" class="count">{count}</Text>
			{/if}
			{#if subtitle}
				<Text size="sm" variant="secondary" class="subtitle">{subtitle}</Text>
			{/if}
		</div>
		{#if actions || collapsible}
			<div class="actions">
				{#if actions}{@render actions()}{/if}
				{#if collapsible}
					<span class="chevron {open ? 'open' : 'closed'}">
						<Icon name="ChevronDown" size={14} />
					</span>
				{/if}
			</div>
		{/if}
	</svelte:element>

	{#if children && (!collapsible || open)}
		<div class="section-body" transition:slide={{ duration: 180 }}>
			{@render children()}
		</div>
	{/if}
</section>

<style lang="scss">
	.glow-section {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		width: 100%;
		background: transparent;
		border: none;
		color: inherit;
		text-align: left;
		font: inherit;
		padding: 0;
	}

	.collapsible {
		cursor: pointer;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		flex: 1 1 auto;
	}

	.actions {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		transition: transform 150ms ease, opacity 150ms ease;
	}

	.chevron.closed {
		transform: rotate(-90deg);
	}

	.collapsible:hover .chevron {
		opacity: 1;
	}

	.section-body {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.section-title) {
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.2;
	}

	:global(.glow-section .count) {
		font-variant-numeric: tabular-nums;
	}
</style>
