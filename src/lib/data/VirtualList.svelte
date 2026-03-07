<script lang="ts">
	import type { VirtualListProps } from './types.js';
	import { onMount } from 'svelte';

	let {
		items = [],
		itemHeight = 60,
		renderItem,
		hasMore = false,
		loading = false,
		onLoadMore,
		threshold = 200,
		overscan = 3,
		gap = 0,
		height = '100%',
		emptyState,
		loadingState,
		endState,
		onScroll,
		onVisibleRangeChange
	}: VirtualListProps = $props();

	let container: HTMLDivElement | null = $state(null);
	let scrollTop = $state(0);
	let containerHeight = $state(0);

	// Calculate item height for a given index
	function getItemHeight(index: number): number {
		if (typeof itemHeight === 'function') {
			return itemHeight(items[index], index);
		}
		return itemHeight;
	}

	// Calculate cumulative heights for positioning
	const itemHeights = $derived.by(() => {
		const heights: number[] = [];
		let cumulative = 0;
		for (let i = 0; i < items.length; i++) {
			heights.push(cumulative);
			cumulative += getItemHeight(i) + gap;
		}
		return heights;
	});

	const totalHeight = $derived(
		itemHeights.length > 0 ? itemHeights[itemHeights.length - 1] + getItemHeight(items.length - 1) : 0
	);

	// Binary search to find the first visible item
	function findFirstVisibleIndex(scroll: number): number {
		let left = 0;
		let right = itemHeights.length - 1;

		while (left < right) {
			const mid = Math.floor((left + right) / 2);
			if (itemHeights[mid] < scroll) {
				left = mid + 1;
			} else {
				right = mid;
			}
		}

		return Math.max(0, left - overscan);
	}

	// Calculate visible range
	const visibleStart = $derived(findFirstVisibleIndex(scrollTop));
	const visibleEnd = $derived.by(() => {
		let end = visibleStart;
		let height = 0;
		while (end < items.length && height < containerHeight + threshold) {
			height += getItemHeight(end) + gap;
			end++;
		}
		return Math.min(items.length, end + overscan);
	});

	const visibleItems = $derived.by(() => {
		const visible = [];
		for (let i = visibleStart; i < visibleEnd; i++) {
			visible.push({
				item: items[i],
				index: i,
				top: itemHeights[i],
				height: getItemHeight(i)
			});
		}
		return visible;
	});

	// Handle scroll events
	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		scrollTop = target.scrollTop;

		// Call user callback
		onScroll?.(scrollTop, target.scrollHeight);

		// Notify about visible range changes
		onVisibleRangeChange?.(visibleStart, visibleEnd);

		// Check if we should load more
		if (!loading && hasMore && onLoadMore) {
			const bottom = target.scrollHeight - scrollTop - containerHeight;
			if (bottom < threshold) {
				onLoadMore();
			}
		}
	}

	// Measure container height on mount and resize
	onMount(() => {
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerHeight = entry.contentRect.height;
			}
		});

		observer.observe(container);

		return () => observer.disconnect();
	});
</script>

<div
	bind:this={container}
	class="virtual-list"
	style:height={typeof height === 'number' ? `${height}px` : height}
	onscroll={handleScroll}
>
	{#if items.length === 0 && !loading}
		{#if emptyState}
			<div class="virtual-list-state empty">
				{@render emptyState()}
			</div>
		{:else}
			<div class="virtual-list-state empty">
				<p>No items to display</p>
			</div>
		{/if}
	{:else}
		<div class="virtual-list-content" style:height="{totalHeight}px">
			{#each visibleItems as { item, index, top, height } (index)}
				<div
					class="virtual-list-item"
					style:position="absolute"
					style:top="{top}px"
					style:height="{height}px"
					style:left="0"
					style:right="0"
				>
					{@render renderItem(item, index)}
				</div>
			{/each}
		</div>
	{/if}

	{#if loading}
		{#if loadingState}
			<div class="virtual-list-state loading">
				{@render loadingState()}
			</div>
		{:else}
			<div class="virtual-list-state loading">
				<div class="spinner"></div>
			</div>
		{/if}
	{:else if !hasMore && items.length > 0 && endState}
		<div class="virtual-list-state end">
			{@render endState()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.virtual-list {
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		width: 100%;

		&::-webkit-scrollbar {
			width: 8px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba($fg, 0.2);
			border-radius: 4px;

			&:hover {
				background: rgba($fg, 0.3);
			}
		}
	}

	.virtual-list-content {
		position: relative;
		width: 100%;
	}

	.virtual-list-item {
		will-change: transform;
	}

	.virtual-list-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: $text-muted;
		font-size: $text-sm;

		&.empty {
			min-height: 200px;
		}

		&.loading {
			padding: 1rem;
		}

		&.end {
			padding: 1rem;
		}
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba($primary, 0.3);
		border-top-color: $primary;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
