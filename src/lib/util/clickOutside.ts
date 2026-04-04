export function onClickOutside(
	containers: (HTMLElement | null | undefined)[],
	callback: () => void
) {
	function handler(e: MouseEvent) {
		const target = e.target as Node;
		if (containers.some((c) => c?.contains(target))) return;
		callback();
	}
	document.addEventListener('mousedown', handler, true);
	return () => document.removeEventListener('mousedown', handler, true);
}
