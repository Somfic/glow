/**
 * Catch a duplicate `view-transition-name` while there is still someone to tell.
 *
 * The value is a CSS `<custom-ident>`, so it is a string rather than a closed
 * set on purpose: an app may render two shells and need distinct names, or want
 * one that its own `::view-transition-group(…)` rules already target. Glow
 * cannot own that namespace.
 *
 * What Glow can do is make the mistake loud. Both ways of getting this wrong
 * are silent in the browser — a name nothing matches simply doesn't animate,
 * and two elements sharing a name make the browser abandon the transition
 * outright, so the navigation still works and only the animation disappears.
 * There is no error, no warning, and nothing in the DOM to look at.
 */

const claimed = new Map<string, number>();
const warned = new Set<string>();

/**
 * Claim a name for as long as the element is mounted. Returns the release
 * function, so it can be handed straight back from `onMount`.
 */
export function claimViewTransitionName(name: string | null | undefined): () => void {
	if (!name || typeof document === 'undefined') return () => {};

	const count = (claimed.get(name) ?? 0) + 1;
	claimed.set(name, count);

	// `import.meta.env?.DEV` and not a bare `.DEV`: this ships to consumers, and
	// a bundler that doesn't define `import.meta.env` would throw rather than
	// warn.
	if (count > 1 && import.meta.env?.DEV && !warned.has(name)) {
		warned.add(name);
		console.warn(
			`[glow] view-transition-name "${name}" is on ${count} elements at once. ` +
				`A name has to be unique in the document — the browser will abandon the ` +
				`transition silently, so navigation keeps working and nothing animates.`
		);
	}

	return () => {
		const remaining = (claimed.get(name) ?? 1) - 1;
		if (remaining > 0) claimed.set(name, remaining);
		else {
			claimed.delete(name);
			warned.delete(name);
		}
	};
}
