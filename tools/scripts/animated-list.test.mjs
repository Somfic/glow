// AnimatedList — the assertions a screenshot cannot make: that rows actually
// travel to their new places rather than appearing there, that removing one
// does not snap the rows below it, that a filter which narrows and refills the
// list keeps the rows it never removed, and that prefers-reduced-motion snaps
// rather than animating quickly.
//
//   node tools/scripts/animated-list.test.mjs [--no-build]
//
// Runs with motion ON, unlike shots.mjs — a frozen library would pass half of
// these for the wrong reason.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("animated-list — moves, identity, reduced motion");
const app = await launch({
	build: !process.argv.includes("--no-build"),
	reducedMotion: "no-preference",
});
t.watch(app.page);

const page = app.page;

/**
 * Every row in a card: its text on one line, and its painted top edge.
 *
 * `getBoundingClientRect` rather than `offsetTop`, because it includes the
 * transform — and a row mid-flip is laid out at its destination and translated
 * back towards where it came from, so the transform *is* the animation.
 */
async function rows(target, card) {
	return target.$$eval(`.card[id="${card}"] .animated-list > .row`, (els) =>
		els.map((el) => ({
			text: (el.innerText ?? "").replace(/\s+/g, " ").trim(),
			y: el.getBoundingClientRect().top,
		})),
	);
}

const yOf = (list, text) => list.find((r) => r.text.includes(text))?.y;

/** Click a button by its label inside one card. */
const press = (target, card, label) =>
	target.locator(`.card[id="${card}"] button`, { hasText: label }).first().click();

/** Strictly between, with room for a rounded pixel at either end. */
const between = (v, a, b) => Math.min(a, b) + 4 < v && v < Math.max(a, b) - 4;

try {
	await open(page, "/components/animated-list");

	// --- a reorder moves the rows, and is caught in flight ------------------
	await press(page, "reorder", "By name");
	await page.waitForTimeout(600);

	const before = await rows(page, "reorder");
	t.ok("the list renders its rows", before.length === 5);
	t.ok(
		"sorted by name",
		before.map((r) => r.text.split(" ")[0]).join() === "ams-1,fra-2,iad-1,sfo-3,syd-1",
	);

	// syd-1 is last by name and first by latency, so this is the longest travel
	// on the page — a distance no rounding could explain away.
	await press(page, "reorder", "By latency");
	const instant = await rows(page, "reorder");
	await page.waitForTimeout(120);
	const early = await rows(page, "reorder");
	await page.waitForTimeout(80);
	const late = await rows(page, "reorder");
	await page.waitForTimeout(600);
	const after = await rows(page, "reorder");

	t.ok(
		"sorted by latency",
		after.map((r) => r.text.split(" ")[0]).join() === "syd-1,fra-2,sfo-3,ams-1,iad-1",
	);

	const from = yOf(before, "syd-1");
	const to = yOf(after, "syd-1");
	t.ok("the row ends four places up", from - to > 100);
	t.ok("it has not teleported to its new place", yOf(instant, "syd-1") > to + 8);
	t.ok("it is part-way there mid-animation", between(yOf(early, "syd-1"), from, to));
	t.ok(
		"and further along a beat later — it interpolates, it does not jump",
		between(yOf(late, "syd-1"), from, to) && yOf(late, "syd-1") < yOf(early, "syd-1") - 4,
	);
	t.ok("before landing exactly on its new place", Math.abs(yOf(after, "syd-1") - to) < 1);

	// The rows it displaced have to move too, or only the sorted-to-front one is
	// animated and the rest are being re-rendered in place.
	t.ok(
		"a displaced row travels as well",
		between(yOf(early, "ams-1"), yOf(before, "ams-1"), yOf(after, "ams-1")),
	);

	// A flip leaves a transform behind if it is interrupted or mis-composed, and
	// half a pixel of it is invisible until someone zooms. The resting state has
	// to be exactly identity, on every row on the page.
	t.ok(
		"every row rests at no transform at all",
		await page.$$eval(".animated-list > .row", (els) =>
			els.every((el) => {
				const tf = getComputedStyle(el).transform;
				return tf === "none" || tf === "matrix(1, 0, 0, 1, 0, 0)";
			}),
		),
	);

	// --- removing a row does not snap the rows below it ---------------------
	const remove = page.locator('.card[id="add-remove"] .animated-list > .row').first()
		.locator("button").first();
	await remove.scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);

	const tasksBefore = await rows(page, "add-remove");
	const survivor = tasksBefore[1].text.split(" ").slice(1, 3).join(" ");
	await remove.click();
	const snapped = await rows(page, "add-remove");
	await page.waitForTimeout(110);
	const sliding = await rows(page, "add-remove");
	await page.waitForTimeout(600);
	const tasksAfter = await rows(page, "add-remove");

	t.ok("the row is gone", tasksAfter.length === tasksBefore.length - 1);
	// The classic bug this composition exists to avoid: the leaving row drops out
	// of the flow, everything below jumps up a row height, and only then does the
	// fade start on a row that is no longer where the jump left it.
	t.ok(
		"the leaving row is still painted while it fades",
		snapped.length === tasksBefore.length,
	);
	t.ok(
		"the row below has not jumped to the gap",
		yOf(snapped, survivor) > yOf(tasksAfter, survivor) + 8,
	);
	t.ok(
		"it slides up instead",
		between(yOf(sliding, survivor), yOf(tasksBefore, survivor), yOf(tasksAfter, survivor)),
	);
	t.ok("and arrives", yOf(tasksAfter, survivor) < yOf(tasksBefore, survivor) - 4);

	// --- a filter that narrows and refills keeps identity -------------------
	// Stamp the live nodes: a row that is only re-sorted or re-shown has to be
	// the same element, not a fresh one carrying the same text. That identity is
	// what makes a flip possible at all.
	const stamp = (target) =>
		target.$$eval('.card[id="filter"] .animated-list > .row', (els) =>
			els.forEach((el, i) => (el.dataset.stamp = String(i))),
		);
	const stamps = (target) =>
		target.$$eval('.card[id="filter"] .animated-list > .row', (els) =>
			els.map((el) => [
				(el.innerText ?? "").replace(/\s+/g, " ").trim(),
				el.dataset.stamp ?? "new",
			]),
		);

	await stamp(page);
	await press(page, "filter", "Design");
	await page.waitForTimeout(600);
	const kept = await stamps(page);
	t.ok("the filter narrows the list", kept.length === 2);
	t.ok("and the rows that stayed are the same DOM nodes", kept.every(([, s]) => s !== "new"));

	await press(page, "filter", "All");
	await page.waitForTimeout(600);
	const refilled = await stamps(page);
	const names = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Radia Perlman", "Barbara Liskov"];
	t.ok("filtering back restores every row", refilled.length === 5);
	t.ok(
		"in the source order, not the order they were re-added in",
		names.every((name, i) => refilled[i][0].includes(name)),
	);
	t.ok(
		"the two that were never filtered out were never re-created",
		refilled.filter(([, s]) => s !== "new").length === 2,
	);

	// Emptying and refilling is the same path with no survivors at all.
	await press(page, "add-remove", "Clear");
	await page.waitForTimeout(600);
	t.ok(
		"an emptied list shows the empty snippet",
		(await page.locator('.card[id="add-remove"] .animated-list').innerText()).includes(
			"Nothing left to do",
		),
	);
	await press(page, "add-remove", "Add task");
	await page.waitForTimeout(600);
	t.ok("and refills", (await rows(page, "add-remove")).length === 1);

	// --- reduced motion snaps ----------------------------------------------
	const reduced = await app.open({ reducedMotion: "reduce" });
	t.watch(reduced);
	await open(reduced, "/components/animated-list");
	await press(reduced, "reorder", "By name");
	await reduced.waitForTimeout(400);

	const stillBefore = await rows(reduced, "reorder");
	await press(reduced, "reorder", "By latency");
	const stillMid = await rows(reduced, "reorder");
	await reduced.waitForTimeout(400);
	const stillAfter = await rows(reduced, "reorder");

	t.ok(
		"under prefers-reduced-motion the row still ends up moved",
		yOf(stillBefore, "syd-1") - yOf(stillAfter, "syd-1") > 100,
	);
	t.ok(
		"but is already there on the next frame — not a fast animation",
		Math.abs(yOf(stillMid, "syd-1") - yOf(stillAfter, "syd-1")) < 2,
	);
	t.ok(
		"and nothing is left mid-transform",
		await reduced.$$eval('.card[id="reorder"] .animated-list > .row', (els) =>
			els.every((el) => {
				const tf = getComputedStyle(el).transform;
				return tf === "none" || tf === "matrix(1, 0, 0, 1, 0, 0)";
			}),
		),
	);
} finally {
	await app.close();
}

t.done();
