<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
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
		/** Footer-action buttons (the Cancel/Save row). Maps to Card's `footerActions`. */
		actions?: ButtonAction[];
		/** Override the default footer with a snippet. */
		footer?: Snippet;
		size?: 'small' | 'medium' | 'large' | 'full';
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onClose?: () => void;
		onOpen?: () => void;
		children?: Snippet;
	} = $props();

	let modalContentElement = $state<HTMLDivElement | null>(null);
	let previousActiveElement: Element | null = null;

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
		trapFocus(modalContentElement, event);
	}

	// Card's `actions` prop renders header-right buttons. We use that slot for
	// the close X. Modal's own `actions` prop is the *footer* buttons (Cancel /
	// Save) which we forward to Card.footerActions.
	const headerActions = $derived<ButtonAction[]>(
		showCloseButton ? [{ icon: 'X', variant: 'ghost', onclick: close }] : []
	);

	$effect(() => {
		if (typeof document === 'undefined') return;

		if (isOpen) {
			previousActiveElement = document.activeElement;
			lockScroll();

			setTimeout(() => {
				if (!modalContentElement) return;
				const focusable = modalContentElement.querySelectorAll<HTMLElement>(
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
		class="modal-overlay"
		use:portal
		onclick={handleOverlayClick}
		role="dialog"
		aria-modal="true"
		tabindex="0"
		transition:fade={{ duration: 200 }}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={modalContentElement}
			class="modal-container size-{size}"
			role="document"
			tabindex="-1"
			onkeydown={handleContentKeydown}
			transition:scale={{ duration: 200, start: 0.95, opacity: 0 }}
		>
			<Card
				{title}
				{subtitle}
				{icon}
				actions={headerActions}
				footerActions={actions}
				{footer}
				padding="md"
				class="modal-card"
			>
				{@render children?.()}
			</Card>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $space-md;

		@media (max-width: 640px) {
			padding: $space-sm;
		}
	}

	.modal-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: calc(100vh - 4rem);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
		border-radius: $radius;

		&:focus {
			outline: none;
		}

		&.size-small  { max-width: 400px; }
		&.size-medium { max-width: 600px; }
		&.size-large  { max-width: 800px; }
		&.size-full   { max-width: 95vw; }

		@media (max-width: 640px) {
			max-width: 100%;
			max-height: calc(100vh - 2rem);
		}
	}

	// Make the Card inside the dialog flex-fill the container so its body can
	// scroll while header/footer stay pinned. Chained selector outranks
	// Card's own `.card` defaults at the same specificity.
	:global(.card.modal-card) {
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1 1 auto;
	}

	:global(.card.modal-card > .card-body) {
		overflow-y: auto;
		min-height: 0;
		flex: 1 1 auto;
	}
</style>
