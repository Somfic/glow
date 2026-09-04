<script lang="ts">
	type Props = {
		/** Width — number → px, string → as-is. */
		width?: number | string;
		/** Height — number → px, string → as-is. */
		height?: number | string;
		/** Shape preset. `text` uses a thinner default height + 4px radius;
		 *  `circle` forces width = height + circular radius. `rect` is the
		 *  generic block. */
		shape?: 'rect' | 'text' | 'circle';
		/** Number of stacked rows to render. Useful for skeleton paragraphs / lists. */
		count?: number;
		class?: string;
		style?: string;
	};

	let {
		width,
		height,
		shape = 'rect',
		count = 1,
		class: className,
		style
	}: Props = $props();

	function size(v: number | string | undefined, fallback: string): string {
		if (v == null) return fallback;
		return typeof v === 'number' ? `${v}px` : v;
	}

	const w = $derived(size(width, '100%'));
	const h = $derived(
		shape === 'circle' ? w : size(height, shape === 'text' ? '0.9em' : '1rem')
	);
	const radius = $derived(
		shape === 'circle' ? '50%' : shape === 'text' ? '4px' : '6px'
	);
</script>

{#if count === 1}
	<span
		class={['skeleton', className].filter(Boolean).join(' ')}
		style="width: {w}; height: {h}; border-radius: {radius};{style ? ` ${style}` : ''}"
		aria-hidden="true"
	></span>
{:else}
	<span class={['skeleton-group', className].filter(Boolean).join(' ')} {style} aria-hidden="true">
		{#each Array(count) as _, i (i)}
			<span
				class="skeleton"
				style="width: {w}; height: {h}; border-radius: {radius};"
			></span>
		{/each}
	</span>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.skeleton {
		display: block;
		background: linear-gradient(
			90deg,
			color-mix(in oklab, var(--glow-fg) 6%, transparent) 0%,
			color-mix(in oklab, var(--glow-fg) 14%, transparent) 50%,
			color-mix(in oklab, var(--glow-fg) 6%, transparent) 100%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.4s ease-in-out infinite;
	}

	.skeleton-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@keyframes skeleton-shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
			background: color-mix(in oklab, var(--glow-fg) 10%, transparent);
		}
	}
</style>
