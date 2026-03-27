<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		disabled?: boolean;
		trigger: Snippet;
		children: Snippet;
		align?: 'left' | 'right' | 'stretch';
		offset?: number;
		manual?: boolean;
		class?: string;
	}

	let {
		open = $bindable(false),
		disabled = false,
		trigger,
		children,
		align = 'stretch',
		offset = 4,
		manual = false,
		class: className = ''
	}: Props = $props();

	let containerElement: HTMLDivElement;
	let contentElement: HTMLDivElement;
	let placement: 'below' | 'above' = $state('below');

	function updatePlacement() {
		if (!containerElement) return;
		const triggerRect = containerElement.getBoundingClientRect();
		const spaceBelow = window.innerHeight - triggerRect.bottom;
		const spaceAbove = triggerRect.top;
		// Estimate content height, refine after mount
		const contentHeight = contentElement?.offsetHeight ?? 200;
		if (spaceBelow < contentHeight + offset && spaceAbove > spaceBelow) {
			placement = 'above';
		} else {
			placement = 'below';
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (open && containerElement && !containerElement.contains(e.target as Node)) {
			open = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
		}
	}

	$effect(() => {
		if (open) {
			updatePlacement();
			// Refine after content renders
			requestAnimationFrame(() => updatePlacement());
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>

<div
	class="popover {className}"
	class:disabled
	class:open
	bind:this={containerElement}
>
	<div class="popover-trigger" onclick={() => !disabled && !manual && (open = !open)}>
		{@render trigger()}
	</div>

	{#if open}
		<div
			bind:this={contentElement}
			class="popover-content align-{align}"
			style={placement === 'below' ? `top: calc(100% + ${offset}px)` : `bottom: calc(100% + ${offset}px)`}
			transition:fly={{ duration: 150, y: placement === 'below' ? -8 : 8 }}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.popover {
		position: relative;

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
	}

	.popover-trigger {
		cursor: pointer;
	}

	.popover-content {
		position: absolute;
		background-color: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

		&.align-stretch {
			left: -$border-width;
			right: -$border-width;
		}

		&.align-left {
			left: -$border-width;
		}

		&.align-right {
			right: -$border-width;
		}
	}
</style>
