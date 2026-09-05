// Geometry for the chart components. Deliberately dependency-free: a polyline,
// a monotone cubic and a tick scale are a few hundred lines, where d3 (or any
// charting library) would be a bigger install than the whole of glow and would
// bring a build story this package does not have.

/** A point with an explicit x. Use it when the samples are not evenly spaced. */
export interface ChartPoint {
	x: number;
	/** `null` is a gap — the line breaks rather than interpolating over it. */
	y: number | null;
}

/** A series value: a bare number (x is its index), or an explicit `{ x, y }`. */
export type ChartDatum = number | null | ChartPoint;

export interface Extent {
	min: number;
	max: number;
}

/**
 * Bare numbers get their index as x; `{ x, y }` points keep theirs. Sorted by x
 * because everything downstream (the line, the crosshair's nearest-point search,
 * the x axis) assumes ascending order, and a caller handing us a map's values or
 * an unordered API response is the normal case, not the exotic one.
 */
export function toPoints(data: readonly ChartDatum[] | undefined): ChartPoint[] {
	if (!data?.length) return [];

	const points: ChartPoint[] = data.map((d, i) => {
		if (d === null || d === undefined) return { x: i, y: null };
		if (typeof d === 'number') return { x: i, y: Number.isFinite(d) ? d : null };
		return { x: d.x, y: d.y === null || !Number.isFinite(d.y) ? null : d.y };
	});

	// `sort` is stable in every engine we target, so duplicate x values keep the
	// order they were given in.
	return points.sort((a, b) => a.x - b.x);
}

/** Extent over the finite values only; `null` when nothing is plottable. */
export function extentOf(values: readonly (number | null)[]): Extent | null {
	let min = Infinity;
	let max = -Infinity;
	for (const v of values) {
		if (v === null || !Number.isFinite(v)) continue;
		if (v < min) min = v;
		if (v > max) max = v;
	}
	return min === Infinity ? null : { min, max };
}

/**
 * Widens a zero-height range so the scale never divides by zero. An all-equal
 * series is a real thing to plot (a flat month of uptime), and it should read as
 * a line through the middle rather than as a division by zero or a line welded
 * to the top edge — hence the symmetric pad rather than `max + 1`.
 */
export function padExtent(e: Extent): Extent {
	if (e.max > e.min) return e;
	const pad = Math.abs(e.min) > 1e-9 ? Math.abs(e.min) * 0.1 : 1;
	return { min: e.min - pad, max: e.max + pad };
}

/** Maps a domain onto a pixel range. `invert` is what the crosshair needs. */
export function scale(domain: Extent, from: number, to: number) {
	const span = domain.max - domain.min;
	return {
		of: (v: number) => (span === 0 ? (from + to) / 2 : from + ((v - domain.min) / span) * (to - from)),
		invert: (px: number) =>
			to === from ? domain.min : domain.min + ((px - from) / (to - from)) * span
	};
}

type Pixel = { x: number; y: number | null };

/** Contiguous runs of plottable points — one subpath each, so gaps stay gaps. */
function runs(points: readonly Pixel[]): { x: number; y: number }[][] {
	const out: { x: number; y: number }[][] = [];
	let current: { x: number; y: number }[] = [];
	for (const p of points) {
		if (p.y === null) {
			if (current.length) out.push(current);
			current = [];
		} else {
			current.push({ x: p.x, y: p.y });
		}
	}
	if (current.length) out.push(current);
	return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Monotone cubic (Fritsch–Carlson), not a Catmull-Rom or a plain bezier: those
 * overshoot, and an overshoot in a chart is a lie — a smoothed series of
 * non-negative values must not dip below zero between two samples.
 */
function monotoneSegments(pts: { x: number; y: number }[]): string {
	const n = pts.length;
	const slopes: number[] = [];
	for (let i = 0; i < n - 1; i++) {
		const dx = pts[i + 1].x - pts[i].x;
		slopes.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
	}

	// Tangents: the three-point difference, zeroed wherever the data turns, then
	// clamped to 3x the neighbouring secant, which is what keeps it monotone.
	const tangents: number[] = new Array(n);
	tangents[0] = slopes[0];
	tangents[n - 1] = slopes[n - 2];
	for (let i = 1; i < n - 1; i++) {
		if (slopes[i - 1] * slopes[i] <= 0) tangents[i] = 0;
		else tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
	}
	for (let i = 0; i < n - 1; i++) {
		if (slopes[i] === 0) {
			tangents[i] = 0;
			tangents[i + 1] = 0;
			continue;
		}
		const a = tangents[i] / slopes[i];
		const b = tangents[i + 1] / slopes[i];
		const h = Math.hypot(a, b);
		if (h > 3) {
			tangents[i] = ((3 * a) / h) * slopes[i];
			tangents[i + 1] = ((3 * b) / h) * slopes[i];
		}
	}

	let d = '';
	for (let i = 0; i < n - 1; i++) {
		const dx = (pts[i + 1].x - pts[i].x) / 3;
		d +=
			` C ${round(pts[i].x + dx)} ${round(pts[i].y + tangents[i] * dx)}` +
			` ${round(pts[i + 1].x - dx)} ${round(pts[i + 1].y - tangents[i + 1] * dx)}` +
			` ${round(pts[i + 1].x)} ${round(pts[i + 1].y)}`;
	}
	return d;
}

/**
 * The line. A one-point run emits a zero-length subpath, which paints as a dot
 * under `stroke-linecap: round` — that is the wanted behaviour for a series with
 * a single sample, or with samples marooned between two gaps.
 */
export function linePath(points: readonly Pixel[], smooth = false): string {
	let d = '';
	for (const run of runs(points)) {
		d += `M ${round(run[0].x)} ${round(run[0].y)}`;
		if (run.length === 1) {
			d += ` L ${round(run[0].x)} ${round(run[0].y)}`;
		} else if (smooth && run.length > 2) {
			d += monotoneSegments(run);
		} else {
			for (let i = 1; i < run.length; i++) d += ` L ${round(run[i].x)} ${round(run[i].y)}`;
		}
		d += ' ';
	}
	return d.trim();
}

/** The fill under the line, closed to `baseY`. One shape per run, so a gap in
 *  the data is a gap in the fill rather than a wedge across it. */
export function areaPath(points: readonly Pixel[], baseY: number, smooth = false): string {
	let d = '';
	for (const run of runs(points)) {
		if (run.length === 1) continue; // a single sample has no area to shade
		d += `M ${round(run[0].x)} ${round(baseY)} L ${round(run[0].x)} ${round(run[0].y)}`;
		if (smooth && run.length > 2) d += monotoneSegments(run);
		else for (let i = 1; i < run.length; i++) d += ` L ${round(run[i].x)} ${round(run[i].y)}`;
		d += ` L ${round(run[run.length - 1].x)} ${round(baseY)} Z `;
	}
	return d.trim();
}

/**
 * Ticks on 1/2/5 x 10^n steps, the same ladder every axis library converges on —
 * those are the intervals whose labels a reader can add up in their head.
 * Returns the tick values; the caller decides the extended domain.
 */
export function niceTicks(domain: Extent, count = 5): number[] {
	const span = domain.max - domain.min;
	if (span <= 0 || !Number.isFinite(span)) return [domain.min];

	const rough = span / Math.max(1, count);
	const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
	const normalised = rough / magnitude;
	const step = (normalised >= 5 ? 10 : normalised >= 2 ? 5 : normalised >= 1 ? 2 : 1) * magnitude;

	const ticks: number[] = [];
	const first = Math.ceil(domain.min / step) * step;
	// Floating-point steps drift, so the loop counts integers and multiplies.
	for (let i = 0; first + i * step <= domain.max + step * 1e-9; i++) {
		const v = first + i * step;
		// Snap away the 0.30000000000000004s that would otherwise reach a label.
		ticks.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toFixed(12)));
	}
	return ticks;
}

/** A short, human default for an axis label or a tooltip readout. */
export function formatNumber(v: number): string {
	if (!Number.isFinite(v)) return '—';
	const abs = Math.abs(v);
	if (abs >= 1_000_000_000) return `${round(v / 1_000_000_000)}B`;
	if (abs >= 1_000_000) return `${round(v / 1_000_000)}M`;
	if (abs >= 10_000) return `${round(v / 1000)}k`;
	if (abs >= 1 || v === 0) return String(Math.round(v * 100) / 100);
	return String(Number(v.toPrecision(3)));
}

/**
 * Width from the element, for charts that size themselves. Returns the teardown
 * so the caller's `$effect` can just hand it back.
 */
export function watchWidth(el: Element, onWidth: (width: number) => void): () => void {
	const observer = new ResizeObserver((entries) => {
		for (const entry of entries) {
			// A hidden or not-yet-laid-out ancestor reports 0; taking it would
			// collapse the chart and then need a second frame to recover, so the
			// last good width (or the SSR default) is kept instead.
			if (entry.contentRect.width > 0) onWidth(entry.contentRect.width);
		}
	});
	observer.observe(el);
	return () => observer.disconnect();
}

/** How many distinct series the built-in palette and marker set cover before
 *  they repeat. Past this, a chart needs a different design, not a 7th hue. */
export const SERIES_SLOTS = 6;

/**
 * Dash pattern per series slot. Colour alone does not separate series for a
 * dichromatic reader (and does not survive a greyscale print at all), so the
 * stroke pattern carries the same distinction — slot 0 stays solid because the
 * single-series case is the common one and a dashed lone line looks broken.
 */
export const SERIES_DASH = ['', '6 4', '1 4', '10 4 2 4', '3 3', '12 4 1 4'];

/** Marker outline for a series slot, so a point is identifiable by shape as
 *  well as by hue. Same reason as the dashes. */
export function markerPath(slot: number, cx: number, cy: number, r: number): string {
	switch (slot % 5) {
		case 1: // square
			return `M ${cx - r} ${cy - r} H ${cx + r} V ${cy + r} H ${cx - r} Z`;
		case 2: // triangle
			return `M ${cx} ${cy - r * 1.15} L ${cx + r} ${cy + r * 0.8} L ${cx - r} ${cy + r * 0.8} Z`;
		case 3: // diamond
			return `M ${cx} ${cy - r * 1.25} L ${cx + r * 1.25} ${cy} L ${cx} ${cy + r * 1.25} L ${cx - r * 1.25} ${cy} Z`;
		case 4: // triangle, pointing down
			return `M ${cx} ${cy + r * 1.15} L ${cx + r} ${cy - r * 0.8} L ${cx - r} ${cy - r * 0.8} Z`;
		default: // circle, drawn as arcs so every marker is one <path>
			return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
	}
}
