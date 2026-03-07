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
</script>

<div
	class="tooltip {position}"
	style="left: {x}px; top: {y}px;"
	transition:fade={{ duration: 150 }}
	role="tooltip"
>
	{content}
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
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
  word-wrap: break-word;
  pointer-events: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.tooltip.top {
  transform: translate(-50%, calc(-100% - 8px));
}
.tooltip.bottom {
  transform: translate(-50%, 8px);
}
.tooltip.left {
  transform: translate(calc(-100% - 8px), -50%);
}
.tooltip.right {
  transform: translate(8px, -50%);
}</style>
