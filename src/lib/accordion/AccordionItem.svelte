<script lang="ts">
	import { getContext, onMount, type Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import { ACCORDION_CONTEXT_KEY, type AccordionContext } from './context.js';

	interface Props {
		/** Identity of this item within the group. Defaults to a generated id. */
		value?: string;
		/** Header text. Use the `header` snippet instead when you need markup. */
		title?: string;
		/** Muted second line under the title. */
		subtitle?: string;
		/** Icon rendered before the title. */
		icon?: IconProp;
		/** Right-aligned text or count, rendered before the chevron. */
		badge?: string | number;
		disabled?: boolean;
		/** Replaces the whole title cluster. Rendered inside the trigger button. */
		header?: Snippet;
		/** Panel content. */
		children?: Snippet;
		class?: string;
	}

	let {
		value,
		title,
		subtitle,
		icon,
		badge,
		disabled = false,
		header,
		children,
		class: className
	}: Props = $props();

	const ctx = getContext<AccordionContext>(ACCORDION_CONTEXT_KEY);
	if (!ctx) throw new Error('<AccordionItem> must be used inside an <Accordion>.');

	// `$props.id()` rather than a random string: it is stable across SSR and
	// hydration, so the aria-controls / aria-labelledby pair doesn't change
	// under the client and break the association mid-hydration.
	const uid = $props.id();
	const itemValue = $derived(value ?? uid);
	const triggerId = `${uid}-trigger`;
	const panelId = `${uid}-panel`;

	const isOpen = $derived(ctx.open.includes(itemValue));
	const isDisabled = $derived(disabled || ctx.disabled);

	// Panel height animation: measure the content's intrinsic height and drive
	// the wrapper between 0 and that. Same recipe as Card's collapsible body —
	// `height: auto` is not animatable.
	let panelHeight = $state(0);

	// Skip the transition on first paint, so an item that starts open renders
	// open instead of unrolling itself on load.
	let mounted = $state(false);
	onMount(() => {
		requestAnimationFrame(() => {
			mounted = true;
		});
	});
</script>

<div class={['accordion-item', className].filter(Boolean).join(' ')} class:open={isOpen}>
	<svelte:element this={`h${ctx.headingLevel}`} class="accordion-heading">
		<button
			type="button"
			id={triggerId}
			class="accordion-trigger"
			data-accordion-trigger
			aria-expanded={isOpen}
			aria-controls={panelId}
			aria-disabled={isDisabled || undefined}
			disabled={isDisabled}
			onclick={() => ctx.toggle(itemValue)}
		>
			{#if header}
				{@render header()}
			{:else}
				{#if icon}
					<span class="trigger-icon" aria-hidden="true">
						<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 16} />
					</span>
				{/if}
				<span class="trigger-text">
					{#if title}<span class="trigger-title">{title}</span>{/if}
					{#if subtitle}<span class="trigger-subtitle">{subtitle}</span>{/if}
				</span>
			{/if}
			<span class="trigger-spacer"></span>
			{#if badge != null}
				<span class="trigger-badge">{badge}</span>
			{/if}
			<span class="chevron" aria-hidden="true">
				<Icon name="ChevronRight" size={14} />
			</span>
		</button>
	</svelte:element>

	<div
		class="panel-wrap"
		class:mounted
		style:height="{isOpen ? panelHeight : 0}px"
		aria-hidden={!isOpen}
	>
		<div
			id={panelId}
			role="region"
			aria-labelledby={triggerId}
			class="panel"
			bind:offsetHeight={panelHeight}
		>
			{@render children?.()}
		</div>
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.accordion-item {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.accordion-heading {
		margin: 0;
		font: inherit;
	}

	.accordion-trigger {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--glow-text-primary);
		font-family: $font-family;
		font-size: $text-sm;
		font-weight: $weight-medium;
		text-align: left;
		cursor: pointer;
		transition: background var(--glow-dur-fast) var(--glow-ease-out),
			color var(--glow-dur-fast) var(--glow-ease-out);

		&:hover:not(:disabled) {
			background: var(--glow-fg-soft);
		}

		&:disabled {
			@include disabled-content;
			cursor: default;
		}

		// Inset so the ring isn't clipped by the container's `overflow: hidden`.
		&:focus-visible {
			outline: 2px solid var(--glow-primary);
			outline-offset: -2px;
		}
	}

	.trigger-icon {
		display: inline-flex;
		opacity: 0.8;
		flex: 0 0 auto;
	}

	.trigger-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.trigger-title {
		line-height: 1.3;
	}

	.trigger-subtitle {
		font-size: $text-xs;
		font-weight: $weight-normal;
		color: var(--glow-text-secondary);
		line-height: 1.3;
	}

	.trigger-spacer {
		flex: 1 1 auto;
	}

	.trigger-badge {
		flex: 0 0 auto;
		font-size: $text-xs;
		font-variant-numeric: tabular-nums;
		color: var(--glow-text-secondary);
		background: var(--glow-fg-soft);
		border-radius: 999px;
		padding: 0.125rem 0.5rem;
	}

	.chevron {
		display: inline-flex;
		flex: 0 0 auto;
		opacity: 0.7;
		transition: transform var(--glow-dur-base) var(--glow-ease-out);

		.open & {
			transform: rotate(90deg);
		}
	}

	.panel-wrap {
		overflow: hidden;
		// `visibility` keeps a closed panel's content out of the tab order and
		// the a11y tree while still letting it lay out, which is what makes
		// `offsetHeight` above readable while closed. The delay flips it at the
		// *end* of a close so the content doesn't vanish mid-collapse, and at
		// the start of an open so it is there for the whole reveal.
		visibility: hidden;
		transition: visibility 0s linear var(--glow-dur-base);

		&.mounted {
			transition: height var(--glow-dur-base) var(--glow-ease-out),
				visibility 0s linear var(--glow-dur-base);
		}
	}

	.open .panel-wrap {
		visibility: visible;
		transition-delay: 0s;
	}

	.panel {
		// Padding lives here, not on the wrapper, so the measured height already
		// includes it and the wrapper's explicit height is exactly what shows.
		padding: 0 1rem 1rem;
		min-width: 0;
		color: var(--glow-text-secondary);
		font-size: $text-sm;
	}

	// Variant styling reaches down from the group: the item doesn't know or care
	// which frame it is sitting in, and only the group knows where its edges are.
	:global(.glow-accordion.variant-bordered) .accordion-item:not(:first-child) {
		border-top: 1px solid var(--glow-border-color);
	}

	:global(.glow-accordion.variant-separated) .accordion-item {
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;
		overflow: hidden;
		background: var(--glow-bg-surface-element);
	}

	:global(.glow-accordion.variant-plain) .accordion-item:not(:first-child) {
		border-top: 1px solid var(--glow-border-color);
	}

	:global(.glow-accordion.variant-plain) .accordion-trigger {
		padding-left: 0;
		padding-right: 0;
	}

	:global(.glow-accordion.variant-plain) .panel {
		padding-left: 0;
		padding-right: 0;
	}
</style>
