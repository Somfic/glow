<script lang="ts" module>
	import type {
		AnimatedNumberAlign,
		AnimatedNumberFormat,
		AnimatedNumberMode
	} from '../animated-number/AnimatedNumber.svelte';

	export type AnimatedValueProps = {
		/**
		 * A number counts to its new value; a string crossfades to it. The split
		 * is on the runtime type, so a figure that is sometimes `'—'` and
		 * sometimes `42` needs no branch at the call site.
		 */
		value: string | number;
		/** Milliseconds for a change. Shared by both paths, so a number and a
		 *  string sitting side by side settle together. */
		duration?: number;
		class?: string;
		style?: string;

		// ── Numbers only. Ignored for a string value, which has no digits to
		// format, pad or roll. ──────────────────────────────────────────────
		format?: AnimatedNumberFormat;
		mode?: AnimatedNumberMode;
		pad?: number;
		locale?: string;
		align?: AnimatedNumberAlign;
		live?: boolean;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import AnimatedNumber from '../animated-number/AnimatedNumber.svelte';

	let {
		value,
		duration = 800,
		format,
		mode = 'tween',
		pad,
		locale,
		align = 'start',
		live = false,
		class: className,
		style
	}: AnimatedValueProps = $props();

	// A change counter rather than the value itself as the key, so the first
	// render is un-keyed and therefore still. `AnimatedNumber` makes the same
	// promise — it mounts showing its number rather than counting up to it — and
	// a string that faded itself in on load would break it for half the inputs.
	let changes = $state(0);
	let seen: string | number | undefined;

	// The width has to be animated off a measured pixel value: `width: auto` is
	// not an interpolable length, so a box left to size itself steps between the
	// old content and the new. `AnimatedNumber` already refuses to reflow *during*
	// a count by reserving the wider of the two values, but that reservation
	// itself lands in one frame — and a string swap has no such reservation at
	// all. Measuring the content and easing the box to it covers both, and is the
	// only thing here that needs a layout read.
	let inner: HTMLElement | undefined = $state();
	let width = $state<number | undefined>(undefined);
	// Until a first measurement is in there is no width to ease *from*, so the
	// opening frame is applied bare — otherwise every value on the page unfurls
	// from zero on load, which is the mount animation this component exists to
	// avoid.
	let measured = $state(false);

	$effect(() => {
		if (!inner) return;
		const ro = new ResizeObserver(([entry]) => {
			const next = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
			if (next > 0) {
				width = next;
				measured = true;
			}
		});
		ro.observe(inner);
		return () => ro.disconnect();
	});
	$effect(() => {
		const next = value;
		untrack(() => {
			if (seen !== undefined && seen !== next) changes++;
			seen = next;
		});
	});
</script>

<span
	class={['animated-value', className].filter(Boolean).join(' ')}
	class:measured
	style="--av-scale: {duration / 800}; {measured && width !== undefined
		? `width: ${width}px;`
		: ''} {style ?? ''}"
>
	<span class="inner" bind:this={inner}>
		{#if typeof value === 'number'}
			<AnimatedNumber {value} {duration} {format} {mode} {pad} {locale} {align} {live} />
		{:else}
			<!-- Keyed so the outgoing text is torn down and the incoming one animates.
			     The class is what actually runs it, and it stays off until a change
			     has happened — which is what keeps the first paint still. -->
			{#key changes}
				<span class="swap" class:animating={changes > 0}>{value}</span>
			{/key}
			<!-- Written once per change rather than once per frame, and the only copy
			     a screen reader is offered when `live` is on. -->
			<span class="sr-only" aria-live={live ? 'polite' : 'off'}>{value}</span>
		{/if}
	</span>
</span>

<style lang="scss">
	.animated-value {
		display: inline-block;
		position: relative;
		vertical-align: bottom;
		// Both paths have to occupy the same box, or a tile's height depends on
		// whether its value happens to be a number this render — which is exactly
		// the branch this component exists to hide. 1.2 and not `inherit`: the
		// number path cannot follow, because `AnimatedNumber` sizes its digit
		// wheels off `--an-line: 1.2em` and that geometry is load-bearing. So the
		// string path matches the number, rather than the other way round.
		line-height: 1.2;
		// `clip` and not `hidden`: `hidden` would establish a scroll container and
		// crop the swap's vertical travel, while `clip` on one axis leaves the
		// other genuinely visible.
		overflow-x: clip;
		overflow-y: visible;
	}

	// Only once a width has been measured — the first frame is applied bare, so
	// nothing unfurls from zero on load.
	.measured {
		transition: width calc(var(--glow-dur-base) * var(--av-scale, 1)) var(--glow-ease-out);
	}

	.inner {
		display: inline-block;
		white-space: nowrap;
	}

	.swap {
		display: inline-block;
	}

	// A CSS animation rather than a Svelte transition: `prefers-reduced-motion`
	// is collapsed in `global.scss` through the `--glow-dur-*` tokens, and a
	// JS-driven transition sails straight past that. `duration` arrives as a
	// multiplier of the token rather than as a length of its own, so a collapsed
	// token still collapses this — scaling zero leaves zero.
	.animating {
		animation: animated-value-swap calc(var(--glow-dur-base) * var(--av-scale, 1))
			var(--glow-ease-out);
	}

	@keyframes animated-value-swap {
		from {
			opacity: 0;
			transform: translateY(0.25em);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
