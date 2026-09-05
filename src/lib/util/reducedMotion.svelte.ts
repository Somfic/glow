/**
 * `prefers-reduced-motion`, as a reactive value plus a duration helper.
 *
 * `global.scss` collapses every `--glow-dur-*` token to 1ms under the query,
 * which covers every CSS transition in the library. It cannot reach motion
 * that is driven from JS — a Svelte `transition:` whose duration is a number,
 * a `Tween`, a smooth scroll — because none of those read a CSS token. Those
 * have to ask the query themselves, and this is the one place that asks.
 *
 * Call it once during component init; the change listener tears down with the
 * component.
 *
 * ```svelte
 * const motion = reducedMotion();
 * <div transition:fade={{ duration: motion.ms(200) }}>
 * ```
 */
export interface ReducedMotion {
	/** Whether the user has asked for reduced motion. */
	readonly current: boolean;
	/**
	 * `ms` normally, `0` when reduced motion is asked for. Zero rather than the
	 * tokens' 1ms: a 1ms transition still paints one frame at the old position,
	 * which reads as a flicker instead of the snap that was wanted.
	 */
	ms(ms: number): number;
}

export function reducedMotion(): ReducedMotion {
	// Read synchronously rather than waiting for the effect: a component that
	// mounts already open runs its intro transition before the first effect
	// flush, and that transition has to see the real answer. SSR has no
	// matchMedia, and `false` is the safe guess there — durations never reach
	// the markup, so there is nothing for hydration to disagree about.
	let current = $state(
		typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	);

	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		current = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (current = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	return {
		get current() {
			return current;
		},
		ms: (ms: number) => (current ? 0 : ms)
	};
}
