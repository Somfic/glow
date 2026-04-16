<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import Button, { type ButtonAction } from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';

	interface Props {
		/** Section title (uppercase eyebrow style). */
		title: string;
		/** Optional leading icon. */
		icon?: IconProp;
		/** Longer description shown under the title. */
		description?: string;
		/** Whether the section can be collapsed. */
		collapsible?: boolean;
		/** Initial open state for collapsible sections. */
		defaultOpen?: boolean;
		/** Bindable open state (overrides defaultOpen if provided). */
		open?: boolean;
		/** Header actions (right-aligned). */
		actions?: ButtonAction[];
		/** Stable id for nav anchoring. */
		id?: string;
		/** Visual variant. `bordered` uses a divider style; `card` is a surface card. */
		variant?: 'bordered' | 'card' | 'plain';
		/** Optional snippet rendered to the right of the title (extra controls). */
		headerExtra?: Snippet;
		children: Snippet;
	}

	let {
		title,
		icon,
		description,
		collapsible = false,
		defaultOpen = true,
		open = $bindable<boolean | undefined>(undefined),
		actions,
		id,
		variant = 'bordered',
		headerExtra,
		children
	}: Props = $props();

	// See Disclosure for the same pattern: undefined sentinel keeps defaultOpen
	// reactive instead of pinning it at component-create time.
	let internalOpen = $state<boolean | undefined>(undefined);
	let isOpen = $derived(open ?? internalOpen ?? defaultOpen);

	function toggle() {
		if (!collapsible) return;
		const next = !isOpen;
		if (open !== undefined) open = next;
		else internalOpen = next;
	}
</script>

<section
	class="section"
	class:bordered={variant === 'bordered'}
	class:card={variant === 'card'}
	class:plain={variant === 'plain'}
	class:collapsible
	class:collapsed={collapsible && !isOpen}
	{id}
	aria-labelledby={id ? `${id}-title` : undefined}
>
	<header class="header">
		{#if collapsible}
			<button
				type="button"
				class="title-button"
				aria-expanded={isOpen}
				aria-controls={id ? `${id}-content` : undefined}
				onclick={toggle}
			>
				<span class="chevron" aria-hidden="true">
					<Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} />
				</span>
				<span class="title-cluster">
					{#if icon}
						<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 14} />
					{/if}
					<span class="title" id={id ? `${id}-title` : undefined}>{title}</span>
				</span>
			</button>
		{:else}
			<div class="title-cluster static">
				{#if icon}
					<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 14} />
				{/if}
				<span class="title" id={id ? `${id}-title` : undefined}>{title}</span>
			</div>
		{/if}
		<div class="header-trailing">
			{#if headerExtra}
				{@render headerExtra()}
			{/if}
			{#if actions && actions.length > 0}
				<ButtonGroup noborder>
					{#each actions as action}
						<Button
							label={action.label!}
							icon={action.icon!}
							variant="ghost"
							onclick={action.onclick}
						/>
					{/each}
				</ButtonGroup>
			{/if}
		</div>
	</header>
	{#if description}
		<p class="description">{description}</p>
	{/if}
	{#if isOpen}
		<div class="content" id={id ? `${id}-content` : undefined}>
			{@render children()}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--glow-section-header-gap);
		min-width: 0;

		// Sections naturally space themselves vertically. The :global selector
		// is needed because adjacent siblings cross component boundaries.
		& + :global(.section) {
			margin-top: var(--glow-section-spacing);
		}

		&.bordered + :global(.section.bordered) {
			padding-top: var(--glow-section-spacing);
			border-top: 1px solid rgba($fg, 0.06);
		}

		&.card {
			padding: 1rem 1.125rem;
			border-radius: $radius * 0.75;
			background: rgba($fg, 0.025);
			border: 1px solid rgba($fg, 0.05);
		}
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.title-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		margin: 0;
		background: transparent;
		border: 0;
		color: $text-secondary;
		font-family: $font-family;
		cursor: pointer;
		transition: color 0.12s ease;

		&:hover {
			color: $text-primary;
		}
	}

	.title-cluster {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;

		&.static {
			padding-left: 0;
		}
	}

	.title {
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: $text-secondary;
		line-height: 1;
	}

	.title-button:hover .title {
		color: $text-primary;
	}

	.chevron {
		display: inline-flex;
		opacity: 0.6;
		transition: opacity 0.12s ease;
	}

	.title-button:hover .chevron {
		opacity: 1;
	}

	.header-trailing {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.description {
		margin: 0;
		font-size: $text-xs;
		color: $text-muted;
		line-height: 1.5;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: var(--glow-section-gap);
		min-width: 0;
	}
</style>
