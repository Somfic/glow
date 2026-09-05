// Popover's two positioning invariants, neither of which is visible in markup.
//
//   node tools/scripts/popover-position.test.mjs
//   node tools/scripts/popover-position.test.mjs --no-build
//
// 1. The panel is never *painted* at a position it will jump away from. The
//    checks below open the popover from inside a rAF callback and measure at
//    the end of that same frame — after Svelte has flushed, before the browser
//    paints — because that is the one frame the bug lived in and the only
//    moment at which asking is meaningful. Motion is off here (the harness sets
//    `reducedMotion: "reduce"`, which is also the condition under which a real
//    user saw the jump: the fly transition no longer covers it).
//
// 2. A trigger scrolled entirely out of view gets no panel. The clamps in
//    updatePosition() would otherwise pin it against the window edge, attached
//    to nothing. Partly visible still counts as visible, and scrolling back
//    brings the panel back — hiding, not closing.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

const t = checks("popover positioning");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

/** Scroll the popover's own scrolling ancestor — the docs shell scrolls a div, not the window. */
const scrollBy = (dy) =>
	page.evaluate((d) => {
		let el = document.querySelector(".popover.open");
		while (
			el &&
			!(el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY))
		)
			el = el.parentElement;
		(el ?? document.scrollingElement).scrollBy(0, d);
	}, dy);

/** Is the panel actually painted, and where is it relative to its trigger? */
const state = () =>
	page.evaluate(() => {
		const el = document.querySelector(".popover-content");
		if (!el) return { present: false };
		const r = el.getBoundingClientRect();
		const trigger = document.querySelector(".popover.open")?.getBoundingClientRect();
		return {
			present: true,
			shown: getComputedStyle(el).visibility === "visible",
			panel: { top: r.top, left: r.left, bottom: r.bottom },
			trigger: trigger && { top: trigger.top, bottom: trigger.bottom, left: trigger.left },
		};
	});

try {
	await open(page, "/components/popover");
	await settle(page);

	// ── 1. The first painted frame ──
	const first = await page.evaluate(
		async () =>
			await new Promise((resolve) => {
				requestAnimationFrame(async () => {
					const btn = document.querySelector('.card[id="basic"] button');
					const trigger = btn.getBoundingClientRect();
					btn.click();
					// Yield to the microtask queue until the panel exists and Svelte
					// has finished flushing; all of this still precedes this frame's
					// paint, so what we read is what the user's first frame shows.
					let el = null;
					for (let i = 0; i < 100 && !el; i++) {
						await Promise.resolve();
						el = document.querySelector(".popover-content");
					}
					for (let i = 0; i < 20; i++) await Promise.resolve();
					const panel = el.getBoundingClientRect();
					resolve({
						shown: getComputedStyle(el).visibility === "visible",
						drift: Math.abs(panel.left - trigger.left),
					});
				});
			}),
	);
	t.ok(
		`the frame the panel mounts on is not painted at the wrong place (visible=${first.shown}, left drifts ${Math.round(first.drift)}px from the trigger)`,
		!first.shown || first.drift < 2,
	);

	// …and it does become visible, promptly, in the right place.
	await page.waitForTimeout(300);
	const settled = await state();
	t.ok("the panel is visible once positioned", settled.present && settled.shown);
	t.ok(
		`and anchored to its trigger (${JSON.stringify(settled)})`,
		Math.abs(settled.panel.left - settled.trigger.left) < 2 &&
			Math.abs(settled.panel.top - settled.trigger.bottom) < 12,
	);

	await page.keyboard.press("Escape");
	await page.waitForTimeout(300);

	// ── 2. A trigger that has left the viewport ──
	// Manual mode is the pinned-open case from the report: the panel stays open
	// with no pointer anywhere near it.
	await page.locator('.card[id="manual"]').scrollIntoViewIfNeeded();
	await page.getByRole("button", { name: "Open it" }).click();
	await page.waitForTimeout(300);
	t.ok("pinned open to start with", (await state()).shown);

	// Nudge the trigger so it straddles the bottom edge — still partly visible.
	const partial = await page.evaluate(() => {
		const t = document.querySelector(".popover.open").getBoundingClientRect();
		return innerHeight - t.top - t.height / 2;
	});
	await scrollBy(-partial);
	await page.waitForTimeout(300);
	const half = await state();
	t.ok(`a half-visible trigger still gets its panel (${JSON.stringify(half)})`, half.shown);

	// Now take it fully past the fold.
	await scrollBy(-1000);
	await page.waitForTimeout(400);
	const away = await state();
	const off =
		!away.present || away.trigger.top >= (await page.evaluate(() => innerHeight));
	t.ok("the trigger is genuinely off-screen for the next check", off);
	t.ok(
		`an out-of-view trigger paints no panel against the window edge (${JSON.stringify(away)})`,
		!away.present || !away.shown,
	);

	// Scrolling back must bring it back: hiding, not closing.
	await scrollBy(1000);
	await page.waitForTimeout(400);
	const back = await state();
	t.ok(`scrolling back restores it, still open (${JSON.stringify(back)})`, back.present && back.shown);
	t.ok(
		"and it is anchored to the trigger again, not clamped to the edge",
		Math.abs(back.panel.top - back.trigger.bottom) < 12,
	);
} finally {
	await app.close();
}

t.done();
