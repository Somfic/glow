<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { TooltipPosition } from './tooltip.svelte.js';
	import { reducedMotion } from '../util/reducedMotion.svelte.js';

	const motion = reducedMotion();

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

	// A tooltip is deliberately inverted — it has to read as something floating
	// above the page rather than as one more surface of it. Rather than inventing
	// an overlay palette, stamp the *opposite* theme on this element: global.scss
	// re-runs every token recipe against the inverted seeds for this subtree, so
	// `--glow-bg-surface` and `--glow-fg` below come out inverted for free and
	// stay correct if either palette is retuned.
	//
	// <html> is the right thing to read, not a parent: the tooltip is mounted
	// into <body> from an action, so it inherits no subtree's theme, and both
	// writers of the theme (the store and a controlled <Root>) stamp <html>.
	// Nothing stamped yet means the :root default, which is dark.
	const pageTheme =
		typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
			? 'light'
			: 'dark';
	const inverse = pageTheme === 'light' ? 'dark' : 'light';

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
	data-theme={inverse}
	style="left: {x}px; top: {y}px;"
	transition:fade={{ duration: motion.ms(150) }}
	role="tooltip"
>
	{content}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.tooltip {
		position: fixed;
		z-index: 10000;
		background: color-mix(in oklab, var(--glow-bg-surface) 92%, transparent);
		color: var(--glow-fg);
		// Over a subtree that stamps the opposite theme for itself — Sidebar's
		// dark rail in a light app — the inverted fill can land close to what is
		// behind it. The border is what still separates the two.
		border: $border-strong;
		padding: 0.5rem 0.75rem;
		border-radius: $radius-sm;
		font-size: 0.875rem;
		line-height: 1.4;
		max-width: 250px;
		white-space: nowrap;
		pointer-events: none;
		backdrop-filter: blur(8px);
		box-shadow: $shadow-md;

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
