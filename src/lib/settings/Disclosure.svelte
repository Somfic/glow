<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	interface Props {
		/** Header text shown next to the chevron. */
		title: string;
		/** Optional leading icon. */
		icon?: IconProp;
		/** Whether the disclosure is open. Bindable. */
		open?: boolean;
		/** Initial state when uncontrolled. */
		defaultOpen?: boolean;
		/** Optional muted text shown to the right of the title (e.g. count, status). */
		meta?: string;
		/** Optional snippet rendered to the right of the header (e.g. a Spinner). */
		headerExtra?: Snippet;
		/** Visual variant. `subtle` is for inline/streaming use, `boxed` adds a card-like background. */
		variant?: 'subtle' | 'boxed';
		/** Highlight the border (e.g. while streaming). */
		active?: boolean;
		/** Disable user interaction. */
		disabled?: boolean;
		children: Snippet;
		onToggle?: (open: boolean) => void;
	}

	let {
		title,
		icon,
		open = $bindable<boolean | undefined>(undefined),
		defaultOpen = true,
		meta,
		headerExtra,
		variant = 'boxed',
		active = false,
		disabled = false,
		children,
		onToggle
	}: Props = $props();

	// Track internal state when uncontrolled. `internalOpen` starts undefined
	// so the $derived can fall through to `defaultOpen` lazily — this avoids
	// pinning the initial value of the prop and keeps it reactive if it changes.
	let internalOpen = $state<boolean | undefined>(undefined);
	let isOpen = $derived(open ?? internalOpen ?? defaultOpen);

	function toggle() {
		if (disabled) return;
		const next = !isOpen;
		if (open !== undefined) open = next;
		else internalOpen = next;
		onToggle?.(next);
	}
</script>

<div class="disclosure" class:boxed={variant === 'boxed'} class:active class:open={isOpen}>
	<button
		type="button"
		class="header"
		aria-expanded={isOpen}
		{disabled}
		onclick={toggle}
	>
		<span class="chevron" aria-hidden="true">
			<Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} />
		</span>
		{#if icon}
			<span class="icon" aria-hidden="true">
				<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 14} />
			</span>
		{/if}
		<span class="title">{title}</span>
		{#if meta}
			<span class="meta">{meta}</span>
		{/if}
		{#if headerExtra}
			<span class="extra">{@render headerExtra()}</span>
		{/if}
	</button>
	{#if isOpen}
		<div class="content">
			{@render children()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.disclosure {
		display: flex;
		flex-direction: column;
		min-width: 0;

		&.boxed {
			border: 1px solid rgba($fg, 0.08);
			border-radius: $radius * 0.6;
			background: rgba($fg, 0.02);
			overflow: hidden;
			transition: border-color 0.15s ease;

			&.active {
				border-color: $primary;
			}
		}
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 0;
		color: $text-secondary;
		font-family: $font-family;
		font-size: $text-xs;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		cursor: pointer;
		text-align: left;
		transition: color 0.12s ease, background 0.12s ease;

		&:hover:not(:disabled) {
			color: $text-primary;
			background: rgba($fg, 0.03);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}
	}

	.chevron {
		display: inline-flex;
		opacity: 0.7;
	}

	.icon {
		display: inline-flex;
		opacity: 0.8;
	}

	.title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0;
		color: $text-muted;
		font-size: $text-xs;
	}

	.extra {
		display: inline-flex;
		align-items: center;
	}

	.content {
		padding: 0.5rem 0.875rem 0.875rem;
		display: flex;
		flex-direction: column;
		gap: var(--glow-section-gap, 0.5rem);
	}
</style>
