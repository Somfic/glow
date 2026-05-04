import type { IconProp } from '../icon/Icon.svelte';

export type CommandContext = {
	/** Current search query at the moment of execution. */
	query: string;
	/** Imperatively close the palette. */
	close: () => void;
};

export type Command = {
	/** Stable identifier — used as the registry key. */
	id: string;
	/** Primary, displayed text. */
	label: string;
	/** Optional secondary text shown beneath the label. */
	description?: string;
	/** Section heading; commands without a group fall under "Other". */
	group?: string;
	/** Leading icon. Ignored when `image` is set. */
	icon?: IconProp;
	/** Leading image URL — circular avatar slot, takes precedence over `icon`. */
	image?: string;
	/** Display-only shortcut hint, e.g. "⌘S". */
	shortcut?: string;
	/** Trailing pill — number / short string, or an icon (with optional label). */
	badge?: string | number | { icon: IconProp; label?: string };
	/** Extra terms folded into fuzzy search (synonyms, aliases). */
	keywords?: string[];
	/** Reactive visibility predicate. Re-evaluated on every render. */
	when?: () => boolean;
	/** Action invoked when the command is selected. May return anything;
	 *  Promise return values are awaited and gate the loading indicator. */
	perform?: (ctx: CommandContext) => unknown;
	/**
	 * Nested commands — selecting this command drills the palette into a
	 * sub-list. Either an array, or a thunk that returns one (sync or async,
	 * for dynamic / lazy-loaded children). When set, `perform` is ignored.
	 */
	children?: Command[] | (() => Command[] | Promise<Command[]>);
};

export type CommandGroup = { name: string; commands: Command[] };
