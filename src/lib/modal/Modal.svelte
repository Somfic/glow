<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { Button, Icon } from '../index.js';
	import type { Snippet } from 'svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';

	type Action = {
		label: string;
		variant?: 'primary' | 'secondary' | 'ternary';
		onclick: () => void;
	};

	let {
		title,
		subtitle,
		icon,
		actions = [],
		size = 'medium',
		showCloseButton = true,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		onClose,
		onOpen,
		children
	}: {
		title?: string;
		subtitle?: string;
		icon?: IconName;
		actions?: Action[];
		size?: 'small' | 'medium' | 'large' | 'full';
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onClose?: () => void;
		onOpen?: () => void;
		children?: Snippet;
	} = $props();

	let isOpen = $state(false);
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
		if (isOpen) {
			close();
		} else {
			open();
		}
	}

	export function isOpenState(): boolean {
		return isOpen;
	}

	function handleOverlayClick(event: MouseEvent) {
		if (!closeOnBackdropClick) return;
		const target = event.target as HTMLElement;
		// Only close if clicking the overlay itself, not the modal content
		if (target === event.currentTarget) {
			close();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			close();
		}
	}

	function handleContentKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		if (!modalContentElement) return;

		const focusableElements = Array.from(
			modalContentElement.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled'));

		if (focusableElements.length === 0) return;

		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];

		if (event.shiftKey && document.activeElement === firstFocusable) {
			event.preventDefault();
			lastFocusable.focus();
		} else if (!event.shiftKey && document.activeElement === lastFocusable) {
			event.preventDefault();
			firstFocusable.focus();
		}
	}

	// Manage body scroll lock and focus
	$effect(() => {
		if (typeof document === 'undefined') return;

		if (isOpen) {
			// Store previous focus
			previousActiveElement = document.activeElement;

			// Lock body scroll
			document.body.style.overflow = 'hidden';

			// Focus first focusable element in modal
			setTimeout(() => {
				if (!modalContentElement) return;
				const focusableElements = modalContentElement.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				const firstFocusable = Array.from(focusableElements).find(
					(el) => !el.hasAttribute('disabled')
				);
				firstFocusable?.focus();
			}, 0);
		} else {
			// Restore body scroll
			document.body.style.overflow = '';

			// Restore previous focus
			if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal-overlay"
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
			{#if title || showCloseButton}
				<div class="modal-header">
					<div class="modal-header-content">
						{#if icon}
							<Icon name={icon} size={24} />
						{/if}
						{#if title || subtitle}
							<div class="modal-header-text">
								{#if title}
									<h2 class="modal-title">{title}</h2>
								{/if}
								{#if subtitle}
									<p class="modal-subtitle">{subtitle}</p>
								{/if}
							</div>
						{/if}
					</div>
					{#if showCloseButton}
						<Button icon="X" variant="ternary" onclick={close} />
					{/if}
				</div>
			{/if}

			<div class="modal-content">
				{@render children?.()}
			</div>

			{#if actions.length > 0}
				<div class="modal-footer">
					<ButtonGroup>
						{#each actions as action}
							<Button label={action.label} variant={action.variant} onclick={action.onclick} />
						{/each}
					</ButtonGroup>
				</div>
			{/if}
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
		padding: 1rem;

		@media (max-width: 640px) {
			padding: 0.5rem;
		}
	}

	.modal-container {
		background: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		max-height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
		width: 100%;

		&:focus {
			outline: none;
		}

		&.size-small {
			max-width: 400px;
		}

		&.size-medium {
			max-width: 600px;
		}

		&.size-large {
			max-width: 800px;
		}

		&.size-full {
			max-width: 95vw;
		}

		@media (max-width: 640px) {
			max-width: 100%;
			max-height: calc(100vh - 2rem);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: $border;
		flex-shrink: 0;
		gap: 1rem;

		@media (max-width: 640px) {
			padding: 0.75rem;
		}
	}

	.modal-header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.modal-header-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: $fg;
	}

	.modal-subtitle {
		font-size: 0.875rem;
		margin: 0;
		color: rgba($fg, 0.7);
	}

	.modal-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
		min-height: 0;

		@media (max-width: 640px) {
			padding: 0.75rem;
		}
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 1rem;
		border-top: $border;
		flex-shrink: 0;

		@media (max-width: 640px) {
			padding: 0.75rem;
		}
	}
</style>
