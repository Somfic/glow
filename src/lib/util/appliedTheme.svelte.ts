/**
 * The theme that is actually in force, as a reactive value.
 *
 * This reads `data-theme` off `<html>` rather than the `theme` store, because
 * the store is only one of the two writers: a `<Root theme="…">` calls
 * `claim()` and stamps the attribute itself, after which the store's `mode`
 * stops tracking what the page looks like. The attribute is the single thing
 * both paths agree on, so anything that has to *match* the theme from JS —
 * rather than change it — should ask here.
 *
 * Almost nothing needs this: CSS gets the answer from the `--glow-*` tokens
 * under the `[data-theme]` selector. It exists for the cases where a colour is
 * baked into markup by something outside our stylesheet, which today means
 * Shiki's inline `style` attributes in `CodeBlock`.
 *
 * ```svelte
 * const applied = appliedTheme();
 * $effect(() => highlight(applied.isDark ? 'vitesse-dark' : 'vitesse-light'));
 * ```
 */
import type { ThemeMode } from '../style/theme.svelte.js';

export interface AppliedTheme {
	readonly current: ThemeMode;
	readonly isDark: boolean;
}

export function appliedTheme(): AppliedTheme {
	// `dark` is the store's own default, so an SSR render and a document that
	// has not been stamped yet agree with what the tokens resolve to.
	let current = $state<ThemeMode>(read() ?? 'dark');

	function read(): ThemeMode | null {
		if (typeof document === 'undefined') return null;
		const value = document.documentElement.dataset.theme;
		return value === 'dark' || value === 'light' ? value : null;
	}

	$effect(() => {
		current = read() ?? 'dark';
		const observer = new MutationObserver(() => {
			current = read() ?? 'dark';
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		return () => observer.disconnect();
	});

	return {
		get current() {
			return current;
		},
		get isDark() {
			return current === 'dark';
		}
	};
}
