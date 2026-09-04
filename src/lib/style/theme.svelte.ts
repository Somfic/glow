/**
 * Shared light/dark state.
 *
 * `<Root>` reads this when it isn't given an explicit `theme` prop, and the
 * sidebar's theme switch writes to it — so any control anywhere in the tree can
 * flip the theme without prop-drilling through the layout.
 *
 * The store stamps `data-theme` on `<html>` itself, so a theme switch works
 * whether or not the app is wrapped in `<Root>`. It has to be `<html>` rather
 * than a wrapper element: overlays that portal into `<body>` (Popover, Modal,
 * Drawer, CommandPalette, tooltips) sit outside any wrapper, and the page canvas
 * sits above it. A `<Root>` given an explicit `theme` calls `claim()` to take
 * that over, after which the store stops writing and switches become inert —
 * which is the point of pinning it.
 *
 * Resolution order on first use: a previous choice from `localStorage`, then
 * the OS `prefers-color-scheme`, then dark.
 *
 * SSR note: this is module-level state, which on a server is shared by every
 * request. Nothing here writes to it during render — `hydrate()` and the
 * setters are reachable only from the browser — so a server render always sees
 * the `dark` default and cannot leak one visitor's choice to another. The real
 * value is applied on mount, which is also why the stored preference can't be
 * honoured in the server-rendered HTML.
 */
export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'glow-theme';

function readStored(): ThemeMode | null {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		return v === 'dark' || v === 'light' ? v : null;
	} catch {
		// Private browsing and "block site data" both throw on access rather
		// than returning null.
		return null;
	}
}

function readSystem(): ThemeMode {
	return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
		? 'light'
		: 'dark';
}

class ThemeStore {
	#mode = $state<ThemeMode>('dark');
	/** True once the browser preference has been read, so we only do it once. */
	#hydrated = false;
	/** True while a controlled `<Root>` is driving `data-theme` instead. */
	#claimed = false;

	get mode(): ThemeMode {
		return this.#mode;
	}

	set mode(next: ThemeMode) {
		this.#mode = next;
		this.#hydrated = true;
		this.#apply();
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// Not persisting is survivable; the theme still applies for this session.
		}
	}

	/** Mirror onto <html>, unless a controlled `<Root>` owns the attribute. */
	#apply(): void {
		if (this.#claimed || typeof document === 'undefined') return;
		document.documentElement.dataset.theme = this.#mode;
	}

	/**
	 * Called by `<Root theme="…">` to take ownership of `<html>`. Returns a
	 * release function, so Root can hand it back when it unmounts or becomes
	 * uncontrolled.
	 */
	claim(): () => void {
		this.#claimed = true;
		return () => {
			this.#claimed = false;
		};
	}

	get isDark(): boolean {
		return this.#mode === 'dark';
	}

	toggle(): ThemeMode {
		this.mode = this.#mode === 'dark' ? 'light' : 'dark';
		return this.#mode;
	}

	/**
	 * Adopt the stored-or-system preference. Called by `<Root>` on mount when it
	 * has no explicit `theme` prop. Idempotent, and a no-op on the server or
	 * once an explicit choice has been made.
	 */
	hydrate(): void {
		if (this.#hydrated || typeof window === 'undefined') return;
		this.#hydrated = true;
		this.#mode = readStored() ?? readSystem();
		this.#apply();
	}

	/** Forget the stored choice and fall back to the OS preference. */
	clear(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// nothing to clean up
		}
		this.#hydrated = true;
		this.#mode = readSystem();
		this.#apply();
	}
}

export const theme = new ThemeStore();
