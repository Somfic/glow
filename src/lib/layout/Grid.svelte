<script lang="ts" module>
	import type { GapSize } from './Flex.svelte';
	export type { GapSize };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { gapMap, resolveAlign, resolveJustify, type Align, type Justify } from './Flex.svelte';

	type Props = {
		/**
		 * Minimum column width before wrapping. Combined with `auto` it produces
		 * `repeat(auto-fit, minmax(<min>, 1fr))` — the responsive grid pattern
		 * everyone hand-rolls. Default `200px`. Ignored if `cols` is set.
		 */
		min?: string;
		/** Fixed column count. Overrides `min` when set. */
		cols?: number;
		/**
		 * Whether unfilled tracks collapse (`fit`, default) or stay reserved
		 * (`fill`). `auto-fill` is rarely the right answer — pick it only when
		 * trailing empty cells are intentional.
		 */
		auto?: 'fit' | 'fill';
		gap?: GapSize | string;
		/** Cross-axis alignment of items within their cell. */
		align?: Align;
		/** Main-axis distribution when tracks don't fill the container. */
		justify?: Justify;
		style?: string;
		class?: string;
		children: Snippet;
	};

	let {
		min = '200px',
		cols,
		auto = 'fit',
		gap = 'md',
		align,
		justify,
		style,
		class: className,
		children
	}: Props = $props();

	const gapValue = $derived(
		typeof gap === 'string' && gap in gapMap ? gapMap[gap as GapSize] : (gap as string)
	);

	const columns = $derived(
		cols ? `repeat(${cols}, minmax(0, 1fr))` : `repeat(auto-${auto}, minmax(${min}, 1fr))`
	);
</script>

<div
	class={['grid', className].filter(Boolean).join(' ')}
	style:gap={gapValue}
	style:grid-template-columns={columns}
	style:align-items={resolveAlign(align)}
	style:justify-content={resolveJustify(justify)}
	{style}
>
	{@render children()}
</div>

<style>
	.grid {
		display: grid;
		min-width: 0;
	}
</style>
