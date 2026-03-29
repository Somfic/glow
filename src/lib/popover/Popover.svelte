<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { portal } from '../util/portal.js';

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
	let popoverStyle = $state('');

	function updatePosition() {
		if (!containerElement) return;
		const rect = containerElement.getBoundingClientRect();
		const contentHeight = contentElement?.offsetHeight ?? 200;
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;

		if (spaceBelow < contentHeight + offset && spaceAbove > spaceBelow) {
			placement = 'above';
		} else {
			placement = 'below';
		}

		let top: number;
		if (placement === 'below') {
			top = rect.bottom + offset;
		} else {
			top = rect.top - offset - (contentElement?.offsetHeight ?? 0);
		}

		let style = `position: fixed; top: ${top}px; z-index: 10000;`;

		if (align === 'stretch') {
			style += ` left: ${rect.left}px; width: ${rect.width}px;`;
		} else if (align === 'left') {
			style += ` left: ${rect.left}px;`;
		} else if (align === 'right') {
			style += ` left: ${rect.right}px; transform: translateX(-100%);`;
		}

		popoverStyle = style;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as Node;
		if (
			open &&
			containerElement &&
			!containerElement.contains(target) &&
			(!contentElement || !contentElement.contains(target))
		) {
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
			updatePosition();
			requestAnimationFrame(() => updatePosition());

			window.addEventListener('scroll', updatePosition, true);
			window.addEventListener('resize', updatePosition);
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);

			return () => {
				window.removeEventListener('scroll', updatePosition, true);
				window.removeEventListener('resize', updatePosition);
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
			class="popover-content"
			style={popoverStyle}
			use:portal
			transition:fly={{ duration: 150, y: placement === 'below' ? -8 : 8 }}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.popover {
		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
	}

	.popover-trigger {
		cursor: pointer;
	}

	:global(.popover-content) {
		background-color: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
</style>
