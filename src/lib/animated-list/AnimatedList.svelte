<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** How a row that is added or removed comes and goes. A move is always a slide. */
	export type AnimatedListEffect = 'fade' | 'slide' | 'scale' | 'none';

	export type AnimatedListDirection = 'vertical' | 'horizontal';

	export interface AnimatedListProps<T> {
		/** The list, in the order it should be drawn. Sorting and filtering happen outside. */
		items: T[];
		/**
		 * Stable identity per item. Required, and deliberately not handed the index:
		 * a keyed `{#each}` keyed by position has a different item under the same key
		 * after a reorder, so nothing moves and the animation silently does nothing.
		 * Return the id you would store in a database, not a position.
		 */
		key: (item: T) => string | number;
		/** Row body. Receives the item and its current index. */
		children: Snippet<[T, number]>;
		/** Rendered instead of the rows while `items` is empty. */
		empty?: Snippet;
		/**
		 * Milliseconds for a move, an enter and an exit. A number rather than a
		 * `--glow-dur-*` token because `animate:flip` takes one — see the reduced
		 * motion note in the component. Defaults to the value of `--glow-dur-slow`.
		 */
		duration?: number;
		effect?: AnimatedListEffect;
		direction?: AnimatedListDirection;
		/** Space between rows, as any CSS length. */
		gap?: string;
		/** The container element. `ul`/`ol` wrap each row in an `li`. */
		as?: 'ul' | 'ol' | 'div';
		/** Accessible name for the list. */
		label?: string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts" generics="T">
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

	let {
		items,
		key,
		children,
		empty,
		duration = 320,
		// Aliased: a local called `effect` makes the compiler read `$effect` as a
		// store subscription on it, and the component dies on the server.
		effect: appearance = 'fade',
		direction = 'vertical',
		gap = '0.5rem',
		as = 'ul',
		label,
		class: className,
		style
	}: AnimatedListProps<T> = $props();

	// `animate:flip` and Svelte's transitions take a number of milliseconds, so
	// neither ever sees the media query that collapses every `--glow-dur-*` to 1ms.
	// Reduced motion has to be read here, in JS, or the component quietly opts
	// itself out of it: the one case in this library where a token is not enough.
	let reduced = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reduced = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	// Zero rather than 1ms: a 1ms flip still schedules a frame that paints the row
	// at its old position, which reads as a flicker instead of the asked-for snap.
	const ms = $derived(reduced ? 0 : duration);

	const rowTag = $derived(as === 'div' ? 'div' : 'li');

	/** How far an entering or leaving row travels, along the list's own axis. */
	const distance = 10;

	function offset(u: number): string {
		const d = distance * u;
		return direction === 'horizontal' ? `translateX(${d}px)` : `translateY(${d}px)`;
	}

	function shape(u: number): string {
		if (appearance === 'slide') return offset(u);
		if (appearance === 'scale') return `scale(${1 - 0.08 * u})`;
		return '';
	}

	/**
	 * One config for both `in:` and `out:`, so a row leaves the way it arrived.
	 * Written by hand rather than composed from `fly`/`scale` for the transform
	 * below, which those cannot express.
	 */
	function motion(node: HTMLElement) {
		if (appearance === 'none' || ms === 0) return { duration: 0 };
		// Before a leaving row's outro runs, Svelte pins it out of the flow with
		// `position: absolute` and an inline `transform` — that is what lets the
		// rows below start sliding up immediately instead of snapping once the fade
		// has finished. Compose with whatever transform is already there rather
		// than overwriting it, or a leaving row jumps before it fades.
		const pinned = node.style.transform;
		return {
			duration: ms,
			easing: cubicOut,
			css: (t: number, u: number) => `opacity: ${t}; transform: ${pinned} ${shape(u)};`
		};
	}
</script>

<svelte:element
	this={as}
	class={['animated-list', className].filter(Boolean).join(' ')}
	data-direction={direction}
	role={as === 'div' ? 'list' : undefined}
	aria-label={label}
	style="--animated-list-gap: {gap}; {style ?? ''}"
>
	{#if items.length === 0 && empty}
		<svelte:element this={rowTag} class="row" role={as === 'div' ? 'listitem' : undefined}>
			{@render empty()}
		</svelte:element>
	{:else}
		{#each items as item, i (key(item))}
			<svelte:element
				this={rowTag}
				class="row"
				role={as === 'div' ? 'listitem' : undefined}
				animate:flip={{ duration: ms, easing: cubicOut }}
				in:motion
				out:motion
			>
				{@render children(item, i)}
			</svelte:element>
		{/each}
	{/if}
</svelte:element>

<style lang="scss">
	.animated-list {
		// Positioned, because a leaving row is taken out of the flow with
		// `position: absolute` and has to land inside this list rather than against
		// whatever ancestor happens to be positioned.
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--animated-list-gap);
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
	}

	.animated-list[data-direction='horizontal'] {
		flex-direction: row;
		flex-wrap: wrap;
		width: auto;
	}

	.row {
		min-width: 0;
	}
</style>
