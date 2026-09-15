import { registerShortcut } from '../util/shortcut.svelte.js';
import type { PopoverMenuEntry } from './PopoverMenu.svelte';

/**
 * Register every shortcut in a menu's entries, submenus included, and return
 * one cleanup for the lot — call it from an `$effect` and return the result.
 *
 * Bound from the `items` array rather than from the rendered rows on purpose:
 * a menu's rows only exist while it is open, and an accelerator that only
 * works when its menu is already open is no accelerator at all.
 */
export function bindMenuShortcuts(entries: PopoverMenuEntry[]): () => void {
	const cleanups: (() => void)[] = [];

	const walk = (list: PopoverMenuEntry[]) => {
		for (const entry of list) {
			if (entry === 'divider' || typeof entry === 'string') continue;
			if (entry.kind === 'item') {
				if (entry.shortcut && !entry.disabled) {
					cleanups.push(registerShortcut(entry.shortcut, entry.onclick));
				}
			} else if (entry.kind === 'submenu') {
				if (entry.items) walk(entry.items);
			}
		}
	};

	walk(entries);
	return () => cleanups.forEach((off) => off());
}
