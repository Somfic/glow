/**
 * The part of a router's navigation object this helper needs. Typed
 * structurally so the library does not take a dependency on `@sveltejs/kit`,
 * the same way `viewTransition` does.
 */
export interface ScrollTarget {
	url: URL;
}

export interface ScrollNavigation {
	/** SvelteKit's set is `enter | form | leave | link | goto | popstate`. */
	type: string;
	from?: ScrollTarget | null;
	to?: ScrollTarget | null;
}

export interface ScrollMemory {
	/** Wire to the router's before-navigate hook. */
	before(navigation: ScrollNavigation): void;
	/** Wire to the router's after-navigate hook. */
	after(navigation: ScrollNavigation): void;
}

/**
 * Give an element that scrolls instead of the document the scroll behaviour
 * the document would have had.
 *
 * ```ts
 * let scroller = $state<HTMLElement>();
 * const scroll = scrollMemory(() => scroller);
 * beforeNavigate(scroll.before);
 * afterNavigate(scroll.after);
 * ```
 *
 * `Page` beside a sidebar makes its content panel the scroller rather than the
 * document, so the scrollbar lands inside the rounded panel. The cost is that
 * a router's own scroll handling no longer applies to anything: SvelteKit
 * resets `window.scrollY` on navigation, and on a page that scrolls internally
 * that is a no-op — so the next page opens at the previous page's scroll
 * offset. This restores all three behaviours the browser gives a document that
 * scrolls itself: a new page starts at the top, back and forward return to
 * where you were, and a link to an anchor lands on the anchor.
 *
 * It takes a getter rather than the element because the element is bound after
 * the first render, and the handlers are registered before it.
 *
 * Positions are keyed by path, not by history entry, so two entries for the
 * same URL share one remembered offset. A router that exposes a history index
 * could do better; nothing this library can reach does.
 */
export function scrollMemory(scroller: () => HTMLElement | null | undefined): ScrollMemory {
	const positions = new Map<string, number>();
	const key = (target?: ScrollTarget | null) =>
		target ? target.url.pathname + target.url.search : undefined;

	return {
		before(navigation) {
			const el = scroller();
			const from = key(navigation.from);
			if (el && from !== undefined) positions.set(from, el.scrollTop);
		},

		after(navigation) {
			// The first render, where the browser has already put the page where
			// it belongs and there is no previous page to have scrolled.
			if (navigation.type === 'enter') return;

			const el = scroller();
			if (!el) return;

			if (navigation.type === 'popstate') {
				const to = key(navigation.to);
				const previous = to !== undefined ? positions.get(to) : undefined;
				if (previous !== undefined) {
					el.scrollTop = previous;
					return;
				}
			}

			// A hash is an explicit request to land somewhere other than the top.
			// The router has already scrolled to it by the time this runs, so the
			// only thing left to do is not undo it.
			const hash = navigation.to?.url.hash;
			if (hash && hash.length > 1) {
				const id = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(hash.slice(1)) : hash.slice(1);
				try {
					if (el.querySelector(`#${id}`)) return;
				} catch {
					// An id that isn't a valid selector cannot be a scroll target
					// either, so fall through and start at the top.
				}
			}

			el.scrollTop = 0;
		}
	};
}
