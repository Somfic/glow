/**
 * Register a global keydown listener that fires when the user presses
 * `key` while not focused inside an editable element. The handler is
 * automatically removed when the calling effect tears down.
 *
 * Returns a cleanup function so it can be used inside `$effect`.
 */
export function registerShortcut(key: string | undefined, handler: () => void): () => void {
	if (!key || typeof window === 'undefined') return () => {};

	const onKey = (e: KeyboardEvent) => {
		if (e.key !== key) return;
		const target = e.target as HTMLElement | null;
		if (!target) return;
		const tag = target.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
			return;
		}
		e.preventDefault();
		handler();
	};

	window.addEventListener('keydown', onKey);
	return () => window.removeEventListener('keydown', onKey);
}
