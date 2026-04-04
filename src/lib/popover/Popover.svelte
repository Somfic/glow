<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { portal } from '../util/portal.js';
	import { onEscape } from '../util/escapeKey.js';
	import { onClickOutside } from '../util/clickOutside.js';

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
	let contentElement = $state<HTMLDivElement>(undefined!);
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

	$effect(() => {
		if (open) {
			updatePosition();
			requestAnimationFrame(() => updatePosition());

			window.addEventListener('scroll', updatePosition, true);
			window.addEventListener('resize', updatePosition);

			const cleanupEscape = onEscape(() => { open = false; });
			const cleanupClickOutside = onClickOutside(
				[containerElement, contentElement],
				() => { open = false; }
			);

			return () => {
				window.removeEventListener('scroll', updatePosition, true);
				window.removeEventListener('resize', updatePosition);
				cleanupEscape();
				cleanupClickOutside();
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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
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
