import { tick } from 'svelte';
import type { Action } from 'svelte/action';

export interface SortableOptions {
	/**
	 * The reactive `$state` array backing the list. On a successful drop the
	 * action mutates this array **in place** (`splice`), so a keyed `{#each}`
	 * over the same array re-renders into the new order — no callback wiring
	 * needed. Pass the array itself, e.g. `use:sortable={{ items }}`.
	 */
	items: unknown[];
	/** Axis along which items are reordered. Default `'vertical'`. */
	direction?: 'vertical' | 'horizontal';
	/**
	 * CSS selector for the drag handle within a row. When set, a drag only
	 * starts if the pointer goes down on an element matching this selector
	 * (e.g. `'.drag-handle'`). When omitted, the whole row is draggable.
	 */
	handle?: string;
	/** Disable dragging entirely (e.g. a read-only mode). */
	disabled?: boolean;
	/** Fired after a successful reorder with the old and new index. */
	onReorder?: (from: number, to: number) => void;
}

/** Pixels the pointer must travel before a press becomes a drag — lets plain
 *  clicks/taps on row contents still register even though the whole row is a
 *  drag target. Mirrors the click-vs-drag guard in `RangeInput`. */
const DRAG_THRESHOLD = 4;

/** Selector for elements that should keep the pointer gesture for themselves
 *  (text fields, native controls) or explicitly opt out via `data-no-drag`. */
const NO_DRAG =
	'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-no-drag]';

let stylesInjected = false;
function injectStyles(): void {
	if (stylesInjected || typeof document === 'undefined') return;
	stylesInjected = true;
	const el = document.createElement('style');
	el.textContent = `
		.glow-sortable-dragging { cursor: grabbing !important; user-select: none; }
		.glow-sortable-dragging * { cursor: grabbing !important; }
		.glow-sortable-lifted {
			z-index: 2;
			position: relative;
			pointer-events: none;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
			opacity: 0.95;
		}
	`;
	document.head.appendChild(el);
}

const reducedMotion = (): boolean =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const sortable = ((node: HTMLElement, options: SortableOptions) => {
	injectStyles();
	let opts = options;

	type Drag = {
		pointerId: number;
		index: number;
		el: HTMLElement;
		startX: number;
		startY: number;
		active: boolean;
		/** Children captured at gesture start, in DOM order (1:1 with items). */
		children: HTMLElement[];
		/** Original (pre-transform) rects of `children`, captured on activate. */
		rects: DOMRect[];
		/** One slot = dragged item size + gap, along the active axis. */
		slot: number;
		/** Current target index the dragged item would drop into. */
		to: number;
	};
	let drag: Drag | null = null;

	const isVertical = () => (opts.direction ?? 'vertical') === 'vertical';

	/** Walk up from an event target to the direct child of `node`. */
	function directChild(target: EventTarget | null): HTMLElement | null {
		let el = target as HTMLElement | null;
		while (el && el.parentElement !== node) el = el.parentElement;
		return el && el.parentElement === node ? el : null;
	}

	function onPointerDown(e: PointerEvent): void {
		if (opts.disabled || drag) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if ((e.target as HTMLElement).closest(NO_DRAG)) return;
		const el = directChild(e.target);
		if (!el) return;
		if (opts.handle) {
			const h = (e.target as HTMLElement).closest(opts.handle);
			if (!h || !el.contains(h)) return;
		}
		const children = Array.from(node.children).filter(
			(c): c is HTMLElement => c instanceof HTMLElement
		);
		const index = children.indexOf(el);
		if (index < 0) return;
		drag = {
			pointerId: e.pointerId,
			index,
			el,
			startX: e.clientX,
			startY: e.clientY,
			active: false,
			children,
			rects: [],
			slot: 0,
			to: index
		};
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);
	}

	function activate(): void {
		if (!drag) return;
		drag.active = true;
		drag.rects = drag.children.map((c) => c.getBoundingClientRect());
		const r = drag.rects[drag.index];
		const nb = drag.rects[drag.index + 1];
		const pv = drag.rects[drag.index - 1];
		// Slot = distance between adjacent item origins (item extent + gap),
		// measured against whichever neighbour exists. Using origin-to-origin
		// distance keeps it correct whether the neighbour is below or above
		// (e.g. dragging the last item up). Lists generally use a uniform row
		// size, so one slot shifts every crossed sibling cleanly.
		if (isVertical()) {
			drag.slot = nb ? nb.top - r.top : pv ? r.top - pv.top : r.height;
		} else {
			drag.slot = nb ? nb.left - r.left : pv ? r.left - pv.left : r.width;
		}
		node.classList.add('glow-sortable-dragging');
		node.style.touchAction = 'none';
		drag.el.classList.add('glow-sortable-lifted');
		drag.el.style.transition = 'none';
		for (const c of drag.children) {
			if (c !== drag!.el) c.style.transition = 'transform var(--glow-dur-fast, 140ms) ease';
		}
	}

	function onPointerMove(e: PointerEvent): void {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const dx = e.clientX - drag.startX;
		const dy = e.clientY - drag.startY;

		if (!drag.active) {
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
			activate();
			try {
				node.setPointerCapture(drag.pointerId);
			} catch {
				/* element may not accept capture; window listeners still cover us */
			}
		}
		e.preventDefault();

		// Follow the pointer along the active axis only.
		drag.el.style.transform = isVertical() ? `translateY(${dy}px)` : `translateX(${dx}px)`;

		// Target index = how many sibling midpoints the pointer has crossed.
		const pos = isVertical() ? e.clientY : e.clientX;
		let to = drag.index;
		for (let i = 0; i < drag.rects.length; i++) {
			if (i === drag.index) continue;
			const rc = drag.rects[i];
			const mid = isVertical() ? rc.top + rc.height / 2 : rc.left + rc.width / 2;
			if (i < drag.index && pos < mid) {
				to = Math.min(to, i);
			} else if (i > drag.index && pos > mid) {
				to = Math.max(to, i);
			}
		}

		if (to !== drag.to) {
			drag.to = to;
			applyShift();
		}
	}

	/** Open a gap at `drag.to` by transforming the crossed siblings one slot. */
	function applyShift(): void {
		if (!drag) return;
		const { index, to, slot } = drag;
		for (let i = 0; i < drag.children.length; i++) {
			if (i === index) continue;
			const c = drag.children[i];
			let shift = 0;
			if (index < to && i > index && i <= to) shift = -slot;
			else if (index > to && i >= to && i < index) shift = slot;
			c.style.transform = shift
				? isVertical()
					? `translateY(${shift}px)`
					: `translateX(${shift}px)`
				: '';
		}
	}

	async function onPointerUp(e: PointerEvent): Promise<void> {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const d = drag;
		drag = null;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);

		if (!d.active) return; // was a click/tap, not a drag

		try {
			node.releasePointerCapture(d.pointerId);
		} catch {
			/* capture may never have been set */
		}

		const { index: from, to } = d;
		const animate = !reducedMotion();

		// FLIP "first": current visual positions (lifted/shifted) keyed by node.
		const first = animate ? new Map(d.children.map((c) => [c, c.getBoundingClientRect()])) : null;

		// Clear all drag styling — DOM returns to its original, untransformed
		// order before we mutate the array.
		node.classList.remove('glow-sortable-dragging');
		node.style.touchAction = '';
		d.el.classList.remove('glow-sortable-lifted');
		for (const c of d.children) {
			c.style.transform = '';
			c.style.transition = '';
		}

		if (to !== from) {
			const [moved] = opts.items.splice(from, 1);
			opts.items.splice(to, 0, moved);
			opts.onReorder?.(from, to);
		}

		if (!first) return;

		// FLIP "last/invert/play": after Svelte reorders the keyed nodes,
		// measure where each landed and animate from its old spot.
		await tick();
		requestAnimationFrame(() => {
			for (const c of d.children) {
				if (!c.isConnected) continue;
				const f = first.get(c)!;
				const l = c.getBoundingClientRect();
				const dx = f.left - l.left;
				const dy = f.top - l.top;
				if (!dx && !dy) continue;
				c.style.transition = 'none';
				c.style.transform = `translate(${dx}px, ${dy}px)`;
				// Force reflow so the inverted start position is committed.
				void c.offsetWidth;
				c.style.transition = 'transform var(--glow-dur-fast, 140ms) ease';
				c.style.transform = '';
				const cleanup = () => {
					c.style.transition = '';
					c.removeEventListener('transitionend', cleanup);
				};
				c.addEventListener('transitionend', cleanup);
			}
		});
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(newOptions: SortableOptions) {
			opts = newOptions;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
		}
	};
}) satisfies Action<HTMLElement, SortableOptions>;
