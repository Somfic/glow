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
			class="popover-content align-{align}"
			style="top: calc(100% + {offset}px)"
			transition:fly={{ duration: 150, y: -8 }}
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
