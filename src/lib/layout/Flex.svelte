<script lang="ts" module>
	export type GapSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
	export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
	export type FlexDirection = 'horizontal' | 'vertical';

	export const gapMap: Record<GapSize, string> = {
		none: '0',
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem'
	};

	const alignMap: Record<Align, string> = {
		start: 'flex-start',
		center: 'center',
		end: 'flex-end',
		stretch: 'stretch',
		baseline: 'baseline'
	};

	const justifyMap: Record<Justify, string> = {
		start: 'flex-start',
		center: 'center',
		end: 'flex-end',
		between: 'space-between',
		around: 'space-around',
		evenly: 'space-evenly'
	};

	export function resolveAlign(a?: Align) {
		return a ? alignMap[a] : undefined;
	}
	export function resolveJustify(j?: Justify) {
		return j ? justifyMap[j] : undefined;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		direction = 'vertical',
		gap = 'md',
		align,
		justify,
		wrap = false,
		style,
		class: className,
		children
	}: {
		/** Lay children out along which axis. `vertical` (default) stacks top→bottom; `horizontal` lines them up left→right. */
		direction?: FlexDirection;
		gap?: GapSize | string;
		align?: Align;
		justify?: Justify;
		wrap?: boolean;
		style?: string;
		class?: string;
		children: Snippet;
	} = $props();

	const gapValue = $derived(
		typeof gap === 'string' && gap in gapMap ? gapMap[gap as GapSize] : (gap as string)
	);
	const flexDirection = $derived(direction === 'horizontal' ? 'row' : 'column');
</script>

<div
	class={['flex', className].filter(Boolean).join(' ')}
	style:flex-direction={flexDirection}
	style:gap={gapValue}
	style:align-items={resolveAlign(align)}
	style:justify-content={resolveJustify(justify)}
	style:flex-wrap={wrap ? 'wrap' : undefined}
	{style}
>
	{@render children()}
</div>

<style>
	.flex {
		display: flex;
		min-width: 0;
	}
</style>
