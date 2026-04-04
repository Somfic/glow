const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function trapFocus(container: HTMLElement | null, event: KeyboardEvent) {
	if (!container || event.key !== 'Tab') return;
	const focusable = Array.from(
		container.querySelectorAll<HTMLElement>(FOCUSABLE)
	).filter((el) => !el.hasAttribute('disabled'));
	if (focusable.length === 0) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}
