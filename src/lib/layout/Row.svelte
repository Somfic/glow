<script lang="ts">
	import type { Snippet } from 'svelte';
	import { gapMap, resolveAlign, resolveJustify, type GapSize, type Align, type Justify } from './Stack.svelte';

	let {
		gap = 'md',
		align = 'center',
		justify,
		wrap = false,
		style,
		class: className,
		children
	}: {
		gap?: GapSize | string;
		align?: Align;
		justify?: Justify;
		wrap?: boolean;
		style?: string;
		class?: string;
		children: Snippet;
	} = $props();

	let gapValue = $derived(
		typeof gap === 'string' && gap in gapMap ? gapMap[gap as GapSize] : (gap as string)
	);
</script>

<div
	class={['row', className].filter(Boolean).join(' ')}
	style:gap={gapValue}
	style:align-items={resolveAlign(align)}
	style:justify-content={resolveJustify(justify)}
	style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
	{style}
>
	{@render children()}
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		min-width: 0;
	}
</style>
