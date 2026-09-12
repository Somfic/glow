// Sparkline `morph` — that a scrolling series translates rather than undulates.
//
//   node tools/scripts/sparkline-morph.test.mjs
//   node tools/scripts/sparkline-morph.test.mjs --no-build
//
// Slow on purpose: the behaviour under test only appears once a rolling window
// is *full*, because that is when pushing a sample shifts every other one into
// a new array index. Motion is the subject, so the harness's freeze is off.

import { launch } from '../harness/app.mjs';
import { checks } from '../harness/check.mjs';
import { ROOT, open } from '../glow/docs.mjs';

const build = !process.argv.includes('--no-build');
const ROUTE = '/components/stat';

const parse = (d) =>
	(d.match(/-?\d+(\.\d+)?\s+-?\d+(\.\d+)?/g) ?? []).map((p) => p.split(/\s+/).map(Number));

const t = checks('sparkline morph');
const app = await launch({ build, cwd: ROOT, reducedMotion: 'no-preference' });
t.watch(app.page);
const { page } = app;

try {
	await open(page, ROUTE);
	// The `trendLength={12}` tile: the shortest window on the page, so it fills
	// in the least wall-clock time.
	const line = page.locator('#live-trend .sparkline path.line').nth(1);
	const d = () => line.getAttribute('d');

	let count = 0;
	let same = 0;
	for (let i = 0; i < 120 && same < 6; i++) {
		await page.waitForTimeout(500);
		const n = parse(await d()).length;
		if (n === count) same++;
		else {
			count = n;
			same = 0;
		}
	}
	t.ok(`the window saturates (${count} points)`, count > 2);

	// Settle first: `before` has to be a finished frame. Sampling "the next time
	// the path changes" without this lands mid-morph, where every frame differs
	// from the last and the comparison below is meaningless.
	let stable = null;
	let holds = 0;
	for (let i = 0; i < 400 && holds < 8; i++) {
		await page.waitForTimeout(25);
		const cur = await d();
		if (cur === stable) holds++;
		else {
			stable = cur;
			holds = 0;
		}
	}
	const before = parse(stable);

	let first = null;
	for (let i = 0; i < 300 && !first; i++) {
		await page.waitForTimeout(8);
		const cur = await d();
		if (cur !== stable) first = parse(cur);
	}

	if (!first || first.length !== before.length) {
		t.ok('a slide was observed', false);
	} else {
		// The opening frame of the morph says which rule the tween is following.
		// Under identity matching, point k starts where sample k+1 was, because
		// that is the same reading one slot further left. Under index matching it
		// starts at its own old slot, which is a different reading — every sample
		// then animates towards its neighbour's value and the line ripples.
		let identity = 0;
		let index = 0;
		let n = 0;
		for (let k = 0; k + 1 < before.length; k++) {
			identity += Math.abs(first[k][1] - before[k + 1][1]);
			index += Math.abs(first[k][1] - before[k][1]);
			n++;
		}
		t.ok(
			`a slide translates samples rather than deforming them ` +
				`(identity ${(identity / n).toFixed(2)}px vs index ${(index / n).toFixed(2)}px)`,
			identity < index
		);
	}
} finally {
	await app.close();
	t.done();
}
