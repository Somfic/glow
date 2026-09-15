/**
 * Keyboard shortcuts: one spec string is both what the user sees on the row
 * and what actually fires.
 *
 * A spec is modifiers and a key joined by `+` — `'mod+s'`, `'mod+shift+z'`,
 * `'alt+ArrowLeft'` — or a bare key (`'/'`, `'Escape'`). `mod` is the
 * platform's command modifier: ⌘ on Apple, Ctrl everywhere else, which is the
 * whole reason specs are written rather than matched against `metaKey`
 * directly. The Apple glyphs are accepted too (`'⌘⇧Z'`), so strings already
 * written for display keep working.
 */

export interface ParsedShortcut {
	/** Normalised key, compared case-insensitively against `KeyboardEvent.key`. */
	key: string;
	meta: boolean;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
}

/**
 * Apple keyboards put the command modifier on `metaKey`; everything else uses
 * `ctrlKey`. Read once — the platform does not change mid-session, and this is
 * consulted on every keydown.
 */
export const isApple: boolean =
	typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const MODIFIERS: Record<string, keyof Omit<ParsedShortcut, 'key'> | 'mod'> = {
	mod: 'mod',
	cmdorctrl: 'mod',
	commandorcontrol: 'mod',
	'⌘': 'meta',
	cmd: 'meta',
	command: 'meta',
	meta: 'meta',
	super: 'meta',
	win: 'meta',
	'⌃': 'ctrl',
	ctrl: 'ctrl',
	control: 'ctrl',
	'⌥': 'alt',
	alt: 'alt',
	opt: 'alt',
	option: 'alt',
	'⇧': 'shift',
	shift: 'shift'
};

/** Spellings that are friendlier to write than the `KeyboardEvent.key` value. */
const KEY_ALIASES: Record<string, string> = {
	space: ' ',
	spacebar: ' ',
	esc: 'Escape',
	escape: 'Escape',
	enter: 'Enter',
	return: 'Enter',
	del: 'Delete',
	delete: 'Delete',
	backspace: 'Backspace',
	tab: 'Tab',
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight',
	plus: '+',
	comma: ','
};

/** Display glyphs, in the order macOS prints them: ⌃⌥⇧⌘. */
const GLYPHS = { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' } as const;
const WORDS = { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Win' } as const;

/** Split a spec into its tokens, tolerating both `'mod+shift+z'` and `'⌘⇧Z'`. */
function tokenize(spec: string): string[] {
	// A leading run of glyphs carries no separators, so peel those off first;
	// what remains is `+`-joined (or a bare key).
	const tokens: string[] = [];
	let rest = spec.trim();
	while (rest.length > 1 && rest[0] in MODIFIERS) {
		tokens.push(rest[0]);
		rest = rest.slice(1);
	}
	// A trailing `+` is the key itself (`'mod++'`), not an empty final token.
	if (rest.endsWith('+') && rest.length > 1) {
		tokens.push(...rest.slice(0, -1).split('+').filter(Boolean), '+');
	} else {
		tokens.push(...rest.split('+').filter(Boolean));
	}
	return tokens;
}

export function parseShortcut(spec: string): ParsedShortcut | null {
	const tokens = tokenize(spec);
	if (tokens.length === 0) return null;

	const parsed: ParsedShortcut = { key: '', meta: false, ctrl: false, alt: false, shift: false };
	for (const token of tokens) {
		const modifier = MODIFIERS[token.toLowerCase()];
		if (modifier === 'mod') {
			parsed[isApple ? 'meta' : 'ctrl'] = true;
		} else if (modifier) {
			parsed[modifier] = true;
		} else {
			// Last non-modifier token wins; a spec with two of them is malformed
			// either way, and taking the last one matches how they read.
			parsed.key = KEY_ALIASES[token.toLowerCase()] ?? token;
		}
	}

	return parsed.key ? parsed : null;
}

export function matchesShortcut(e: KeyboardEvent, parsed: ParsedShortcut): boolean {
	if (e.metaKey !== parsed.meta || e.ctrlKey !== parsed.ctrl || e.altKey !== parsed.alt) return false;

	const key = parsed.key;
	// Option on macOS rewrites `key` into the character it composes (⌥e → '´'),
	// and Shift rewrites it into the shifted character, so a single character
	// spec also matches by physical key. `code` is layout-dependent in the other
	// direction (Dvorak), hence both rather than either alone.
	const byKey = e.key.toLowerCase() === key.toLowerCase();
	const byCode =
		key.length === 1 &&
		(e.code === `Key${key.toUpperCase()}` || e.code === `Digit${key}` || (key === ' ' && e.code === 'Space'));
	if (!byKey && !byCode) return false;

	if (parsed.shift) return e.shiftKey;
	if (!e.shiftKey) return true;
	// Shift is held but the spec didn't ask for it. Only a key that *needs*
	// shift to be typed at all (`'?'`, `'+'`) may match anyway — letting ⌘Z
	// also fire on ⌘⇧Z would make an undo/redo pair impossible to express.
	return key.length === 1 && !/[a-z0-9]/i.test(key) && e.key === key;
}

/**
 * How a spec should read on this platform — `'mod+shift+z'` is `⌘⇧Z` on a Mac
 * and `Ctrl+Shift+Z` elsewhere. Returns the input unchanged when it isn't a
 * parseable spec, so a hand-written label still renders as written.
 */
export function formatShortcut(spec: string): string {
	const parsed = parseShortcut(spec);
	if (!parsed) return spec;

	// Each platform prints its modifiers in its own order: ⌃⌥⇧⌘ on macOS,
	// Ctrl+Win+Alt+Shift on Windows.
	const names = isApple ? GLYPHS : WORDS;
	const order = isApple
		? (['ctrl', 'alt', 'shift', 'meta'] as const)
		: (['ctrl', 'meta', 'alt', 'shift'] as const);
	const parts: string[] = order.filter((m) => parsed[m]).map((m) => names[m]);

	const key =
		parsed.key === ' '
			? 'Space'
			: parsed.key.length === 1
				? parsed.key.toUpperCase()
				: parsed.key.replace(/^Arrow/, '');
	parts.push(key);

	// One badge, not one per modifier: menus print `⌘⇧Z` as a unit, and the
	// Windows spelling is joined by `+` the way its own menus do.
	return isApple ? parts.join('') : parts.join('+');
}

export interface ShortcutOptions {
	/**
	 * Don't bind at all. A disabled control's key is not its own: swallowing
	 * it would stop whatever else — an enclosing app, the browser — would
	 * otherwise have taken it, while doing nothing itself.
	 */
	disabled?: boolean;
}

/**
 * Register a global shortcut. Fires while the user is not typing — unless the
 * spec carries a real modifier (⌘/Ctrl/⌥), which is what separates an
 * application accelerator like ⌘S, that must still work from inside a text
 * field, from a bare-key affordance like `/` that must not.
 *
 * A handler that returns `false` has declined: the key is left alone, exactly
 * as though nothing had bound it. That is the escape hatch for state a
 * binding cannot see when it is made — a row that was enabled at bind time
 * and is not by the time it is pressed.
 *
 * Returns a cleanup function, so it can be returned straight from an `$effect`.
 */
export function registerShortcut(
	spec: string | undefined,
	handler: () => unknown,
	options: ShortcutOptions = {}
): () => void {
	if (!spec || options.disabled || typeof window === 'undefined') return () => {};

	const parsed = parseShortcut(spec);
	if (!parsed) return () => {};

	const editableSafe = parsed.meta || parsed.ctrl || parsed.alt;

	const onKey = (e: KeyboardEvent) => {
		if (!matchesShortcut(e, parsed)) return;
		if (!editableSafe) {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
				return;
			}
		}
		// `preventDefault` after the handler, not before: a decline has to be
		// able to leave the event untouched, and both run in the same tick.
		if (handler() === false) return;
		e.preventDefault();
	};

	window.addEventListener('keydown', onKey);
	return () => window.removeEventListener('keydown', onKey);
}
