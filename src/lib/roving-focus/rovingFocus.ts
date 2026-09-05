import type { Action } from 'svelte/action';

/**
 * Roving tabindex: a group of controls that is **one** tab stop, navigated
 * internally with the arrow keys.
 *
 * Shipped as an action rather than a rune-based helper on purpose. A helper
 * would have to hand back a per-item `tabindex` and a keydown handler for the
 * consumer to spread onto every item, which means the invariant this thing
 * exists to guarantee — exactly one `tabindex="0"` in the group — depends on
 * the consumer wiring it correctly on every item, including the ones an
 * `{#each}` adds later. The DOM is where that invariant actually lives, so the
 * action owns the DOM: it finds its items, writes their `tabindex`, and watches
 * for them changing underneath it. The consumer writes `use:rovingFocus` on the
 * container and a marker attribute on the items, and nothing else.
 */

export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

export interface RovingFocusOptions {
	/**
	 * Which arrow keys move focus. Default `'both'`: a group that silently
	 * ignores half the arrow keys is the more surprising default, and a
	 * consumer with a competing axis (a horizontal toolbar of vertical menus)
	 * opts into the one it wants.
	 */
	orientation?: RovingOrientation;
	/** Arrow past the last item to land on the first. Default `true`. */
	wrap?: boolean;
	/**
	 * How items are found inside the container. Default
	 * `'[data-roving-item]'` — an explicit opt-in attribute rather than a
	 * focusable-element sweep, because a group's items are rarely *every*
	 * focusable descendant (a toolbar button with a nested close affordance
	 * would otherwise become two stops).
	 */
	item?: string;
	/** Type a prefix to jump to the matching item. Default `false`. */
	typeahead?: boolean;
	/**
	 * Suspend the group: keys are ignored and every item gets the `tabindex` it
	 * had before the action touched it, so a suspended group is plain markup
	 * again rather than a group with no reachable tab stop.
	 */
	disabled?: boolean;
	/**
	 * Where the tab stop sits before anything has been focused. Default
	 * `'first'`; a number is an index into the enabled items.
	 */
	initial?: number | 'first' | 'last';
	/** Fired whenever the tab stop moves, with the item and its index. */
	onMove?: (item: HTMLElement, index: number) => void;
}

/** Stamped on every container, so an item can name the group that owns it. */
const GROUP_ATTR = 'data-roving-focus';

/**
 * Sent to the groups inside a container when that container becomes (or stops
 * being) a group.
 *
 * Svelte runs a child's actions before its parent's, so an inner group mounts
 * before the outer one has marked itself — without this it would spend its
 * whole life believing it is top-level, and the nest would be two tab stops.
 */
const RESYNC = 'glow-roving-resync';

/** Milliseconds of quiet before a typeahead buffer is abandoned. */
const TYPEAHEAD_TIMEOUT = 500;

const isDisabled = (el: HTMLElement): boolean =>
	el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' || Boolean(el.hidden);

export const rovingFocus = ((node: HTMLElement, options: RovingFocusOptions = {}) => {
	let opts = options;
	node.setAttribute(GROUP_ATTR, '');

	/** Index of `active` as of the last sync — read after it has been removed. */
	let lastIndex = 0;
	/** Original `tabindex` per item, so `destroy` leaves the DOM as it found it. */
	const original = new WeakMap<HTMLElement, string | null>();
	/** The item currently holding the group's single `tabindex="0"`. */
	let active: HTMLElement | null = null;
	let focusWithin = false;
	let typed = '';
	let typedAt = 0;

	const selector = () => opts.item ?? '[data-roving-item]';

	/**
	 * This group's items, in DOM order.
	 *
	 * The `closest` filter is what makes nesting work: a tree inside a toolbar
	 * matches the toolbar's selector too, so ownership is decided by which
	 * container is *nearest*, not by which one can see the item. The search
	 * starts at the item's parent so that a nested group's own container can be
	 * an item of the group around it — which is how the keyboard gets in.
	 */
	function items(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(selector())).filter(
			(el) => el.parentElement?.closest(`[${GROUP_ATTR}]`) === node
		);
	}

	const enabled = (list = items()): HTMLElement[] => list.filter((el) => !isDisabled(el));

	/** The group that owns this one, when a container sits inside another. */
	const parentGroup = (): HTMLElement | null =>
		(node.parentElement?.closest(`[${GROUP_ATTR}]`) as HTMLElement | null) ?? null;

	/**
	 * A nested group holds no tab stop of its own while focus is outside it.
	 *
	 * Otherwise a tree inside a toolbar would be two tab stops — the toolbar's,
	 * and the tree's — which is exactly the thing the pattern promises not to
	 * be. The way in is the outer group's item that contains this container:
	 * mark it `data-roving-item`, and an arrow key pressed on it steps inside.
	 */
	const subordinate = (): boolean => !!parentGroup() && !node.contains(document.activeElement);

	function remember(el: HTMLElement): void {
		if (!original.has(el)) original.set(el, el.getAttribute('tabindex'));
	}

	/**
	 * Write the invariant: `active` (or the best stand-in) is the only item at
	 * `tabindex="0"`. Everything that can change the group — mount, keypress,
	 * click, a mutation — ends here.
	 */
	function sync({ notify = false } = {}): void {
		if (opts.disabled) return;
		const list = items();
		const usable = enabled(list);
		if (active && (!active.isConnected || isDisabled(active))) active = null;
		if (!active || !list.includes(active)) {
			active =
				(typeof opts.initial === 'number'
					? usable[opts.initial]
					: opts.initial === 'last'
						? usable.at(-1)
						: usable[0]) ??
				usable[0] ??
				null;
		}
		const stop = subordinate() ? null : active;
		for (const el of list) {
			remember(el);
			// A disabled item stays reachable by arrow-less means but is never
			// the tab stop; -1 keeps `.focus()` working for whoever wants it.
			el.tabIndex = el === stop ? 0 : -1;
		}
		if (active) lastIndex = list.indexOf(active);
		if (notify && active) opts.onMove?.(active, list.indexOf(active));
	}

	function move(to: HTMLElement | undefined | null): void {
		if (!to) return;
		active = to;
		sync({ notify: true });
		to.focus();
	}

	function step(delta: number): void {
		const usable = enabled();
		if (usable.length === 0) return;
		const from = active ? usable.indexOf(active) : -1;
		let next = from + delta;
		if (next < 0 || next >= usable.length) {
			if (!(opts.wrap ?? true)) return;
			next = (next + usable.length) % usable.length;
		}
		move(usable[next]);
	}

	/** Forward along the *visual* axis: in RTL, ArrowLeft is forward. */
	const rtl = (): boolean => getComputedStyle(node).direction === 'rtl';

	function matchTypeahead(char: string): void {
		const now = Date.now();
		typed = now - typedAt > TYPEAHEAD_TIMEOUT ? char : typed + char;
		typedAt = now;
		const usable = enabled();
		if (usable.length === 0) return;
		// One character repeated cycles through the items starting with it, the
		// way every native listbox behaves; anything else is a growing prefix.
		const repeat = typed.length > 1 && new Set(typed).size === 1;
		const prefix = (repeat ? typed[0] : typed).toLowerCase();
		const from = active ? usable.indexOf(active) : -1;
		// A growing prefix starts its search *on* the current item, so typing
		// another matching letter does not skip off it; a repeat starts after.
		const start = repeat || typed.length === 1 ? from + 1 : Math.max(from, 0);
		const order = usable.slice(start).concat(usable.slice(0, start));
		const label = (el: HTMLElement) =>
			(el.dataset.rovingLabel ?? el.textContent ?? '').trim().toLowerCase();
		move(order.find((el) => label(el).startsWith(prefix)));
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (opts.disabled || e.defaultPrevented) return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const target = e.target as HTMLElement | null;
		if (!target) return;
		// Nested groups: the *nearest* group owns the key outright, even for a
		// key it does not act on. Letting the outer one pick up the leftovers
		// would mean a tree's ArrowRight also walked its enclosing toolbar.
		const owner = target.closest(`[${GROUP_ATTR}]`);
		// The one thing an outer group may act on inside a nested one is a key
		// pressed on the nested container itself, which is an item of ours.
		if (owner !== node && !(target === owner && items().includes(target))) return;
		// Conversely, a key on our own container means "step into this group" —
		// that container is how an outer group's arrows reach us.
		const entering = target === node && !!parentGroup();
		if (!entering && !items().includes(target.closest(selector()) as HTMLElement)) return;

		const orientation = opts.orientation ?? 'both';
		const horizontal = orientation !== 'vertical';
		const vertical = orientation !== 'horizontal';
		const forward = rtl() ? 'ArrowLeft' : 'ArrowRight';
		const back = rtl() ? 'ArrowRight' : 'ArrowLeft';

		if (entering) {
			// Only our own axis steps in. Anything else — including the outer
			// group's axis — is left to bubble, so the container behaves like
			// the ordinary toolbar item it is for every other key.
			const enters =
				(horizontal && (e.key === forward || e.key === back)) ||
				(vertical && (e.key === 'ArrowDown' || e.key === 'ArrowUp'));
			if (!enters) return;
			e.preventDefault();
			e.stopPropagation();
			move(active ?? enabled()[0]);
			return;
		}

		let handled = true;
		if (horizontal && e.key === forward) step(1);
		else if (horizontal && e.key === back) step(-1);
		else if (vertical && e.key === 'ArrowDown') step(1);
		else if (vertical && e.key === 'ArrowUp') step(-1);
		else if (e.key === 'Home') move(enabled()[0]);
		else if (e.key === 'End') move(enabled().at(-1));
		else if (opts.typeahead && e.key.length === 1 && /\S/.test(e.key)) matchTypeahead(e.key);
		else handled = false;

		if (handled) {
			e.preventDefault();
			// Stop an ancestor group from seeing a key this one already used —
			// belt and braces next to the `closest` guard above, since a
			// consumer may put a listener of their own in between.
			e.stopPropagation();
		}
	}

	/** Tabbing or clicking into an item moves the zero to it, so Tab out and
	 *  back in returns to where the user actually was. */
	function onFocusIn(e: FocusEvent): void {
		focusWithin = true;
		if (opts.disabled) return;
		const item = (e.target as HTMLElement | null)?.closest(selector()) as HTMLElement | null;
		if (!item || !items().includes(item) || item === active) {
			// Even without a change of item, entering or leaving a nested group
			// is what decides whether it has a tab stop at all.
			sync();
			return;
		}
		active = item;
		sync({ notify: true });
	}

	function onFocusOut(e: FocusEvent): void {
		const to = e.relatedTarget as Node | null;
		if (to) {
			focusWithin = node.contains(to);
			sync();
			return;
		}
		// A null `relatedTarget` is ambiguous: the user clicked nothing
		// focusable, *or* the focused item was just removed from the DOM. The
		// MutationObserver runs first (microtask) and may restore focus, so
		// settle the flag afterwards rather than guessing here.
		setTimeout(() => {
			focusWithin = node.contains(document.activeElement);
			sync();
		}, 0);
	}

	/**
	 * Items changing underneath a focused group is the hard case, and the only
	 * reason this needs an observer at all: an `{#each}` can add, remove or
	 * reorder items with no event to hang off, and every one of those can
	 * either strand the tab stop or leave two of them.
	 */
	const observer = new MutationObserver(() => {
		if (opts.disabled) return;
		const list = items();
		const gone = active && !list.includes(active);
		if (gone) {
			// Keep the tab stop where the removed item *was*: index, not
			// identity, is what a user's mental model tracks when a row is
			// deleted out from under them.
			const at = lastIndex;
			const usable = enabled(list);
			const restoreFocus =
				focusWithin && (document.activeElement === null || document.activeElement === document.body);
			active = usable[Math.min(at, usable.length - 1)] ?? usable[0] ?? null;
			sync();
			if (restoreFocus) active?.focus();
			return;
		}
		sync();
	});

	/** Tell any group nested inside this one to reconsider its tab stop. */
	function broadcast(): void {
		for (const el of node.querySelectorAll(`[${GROUP_ATTR}]`))
			el.dispatchEvent(new CustomEvent(RESYNC));
	}

	/** Put every item's `tabindex` back the way the consumer wrote it. */
	function release(): void {
		for (const el of items()) {
			const was = original.get(el);
			if (was === null || was === undefined) el.removeAttribute('tabindex');
			else el.setAttribute('tabindex', was);
		}
	}

	const onResync = () => sync();

	node.addEventListener(RESYNC, onResync);
	node.addEventListener('keydown', onKeyDown);
	node.addEventListener('focusin', onFocusIn);
	node.addEventListener('focusout', onFocusOut);
	observer.observe(node, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['disabled', 'aria-disabled', 'hidden', 'data-roving-item']
	});
	sync();
	broadcast();

	return {
		update(next: RovingFocusOptions = {}) {
			const wasDisabled = opts.disabled;
			opts = next;
			if (next.disabled) {
				// Hand the group back to the browser: the items get their own
				// tabindex back, so a suspended group is simply normal markup.
				release();
			} else {
				if (wasDisabled) active = null;
				sync();
			}
		},
		destroy() {
			observer.disconnect();
			node.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('focusin', onFocusIn);
			node.removeEventListener('focusout', onFocusOut);
			release();
			node.removeAttribute(GROUP_ATTR);
			node.removeEventListener(RESYNC, onResync);
			// The groups inside are top-level again now.
			broadcast();
		}
	};
}) satisfies Action<HTMLElement, RovingFocusOptions | undefined>;
