import { containsThrough } from './portal.js';

export function onClickOutside(
	containers: (HTMLElement | null | undefined)[],
	callback: () => void
) {
	function handler(e: MouseEvent) {
		const target = e.target as Node;
		// `containsThrough`, not `.contains` — a popover opened from inside this
		// one portals its content to <body>, and clicking it must not read as
		// an outside click here.
		if (containers.some((c) => c && containsThrough(c, target))) return;
		callback();
	}
	document.addEventListener('mousedown', handler, true);
	return () => document.removeEventListener('mousedown', handler, true);
}
