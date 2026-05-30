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
	/**
	 * Opt into cross-container dragging. Every `use:sortable` that shares the
	 * same non-empty `group` string can exchange items: dragging a row out of
	 * one container and over another in the same group moves it (and its
	 * backing item) into that container's `items` array, live, mid-drag.
	 * Containers in a group may mix axes (e.g. horizontal tier rows feeding a
	 * vertical pool). When omitted, the container only reorders within itself —
	 * behaviour is unchanged.
	 */
	group?: string;
	/** Fired after a successful reorder with the old and new index. */
	onReorder?: (from: number, to: number) => void;
}

/** A sortable container participating in a cross-container `group`. Registered
 *  module-side so any instance can find its peers and read their live arrays. */
interface GroupMember {
	node: HTMLElement;
	getItems: () => unknown[];
	isVertical: () => boolean;
}

/** group name → members. Populated by grouped instances on mount. */
const groups = new Map<string, Set<GroupMember>>();

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

	const isVertical = () => (opts.direction ?? 'vertical') === 'vertical';

	// --- cross-container group membership --------------------------------
	const member: GroupMember = {
		node,
		getItems: () => opts.items,
		isVertical
	};
	let joinedGroup: string | undefined;
	function syncGroup(): void {
		if (opts.group === joinedGroup) return;
		if (joinedGroup) groups.get(joinedGroup)?.delete(member);
		joinedGroup = opts.group;
		if (joinedGroup) {
			let set = groups.get(joinedGroup);
			if (!set) groups.set(joinedGroup, (set = new Set()));
			set.add(member);
		}
	}
	syncGroup();
	/** Peer containers in this instance's group whose pointer-axis rect the
	 *  given point falls inside, the deepest/nearest first. */
	function memberAt(x: number, y: number): GroupMember | null {
		if (!joinedGroup) return null;
		for (const m of groups.get(joinedGroup) ?? []) {
			const r = m.node.getBoundingClientRect();
			if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return m;
		}
		return null;
	}

	type Drag = {
		pointerId: number;
		index: number;
		el: HTMLElement;
		startX: number;
		startY: number;
		active: boolean;
		/** Children of the *current* container, in DOM order (1:1 with items). */
		children: HTMLElement[];
		/** Original (pre-transform) rects of `children`, captured per container. */
		rects: DOMRect[];
		/** One slot = dragged item size + gap, along the active axis. */
		slot: number;
		/** Current target index the dragged item would drop into. */
		to: number;
		/** Container the dragged element currently lives in (changes on transfer). */
		container: HTMLElement;
		/** Backing array the dragged item currently lives in. */
		sourceItems: unknown[];
		/** Axis of the current container. */
		vertical: boolean;
		/** Containers we applied drag styling to, for cleanup on drop. */
		touched: Set<HTMLElement>;
		/** Group mode only: pointer offset within the grabbed card, so it stays
		 *  glued to the cursor continuously across every container it crosses. */
		grabDX: number;
		grabDY: number;
	};
	let drag: Drag | null = null;

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
			to: index,
			container: node,
			sourceItems: opts.items,
			vertical: isVertical(),
			touched: new Set([node]),
			grabDX: 0,
			grabDY: 0
		};
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);
	}

	/** Re-measure rects + slot for the current container's children, and
	 *  (re)apply lift/transition styling. Used on activate and after every
	 *  cross-container transfer. */
	function bindContainer(): void {
		if (!drag) return;
		drag.rects = drag.children.map((c) => c.getBoundingClientRect());
		const r = drag.rects[drag.index];
		const nb = drag.rects[drag.index + 1];
		const pv = drag.rects[drag.index - 1];
		// Slot = distance between adjacent item origins (item extent + gap),
		// measured against whichever neighbour exists. Using origin-to-origin
		// distance keeps it correct whether the neighbour is below or above
		// (e.g. dragging the last item up). Lists generally use a uniform row
		// size, so one slot shifts every crossed sibling cleanly.
		if (drag.vertical) {
			drag.slot = nb ? nb.top - r.top : pv ? r.top - pv.top : r.height || 1;
		} else {
			drag.slot = nb ? nb.left - r.left : pv ? r.left - pv.left : r.width || 1;
		}
		drag.container.classList.add('glow-sortable-dragging');
		drag.container.style.touchAction = 'none';
		drag.touched.add(drag.container);
		drag.el.classList.add('glow-sortable-lifted');
		drag.el.style.transition = 'none';
		for (const c of drag.children) {
			if (c !== drag!.el) c.style.transition = 'transform var(--glow-dur-fast, 140ms) ease';
		}
	}

	function activate(): void {
		if (!drag) return;
		drag.active = true;
		bindContainer();
		// Anchor the card to where it was grabbed, so in group mode it tracks
		// the cursor 1:1 across every container instead of snapping to slots.
		const r0 = drag.rects[drag.index];
		drag.grabDX = drag.startX - r0.left;
		drag.grabDY = drag.startY - r0.top;
	}

	/** Move the lifted card to follow the pointer. In group mode it's anchored
	 *  to the cursor in viewport space (continuous across containers); in
	 *  single-container mode it stays axis-locked, exactly as before. */
	function positionEl(e: PointerEvent): void {
		if (!drag) return;
		if (joinedGroup) {
			const base = drag.rects[drag.index];
			const x = e.clientX - drag.grabDX - base.left;
			const y = e.clientY - drag.grabDY - base.top;
			drag.el.style.transform = `translate(${x}px, ${y}px)`;
		} else {
			const dx = e.clientX - drag.startX;
			const dy = e.clientY - drag.startY;
			drag.el.style.transform = drag.vertical ? `translateY(${dy}px)` : `translateX(${dx}px)`;
		}
	}

	/** Move the dragged item from its current array into `target` at the
	 *  pointer's insertion point, then re-bind the drag to `target`'s freshly
	 *  rendered DOM so the gesture continues seamlessly in the new container. */
	let transferring = false;
	async function transfer(target: GroupMember, e: PointerEvent): Promise<void> {
		if (!drag) return;
		transferring = true;
		const d = drag;
		const tVert = target.isVertical();
		const tItems = target.getItems();

		// Insertion index = siblings whose midpoint the pointer is past, on the
		// target's axis. (The dragged element isn't in the target yet.)
		const tChildren = Array.from(target.node.children).filter(
			(c): c is HTMLElement => c instanceof HTMLElement
		);
		const pos = tVert ? e.clientY : e.clientX;
		let j = tChildren.length;
		for (let i = 0; i < tChildren.length; i++) {
			const rc = tChildren[i].getBoundingClientRect();
			const mid = tVert ? rc.top + rc.height / 2 : rc.left + rc.width / 2;
			if (pos < mid) {
				j = i;
				break;
			}
		}
		// The array — not the DOM — is the source of truth for item count, so a
		// consumer's empty-state placeholder child can't push the index past it.
		j = Math.min(j, tItems.length);

		// Settle any open gap in the old container before the node leaves it.
		for (const c of d.children) c.style.transform = '';

		const [moved] = d.sourceItems.splice(d.index, 1);
		tItems.splice(j, 0, moved);
		await tick();
		if (drag !== d) return; // gesture ended mid-transfer

		d.container = target.node;
		d.sourceItems = tItems;
		d.vertical = tVert;
		d.index = j;
		d.to = j;
		d.children = Array.from(target.node.children).filter(
			(c): c is HTMLElement => c instanceof HTMLElement
		);
		const fresh = d.children[j];
		if (!fresh) {
			transferring = false;
			return;
		}
		d.el = fresh;
		bindContainer();
		// Keep the card glued to the cursor — no snap into the new row.
		positionEl(e);
		transferring = false;
	}

	function onPointerMove(e: PointerEvent): void {
		if (!drag || e.pointerId !== drag.pointerId || transferring) return;
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

		// Cross-container: if the pointer is over a different container in the
		// same group, hand the item (and its data) over and re-bind there.
		if (joinedGroup) {
			const over = memberAt(e.clientX, e.clientY);
			if (over && over.node !== drag.container) {
				void transfer(over, e);
				return;
			}
		}

		// Follow the pointer (pointer-anchored in group mode, axis-locked else).
		positionEl(e);

		// Target index = how many sibling midpoints the pointer has crossed.
		const pos = drag.vertical ? e.clientY : e.clientX;
		let to = drag.index;
		for (let i = 0; i < drag.rects.length; i++) {
			if (i === drag.index) continue;
			const rc = drag.rects[i];
			const mid = drag.vertical ? rc.top + rc.height / 2 : rc.left + rc.width / 2;
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
				? drag.vertical
					? `translateY(${shift}px)`
					: `translateX(${shift}px)`
				: '';
		}
	}

	async function onPointerUp(e: PointerEvent): Promise<void> {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const d = drag;
		drag = null;
		transferring = false;
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

		// Clear all drag styling — every container the gesture passed through
		// returns to its original, untransformed order before the array mutates.
		for (const cont of d.touched) {
			cont.classList.remove('glow-sortable-dragging');
			cont.style.touchAction = '';
		}
		d.el.classList.remove('glow-sortable-lifted');
		for (const c of d.children) {
			c.style.transform = '';
			c.style.transition = '';
		}

		// Final settle within the current container. Any cross-container moves
		// already mutated their arrays live during the drag.
		if (to !== from) {
			const [moved] = d.sourceItems.splice(from, 1);
			d.sourceItems.splice(to, 0, moved);
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
			syncGroup();
		},
		destroy() {
			if (joinedGroup) groups.get(joinedGroup)?.delete(member);
			node.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
		}
	};
}) satisfies Action<HTMLElement, SortableOptions>;
