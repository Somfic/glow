// Syntax highlighting for a diff, borrowed from the one the library already
// has. `code/highlighter.ts` (Shiki) highlights a whole file at once and hands
// back a `<pre><code>` block; a diff needs it a line at a time, and needs the
// word-level runs to survive the colouring. So this module does two things and
// owns no highlighter of its own:
//
//   1. Split Shiki's output back into per-line HTML.
//   2. Re-apply the word runs on top of the coloured tokens.
//
// Both run in the browser only — `DOMParser` is the parser, because Shiki's
// output nests spans and a regex over it is a bug waiting to happen.

import { highlightCode, inferLanguageFromFilename } from '../code/highlighter.js';
import type { DiffSegment } from './diff.js';

export { inferLanguageFromFilename };

/**
 * Per-line inner HTML, in file order. An empty array means "no highlighting" —
 * every caller falls back to plain text, which is the whole point: a diff that
 * never colours is fine, a diff that fails to render is not.
 */
export async function highlightLines(code: string, lang: string | undefined, theme: string): Promise<string[]> {
	if (typeof window === 'undefined' || !code || !lang) return [];
	try {
		const html = await highlightCode(code, lang, theme);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const lines = doc.querySelectorAll('.line');
		// A `pre` with no `.line` spans means the fallback path in
		// `highlightCode` ran, and its plain `<code>` has nothing to split on.
		return lines.length ? [...lines].map((el) => el.innerHTML) : [];
	} catch {
		return [];
	}
}

/**
 * Wrap the changed runs of a line in `.seg.changed`, inside already-coloured
 * markup. Walks the text nodes keeping a running character offset, so a run
 * that starts in the middle of a Shiki token splits that token rather than
 * losing its colour — which is what wrapping whole tokens would do.
 */
export function applySegments(lineHtml: string, segments: DiffSegment[] | undefined): string {
	if (!segments || typeof window === 'undefined') return lineHtml;

	const ranges: [number, number][] = [];
	let at = 0;
	for (const segment of segments) {
		if (segment.changed) ranges.push([at, at + segment.text.length]);
		at += segment.text.length;
	}
	if (!ranges.length) return lineHtml;

	const host = document.createElement('div');
	host.innerHTML = lineHtml;

	const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
	const texts: Text[] = [];
	for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node as Text);

	let offset = 0;
	for (const text of texts) {
		const start = offset;
		const end = offset + text.length;
		offset = end;

		// Rebuilt as a whole rather than split in place: one token can hold
		// several changed runs, and splitting invalidates the offsets of every
		// node collected above.
		const overlaps = ranges.filter(([from, to]) => Math.max(from, start) < Math.min(to, end));
		if (!overlaps.length) continue;

		const frag = document.createDocumentFragment();
		let cursor = start;
		for (const [from, to] of overlaps) {
			const a = Math.max(from, start);
			const b = Math.min(to, end);
			if (a > cursor) frag.append(text.data.slice(cursor - start, a - start));
			const mark = document.createElement('span');
			mark.className = 'seg changed';
			mark.textContent = text.data.slice(a - start, b - start);
			frag.append(mark);
			cursor = b;
		}
		if (cursor < end) frag.append(text.data.slice(cursor - start));
		text.replaceWith(frag);
	}

	return host.innerHTML;
}
