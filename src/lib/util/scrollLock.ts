let lockCount = 0;

// Components that lock scroll (Modal, Drawer, Popover, Lightbox, ImageCropper)
// balance their lock in `onDestroy`, and `onDestroy` also runs during SSR —
// where there is no `document`. Guard here rather than at each call site.
const canTouchDocument = () => typeof document !== 'undefined';

export function lockScroll() {
	if (!canTouchDocument()) return;
	lockCount++;
	if (lockCount === 1) document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
	if (!canTouchDocument()) return;
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) document.body.style.overflow = '';
}
