<script lang="ts" module>
	export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

	/**
	 * - `auto` — a faint thumb whenever the area overflows, strengthening on hover.
	 * - `always` — thumb plus a track, and a reserved gutter so content never
	 *   reflows when the scrollbar appears.
	 * - `hover` — nothing at rest; the thumb fades in on hover or keyboard focus.
	 * - `none` — no scrollbar at all. Scrolling itself is untouched.
	 */
	export type ScrollAreaScrollbar = 'auto' | 'always' | 'hover' | 'none';

	/** Which edges currently have content past them. */
	export type ScrollAreaEdges = {
		top: boolean;
		bottom: boolean;
		left: boolean;
		right: boolean;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** Axis that scrolls. The other one is clipped. */
		orientation?: ScrollAreaOrientation;
		/** Gradient masks on the edges that still have content past them. */
		fade?: boolean;
		/** Depth of those gradients. Any CSS length. */
		fadeSize?: string;
		scrollbar?: ScrollAreaScrollbar;
		/** Shorthand for the common case; anything CSS accepts. */
		maxHeight?: string;
		maxWidth?: string;
		/**
		 * Accessible name. A scrollable box is a tab stop, and a tab stop with no
		 * name is announced as nothing at all — pass one whenever the surrounding
		 * text doesn't already say what this region is.
		 */
		label?: string;
		/** Fires on every scroll with the edges that currently have content past them. */
		onedgechange?: (edges: ScrollAreaEdges) => void;
		class?: string;
		style?: string;
	}

	let {
		children,
		orientation = 'vertical',
		fade = true,
		fadeSize = '2rem',
		scrollbar = 'auto',
		maxHeight,
		maxWidth,
		label,
		onedgechange,
		class: className,
		style
	}: Props = $props();

	let viewportEl = $state<HTMLDivElement | null>(null);
	let contentEl = $state<HTMLDivElement | null>(null);

	let edges = $state<ScrollAreaEdges>({ top: false, bottom: false, left: false, right: false });

	let scrollsY = $derived(orientation === 'vertical' || orientation === 'both');
	let scrollsX = $derived(orientation === 'horizontal' || orientation === 'both');

	// A box that cannot scroll must not be a tab stop: it would be an empty stop
	// on the way to the next control, with nothing for the key to do. So the
	// tabindex comes off the same measurement that drives the fades, which means
	// it appears and disappears as the content grows and shrinks.
	let scrollable = $derived(edges.top || edges.bottom || edges.left || edges.right);

	$effect(() => {
		const viewport = viewportEl;
		const content = contentEl;
		if (!viewport || !content) return;

		const measure = () => {
			// Sub-pixel layout makes scrollTop + clientHeight land a fraction short
			// of scrollHeight at the very bottom; without the tolerance the trailing
			// fade never quite switches off.
			const slack = 1;
			const next: ScrollAreaEdges = {
				top: scrollsY && viewport.scrollTop > slack,
				bottom:
					scrollsY && viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - slack,
				left: scrollsX && viewport.scrollLeft > slack,
				right:
					scrollsX && viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - slack
			};
			if (
				next.top === edges.top &&
				next.bottom === edges.bottom &&
				next.left === edges.left &&
				next.right === edges.right
			)
				return;
			edges = next;
			onedgechange?.(next);
		};

		measure();
		viewport.addEventListener('scroll', measure, { passive: true });
		// Both boxes are observed. The viewport alone catches a window resize, but
		// not the case this component exists for: content that grows or shrinks
		// inside a viewport whose size never changed — a list that loads a page, an
		// accordion opening. That only moves the *content* box.
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		observer.observe(content);
		return () => {
			viewport.removeEventListener('scroll', measure);
			observer.disconnect();
		};
	});

	/** Scroll to an offset on the scrolling axis. Exposed for consumers driving the area themselves. */
	export function scrollTo(options: ScrollToOptions): void {
		viewportEl?.scrollTo(options);
	}

	/** The scrolling element, for `scrollIntoView` on a child or anything else raw. */
	export function viewport(): HTMLDivElement | null {
		return viewportEl;
	}
</script>

<div
	class={['scroll-area', `sb-${scrollbar}`, className].filter(Boolean).join(' ')}
	class:faded={fade}
	style:--fade-size={fadeSize}
	{style}
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={viewportEl}
		class="viewport"
		class:scroll-y={scrollsY}
		class:scroll-x={scrollsX}
		style:max-height={maxHeight}
		style:max-width={maxWidth}
		tabindex={scrollable ? 0 : undefined}
		role={scrollable && label ? 'region' : undefined}
		aria-label={scrollable ? label : undefined}
	>
		<!--
			A real element rather than `display: contents`, because a box with no box
			is invisible to ResizeObserver — and observing the content is the whole
			point. In horizontal mode it takes its width from the content so that
			width is what gets observed.
		-->
		<div bind:this={contentEl} class="content" class:wide={scrollsX}>
			{@render children()}
		</div>
	</div>

	{#if fade}
		<div class="fade fade-top" class:on={edges.top} aria-hidden="true"></div>
		<div class="fade fade-bottom" class:on={edges.bottom} aria-hidden="true"></div>
		<div class="fade fade-left" class:on={edges.left} aria-hidden="true"></div>
		<div class="fade fade-right" class:on={edges.right} aria-hidden="true"></div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.scroll-area {
		position: relative;
		min-width: 0;
		min-height: 0;
		// The fades are opaque gradients painted over the content, not a
		// `mask-image`. A mask would fade the scrollbar along with the content, and
		// the two-axis case would need `mask-composite` to intersect four gradients.
		// The cost is that the gradient has to know what it sits on: retarget it
		// with `--glow-scroll-fade` when the area isn't on a surface.
		--fade-color: var(--glow-scroll-fade, var(--glow-bg-surface));
	}

	.viewport {
		// Scroll anchoring is left alone (`overflow-anchor` unset): content
		// prepended above the scroll position should keep what you're reading put.
		height: 100%;
		max-width: 100%;
		overflow: hidden;

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
			border-radius: inherit;
		}
	}

	.scroll-y {
		overflow-y: auto;
		overscroll-behavior-y: contain;
	}

	.scroll-x {
		overflow-x: auto;
		overscroll-behavior-x: contain;
	}

	.content {
		min-width: 0;
	}

	// `min-width` rather than `width: max-content`: the content still fills a
	// viewport wider than it is, and only outgrows it when it genuinely needs to.
	.wide {
		min-width: max-content;
	}

	/* ----- Scrollbar ---------------------------------------------------- */

	// Real scrollbar, restyled — not an overlay thumb over a JS-driven
	// transform. Keyboard scrolling, momentum, and the platform's own
	// accessibility affordances all live on the native one.
	.sb-auto .viewport {
		scrollbar-width: thin;
		scrollbar-color: var(--glow-scrollbar-thumb, color-mix(in oklab, var(--glow-fg) 18%, transparent))
			transparent;

		&:hover,
		&:focus-within {
			scrollbar-color: color-mix(in oklab, var(--glow-fg) 34%, transparent) transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: color-mix(in oklab, var(--glow-fg) 18%, transparent);
		}

		&:hover::-webkit-scrollbar-thumb,
		&:focus-within::-webkit-scrollbar-thumb {
			background: color-mix(in oklab, var(--glow-fg) 34%, transparent);
		}
	}

	// The one mode that must occupy layout, and the reason it looks like this:
	// Chromium only honours `::-webkit-scrollbar-*` while `scrollbar-width` and
	// `scrollbar-color` are still at `auto`. Set either one — `global.scss` sets
	// both on `*` — and it switches to the standard properties, which on a
	// platform with overlay scrollbars (macOS, and any Chrome inheriting that
	// system setting) draw over the content and reserve nothing, leaving
	// `scrollbar-gutter: stable` with no gutter to stabilise. Measured: 0px with
	// `scrollbar-color` set, 8px with it reset to `auto`. So the mode resets both
	// and paints through the pseudo-elements instead.
	.sb-always .viewport {
		scrollbar-width: auto;
		scrollbar-color: auto;
		scrollbar-gutter: stable;

		// Firefox has no such pseudo-elements, so it gets the standard properties
		// — where its scrollbars are in-flow anyway, and the mode's promise holds.
		@supports not selector(::-webkit-scrollbar) {
			scrollbar-width: thin;
			scrollbar-color: color-mix(in oklab, var(--glow-fg) 34%, transparent)
				color-mix(in oklab, var(--glow-fg) 7%, transparent);
		}

		&::-webkit-scrollbar-track {
			background: color-mix(in oklab, var(--glow-fg) 7%, transparent);
			border-radius: $radius-full;
		}

		&::-webkit-scrollbar-thumb {
			background: color-mix(in oklab, var(--glow-fg) 34%, transparent);
		}

		&::-webkit-scrollbar-thumb:hover {
			background: color-mix(in oklab, var(--glow-fg) 48%, transparent);
		}
	}

	.sb-hover .viewport {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;

		&::-webkit-scrollbar-thumb {
			background: transparent;
		}

		// Focus counts as hover here: a keyboard user scrolling with the arrow keys
		// gets the same position readout a mouse user gets.
		&:hover,
		&:focus-within {
			scrollbar-color: color-mix(in oklab, var(--glow-fg) 30%, transparent) transparent;
		}

		&:hover::-webkit-scrollbar-thumb,
		&:focus-within::-webkit-scrollbar-thumb {
			background: color-mix(in oklab, var(--glow-fg) 30%, transparent);
		}
	}

	.sb-none .viewport {
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	.viewport::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.viewport::-webkit-scrollbar-thumb {
		border-radius: $radius-full;
		transition: background var(--glow-dur-fast) var(--glow-ease-out);
	}

	/* ----- Fades -------------------------------------------------------- */

	.fade {
		position: absolute;
		pointer-events: none;
		opacity: 0;
		z-index: 1;
		transition: opacity var(--glow-dur-fast) var(--glow-ease-out);
	}

	.fade.on {
		opacity: 1;
	}

	.fade-top,
	.fade-bottom {
		left: 0;
		right: 0;
		height: var(--fade-size);
	}

	.fade-left,
	.fade-right {
		top: 0;
		bottom: 0;
		width: var(--fade-size);
	}

	.fade-top {
		top: 0;
		background: linear-gradient(to bottom, var(--fade-color), transparent);
	}

	.fade-bottom {
		bottom: 0;
		background: linear-gradient(to top, var(--fade-color), transparent);
	}

	.fade-left {
		left: 0;
		background: linear-gradient(to right, var(--fade-color), transparent);
	}

	.fade-right {
		right: 0;
		background: linear-gradient(to left, var(--fade-color), transparent);
	}
</style>
