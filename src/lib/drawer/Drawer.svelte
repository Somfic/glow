<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { type IconProp } from '../icon/Icon.svelte';
	import { type ButtonAction } from '../button/Button.svelte';
	import Card from '../card/Card.svelte';
	import { trapFocus } from '../util/focusTrap.js';
	import { lockScroll, unlockScroll } from '../util/scrollLock.js';
	import { portal } from '../util/portal.js';

	let {
		open: isOpen = $bindable(false),
		title,
		subtitle,
		icon,
		actions = [],
		footer,
		size = 'medium',
		side = 'right',
		showCloseButton = true,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		onClose,
		onOpen,
		children
	}: {
		open?: boolean;
		title?: string;
		subtitle?: string;
		icon?: IconProp;
		/** Footer-action buttons. Maps to Card's `footerActions`. */
		actions?: ButtonAction[];
		footer?: Snippet;
		size?: 'small' | 'medium' | 'large';
		side?: 'left' | 'right';
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onClose?: () => void;
		onOpen?: () => void;
		children?: Snippet;
	} = $props();

	let drawerElement = $state<HTMLDivElement | null>(null);
	let previousActiveElement: Element | null = null;

	const widths = { small: 320, medium: 420, large: 600 };
	let flyX = $derived((side === 'right' ? 1 : -1) * widths[size]);

	export function open() {
		if (isOpen) return;
		isOpen = true;
		onOpen?.();
	}

	export function close() {
		if (!isOpen) return;
		isOpen = false;
		onClose?.();
	}

	export function toggle() {
		if (isOpen) close();
		else open();
	}

	export function isOpenState(): boolean {
		return isOpen;
	}

	function handleOverlayClick(event: MouseEvent) {
		if (!closeOnBackdropClick) return;
		if (event.target === event.currentTarget) close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) close();
	}

	function handleContentKeydown(event: KeyboardEvent) {
		trapFocus(drawerElement, event);
	}

	// Close X button → Card.actions (header right). Modal's `actions` (footer
	// row) → Card.footerActions.
	const headerActions = $derived<ButtonAction[]>(
		showCloseButton ? [{ icon: 'X', variant: 'ghost', onclick: close }] : []
	);

	$effect(() => {
		if (typeof document === 'undefined') return;

		if (isOpen) {
			previousActiveElement = document.activeElement;
			lockScroll();

			setTimeout(() => {
				if (!drawerElement) return;
				const focusable = drawerElement.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				const first = Array.from(focusable).find((el) => !el.hasAttribute('disabled'));
				first?.focus();
			}, 0);
		} else {
			unlockScroll();
			if (previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') unlockScroll();
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="drawer-overlay"
		use:portal
		onclick={handleOverlayClick}
		role="dialog"
		aria-modal="true"
		tabindex="0"
		transition:fade={{ duration: 200 }}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={drawerElement}
			class="drawer-container side-{side} size-{size}"
			role="document"
			tabindex="-1"
			onkeydown={handleContentKeydown}
			transition:fly={{ duration: 250, x: flyX }}
		>
			<Card
				{title}
				{subtitle}
				{icon}
				actions={headerActions}
				footerActions={actions}
				{footer}
				padding="md"
				class="drawer-card"
			>
				{@render children?.()}
			</Card>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.drawer-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
	}

	.drawer-container {
		position: absolute;
		top: 0.75rem;
		bottom: 0.75rem;
		display: flex;
		flex-direction: column;
		border-radius: $radius;

		&:focus {
			outline: none;
		}

		&.side-right {
			right: 0.75rem;
			box-shadow: -8px 0 30px rgba(0, 0, 0, 0.3);
		}

		&.side-left {
			left: 0.75rem;
			box-shadow: 8px 0 30px rgba(0, 0, 0, 0.3);
		}

		&.size-small  { width: 320px; }
		&.size-medium { width: 420px; }
		&.size-large  { width: 600px; }

		@media (max-width: 640px) {
			width: 100% !important;
			border-radius: 0;
			top: 0;
			bottom: 0;
			right: 0;
			left: 0;
		}
	}

	// Make the Card flex-fill the drawer so its body scrolls while header/footer
	// stay pinned. The chained `.card.drawer-card` selector outranks Card's own
	// `.card { display: block; height: 100% }` rule (same specificity tie was
	// causing the footer to sit right under the body instead of at the bottom).
	:global(.card.drawer-card) {
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1 1 auto;
		height: 100%;
	}

	:global(.card.drawer-card > .card-body) {
		overflow-y: auto;
		min-height: 0;
		flex: 1 1 auto;
	}
</style>
