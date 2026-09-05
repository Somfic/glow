<script lang="ts" module>
	export type AnimatedNumberMode = 'tween' | 'odometer';

	/** Either an `Intl.NumberFormat` — reused across frames, and the only form
	 *  that carries enough structure for `odometer` — or a plain function. */
	export type AnimatedNumberFormat = Intl.NumberFormat | ((value: number) => string);

	export type AnimatedNumberAlign = 'start' | 'center' | 'end';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		/** The number to show. Changing it animates from wherever the display
		 *  currently is, not from the previous target. */
		value: number;
		/** Milliseconds for a full run. Deliberately longer than any
		 *  `--glow-dur-*`: those top out at 500ms for a page-level reveal, and a
		 *  counter has to stay readable while it climbs. */
		duration?: number;
		easing?: (t: number) => number;
		/** An `Intl.NumberFormat` (preferred) or `(value) => string`. Default is
		 *  an `Intl.NumberFormat` pinned to the number of decimals `value` itself
		 *  has, so the decimal places don't flicker between frames. */
		format?: AnimatedNumberFormat;
		/** `tween` re-formats the whole number each frame; `odometer` rolls each
		 *  digit on its own wheel. */
		mode?: AnimatedNumberMode;
		/** Locale for the default formatter. Pass one if server and client
		 *  disagree about the ambient locale. */
		locale?: string;
		/** Where the number sits in its reserved box, which is as wide as the
		 *  widest of the last two values. */
		align?: AnimatedNumberAlign;
		/** Announce the settled value. Off by default: a number that ticks on a
		 *  dashboard is not worth interrupting anyone for. */
		live?: boolean;
		class?: string;
		style?: string;
	}

	let {
		value,
		duration = 800,
		easing = cubicOut,
		format,
		mode = 'tween',
		locale,
		align = 'start',
		live = false,
		class: className,
		style
	}: Props = $props();

	// The duration tokens are CSS, and this animation is driven from JS, so the
	// `prefers-reduced-motion` collapse that `global.scss` does for the rest of
	// the library can't reach it. Honour the query directly instead — and snap,
	// rather than run fast: the animation here is pure decoration and the number
	// is the whole content.
	let reduced = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (reduced = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function decimalsOf(n: number): number {
		if (!Number.isFinite(n)) return 0;
		const s = String(n);
		// Exponential notation has no fraction digits to count off the string;
		// four is as far as a counter is worth reading anyway.
		if (s.includes('e') || s.includes('E')) return 0;
		const dot = s.indexOf('.');
		return dot === -1 ? 0 : Math.min(s.length - dot - 1, 4);
	}

	// Min and max are the same on purpose: it pins the fraction digit count to
	// the target's, so tweening 4 → 4.5 doesn't grow a decimal place mid-flight
	// and 999 → 1000 stays whole all the way.
	let fallbackFormat = $derived.by(() => {
		const digits = decimalsOf(value);
		return new Intl.NumberFormat(locale, {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
	});

	let intl = $derived(typeof format === 'function' ? undefined : (format ?? fallbackFormat));
	let toText = $derived.by(() => {
		const nf = intl;
		return typeof format === 'function' ? format : (n: number) => nf!.format(n);
	});

	// Every `set()` below passes its own options, so the constructor's are only
	// ever the starting point. `untrack` because these are the initial values on
	// purpose — the component mounts showing its number, it doesn't count up to
	// it from nowhere.
	const tween = untrack(() => new Tween(value, { duration, easing }));

	// Where the current run started: the tween's own value at the moment the
	// target changed, which is what makes an interruption continue from the
	// number on screen instead of snapping back.
	let anchorValue = $state(untrack(() => value));
	let anchorOffsets = $state(new Map<number, number>());
	// The value the box was sized against before this run, so it can hold the
	// wider of the two and never reflow mid-count.
	let priorText = $state('');

	// A non-reactive mirror of what is painted right now. Read (never tracked)
	// when a new target lands, one frame behind, which is exactly the frame the
	// interruption has to continue from.
	let painted = { text: '', offsets: new Map<number, number>() };

	$effect(() => {
		const next = value;
		const dur = reduced ? 0 : duration;
		untrack(() => {
			anchorValue = tween.current;
			anchorOffsets = new Map(painted.offsets);
			priorText = painted.text;
		});
		tween.set(next, { duration: dur, easing });
	});

	let targetText = $derived(toText(value));
	let currentText = $derived(toText(tween.current));

	/** 0 → 1 across the current run; the digit wheels ride this rather than the
	 *  raw value, so a jump of 1200 spins each wheel once instead of 120 times. */
	let progress = $derived.by(() => {
		const span = tween.target - anchorValue;
		if (span === 0) return 1;
		const t = (tween.current - anchorValue) / span;
		return t < 0 ? 0 : t > 1 ? 1 : t;
	});

	type Cell =
		| { kind: 'digit'; place: number; digit: number }
		| { kind: 'literal'; text: string };

	// Odometer takes its shape from the *target*, not from the frame: the
	// separators and decimals of "1,000" are on screen from the first frame of
	// 999 → 1000, so nothing pops in half way through. It needs `formatToParts`
	// to know which digit sits in which place, so a function `format` — which
	// hands back an opaque string — quietly falls back to `tween`.
	let cells = $derived.by<Cell[]>(() => {
		if (mode !== 'odometer' || !intl || !Number.isFinite(value)) return [];
		const parts = intl.formatToParts(value);
		const integerDigits = parts
			.filter((p) => p.type === 'integer')
			.reduce((n, p) => n + p.value.length, 0);
		const out: Cell[] = [];
		let seenInteger = 0;
		let seenFraction = 0;
		for (const part of parts) {
			if (part.type === 'integer' || part.type === 'fraction') {
				// A locale on a non-latin numbering system would need its own
				// digit strip; give up and let `tween` handle it.
				if (!/^[0-9]+$/.test(part.value)) return [];
				for (const ch of part.value) {
					const place =
						part.type === 'integer'
							? Math.pow(10, integerDigits - 1 - seenInteger++)
							: Math.pow(10, -++seenFraction);
					out.push({ kind: 'digit', place, digit: Number(ch) });
				}
			} else {
				out.push({ kind: 'literal', text: part.value });
			}
		}
		return out;
	});

	let odometer = $derived(cells.length > 0);

	function digitAt(n: number, place: number): number {
		// The epsilon absorbs the float error in 3.14 / 0.01, which lands on
		// 313.99999999999994 and would otherwise floor to the wrong digit.
		return Math.floor(Math.abs(n) / place + 1e-9) % 10;
	}

	/** How far a wheel still is from its target, in digit heights, signed: `0`
	 *  is arrived, `2.5` is two and a half digits short of it.
	 *
	 *  Measuring the distance *to* the target rather than the absolute position
	 *  on a 0-9 strip is what keeps the settled number on one baseline. A line
	 *  box of `1.2em` is a fractional number of device pixels at most font
	 *  sizes, so a strip translated by its own digit parks every wheel on a
	 *  different subpixel offset — five digits, five baselines, re-scrambled on
	 *  every value change. Here the target glyph is the strip's own in-flow
	 *  cell, so at rest the transform is exactly `translateY(0)` whatever the
	 *  font size, zoom or device pixel ratio. */
	let distances = $derived(
		cells.map((cell) => {
			if (cell.kind !== 'digit') return 0;
			const from = anchorOffsets.get(cell.place) ?? digitAt(anchorValue, cell.place);
			let to = cell.digit;
			// Carry the wheel the way the number is going, so 9 → 0 on a rising
			// count rolls forward through the wrap rather than spinning back
			// through 8, 7, 6.
			if (value > anchorValue && to < from) to += 10;
			else if (value < anchorValue && to > from) to -= 10;
			return (from - to) * (1 - progress);
		})
	);

	$effect(() => {
		const offsets = new Map<number, number>();
		cells.forEach((cell, i) => {
			// The mirror keeps absolute wheel positions, 0-10, because that is
			// what an interrupted run has to measure its next distance from.
			if (cell.kind === 'digit') offsets.set(cell.place, (cell.digit + distances[i] + 20) % 10);
		});
		painted = { text: targetText, offsets };
	});

	// The neighbours of the in-flow target glyph, hung above and below it. The
	// carry above bounds a wheel's travel at ten digits, and ±10 is exactly
	// that, so the strip always has a real cell under the window — including at
	// both ends, where the target glyph repeats and a wrap is invisible.
	const neighbours = Array.from({ length: 21 }, (_, i) => i - 10).filter((k) => k !== 0);
</script>

<span
	class={['animated-number', `align-${align}`, className].filter(Boolean).join(' ')}
	{style}
>
	<span class="value" aria-hidden="true">
		{#if odometer}
			{#each cells as cell, i (i)}
				{#if cell.kind === 'digit'}
					<span class="digit">
						<span class="strip" style="--distance: {distances[i]}"
							><span class="glyph">{cell.digit}</span
							>{#each neighbours as k (k)}<span
									class="glyph neighbour"
									style="--k: {k}">{(cell.digit + k + 10) % 10}</span
								>{/each}</span
						>
					</span>
				{:else}
					<span class="literal">{cell.text}</span>
				{/if}
			{/each}
		{:else}
			{currentText}
		{/if}
	</span>

	<!-- Sizing ghosts: the box is as wide as the widest of the value it is
	     leaving and the one it is heading for, so the page never reflows around a
	     number while it counts. Both are laid on the same grid cell, so the
	     column takes their real rendered width rather than a guess at it. -->
	<span class="ghost" aria-hidden="true">{targetText}</span>
	<span class="ghost" aria-hidden="true">{priorText}</span>

	<!-- The animated digits are decoration. This is the value, written once per
	     change rather than once per frame, so a screen reader reads a number
	     instead of a stream of them. -->
	<span class="sr-only" aria-live={live ? 'polite' : 'off'}>{targetText}</span>
</span>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.animated-number {
		// One row, one column, everything stacked in it: the ghosts reserve the
		// width without taking any layout of their own.
		display: inline-grid;
		grid-template-areas: 'n';
		// Only so the visually-hidden readout below anchors here rather than on
		// whatever distant ancestor happens to be positioned.
		position: relative;
		line-height: 1.2;
		// Without this, every frame re-lays-out the number as the glyph widths
		// change, and the digits visibly shuffle sideways while it counts.
		font-variant-numeric: tabular-nums;
		color: $text-primary;

		--an-line: 1.2em;
	}

	.align-start {
		justify-items: start;
	}
	.align-center {
		justify-items: center;
	}
	.align-end {
		justify-items: end;
	}

	.value,
	.ghost {
		grid-area: n;
		white-space: nowrap;
	}

	.ghost {
		visibility: hidden;
		pointer-events: none;
	}

	.value {
		display: inline-flex;
		align-items: flex-start;
		// A digit wheel carries all ten glyphs, so selecting across one would
		// copy "0123456789…". Selection falls through to the hidden readout
		// below, which is the settled number.
		user-select: none;
	}

	.digit {
		display: inline-block;
		overflow: hidden;
		height: var(--an-line);
		// Tabular figures are all one advance wide, so a column of them is
		// exactly `1ch` and the ghosts above measure the same.
		width: 1ch;
	}

	.strip {
		display: block;
		position: relative;
		// `--distance` is zero once the wheel arrives, so a settled number is
		// untransformed and every digit lands on the same device pixel row.
		transform: translateY(calc(var(--distance) * var(--an-line) * -1));
	}

	.neighbour {
		position: absolute;
		inset-inline: 0;
		top: calc(var(--k) * var(--an-line));
	}

	.glyph,
	.literal {
		display: block;
		height: var(--an-line);
		line-height: var(--an-line);
	}

	.glyph {
		text-align: center;
	}

	.literal {
		// Same box and line-height as a digit cell, which is what puts a group
		// separator's baseline on the digits' baseline rather than near it.
		white-space: pre;
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
		user-select: text;
	}
</style>
