<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { TooltipPosition } from './tooltip.svelte.js';

	let {
		content,
		x = 0,
		y = 0,
		position = 'top'
	}: {
		content: string;
		x?: number;
		y?: number;
		position?: TooltipPosition;
	} = $props();

	let el = $state<HTMLDivElement>();

	// The anchor x/y + CSS transform can place the tooltip past a viewport edge
	// (e.g. a centered `top` tooltip on a trigger near the right edge). Measure
	// the rendered box and shift it back on-screen. getBoundingClientRect already
	// accounts for the transform, so nudging left/top corrects the visible box.
	$effect(() => {
		if (!el) return;
		const margin = 8;
		const r = el.getBoundingClientRect();
		let dx = 0;
		let dy = 0;
		if (r.left < margin) dx = margin - r.left;
		else if (r.right > window.innerWidth - margin) dx = window.innerWidth - margin - r.right;
		if (r.top < margin) dy = margin - r.top;
		else if (r.bottom > window.innerHeight - margin) dy = window.innerHeight - margin - r.bottom;
		el.style.left = `${x + dx}px`;
		el.style.top = `${y + dy}px`;
	});
</script>

<div
	bind:this={el}
	class="tooltip {position}"
	style="left: {x}px; top: {y}px;"
	transition:fade={{ duration: 150 }}
	role="tooltip"
>
	{content}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.tooltip {
		position: fixed;
		z-index: 10000;
		background: rgba(0, 0, 0, 0.9);
		color: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.4;
		max-width: 250px;
		white-space: nowrap;
		pointer-events: none;
		backdrop-filter: blur(8px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

		&.top {
			transform: translate(-50%, calc(-100% - 8px));
		}

		&.bottom {
			transform: translate(-50%, 8px);
		}

		&.left {
			transform: translate(calc(-100% - 8px), -50%);
		}

		&.right {
			transform: translate(8px, -50%);
		}
	}
</style>
