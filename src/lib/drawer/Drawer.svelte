<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { Button, Icon } from '../index.js';
	import type { Snippet } from 'svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';

	type Action = {
		label: string;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		onclick: () => void;
	};

	let {
		title,
		subtitle,
		icon,
		iconFilled = false,
		actions = [],
		size = 'medium',
		side = 'right',
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
		iconFilled?: boolean;
		actions?: Action[];
		size?: 'small' | 'medium' | 'large';
		side?: 'left' | 'right';
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onClose?: () => void;
		onOpen?: () => void;
		children?: Snippet;
	} = $props();

	let isOpen = $state(false);
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
		if (event.target === event.currentTarget) {
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
		if (!drawerElement) return;

		const focusableElements = Array.from(
			drawerElement.querySelectorAll<HTMLElement>(
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

	$effect(() => {
		if (typeof document === 'undefined') return;

		if (isOpen) {
			previousActiveElement = document.activeElement;
			document.body.style.overflow = 'hidden';

			setTimeout(() => {
				if (!drawerElement) return;
				const focusableElements = drawerElement.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				const firstFocusable = Array.from(focusableElements).find(
					(el) => !el.hasAttribute('disabled')
				);
				firstFocusable?.focus();
			}, 0);
		} else {
			document.body.style.overflow = '';

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
		class="drawer-overlay"
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
			{#if title || showCloseButton}
				<div class="drawer-header">
					<div class="drawer-header-content">
						{#if icon}
							<Icon name={icon} size={24} fill={iconFilled} />
						{/if}
						{#if title || subtitle}
							<div class="drawer-header-text">
								{#if title}
									<h2 class="drawer-title">{title}</h2>
								{/if}
								{#if subtitle}
									<p class="drawer-subtitle">{subtitle}</p>
								{/if}
							</div>
						{/if}
					</div>
					{#if showCloseButton}
						<Button icon="X" variant="ghost" onclick={close} />
					{/if}
				</div>
			{/if}

			<div class="drawer-content">
				{@render children?.()}
			</div>

			{#if actions.length > 0}
				<div class="drawer-footer">
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
		background: $bg-surface-element;
		border: $border;
		display: flex;
		flex-direction: column;

		&:focus {
			outline: none;
		}

		&.side-right {
			right: 0.75rem;
			border-radius: $radius;
			box-shadow: -8px 0 30px rgba(0, 0, 0, 0.3);
		}

		&.side-left {
			left: 0.75rem;
			border-radius: $radius;
			box-shadow: 8px 0 30px rgba(0, 0, 0, 0.3);
		}

		&.size-small {
			width: 320px;
		}

		&.size-medium {
			width: 420px;
		}

		&.size-large {
			width: 600px;
		}

		@media (max-width: 640px) {
			width: 100% !important;
			border-radius: 0;
		}
	}

	.drawer-header {
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

	.drawer-header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.drawer-header-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.drawer-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: $fg;
	}

	.drawer-subtitle {
		font-size: 0.875rem;
		margin: 0;
		color: rgba($fg, 0.7);
	}

	.drawer-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
		min-height: 0;

		@media (max-width: 640px) {
			padding: 0.75rem;
		}
	}

	.drawer-footer {
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
