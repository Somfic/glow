/**
 * The part of SvelteKit's `onNavigate` argument this helper needs: a promise
 * that settles once the new page has been rendered. Typed structurally so the
 * library does not take a dependency on `@sveltejs/kit`.
 */
export interface ViewTransitionNavigation {
	complete: Promise<unknown>;
}

export interface ViewTransitionOptions<T extends ViewTransitionNavigation = ViewTransitionNavigation> {
	/** Skip the transition for this navigation — e.g. between tabs of one page. */
	skip?: boolean | ((navigation: T) => boolean);
}

type StartViewTransition = (callback: () => Promise<void> | void) => {
	ready: Promise<void>;
	updateCallbackDone: Promise<void>;
	finished: Promise<void>;
};

/** `matchMedia` is absent in a non-browser document (jsdom, some test runners). */
function prefersReducedMotion(): boolean {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Wrap a SvelteKit navigation in a View Transition.
 *
 * ```ts
 * onNavigate(viewTransition);
 * ```
 *
 * Returns a promise that resolves once the transition has captured the old
 * page, which is the contract `onNavigate` wants — SvelteKit holds the DOM
 * update until it resolves. Returns `undefined`, meaning "navigate normally",
 * in the three cases where a transition should not happen:
 *
 *   - `document.startViewTransition` is missing (Firefox, older Safari). No
 *     polyfill: a page-level crossfade is decoration, and the navigation has
 *     to be untouched where the API is not there.
 *   - `<Root transitions={false}>`. Root stamps that on `<html>`, because this
 *     runs from the router's navigation hook — outside any component, where
 *     Svelte context cannot reach it. Without the shared flag an app could turn
 *     transitions off on Root and still get a crossfade of an unnamed sidebar,
 *     which is worse than either setting on its own.
 *   - The user asked for reduced motion. A crossfade of the whole viewport is
 *     exactly the motion that preference exists to suppress, and skipping the
 *     transition is a truer answer than running a 1ms one — the UA drives
 *     these animations from its own default stylesheet on the
 *     `::view-transition-*` pseudo-elements, which no `--glow-dur-*` token
 *     reaches unless the page overrides them by hand.
 *   - `skip` says so.
 *
 * The caller still owns the CSS. Give any chrome that persists across the
 * navigation (a sidebar, a header) its own `view-transition-name` so it is
 * treated as the same element instead of being crossfaded into itself — and
 * make sure that name is unique in the document, since a duplicate makes the
 * browser abandon the transition.
 */
export function viewTransition<T extends ViewTransitionNavigation>(
	navigation: T,
	{ skip }: ViewTransitionOptions<T> = {}
): Promise<void> | undefined {
	if (typeof document === 'undefined') return;

	const start = (document as Document & { startViewTransition?: StartViewTransition })
		.startViewTransition;
	if (!start) return;
	if (document.documentElement.dataset.glowTransitions === 'off') return;
	if (prefersReducedMotion()) return;
	if (typeof skip === 'function' ? skip(navigation) : skip) return;

	return new Promise<void>((resolve) => {
		const transition = start.call(document, async () => {
			// Resolving first is what lets SvelteKit apply the DOM update inside
			// the transition's callback; awaiting `complete` after it keeps the
			// transition open until the new page has actually rendered.
			resolve();
			await navigation.complete;
		});

		// A transition that never runs is normal, not exceptional: it is how the
		// browser reports a duplicate `view-transition-name`, a second navigation
		// starting mid-flight, or a tab going to the background. Left unhandled
		// these reject into the console as errors the app can do nothing about.
		transition.ready.catch(() => {});
		transition.finished.catch(() => {});
		transition.updateCallbackDone.catch(() => {});
	});
}
