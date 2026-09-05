<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import Popover from '../popover/Popover.svelte';
	import Skeleton from '../skeleton/Skeleton.svelte';
	import { portal, containsThrough } from '../util/portal.js';

	export type HoverCardStatus = 'idle' | 'loading' | 'ready' | 'error';

	interface Props {
		/** The thing being previewed — usually a link, an avatar, or a name. */
		trigger: Snippet;
		/** The preview itself. Rendered into a portal on `<body>` by Popover. */
		children: Snippet;
		/** Shown while `onOpen` is in flight. Defaults to a Skeleton stand-in. */
		loading?: Snippet;
		/** Shown when `onOpen` rejects. Defaults to a short retry-free message. */
		error?: Snippet<[unknown]>;
		open?: boolean;
		disabled?: boolean;
		/**
		 * Hover intent: how long the pointer must rest on the trigger. Deliberately
		 * far longer than the close delay — an eager open fires cards at everything
		 * the pointer crosses on its way somewhere else.
		 */
		openDelay?: number;
		/**
		 * Grace period after the pointer leaves. Short, because a card that lingers
		 * reads as stuck, but non-zero so the trip across the gap survives (see the
		 * bridge below) and so a pointer that clips the edge doesn't flicker it.
		 */
		closeDelay?: number;
		align?: 'left' | 'right' | 'stretch';
		/** Gap between trigger and card, in px. The bridge covers exactly this. */
		offset?: number;
		/** Card width — number → px, string → as-is. */
		width?: number | string;
		/**
		 * Loader, run only once hover intent is confirmed — never on the way past.
		 * A rejected promise renders the `error` snippet.
		 */
		onOpen?: () => unknown | Promise<unknown>;
		/** Re-run `onOpen` on every open instead of caching the first success. */
		refetch?: boolean;
		/**
		 * What a touch tap does. `'preview'` opens the card and swallows that first
		 * tap (so tapping a link previews it, and tapping again follows it);
		 * `'off'` leaves touch alone and the trigger behaves as if the card weren't
		 * there.
		 */
		touch?: 'preview' | 'off';
		class?: string;
	}

	let {
		trigger: triggerSnippet,
		children,
		loading,
		error,
		open = $bindable(false),
		disabled = false,
		openDelay = 500,
		closeDelay = 200,
		align = 'left',
		offset = 8,
		width = 300,
		onOpen,
		refetch = false,
		touch = 'preview',
		class: className = ''
	}: Props = $props();

	let triggerElement = $state<HTMLSpanElement>();
	let cardElement = $state<HTMLDivElement>();

	let status = $state<HoverCardStatus>('idle');
	let failure = $state<unknown>(undefined);

	// Which input opened the card. Keyboard focus is the only case a screen
	// reader user asked for it, and it's the only case we expose it to them.
	let source = $state<'pointer' | 'focus' | 'touch'>('pointer');

	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	// Stable per instance so the focused trigger can point at the card.
	const cardId = `glow-hover-card-${Math.random().toString(36).slice(2, 9)}`;

	const cardWidth = $derived(typeof width === 'number' ? `${width}px` : width);

	// `aria-describedby` has to sit on the element that actually takes focus —
	// the consumer's own link or button — not on our wrapper span, which no
	// screen reader will ever land on. So it is stamped on and off by hand.
	let describedElement: HTMLElement | undefined;

	function describe(el: HTMLElement) {
		describedElement = el;
		el.setAttribute('aria-describedby', cardId);
	}

	function undescribe() {
		describedElement?.removeAttribute('aria-describedby');
		describedElement = undefined;
	}

	$effect(() => {
		if (!open) undescribe();
	});

	function clearTimers() {
		clearTimeout(openTimer);
		clearTimeout(closeTimer);
		openTimer = undefined;
		closeTimer = undefined;
	}

	async function load() {
		if (!onOpen) return;
		if (status === 'ready' && !refetch) return;
		status = 'loading';
		failure = undefined;
		try {
			await onOpen();
			status = 'ready';
		} catch (e) {
			failure = e;
			status = 'error';
		}
	}

	function show(from: 'pointer' | 'focus' | 'touch') {
		clearTimers();
		source = from;
		open = true;
	}

	// The load hangs off `open` rather than off `show()` so that a consumer
	// binding `open` gets the same fetch-on-open a hover does. Untracked because
	// `load` reads and writes `status`, which would otherwise re-run this.
	let wasOpen = false;
	$effect(() => {
		const isOpen = open;
		untrack(() => {
			if (isOpen && !wasOpen) load();
			wasOpen = isOpen;
		});
	});

	function scheduleOpen(from: 'pointer' | 'focus') {
		if (disabled) return;
		clearTimeout(closeTimer);
		closeTimer = undefined;
		if (open || openTimer) return;
		// Focus has no "passing through" problem to defend against, so it opens
		// immediately; only the pointer pays the intent delay.
		if (from === 'focus') return show('focus');
		openTimer = setTimeout(() => {
			openTimer = undefined;
			show('pointer');
		}, openDelay);
	}

	function scheduleClose() {
		clearTimeout(openTimer);
		openTimer = undefined;
		if (!open) return;
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			closeTimer = undefined;
			open = false;
		}, closeDelay);
	}

	function closeNow() {
		clearTimers();
		open = false;
	}

	function onTriggerEnter(e: PointerEvent) {
		// Touch fires a synthetic pointerenter on tap and then never leaves, which
		// would strand the card open. Taps are handled in `onTriggerClick`.
		if (e.pointerType === 'touch') return;
		scheduleOpen('pointer');
	}

	function onTriggerFocus(e: FocusEvent) {
		// Only a keyboard focus should open it. A click on the trigger also focuses
		// it, and a card popping up under the pointer you just clicked with is
		// noise on top of whatever the click did.
		if (restoringFocus) return;
		const target = e.target as HTMLElement | null;
		if (!target?.matches?.(':focus-visible')) return;
		scheduleOpen('focus');
		if (open) describe(target);
	}

	function onTriggerBlur(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (next && cardElement && containsThrough(cardElement, next)) return;
		closeNow();
	}

	function onTriggerClick(e: MouseEvent) {
		if (source !== 'touch' || touch === 'off' || disabled) return;
		if (open) return; // second tap: let the link do its job
		// Swallow the tap that opens the preview, so tapping a link previews it
		// rather than navigating away from the page you're previewing on.
		e.preventDefault();
		e.stopPropagation();
		show('touch');
	}

	function onTriggerPointerDown(e: PointerEvent) {
		source = e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'pointer';
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			closeNow();
			return;
		}
		// Tab moves into the card rather than to whatever follows the trigger in
		// the document. The card is portaled to the end of <body>, so without this
		// its links are effectively unreachable — and a focus *trap* would be the
		// wrong fix for something this incidental.
		if (e.key !== 'Tab' || e.shiftKey || !open || !cardElement) return;
		const first = cardElement.querySelector<HTMLElement>(
			'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (!first) return;
		e.preventDefault();
		// Focus is about to land inside, so the card stops being decorative: drop
		// the aria-hidden that pointer-opening applies before moving into it.
		source = 'focus';
		first.focus();
	}

	// Handing focus back to the trigger would otherwise land on `onTriggerFocus`
	// and re-open the card the user just dismissed.
	let restoringFocus = false;

	function onCardKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		closeNow();
		restoringFocus = true;
		triggerElement?.querySelector<HTMLElement>('a, button, [tabindex]')?.focus();
		requestAnimationFrame(() => (restoringFocus = false));
	}

	function onCardBlur(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (next && triggerElement?.contains(next)) return;
		if (next && cardElement && containsThrough(cardElement, next)) return;
		closeNow();
	}

	$effect(() => () => clearTimers());

	// ── The gap ──
	// Trigger and card are `offset` px apart, and the pointer crosses that dead
	// space to reach the card. The close delay alone would cover a quick crossing,
	// but not a pointer that pauses mid-gap — and lengthening the delay to cover
	// that is how a card ends up feeling stuck. So the gap gets a real hit area:
	// a band spanning both boxes' width, only as tall as the space between them,
	// alive only while the card is. It is deliberately not the union rectangle of
	// the two boxes, which would swallow clicks either side of the trigger.
	let bridgeStyle = $state('');
	$effect(() => {
		if (!open || !triggerElement || !cardElement) return;
		let frame = 0;
		const track = () => {
			const t = triggerElement!.getBoundingClientRect();
			const c = cardElement!.getBoundingClientRect();
			const left = Math.min(t.left, c.left);
			const right = Math.max(t.right, c.right);
			let top: number;
			let height: number;
			if (c.top >= t.bottom) {
				top = t.bottom;
				height = c.top - t.bottom;
			} else if (c.bottom <= t.top) {
				top = c.bottom;
				height = t.top - c.bottom;
			} else {
				// Overlapping (the popover flipped onto the trigger): no gap to bridge.
				height = 0;
				top = t.top;
			}
			bridgeStyle =
				height > 0
					? // 1px of overshoot at each end: the rects are fractional, and a
						// sub-pixel seam is enough for a pointerleave to fire.
						`left: ${left}px; top: ${top - 1}px; width: ${right - left}px; height: ${height + 2}px;`
					: 'display: none;';
			frame = requestAnimationFrame(track);
		};
		frame = requestAnimationFrame(track);
		return () => cancelAnimationFrame(frame);
	});
</script>

<Popover
	manual
	bind:open
	{align}
	{offset}
	{disabled}
	sheet={false}
	class="glow-hover-card-anchor {className}"
>
	{#snippet trigger()}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			bind:this={triggerElement}
			class="hover-card-trigger"
			onpointerenter={onTriggerEnter}
			onpointerleave={scheduleClose}
			onpointerdown={onTriggerPointerDown}
			onclick={onTriggerClick}
			onfocusin={onTriggerFocus}
			onfocusout={onTriggerBlur}
			onkeydown={onTriggerKeydown}
		>
			{@render triggerSnippet()}
		</span>
	{/snippet}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={cardElement}
		id={cardId}
		class="hover-card"
		style="width: {cardWidth};"
		aria-hidden={source === 'pointer' ? 'true' : undefined}
		onpointerenter={() => {
			clearTimeout(closeTimer);
			closeTimer = undefined;
		}}
		onpointerleave={scheduleClose}
		onkeydown={onCardKeydown}
		onfocusout={onCardBlur}
	>
		{#if status === 'loading'}
			{#if loading}
				{@render loading()}
			{:else}
				<div class="hover-card-loading">
					<Skeleton shape="circle" width={40} />
					<div class="hover-card-loading-lines">
						<Skeleton shape="text" width="55%" />
						<Skeleton shape="text" width="80%" />
						<Skeleton shape="text" width="70%" />
					</div>
				</div>
			{/if}
		{:else if status === 'error'}
			{#if error}
				{@render error(failure)}
			{:else}
				<p class="hover-card-error">Couldn't load this preview.</p>
			{/if}
		{:else}
			{@render children()}
		{/if}
	</div>
</Popover>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="hover-card-bridge"
		style={bridgeStyle}
		aria-hidden="true"
		use:portal
		onpointerenter={() => {
			clearTimeout(closeTimer);
			closeTimer = undefined;
		}}
		onpointerleave={scheduleClose}
	></div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	// Popover's wrapper and trigger are blocks; a hover card usually hangs off a
	// word inside a sentence, so both are pulled back into the text flow. Global
	// because the class lands on Popover's own root.
	:global(.glow-hover-card-anchor) {
		display: inline-block;
		max-width: 100%;
	}

	:global(.glow-hover-card-anchor > .popover-trigger) {
		display: inline;
		// Popover forces a pointer cursor; a hover card's trigger is whatever it
		// wraps (often a link, sometimes plain text) and should keep its own.
		cursor: inherit;
	}

	.hover-card-trigger {
		display: inline;
	}

	.hover-card {
		display: block;
		padding: $space-md;
		max-width: 100%;
		color: var(--glow-fg);
		font-size: $text-sm;
		line-height: 1.5;
	}

	.hover-card-loading {
		display: flex;
		gap: $space-sm;
		align-items: flex-start;
	}

	.hover-card-loading-lines {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: $space-sm;
		// Nudges the first line onto the avatar's optical centre-line instead of
		// its top edge.
		padding-top: 0.2rem;
	}

	.hover-card-error {
		margin: 0;
		color: var(--glow-text-secondary);
		font-size: $text-sm;
	}

	.hover-card-bridge {
		position: fixed;
		// Under the card (10000) but above the page, so it only ever intercepts
		// the pointer in the gap it covers.
		z-index: 9999;
	}
</style>
