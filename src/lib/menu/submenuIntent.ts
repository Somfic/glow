/**
 * Submenu pointer intent — the "safe triangle".
 *
 * A submenu opens beside the row that owns it, so the natural pointer path to
 * it is a diagonal that leaves the trigger row and crosses a sliver of the rows
 * above or below on the way. Closing on `mouseleave` kills the submenu
 * mid-journey; closing on a plain timer makes the menu sticky and closes the
 * wrong thing when the user genuinely moves away.
 *
 * So instead of asking "is the pointer still over the trigger?" we ask "is the
 * pointer heading for the panel?": the triangle spanned by the pointer and the
 * panel's near edge counts as still-inside. A pointer inside it is on its way,
 * however many sibling rows it crosses. A pointer outside it gets a short grace
 * period — and none at all if it is moving away quickly, since a fast pointer
 * travelling away from the panel has already made its intent clear.
 *
 * The apex only ever moves *toward* the panel (see `progress`), so the cone
 * narrows as the pointer closes in. Without that it would drift sideways with
 * the pointer and hold the submenu open for a path that never arrives.
 *
 * Everything is derived from the panel's live rect rather than from an assumed
 * direction, which is what makes the awkward cases fall out for free:
 * `coneSide` picks whichever edge faces the pointer, so a submenu that swung
 * left near the viewport edge gets a cone pointing left, and one that had to
 * stack above or below gets one pointing up or down.
 */

import { containsThrough } from '../util/portal.js';

export interface Point {
	x: number;
	y: number;
}

/** The parts of a `DOMRect` the cone needs — a plain object works too. */
export interface ConeRect {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/** Which side of the panel faces the pointer, i.e. which way the cone points. */
export type ConeSide = 'left' | 'right' | 'top' | 'bottom';

/**
 * The side of `rect` facing `from`. Sideways wins when the pointer is beside
 * the panel, which is the common case; a pointer horizontally within the
 * panel's span is looking at a submenu stacked above or below it instead.
 */
export function coneSide(rect: ConeRect, from: Point): ConeSide {
	if (from.x <= rect.left) return 'left';
	if (from.x >= rect.right) return 'right';
	return from.y <= rect.top ? 'top' : 'bottom';
}

/**
 * The two endpoints of the panel edge facing `from`, each pushed `buffer` px
 * further out. The padding matters: panels have rounded corners and this one
 * deliberately overlaps its parent menu by a pixel, so an unpadded edge leaves
 * a dead sliver at each end where a legitimate path reads as a miss.
 */
export function nearEdge(rect: ConeRect, from: Point, buffer = 0): [Point, Point] {
	switch (coneSide(rect, from)) {
		case 'left':
			return [
				{ x: rect.left, y: rect.top - buffer },
				{ x: rect.left, y: rect.bottom + buffer }
			];
		case 'right':
			return [
				{ x: rect.right, y: rect.top - buffer },
				{ x: rect.right, y: rect.bottom + buffer }
			];
		case 'top':
			return [
				{ x: rect.left - buffer, y: rect.top },
				{ x: rect.right + buffer, y: rect.top }
			];
		case 'bottom':
			return [
				{ x: rect.left - buffer, y: rect.bottom },
				{ x: rect.right + buffer, y: rect.bottom }
			];
	}
}

function edgeSign(p: Point, a: Point, b: Point): number {
	return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
}

/**
 * Point-in-triangle by edge sign. The boundary counts as inside, which is what
 * we want here: the apex *is* the pointer's own last position, so a pointer
 * that has not moved must not read as outside its own cone.
 */
export function inTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
	const d1 = edgeSign(p, a, b);
	const d2 = edgeSign(p, b, c);
	const d3 = edgeSign(p, c, a);
	const negative = d1 < 0 || d2 < 0 || d3 < 0;
	const positive = d1 > 0 || d2 > 0 || d3 > 0;
	return !(negative && positive);
}

/** Is `p` inside the cone spanned by `apex` and the near edge of `rect`? */
export function inCone(p: Point, apex: Point, rect: ConeRect, buffer = 0): boolean {
	const [a, b] = nearEdge(rect, apex, buffer);
	return inTriangle(p, apex, a, b);
}

const inRect = (rect: ConeRect, p: Point) =>
	p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom;

/**
 * How far along the axis pointing at the panel `p` sits — bigger is closer.
 * One scalar is enough: only the perpendicular axis says whether the pointer is
 * making progress, and drift along the edge is not progress.
 */
function progress(p: Point, side: ConeSide): number {
	switch (side) {
		case 'left':
			return p.x;
		case 'right':
			return -p.x;
		case 'top':
			return p.y;
		case 'bottom':
			return -p.y;
	}
}

export interface SubmenuIntentOptions {
	/**
	 * The open submenu panel. Read on every move, so a panel that is bound late
	 * (this one is portalled), repositioned, or swapped for a sibling's is
	 * picked up without restarting the watch.
	 */
	panel: () => Element | null | undefined;
	/**
	 * Elements that count as inside regardless of geometry — the trigger row.
	 * Deliberately not the whole parent menu: hovering an unrelated row on the
	 * far side of it is exactly the case that should close the submenu.
	 */
	safe?: () => (Element | null | undefined)[];
	/** Called once the pointer's path says it is not coming. */
	close: () => void;
	/** ms of grace after the pointer leaves the cone. */
	grace?: number;
	/** px added to each end of the near edge. */
	buffer?: number;
	/** px/ms at or above which a pointer moving away closes immediately. */
	fastSpeed?: number;
}

export interface SubmenuIntent {
	/**
	 * Is a pointer at these viewport coordinates on its way to the open panel?
	 * False when no submenu is being guarded.
	 *
	 * Menus call this from their `mouseenter` handlers — "is this row being
	 * crossed, or chosen?" — and it takes a point rather than reading a cached
	 * flag for a reason: `mouseenter` is the compatibility event for
	 * `pointerenter`, which fires *before* the `pointermove` that would refresh
	 * a cached verdict. A cached answer is a move stale, and a move stale here
	 * is a submenu that refuses to switch to the row next to it.
	 */
	heading(x: number, y: number): boolean;
	/** Guard an open submenu. Returns a cleanup to call when it closes. */
	watch(options: SubmenuIntentOptions): () => void;
}

/**
 * One per menu component. Nested submenus each get their own `watch()`: a level
 * keeps its panel as its target, and a pointer down in a deeper level is inside
 * that panel, so every ancestor reads "inside" and the whole chain stays open.
 */
export function createSubmenuIntent(): SubmenuIntent {
	// Set for as long as a submenu is being watched; the closure it holds shares
	// the live apex with that watch's pointermove handler.
	let verdict: ((p: Point) => boolean) | null = null;

	return {
		heading(x: number, y: number) {
			return verdict?.({ x, y }) ?? false;
		},

		watch(options: SubmenuIntentOptions) {
			const grace = options.grace ?? 140;
			const buffer = options.buffer ?? 12;
			const fastSpeed = options.fastSpeed ?? 0.9;

			// Apex of the cone. Null while the pointer is inside the panel,
			// where a cone would have nothing to point at.
			let apex: Point | null = null;
			let previous: Point | null = null;
			let previousTime = 0;
			let timer = 0;

			// Answer `heading()` from the same apex the move handler maintains.
			// Rects rather than DOM containment here: a `mouseenter` gives us a
			// point, and the row under it is the row asking the question anyway.
			const rule = (p: Point): boolean => {
				const panel = options.panel();
				if (!panel) return true;
				const rect = panel.getBoundingClientRect();
				// Nothing measured yet — the submenu has only just opened, so the
				// pointer is by definition still on its trigger.
				if (rect.width === 0 || rect.height === 0) return true;
				if (inRect(rect, p)) return true;
				if ((options.safe?.() ?? []).some((el) => el && inRect(el.getBoundingClientRect(), p)))
					return true;
				return inCone(p, apex ?? p, rect, buffer);
			};
			verdict = rule;

			const cancel = () => {
				if (timer) clearTimeout(timer);
				timer = 0;
			};

			const scheduleClose = (delay: number) => {
				cancel();
				timer = window.setTimeout(() => {
					timer = 0;
					options.close();
				}, delay);
			};

			const onMove = (e: PointerEvent) => {
				// A touch or pen contact produces one `pointermove` at the point
				// of contact, not a path — there is no intent to read there, and
				// guessing at one would strand submenus open under a finger that
				// has already lifted. Tap-to-open still works: that runs off
				// click, which this never sees. Keyboard never gets here at all.
				if (e.pointerType !== 'mouse') return;

				const p = { x: e.clientX, y: e.clientY };
				const prev = previous;
				const dt = e.timeStamp - previousTime;
				const speed = prev && dt > 0 ? Math.hypot(p.x - prev.x, p.y - prev.y) / dt : 0;
				previous = p;
				previousTime = e.timeStamp;

				const panel = options.panel();
				const target = e.target as Element | null;

				// `containsThrough`, not `contains`: these panels portal to <body>
				// to escape their parent's `overflow`, so a deeper submenu is a
				// DOM sibling of the one that logically owns it. Plain containment
				// would report the pointer as having left the panel the moment it
				// reached the level below.
				if (panel && target && containsThrough(panel, target)) {
					apex = null;
					cancel();
					return;
				}

				const safe = options.safe?.() ?? [];
				if (target && safe.some((el) => el && containsThrough(el, target))) {
					apex = p;
					cancel();
					return;
				}

				if (!panel) return;
				const rect = panel.getBoundingClientRect();
				// A panel still waiting for its first layout pass has no edge to
				// aim at; leave the verdict alone rather than closing on it.
				if (rect.width === 0 || rect.height === 0) return;

				apex ??= p;
				const side = coneSide(rect, apex);

				if (inCone(p, apex, rect, buffer)) {
					cancel();
					if (progress(p, side) > progress(apex, side)) apex = p;
					return;
				}

				const away = prev ? progress(p, side) < progress(prev, side) : false;
				scheduleClose(away && speed >= fastSpeed ? 0 : grace);
			};

			// A pointer that leaves the window stops producing moves, so the cone
			// can never rule on it again. Treat it as leaving the menu system.
			const onOut = (e: PointerEvent) => {
				if (e.pointerType !== 'mouse') return;
				if (e.relatedTarget) return;
				scheduleClose(grace);
			};

			document.addEventListener('pointermove', onMove, true);
			document.addEventListener('pointerout', onOut, true);

			return () => {
				cancel();
				if (verdict === rule) verdict = null;
				document.removeEventListener('pointermove', onMove, true);
				document.removeEventListener('pointerout', onOut, true);
			};
		}
	};
}
