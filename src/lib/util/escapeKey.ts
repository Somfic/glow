export function onEscape(callback: () => void) {
	function handler(e: KeyboardEvent) {
		if (e.key === 'Escape') callback();
	}
	document.addEventListener('keydown', handler);
	return () => document.removeEventListener('keydown', handler);
}
