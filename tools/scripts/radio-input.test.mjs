// RadioInput's sliding indicator and its keyboard pattern.
//
//   node tools/scripts/radio-input.test.mjs
//   node tools/scripts/radio-input.test.mjs --no-build
//
// Two things are being pinned here. The indicator is never "missing" when it
// goes wrong — it is a few pixels off the option it claims to be on, or right
// until the layout moves underneath it, so every check compares its box to the
// selected option's numerically, after each of the three things that move an
// option: first paint, a viewport resize, and a label whose text changed.
//
// The keyboard checks pin an accessibility fix rather than a look: this control
// had no role, no tabindex and no keydown handler at all, so it was N tab stops
// of unlabelled buttons and no arrow keys.
//
// A second browser context runs with motion on, because the collapse of the
// slide under `prefers-reduced-motion` cannot be observed from a page that
// never had the transition in the first place.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

const t = checks("radio input");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

/** The nth `.radio-input` inside a documented card. */
const control = (card, n = 0) => page.locator(`.card[id="${card}"] .radio-input`).nth(n);

/** Indicator and selected-option boxes, in page coordinates. */
async function boxes(p, card, n = 0) {
	return p.evaluate(({ card, n }) => {
		const root = document.querySelectorAll(`.card[id="${card}"] .radio-input`)[n];
		const ind = root.querySelector(".indicator");
		const sel = root.querySelector('.radio-option[aria-checked="true"]');
		const box = ind.getBoundingClientRect();
		return {
			label: sel?.textContent.trim() ?? null,
			opacity: Number(getComputedStyle(ind).opacity),
			indicator: { x: box.x, width: box.width },
			selected: sel
				? { x: sel.getBoundingClientRect().x, width: sel.getBoundingClientRect().width }
				: null,
		};
	}, { card, n });
}

// The indicator sits inside the track's border with no padding between, so it
// lands on the option's box exactly.
const lands = ({ indicator, selected }) =>
	!!selected &&
	Math.abs(indicator.x - selected.x) < 0.5 &&
	Math.abs(indicator.width - selected.width) < 0.5;

const settled = async (p) => {
	await p.waitForTimeout(450); // longer than --glow-dur-base
	await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

try {
	await open(page, "/components/inputs");
	await settle(page);

	// ── Roles: this control had none at all ──
	const roles = await page.evaluate(() => {
		const root = document.querySelector('.card[id="radio-input-sizes"] .radio-input');
		const opts = [...root.querySelectorAll(".radio-option")];
		return {
			group: root.getAttribute("role"),
			named: !!root.getAttribute("aria-label"),
			options: opts.map((el) => el.getAttribute("role")),
			checked: opts.map((el) => el.getAttribute("aria-checked")),
			indicatorHidden: root.querySelector(".indicator").getAttribute("aria-hidden") === "true",
		};
	});
	t.ok("the group is a radiogroup", roles.group === "radiogroup");
	t.ok("it has an accessible name", roles.named);
	t.ok("every option is a radio", roles.options.every((r) => r === "radio"));
	t.ok("exactly one option is checked", roles.checked.filter((c) => c === "true").length === 1);
	t.ok("the indicator is hidden from assistive tech", roles.indicatorHidden);

	// ── First paint ──
	const first = await boxes(page, "radio-input-sizes", 1);
	t.ok(`indicator is on the selected option on first paint (${first.label})`, lands(first));
	t.ok("it starts on the given value, not on the first option", first.label === "Week");

	// ── Clicking an option of a different width ──
	// "All time" is the widest and "Day" the narrowest: if the width were not
	// animated as well as the position, this pair is where it would show.
	await control("radio-input-sizes", 1).locator(".radio-option", { hasText: "All time" }).click();
	await settled(page);
	const wide = await boxes(page, "radio-input-sizes", 1);
	t.ok("indicator follows a click, position and width", lands(wide));
	t.ok("the width actually changed with the option", wide.selected.width > first.selected.width + 8);

	// ── Keyboard: one tab stop, arrows move the selection ──
	const tabStops = await page.evaluate(() =>
		[...document.querySelectorAll('.card[id="radio-input-sizes"] .radio-input')[1]
			.querySelectorAll(".radio-option")].filter((el) => el.tabIndex === 0).length,
	);
	t.ok("the group is a single tab stop", tabStops === 1);

	await control("radio-input-sizes", 1).locator('.radio-option[tabindex="0"]').focus();
	await page.keyboard.press("ArrowLeft");
	await settled(page);
	const left = await boxes(page, "radio-input-sizes", 1);
	t.ok("ArrowLeft moves the selection", left.label === "Month");
	t.ok("…and the indicator with it", lands(left));
	t.ok(
		"…and the focus with it",
		(await page.evaluate(() => document.activeElement?.textContent?.trim())) === "Month",
	);

	await page.keyboard.press("Home");
	await settled(page);
	const home = await boxes(page, "radio-input-sizes", 1);
	t.ok("Home selects the first option", home.label === "Day" && lands(home));

	// A disabled option is skipped rather than focused and refused: End on the
	// billing example has to land on "Yearly", not on the disabled "Lifetime".
	await control("radio-input-disabled", 0).locator('.radio-option[tabindex="0"]').focus();
	await page.keyboard.press("End");
	await settled(page);
	const skipped = await boxes(page, "radio-input-disabled", 0);
	t.ok("End skips a disabled option", skipped.label === "Yearly" && lands(skipped));

	// ── `clearable` against the radiogroup pattern ──
	const clearableOption = (n) =>
		`.card[id="radio-input-keyboard"] .radio-input .radio-option:nth-of-type(${n + 1})`;
	await page.locator(clearableOption(1)).click();
	await settled(page);
	t.ok("clicking selects", (await boxes(page, "radio-input-keyboard")).label === "Medium");
	await page.locator(clearableOption(1)).click();
	await settled(page);
	const cleared = await boxes(page, "radio-input-keyboard");
	t.ok("clicking the selected option clears it", cleared.label === null);
	t.ok("…and the indicator fades out rather than jumping home", cleared.opacity === 0);
	t.ok(
		"an empty group is still reachable — the first option holds the tab stop",
		await page.evaluate(
			() =>
				document
					.querySelector('.card[id="radio-input-keyboard"] .radio-input .radio-option')
					.tabIndex === 0,
		),
	);
	// From nothing selected, one arrow press has to land on an option rather
	// than skip one.
	await page.locator(clearableOption(1)).focus();
	await page.keyboard.press("ArrowRight");
	await settled(page);
	const fromEmpty = await boxes(page, "radio-input-keyboard");
	t.ok("ArrowRight from an empty group selects the focused option", fromEmpty.label === "Medium");
	t.ok("…and the indicator comes back with it", lands(fromEmpty) && fromEmpty.opacity === 1);
	// Arrowing must not clear: only a click means clear.
	await page.keyboard.press("ArrowLeft");
	await page.keyboard.press("ArrowRight");
	await settled(page);
	t.ok(
		"arrowing onto the selected option never clears it",
		(await boxes(page, "radio-input-keyboard")).label === "Medium",
	);

	// ── A viewport resize ──
	// The full-width example is the one whose options are sized by the
	// container, so its geometry is stale the instant the window changes.
	const beforeResize = await boxes(page, "radio-input-full-width");
	t.ok("full-width indicator is right before the resize", lands(beforeResize));
	await page.setViewportSize({ width: 720, height: 900 });
	await settled(page);
	const afterResize = await boxes(page, "radio-input-full-width");
	t.ok("…and still right after it", lands(afterResize));
	t.ok(
		"the resize really did move the option",
		Math.abs(afterResize.selected.width - beforeResize.selected.width) > 8,
	);
	await page.setViewportSize({ width: 1280, height: 900 });
	await settled(page);

	// ── A label whose text changed ──
	// The stand-in for a font swap: same element, new width, and nothing about
	// the track's own size says so.
	await page.evaluate(() => {
		const opt = document.querySelectorAll('.card[id="radio-input-sizes"] .radio-input')[1]
			.querySelector('.radio-option[aria-checked="true"] span');
		opt.textContent = "A considerably longer label";
	});
	await settled(page);
	t.ok(
		"indicator re-measures when a label's text changes",
		lands(await boxes(page, "radio-input-sizes", 1)),
	);

	// ── Alignment: the icon and its label share a centre line ──
	const centres = await page.evaluate(() => {
		const opt = document.querySelector('.card[id="radio-input-icons"] .radio-option');
		const icon = opt.querySelector(".icon").getBoundingClientRect();
		const label = opt.querySelector("span:not(.icon)").getBoundingClientRect();
		return [icon.y + icon.height / 2, label.y + label.height / 2, icon.height, label.height];
	});
	t.ok(
		`icon and label boxes share a centre line (${centres[0]} vs ${centres[1]})`,
		Math.abs(centres[0] - centres[1]) < 0.25,
	);
	t.ok(
		`icon and label boxes are the same height (${centres[2]} vs ${centres[3]})`,
		Math.abs(centres[2] - centres[3]) < 0.25,
	);

	// ── A disabled group drops the accent fill ──
	const fills = await page.evaluate(() => {
		const groups = document.querySelectorAll('.card[id="radio-input-disabled"] .radio-input');
		return [...groups].map((g) => getComputedStyle(g.querySelector(".indicator")).backgroundColor);
	});
	t.ok(`a disabled group is not painted in the accent (${fills[1]})`, fills[0] !== fills[1]);

	// ── Reduced motion collapses the slide ──
	const duration = (p) =>
		p.evaluate(
			() =>
				getComputedStyle(
					document.querySelector('.card[id="radio-input-sizes"] .radio-input .indicator'),
				).transitionDuration,
		);
	const reduced = await duration(page);
	t.ok(`reduced motion collapses the transition (${reduced})`, /^0\.001s/.test(reduced));

	const motion = await app.open({ reducedMotion: "no-preference" });
	await open(motion, "/components/inputs");
	await settle(motion);
	const full = await duration(motion);
	t.ok(`with motion on it is a real transition (${full})`, /^0\.22s/.test(full));

	// And it is a *slide*: mid-flight the indicator is somewhere between the two
	// options rather than already parked on the new one.
	const travel = await motion.evaluate(async () => {
		const root = document.querySelectorAll('.card[id="radio-input-sizes"] .radio-input')[1];
		const ind = root.querySelector(".indicator");
		const before = ind.getBoundingClientRect().x;
		root.querySelectorAll(".radio-option")[3].click();
		await new Promise((r) => setTimeout(r, 90));
		const during = ind.getBoundingClientRect().x;
		await new Promise((r) => setTimeout(r, 500));
		const after = ind.getBoundingClientRect().x;
		return { before, during, after };
	});
	t.ok(
		`the indicator is in transit mid-animation (${travel.before} → ${travel.during} → ${travel.after})`,
		travel.during > travel.before && travel.during < travel.after - 1,
	);
	await motion.context().close();
} finally {
	await app.close();
}

t.done();
