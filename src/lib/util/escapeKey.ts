/**
 * Dismissable layers, innermost last. Escape should peel one layer at a time:
 * with a select open inside a popover, the select closes and the popover
 * stays. A plain per-layer listener closes both on one keypress, so the
 * layers share a single listener that only ever calls the topmost.
 */
const stack: (() => void)[] = [];

function handler(e: KeyboardEvent) {
	if (e.key !== 'Escape') return;
	stack.at(-1)?.();
}

export function onEscape(callback: () => void) {
	if (stack.length === 0) document.addEventListener('keydown', handler);
	stack.push(callback);
	return () => {
		const i = stack.lastIndexOf(callback);
		if (i !== -1) stack.splice(i, 1);
		if (stack.length === 0) document.removeEventListener('keydown', handler);
	};
}
