<script lang="ts">
	import { onMount } from 'svelte';

	interface Heading {
		id: string;
		text: string;
		level: number;
	}

	let {
		headings = $bindable([]),
		activeId = $bindable(''),
		// Auto-detect headings from the page
		autoDetect = true,
		// Selector for the container to scan for headings
		container = 'main',
		// Which heading levels to include (e.g., [1, 2, 3] for h1, h2, h3)
		levels = [1, 2, 3, 4]
	}: {
		headings?: Heading[];
		activeId?: string;
		autoDetect?: boolean;
		container?: string;
		levels?: number[];
	} = $props();

	let observer: IntersectionObserver | null = null;
	let tocContainer = $state<HTMLElement | null>(null);
	let isManualScrolling = false;
	let scrollTimeout: number | null = null;

	// Auto-scroll the TOC when active heading changes - keep active item centered
	$effect(() => {
		if (activeId && tocContainer && !isManualScrolling) {
			const activeItem = tocContainer.querySelector(`a[href="#${activeId}"]`);
			if (activeItem && activeItem instanceof HTMLElement) {
				// Calculate scroll position to center the active item within the TOC container
				const containerRect = tocContainer.getBoundingClientRect();
				const itemRect = activeItem.getBoundingClientRect();
				const scrollOffset = itemRect.top - containerRect.top - containerRect.height / 2 + itemRect.height / 2;

				tocContainer.scrollBy({
					top: scrollOffset,
					behavior: 'smooth'
				});
			}
		}
	});

	onMount(() => {
		if (autoDetect) {
			detectHeadings();
			observeHeadings();
		}

		return () => {
			observer?.disconnect();
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	});

	function detectHeadings() {
		const containerEl = document.querySelector(container);
		if (!containerEl) return;

		const selector = levels.map((l) => `h${l}`).join(', ');
		const headingElements = containerEl.querySelectorAll(selector);

		headings = Array.from(headingElements).map((el, index) => {
			// Ensure heading has an id
			if (!el.id) {
				el.id = `heading-${index}`;
			}

			return {
				id: el.id,
				text: el.textContent || '',
				level: parseInt(el.tagName.substring(1))
			};
		});

		// Set the first heading as active initially
		if (headings.length > 0) {
			activeId = headings[0].id;
		}
	}

	function observeHeadings() {
		observer = new IntersectionObserver(
			(entries) => {
				// Don't update activeId during manual scrolling
				if (isManualScrolling) return;

				// Find the topmost intersecting heading
				const intersecting = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (intersecting.length > 0) {
					activeId = intersecting[0].target.id;
				}
			},
			{
				rootMargin: '-100px 0px -66% 0px',
				threshold: 0
			}
		);

		headings.forEach((heading) => {
			const el = document.getElementById(heading.id);
			if (el) observer?.observe(el);
		});
	}

	// The document is not always the scroller: a Page in sidebar mode scrolls
	// its own panel so the scrollbar stays inside the rounded edge. Find
	// whichever ancestor actually scrolls, and fall back to the window.
	function scrollParent(el: HTMLElement): HTMLElement | null {
		for (let node = el.parentElement; node; node = node.parentElement) {
			const overflowY = getComputedStyle(node).overflowY;
			if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
				return node;
			}
		}
		return null;
	}

	function scrollToHeading(id: string) {
		const el = document.getElementById(id);
		if (el) {
			// Set flag to prevent observer interference
			isManualScrolling = true;
			activeId = id;

			// Clear any existing timeout
			if (scrollTimeout) clearTimeout(scrollTimeout);

			// Place the heading 1/6 of the way down the scrollport.
			const scroller = scrollParent(el);
			if (scroller) {
				const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
				scroller.scrollTo({
					top: scroller.scrollTop + delta - scroller.clientHeight / 6,
					behavior: 'smooth'
				});
			} else {
				const elementPosition = el.getBoundingClientRect().top + window.scrollY;
				window.scrollTo({
					top: elementPosition - window.innerHeight / 6,
					behavior: 'smooth'
				});
			}

			// Re-enable observer after scroll animation completes (~800ms for smooth scroll)
			scrollTimeout = setTimeout(() => {
				isManualScrolling = false;
			}, 1000) as unknown as number;
		}
	}

	// Calculate indent based on heading level
	function getIndent(level: number): number {
		const minLevel = Math.min(...headings.map((h) => h.level));
		return (level - minLevel) * 1; // 1rem per level
	}
</script>

{#if headings.length > 0}
	<nav class="table-of-contents" bind:this={tocContainer}>
		<div class="toc-title">On this page</div>
		<ul class="toc-list">
			{#each headings as heading (heading.id)}
				<li class="toc-item" class:active={activeId === heading.id}>
					<a
						href="#{heading.id}"
						class="toc-link"
						style:padding-left="{getIndent(heading.level)}rem"
						onclick={(e) => {
							e.preventDefault();
							scrollToHeading(heading.id);
						}}
					>
						{heading.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.table-of-contents {
		position: sticky;
		top: 2rem;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		padding: $space-lg;
		background: var(--glow-bg-surface-element);
		border: $border;
		border-radius: $radius;
		width: 250px;
	}

	.toc-title {
		font-size: $text-sm;
		font-weight: $weight-semibold;
		color: var(--glow-text-secondary);
		margin-bottom: $space-md;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.toc-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.toc-item {
		margin: 0;
		border-left: 2px solid color-mix(in oklab, var(--glow-border-color) 50%, transparent);
		transition: border-color 0.15s;

		&.active {
			border-left-color: var(--glow-primary);
		}

		&:hover {
			border-left-color: color-mix(in oklab, var(--glow-primary) 50%, transparent);
		}
	}

	.toc-link {
		display: block;
		padding: 0.5rem 0.75rem;
		color: var(--glow-text-secondary);
		text-decoration: none;
		font-size: $text-sm;
		line-height: 1.4;
		transition: all 0.15s;

		.toc-item.active & {
			color: var(--glow-primary);
			font-weight: $weight-medium;
		}

		&:hover {
			color: var(--glow-fg);
			background: color-mix(in oklab, var(--glow-fg) 5%, transparent);
		}

		.toc-item.active &:hover {
			color: var(--glow-primary);
		}
	}
</style>
