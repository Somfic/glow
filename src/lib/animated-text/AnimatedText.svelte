<script lang="ts" module>
	export type AnimatedTextGranularity = 'character' | 'word' | 'line';

	/** Units per second, per granularity. A character reveal has to run several
	 *  times faster than a word reveal to feel like the same speed of writing,
	 *  so one shared default would be wrong for two of the three modes. These
	 *  land near the cadence of a model streaming tokens: fast enough not to
	 *  make anyone wait, slow enough that the reveal is the point. */
	const DEFAULT_SPEED: Record<AnimatedTextGranularity, number> = {
		character: 55,
		word: 13,
		line: 3.5
	};

	const grapheme =
		typeof Intl !== 'undefined' && 'Segmenter' in Intl
			? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
			: undefined;

	/** Split into reveal units. Joining them back is exactly the input, with no
	 *  separator of any kind — the component renders nothing else between them,
	 *  and the tests check the rendered fragments still spell the source. */
	export function splitText(text: string, granularity: AnimatedTextGranularity): string[] {
		if (text === '') return [];
		if (granularity === 'character') {
			// `Array.from` splits surrogate pairs correctly but still cuts an
			// emoji ZWJ sequence or a combining accent in half, which reveals as
			// a visibly broken glyph. `Intl.Segmenter` is the only thing that
			// gets those right; it is missing on older Safari, hence the fallback.
			return grapheme ? [...grapheme.segment(text)].map((s) => s.segment) : Array.from(text);
		}
		const parts = text.split(granularity === 'word' ? /(\s+)/ : /(\n)/);
		const out: string[] = [];
		let pending = '';
		for (const part of parts) {
			if (part === '') continue;
			// Whitespace joins the unit *after* it rather than becoming a unit of
			// its own — a tick spent revealing an invisible space is a stutter in
			// the cadence — and after rather than before so the caret ends up
			// against the last letter written, the way a text cursor does, not a
			// space out from it.
			if (/^\s+$/.test(part)) pending += part;
			else {
				out.push(pending + part);
				pending = '';
			}
		}
		// Trailing whitespace has no unit to lead, so it rides on the last one.
		if (pending !== '') {
			if (out.length > 0) out[out.length - 1] += pending;
			else out.push(pending);
		}
		return out;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		/** The text to reveal. Changing it mid-reveal keeps whatever the two
		 *  strings share and carries on — see the note on `revealed` below. */
		text: string;
		/** What counts as one step. `word` by default: a character reveal of a
		 *  long paragraph is one span per glyph, which is a lot of DOM for a
		 *  difference most readers will not notice past the first line. */
		granularity?: AnimatedTextGranularity;
		/** Units per second. Defaults per granularity — 55 characters, 13 words,
		 *  3.5 lines. */
		speed?: number;
		/** Pause and resume where it stands. Bindable, so a control can read the
		 *  state back after `loop` or `oncomplete` has moved it. */
		playing?: boolean;
		/** Replay from the start once the text has been fully revealed. */
		loop?: boolean;
		/** Milliseconds the full text is held before a `loop` replays it. */
		loopDelay?: number;
		/** Milliseconds before the first unit appears. Only ever applies to a
		 *  reveal that starts from nothing, not to one resuming after a change. */
		delay?: number;
		/** A blinking caret at the reveal head. Disappears when the text is
		 *  complete, and is never rendered under reduced motion. */
		cursor?: boolean;
		/** Announce the finished text with `aria-live="polite"`. Off by default:
		 *  the text is in the accessibility tree from the first frame, so a
		 *  screen reader already has it and does not need interrupting. */
		live?: boolean;
		/** Fired the moment the last unit lands, once per run. */
		oncomplete?: () => void;
		class?: string;
		style?: string;
	}

	let {
		text,
		granularity = 'word',
		speed,
		playing = $bindable(true),
		loop = false,
		loopDelay = 1200,
		delay = 0,
		cursor = true,
		live = false,
		oncomplete,
		class: className,
		style
	}: Props = $props();

	// The duration tokens are CSS and this animation is driven from JS, so the
	// `prefers-reduced-motion` collapse `global.scss` does for the rest of the
	// library cannot reach it. Honour the query directly — and show everything
	// at once rather than revealing fast: the reveal is decoration, the text is
	// the whole content.
	let reduced = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (reduced = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	let units = $derived(splitText(text, granularity));
	let rate = $derived(speed ?? DEFAULT_SPEED[granularity]);

	/** How many units are visible. Always a prefix count, never a set of
	 *  indices, which is what makes "no character is dropped or duplicated" a
	 *  property of the data structure rather than something to test for. */
	let revealed = $state(0);

	// A new `text` is the streaming case: the string usually grows by a word or
	// two and everything already on screen is still correct, so the reveal has to
	// continue rather than restart.
	//
	// The clamp is in characters, not units, and that is the load-bearing part: a
	// stream's last unit is unstable, because "because " becomes "because" the
	// moment a word lands after it. Comparing unit by unit reads that as a
	// divergence and rewinds a word on every single chunk. Comparing the painted
	// *characters* sees it for what it is — the same text, split one notch
	// differently — so an append keeps everything on screen, a change of
	// `granularity` mid-flight keeps its place too, and a wholesale replacement
	// still rewinds to exactly where the two strings part company.
	let previous: string[] = [];
	$effect(() => {
		const next = units;
		untrack(() => {
			const painted = previous.slice(0, revealed).join('');
			const whole = next.join('');
			let shared = 0;
			while (shared < painted.length && whole[shared] === painted[shared]) shared++;
			let count = 0;
			let len = 0;
			// Whole units only: half a revealed word is a fragment nobody asked for.
			for (const unit of next) {
				if (len + unit.length > shared) break;
				len += unit.length;
				count++;
			}
			revealed = count;
			previous = next;
		});
	});

	$effect(() => {
		if (reduced || !playing) return;
		const total = units.length;
		const step = 1000 / (rate > 0 ? rate : 1);
		let acc = untrack(() => (revealed === 0 ? -delay : 0));
		let hold = 0;
		let last = performance.now();
		let frame = requestAnimationFrame(function tick(now) {
			frame = requestAnimationFrame(tick);
			// A backgrounded tab hands back one enormous delta on return, which
			// would dump the rest of the paragraph in a single frame. Clamping
			// resumes the reveal instead of ending it.
			const dt = Math.min(now - last, 250);
			last = now;
			untrack(() => {
				if (revealed >= total) {
					if (!loop || total === 0) return;
					if (hold === 0) hold = now + loopDelay;
					else if (now >= hold) {
						hold = 0;
						acc = 0;
						revealed = 0;
					}
					return;
				}
				acc += dt;
				if (acc < step) return;
				const n = Math.floor(acc / step);
				acc -= n * step;
				revealed = Math.min(total, revealed + n);
			});
		});
		return () => cancelAnimationFrame(frame);
	});

	// Reduced motion shows everything, and does it here rather than by driving
	// `revealed` to the end: as a derivation it survives a `restart()` and a new
	// `text`, where an effect would need re-running for each and would leave the
	// text blank if it missed one.
	let shown = $derived(reduced ? units.length : revealed);
	let complete = $derived(units.length > 0 && shown >= units.length);

	let announced = false;
	$effect(() => {
		if (!complete) {
			announced = false;
			return;
		}
		if (announced) return;
		announced = true;
		oncomplete?.();
	});

	// Under reduced motion the caret would either blink at the collapsed 1ms
	// token — a strobe, worse than the thing it was suppressing — or sit there
	// as a static bar next to text that is already complete. Neither is worth
	// rendering, so it simply isn't.
	let showCaret = $derived(cursor && !reduced && !complete);

	/** Restart from nothing. Handed out as an instance method so a docs page or
	 *  a consumer can replay without having to blank `text` and put it back,
	 *  which would flash the layout. */
	export function restart() {
		revealed = 0;
		playing = true;
	}
</script>

<span
	class={['animated-text', className].filter(Boolean).join(' ')}
	{style}
	data-complete={complete}
>
	<!-- Every unit is in the DOM from the first frame; the unrevealed ones are
	     transparent rather than absent. That is what holds the box still: the
	     line breaks are decided once, against the whole string, so nothing below
	     the text moves as words arrive and a mid-sentence reveal cannot reflow
	     the page. It also means a drag-select gets the real text, which
	     `visibility: hidden` or a shorter substring would not give.

	     The fragments are hidden from assistive tech; the second span carries the
	     whole string, complete from the first frame, so a screen reader reads one
	     sentence rather than a pile of one-word nodes and never has to wait for
	     an animation to finish.

	     One unbroken line on purpose: with `pre-wrap` in force, any whitespace
	     Svelte leaves between these spans is a real space in the middle of the
	     text. -->
	<!-- prettier-ignore -->
	<span class="body" aria-hidden="true">{#if showCaret && shown === 0}<span class="caret"></span>{/if}{#each units as unit, i (i)}<span class="unit" class:on={i < shown}>{unit}</span>{#if showCaret && i === shown - 1}<span class="caret"></span>{/if}{/each}</span><span class="sr-only" aria-live={live ? 'polite' : 'off'}>{text}</span>
</span>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.animated-text {
		// Newlines in the source have to survive for `granularity="line"` to
		// mean anything, and `pre-wrap` still wraps long lines normally.
		white-space: pre-wrap;
		color: $text-primary;
		// Only so the visually-hidden string below anchors here rather than on
		// whatever distant ancestor happens to be positioned.
		position: relative;
	}

	// Left `inline`, deliberately: an `inline-block` unit would add a line-break
	// opportunity between any two characters in `granularity="character"`, so a
	// word could split down the middle. An inline span adds none, which leaves
	// the wrapping identical to the plain string's — and that is what the box
	// above is sized against.
	.unit {
		opacity: 0;
		transition: opacity var(--glow-dur-fast) var(--glow-ease-out);
	}

	.unit.on {
		opacity: 1;
	}

	.caret {
		// An empty *inline* element, deliberately: its box is the same font box
		// the text spans around it get, so `top: 0; bottom: 0` below puts the bar
		// on the text's own extents rather than on an em guess that lands half a
		// device pixel out. It contributes no width, so the caret cannot push the
		// text after it sideways as the head moves.
		position: relative;
		display: inline;
	}

	.caret::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		// Crisp at reading sizes and still proportionate on a heading: 0.07em is
		// under 2px below ~28px of text, where a fractional-width bar blurs.
		width: max(2px, 0.07em);
		border-radius: 1px;
		background: var(--glow-primary);
		// Written off a token rather than as a bare `1s` so the blink keeps step
		// with the rest of the library — but a loop cannot ride the reduced-motion
		// collapse the way a transition can: 1ms of this is a strobe. The media
		// query below drops the animation entirely instead.
		animation: caret-blink calc(var(--glow-dur-glacial) * 2) steps(1, end) infinite;
	}

	@keyframes caret-blink {
		0%,
		50% {
			opacity: 1;
		}
		50.01%,
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.caret::after {
			animation: none;
			opacity: 1;
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
		// The visible fragments are what a drag-select should pick up; letting
		// this one join in would copy the text twice.
		user-select: none;
	}
</style>
