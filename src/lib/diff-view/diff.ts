// A line diff, hand-rolled.
//
// Every off-the-shelf diff package is either a few hundred kilobytes or drags a
// syntax highlighter along with it, and a component library should not put
// either in a consumer's bundle for one component. Myers' O(ND) algorithm is
// forty lines, so it lives here and is unit-tested directly
// (`tools/scripts/diff.test.mjs`) rather than only through the rendered
// component.

export type DiffLineType = 'context' | 'add' | 'remove';

/** One element-wise step of the edit script. */
export interface DiffOp<T> {
	type: 'equal' | 'insert' | 'delete';
	value: T;
}

/** A run of text within a line, flagged if it differs from its counterpart. */
export interface DiffSegment {
	text: string;
	changed: boolean;
}

export interface DiffLine {
	type: DiffLineType;
	content: string;
	/** 1-based line number on the left/old side. Absent on an added line. */
	oldNumber?: number;
	/** 1-based line number on the right/new side. Absent on a removed line. */
	newNumber?: number;
	/** Word-level runs, present only on a paired add/remove that stayed similar. */
	segments?: DiffSegment[];
}

/** One row of side-by-side output. Either half may be missing. */
export interface DiffRow {
	left?: DiffLine;
	right?: DiffLine;
}

/** A run of rows, either shown or folded away as unchanged. */
export interface DiffChunk<T> {
	kind: 'lines' | 'gap';
	items: T[];
}

export interface DiffStats {
	added: number;
	removed: number;
}

/**
 * Myers' greedy diff with a trace, then a backtrack over it.
 *
 * The trace snapshot is taken *before* each round, so `trace[d]` is the
 * furthest-reaching state after round `d - 1` — which is exactly what the
 * backtrack needs to find the predecessor of an endpoint found in round `d`.
 */
export function diffSequences<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean = Object.is): DiffOp<T>[] {
	const n = a.length;
	const m = b.length;
	const max = n + m;
	// Offset by max + 1 rather than max: the k = ±d edges read v[k ± 1], which
	// would otherwise index one slot outside the array on the very first round.
	const off = max + 1;
	const v = new Int32Array(2 * max + 3);
	const trace: Int32Array[] = [];

	let end = 0;
	outer: for (let d = 0; d <= max; d++) {
		trace.push(v.slice());
		end = d;
		for (let k = -d; k <= d; k += 2) {
			let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
			let y = x - k;
			while (x < n && y < m && eq(a[x], b[y])) {
				x++;
				y++;
			}
			v[off + k] = x;
			if (x >= n && y >= m) break outer;
		}
	}

	const ops: DiffOp<T>[] = [];
	let x = n;
	let y = m;
	for (let d = end; d > 0; d--) {
		const vd = trace[d];
		const k = x - y;
		const prevK = k === -d || (k !== d && vd[off + k - 1] < vd[off + k + 1]) ? k + 1 : k - 1;
		const prevX = vd[off + prevK];
		const prevY = prevX - prevK;
		while (x > prevX && y > prevY) {
			ops.push({ type: 'equal', value: a[--x] });
			y--;
		}
		if (x === prevX) ops.push({ type: 'insert', value: b[--y] });
		else ops.push({ type: 'delete', value: a[--x] });
	}
	while (x > 0 && y > 0) {
		ops.push({ type: 'equal', value: a[--x] });
		y--;
	}

	return ops.reverse();
}

/**
 * Words, punctuation and whitespace as separate tokens. Splitting on
 * whitespace alone makes `foo(bar)` → `foo(baz)` a whole-token change; keeping
 * punctuation apart narrows the highlight to the part that actually moved.
 */
export function tokenize(line: string): string[] {
	return line.match(/\s+|[A-Za-z0-9_$]+|[^\sA-Za-z0-9_$]/g) ?? [];
}

function merge(segments: DiffSegment[]): DiffSegment[] {
	const out: DiffSegment[] = [];
	for (const seg of segments) {
		const last = out[out.length - 1];
		if (last && last.changed === seg.changed) last.text += seg.text;
		else out.push({ ...seg });
	}
	return out;
}

/**
 * Word-level runs for a removed/added pair. Returns `undefined` when the two
 * lines share too little to be worth pairing — highlighting nine tenths of a
 * rewritten line is noise, and the whole-line tint already says the same thing.
 */
export function diffWords(
	before: string,
	after: string,
	similarity = 0.4
): { before: DiffSegment[]; after: DiffSegment[] } | undefined {
	const ops = diffSequences(tokenize(before), tokenize(after));
	let common = 0;
	for (const op of ops) if (op.type === 'equal') common += op.value.length;
	const longest = Math.max(before.length, after.length);
	if (longest === 0 || common / longest < similarity) return undefined;

	const left: DiffSegment[] = [];
	const right: DiffSegment[] = [];
	for (const op of ops) {
		if (op.type === 'equal') {
			left.push({ text: op.value, changed: false });
			right.push({ text: op.value, changed: false });
		} else if (op.type === 'delete') {
			left.push({ text: op.value, changed: true });
		} else {
			right.push({ text: op.value, changed: true });
		}
	}
	return { before: merge(left), after: merge(right) };
}

function splitLines(text: string): string[] {
	if (text === '') return [];
	// A trailing newline terminates the last line rather than starting an empty
	// one — otherwise every file that ends the way files should shows a phantom
	// final line.
	return text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
}

export interface DiffLinesOptions {
	/** Word-level runs on paired add/remove lines. */
	words?: boolean;
}

/** The unified sequence of lines, numbered on both sides. */
export function diffLines(oldText: string, newText: string, options: DiffLinesOptions = {}): DiffLine[] {
	const { words = true } = options;
	const ops = diffSequences(splitLines(oldText), splitLines(newText));

	const lines: DiffLine[] = [];
	let oldNumber = 0;
	let newNumber = 0;
	for (const op of ops) {
		if (op.type === 'equal') lines.push({ type: 'context', content: op.value, oldNumber: ++oldNumber, newNumber: ++newNumber });
		else if (op.type === 'delete') lines.push({ type: 'remove', content: op.value, oldNumber: ++oldNumber });
		else lines.push({ type: 'add', content: op.value, newNumber: ++newNumber });
	}

	const grouped = groupChanges(lines);
	if (words) pairWords(grouped);
	return grouped;
}

/**
 * Sort each run of changed lines into removals-then-additions. Myers is free to
 * interleave them, and the order inside a block carries no meaning — but every
 * reader expects `-` above `+`, and pairing lines for word highlighting (and
 * for side-by-side rows) needs the two sides in a known order.
 */
function groupChanges(lines: DiffLine[]): DiffLine[] {
	const out: DiffLine[] = [];
	for (let i = 0; i < lines.length; ) {
		if (lines[i].type === 'context') {
			out.push(lines[i++]);
			continue;
		}
		let end = i;
		while (end < lines.length && lines[end].type !== 'context') end++;
		const block = lines.slice(i, end);
		out.push(...block.filter((l) => l.type === 'remove'), ...block.filter((l) => l.type === 'add'));
		i = end;
	}
	return out;
}

/**
 * Word-level highlighting is the expensive half of a diff — a second Myers run
 * per line — so it only ever runs on lines that face each other: the i-th
 * removal against the i-th addition of the same block. An unpaired line has
 * nothing to be highlighted against.
 */
function pairWords(lines: DiffLine[]): void {
	let i = 0;
	while (i < lines.length) {
		if (lines[i].type !== 'remove') {
			i++;
			continue;
		}
		let removeEnd = i;
		while (removeEnd < lines.length && lines[removeEnd].type === 'remove') removeEnd++;
		let addEnd = removeEnd;
		while (addEnd < lines.length && lines[addEnd].type === 'add') addEnd++;

		const pairs = Math.min(removeEnd - i, addEnd - removeEnd);
		for (let p = 0; p < pairs; p++) {
			const before = lines[i + p];
			const after = lines[removeEnd + p];
			const segments = diffWords(before.content, after.content);
			if (segments) {
				before.segments = segments.before;
				after.segments = segments.after;
			}
		}
		i = addEnd > removeEnd ? addEnd : removeEnd;
	}
}

/** Side-by-side rows: removals aligned against the additions that replaced them. */
export function toRows(lines: DiffLine[]): DiffRow[] {
	const rows: DiffRow[] = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (line.type === 'context') {
			rows.push({ left: line, right: line });
			i++;
			continue;
		}
		const removes: DiffLine[] = [];
		const adds: DiffLine[] = [];
		while (i < lines.length && lines[i].type === 'remove') removes.push(lines[i++]);
		while (i < lines.length && lines[i].type === 'add') adds.push(lines[i++]);
		for (let p = 0; p < Math.max(removes.length, adds.length); p++) {
			rows.push({ left: removes[p], right: adds[p] });
		}
	}
	return rows;
}

/**
 * Fold runs of unchanged rows longer than `2 * context` into a gap, keeping
 * `context` rows either side of every change. A gap of one row is not worth a
 * click, so it stays expanded.
 */
export function collapse<T>(items: T[], changed: (item: T) => boolean, context: number): DiffChunk<T>[] {
	const keep = new Array<boolean>(items.length).fill(false);
	for (let i = 0; i < items.length; i++) {
		if (!changed(items[i])) continue;
		for (let j = Math.max(0, i - context); j <= Math.min(items.length - 1, i + context); j++) keep[j] = true;
	}

	const chunks: DiffChunk<T>[] = [];
	for (let i = 0; i < items.length; ) {
		const kind = keep[i] ? 'lines' : 'gap';
		let end = i;
		while (end < items.length && keep[end] === keep[i]) end++;
		const run = items.slice(i, end);
		// A one-row fold costs a click to reveal a single line, and the button
		// itself is taller than the line it hides.
		chunks.push({ kind: kind === 'gap' && run.length < 2 ? 'lines' : kind, items: run });
		i = end;
	}

	// Two adjacent 'lines' chunks happen when a short gap was un-folded above.
	return chunks.reduce<DiffChunk<T>[]>((acc, chunk) => {
		const last = acc[acc.length - 1];
		if (last && last.kind === 'lines' && chunk.kind === 'lines') last.items.push(...chunk.items);
		else acc.push(chunk);
		return acc;
	}, []);
}

export function diffStats(lines: DiffLine[]): DiffStats {
	let added = 0;
	let removed = 0;
	for (const line of lines) {
		if (line.type === 'add') added++;
		else if (line.type === 'remove') removed++;
	}
	return { added, removed };
}
