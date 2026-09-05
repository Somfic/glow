// The diff algorithm on its own — no browser, no build.
//
//   node tools/scripts/diff.test.mjs
//
// Imported straight from the .ts: node strips the types. The rendered
// component is covered separately by `diff-view.test.mjs`.

import { checks } from "../harness/check.mjs";
import {
	collapse,
	diffLines,
	diffSequences,
	diffStats,
	diffWords,
	tokenize,
	toRows
} from "../../src/lib/diff-view/diff.ts";

const t = checks("diff");

const sign = { add: "+", remove: "-", context: "c" };
const shape = (lines) => lines.map((l) => `${sign[l.type]}${l.content}`).join("|");

// --- identical inputs -------------------------------------------------------
{
	const lines = diffLines("a\nb\nc\n", "a\nb\nc\n");
	t.ok("identical input is all context", lines.every((l) => l.type === "context"));
	t.ok("identical input keeps every line", lines.length === 3);
	t.ok("identical input has no edits", diffStats(lines).added === 0 && diffStats(lines).removed === 0);
	t.ok(
		"both sides are numbered in step",
		lines.every((l, i) => l.oldNumber === i + 1 && l.newNumber === i + 1)
	);
}

// --- total rewrite ----------------------------------------------------------
{
	const lines = diffLines("one\ntwo\nthree", "alpha\nbeta\ngamma");
	t.ok("a rewrite shares no context", lines.every((l) => l.type !== "context"));
	const stats = diffStats(lines);
	t.ok("a rewrite counts 3 removed and 3 added", stats.removed === 3 && stats.added === 3);
	t.ok(
		"removals come before the additions that replace them",
		shape(lines) === "-one|-two|-three|+alpha|+beta|+gamma"
	);
	t.ok(
		"unrelated lines get no word highlighting",
		lines.every((l) => l.segments === undefined)
	);
}

// --- insertion at the start and at the end ----------------------------------
{
	const start = diffLines("b\nc", "a\nb\nc");
	t.ok("an insertion at the start is one add", shape(start) === "+a|cb|cc");
	t.ok("the added first line has no old number", start[0].oldNumber === undefined && start[0].newNumber === 1);
	t.ok("context after an insertion is offset by one", start[1].oldNumber === 1 && start[1].newNumber === 2);

	const end = diffLines("a\nb", "a\nb\nc");
	t.ok("an insertion at the end is one add", shape(end) === "ca|cb|+c");
	t.ok("the added last line is numbered on the new side only", end[2].newNumber === 3 && end[2].oldNumber === undefined);

	const removedStart = diffLines("a\nb\nc", "b\nc");
	t.ok("a deletion at the start is one remove", shape(removedStart) === "-a|cb|cc");
}

// --- empty input ------------------------------------------------------------
{
	t.ok("empty against empty is nothing at all", diffLines("", "").length === 0);
	t.ok("empty against content is all additions", shape(diffLines("", "a\nb")) === "+a|+b");
	t.ok("content against empty is all removals", shape(diffLines("a\nb", "")) === "-a|-b");
	t.ok("an empty sequence has an empty edit script", diffSequences([], []).length === 0);
	t.ok("tokenizing an empty line gives no tokens", tokenize("").length === 0);
}

// --- newline handling -------------------------------------------------------
{
	t.ok("a trailing newline does not invent a final empty line", diffLines("a\n", "a\n").length === 1);
	t.ok("CRLF input diffs the same as LF", diffLines("a\r\nb\r\n", "a\nb\n").every((l) => l.type === "context"));
	t.ok("a blank line in the middle survives", diffLines("a\n\nb", "a\n\nb").length === 3);
}

// --- the edit script itself -------------------------------------------------
{
	const ops = diffSequences("ABCABBA".split(""), "CBABAC".split(""));
	t.ok(
		"the edit script replays into the target",
		ops.filter((o) => o.type !== "delete").map((o) => o.value).join("") === "CBABAC"
	);
	t.ok(
		"the edit script replays back into the source",
		ops.filter((o) => o.type !== "insert").map((o) => o.value).join("") === "ABCABBA"
	);
	// Myers' own worked example: this pair is a 5-edit script, and a longer one
	// would mean the algorithm is finding a suboptimal path.
	t.ok("it finds the minimal edit script", ops.filter((o) => o.type !== "equal").length === 5);
}

// --- word-level runs --------------------------------------------------------
{
	const lines = diffLines("const x = compute(a, b);", "const x = compute(a, c);");
	const removed = lines.find((l) => l.type === "remove");
	const added = lines.find((l) => l.type === "add");
	t.ok("a near-identical pair gets word runs", !!removed.segments && !!added.segments);
	t.ok(
		"the runs reassemble into the line",
		removed.segments.map((s) => s.text).join("") === removed.content &&
			added.segments.map((s) => s.text).join("") === added.content
	);
	t.ok(
		"only the changed word is flagged",
		removed.segments.filter((s) => s.changed).map((s) => s.text).join("") === "b" &&
			added.segments.filter((s) => s.changed).map((s) => s.text).join("") === "c"
	);
	t.ok("dissimilar lines are not word-diffed", diffWords("aaaa", "zzzzzz") === undefined);
	t.ok("only paired lines carry runs", diffLines("a\nb", "a\nb\nc").every((l) => !l.segments));
}

// --- side-by-side rows ------------------------------------------------------
{
	const rows = toRows(diffLines("a\nold\nc", "a\nnew\nc"));
	t.ok("a replacement is one row with both halves", rows.length === 3 && !!rows[1].left && !!rows[1].right);
	t.ok("the halves face each other", rows[1].left.content === "old" && rows[1].right.content === "new");

	const uneven = toRows(diffLines("a\nx", "a\nx\ny\nz"));
	t.ok("a pure insertion leaves the left half empty", uneven.slice(2).every((r) => r.left === undefined));
	t.ok(
		"every context row appears on both sides",
		toRows(diffLines("a\nb", "a\nb")).every((r) => r.left === r.right)
	);
}

// --- collapsing -------------------------------------------------------------
{
	const lines = diffLines(Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n"), [
		...Array.from({ length: 20 }, (_, i) => `line ${i}`),
		"CHANGED",
		...Array.from({ length: 19 }, (_, i) => `line ${i + 21}`)
	].join("\n"));
	const chunks = collapse(lines, (l) => l.type !== "context", 3);
	t.ok("long unchanged runs fold into gaps", chunks.filter((c) => c.kind === "gap").length === 2);
	t.ok(
		"nothing is lost by folding",
		chunks.reduce((n, c) => n + c.items.length, 0) === lines.length
	);
	t.ok(
		"three lines of context survive on each side of a change",
		chunks.find((c) => c.kind === "lines" && c.items.some((l) => l.type !== "context")).items.length === 8
	);
	t.ok(
		"a file with no changes is one gap",
		collapse(diffLines("a\nb\nc\nd", "a\nb\nc\nd"), (l) => l.type !== "context", 3).every((c) => c.kind === "gap")
	);
	// A fold worth less than a click is not offered as one.
	const tight = collapse(diffLines("a\nb\nc\nd\ne", "a\nb\nX\nd\ne"), (l) => l.type !== "context", 1);
	t.ok("a one-line gap stays expanded", tight.every((c) => c.kind === "lines"));
	t.ok("adjacent expanded runs merge into one chunk", tight.length === 1);
}

t.done();
