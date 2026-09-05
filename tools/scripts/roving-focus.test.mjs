// The rovingFocus action, which is nothing but edge cases.
//
//   node tools/scripts/roving-focus.test.mjs
//   node tools/scripts/roving-focus.test.mjs --no-build
//
// Everything here is asserted against the real focus model in a real browser:
// what `document.activeElement` is after a key, and which items carry
// `tabindex="0"`. Neither is visible from the markup, and both are the entire
// contract of a roving-tabindex group — so a unit test with a fake DOM would
// be testing the fake.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

const t = checks("roving focus");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

/** Text of the focused element, trimmed — what every assertion here reads. */
const focused = () =>
	page.evaluate(() => (document.activeElement?.textContent ?? "").trim() || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);

/** The tabindex of every item in a card's group, in DOM order. */
const stops = (card) =>
	page.evaluate(
		(sel) =>
			[...document.querySelectorAll(`${sel} [data-roving-item]`)].map((el) =>
				el.getAttribute("tabindex"),
			),
		card,
	);

const zeros = async (card) => (await stops(card)).filter((v) => v === "0").length;

/** Focus an item by its text, the way a click would — then the arrows take over. */
const clickItem = (card, text) =>
	page.locator(`${card} [data-roving-item]`, { hasText: text }).first().click();

try {
	await open(page, "/components/roving-focus");
	await settle(page);

	// ── The invariant, on every group on the page ──
	// A nested group is the exception, and deliberately so: it holds no stop of
	// its own while focus is outside it, or the nest would be two tab stops.
	const groups = await page.evaluate(() =>
		[...document.querySelectorAll("[data-roving-focus]")].map((g) => ({
			nested: !!g.parentElement.closest("[data-roving-focus]"),
			zeros: [...g.querySelectorAll("[data-roving-item]")]
				.filter((el) => el.closest("[data-roving-focus]") === g)
				.filter((el) => el.getAttribute("tabindex") === "0").length,
		})),
	);
	t.ok(
		`every top-level group has exactly one tabindex=0 (${groups.map((g) => g.zeros).join(",")})`,
		groups.filter((g) => !g.nested).every((g) => g.zeros === 1),
	);
	t.ok(
		"a nested group holds no stop while focus is outside it",
		groups.filter((g) => g.nested).every((g) => g.zeros === 0),
	);
	t.ok(
		"so the whole page is one tab stop per top-level group",
		await page.evaluate(
			() =>
				[...document.querySelectorAll('[data-roving-focus] [tabindex="0"]')].length ===
				[...document.querySelectorAll("[data-roving-focus]")].filter(
					(g) => !g.parentElement.closest("[data-roving-focus]"),
				).length,
		),
	);

	// ── Tab in, tab out, tab back ──
	// One Tab reaches the group; the next leaves it entirely rather than
	// stepping to the second button.
	await page.locator("h1").click();
	let hops = 0;
	while (hops++ < 40) {
		await page.keyboard.press("Tab");
		if (await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Text formatting"]')))
			break;
	}
	t.ok("Tab reaches the toolbar", await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Text formatting"]')));
	t.ok("and lands on the first item", (await focused()) === "Bold");

	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	t.ok("ArrowRight moves focus", (await focused()) === "Underline");
	t.ok(
		"and the zero moved with it",
		await page.evaluate(
			() => document.activeElement?.getAttribute("tabindex") === "0",
		),
	);
	t.ok("still exactly one zero", (await zeros('.card[id="toolbar"]')) === 1);

	await page.keyboard.press("Tab");
	t.ok(
		"Tab leaves the group rather than stepping within it",
		await page.evaluate(() => !document.activeElement?.closest('[aria-label="Text formatting"]')),
	);
	await page.keyboard.press("Shift+Tab");
	t.ok("Shift+Tab returns to the item we left on", (await focused()) === "Underline");

	// ── Home / End ──
	await page.keyboard.press("End");
	t.ok("End goes to the last item", (await focused()) === "Link");
	await page.keyboard.press("Home");
	t.ok("Home goes to the first item", (await focused()) === "Bold");

	// ── Orientation: a horizontal group ignores the vertical arrows ──
	await page.keyboard.press("ArrowDown");
	t.ok("a horizontal group ignores ArrowDown", (await focused()) === "Bold");

	// ── Wrap on / off ──
	const lists = page.locator('.card[id="orientation"] [data-roving-focus]');
	await lists.nth(0).locator("[data-roving-item]", { hasText: "Settings" }).click();
	await page.keyboard.press("ArrowDown");
	t.ok("wrap: true rolls around to the first item", (await focused()) === "Overview");

	await lists.nth(1).locator("[data-roving-item]", { hasText: "Settings" }).click();
	await page.keyboard.press("ArrowDown");
	t.ok("wrap: false stops at the last item", (await focused()) === "Settings");
	await page.keyboard.press("ArrowUp");
	t.ok("and still moves back off it", (await focused()) === "Members");

	// ── Vertical group ignores the horizontal arrows ──
	await page.keyboard.press("ArrowRight");
	t.ok("a vertical group ignores ArrowRight", (await focused()) === "Members");

	// ── Disabled items ──
	const dis = '.card[id="disabled"]';
	t.ok(
		"a disabled item is never the tab stop",
		await page.evaluate(
			(sel) =>
				[...document.querySelectorAll(`${sel} [data-roving-item]`)].every(
					(el) => !(el.disabled && el.getAttribute("tabindex") === "0"),
				),
			dis,
		),
	);
	await clickItem(dis, "Comment");
	await page.keyboard.press("ArrowDown");
	t.ok("ArrowDown steps over two disabled items", (await focused()).startsWith("Transfer"));
	await page.keyboard.press("End");
	t.ok("End lands on the last *enabled* item", (await focused()).startsWith("Transfer"));

	// ── Typeahead ──
	const type = '.card[id="typeahead"]';
	await clickItem(type, "Apricot");
	await page.keyboard.type("bl", { delay: 60 });
	t.ok("a prefix jumps to the first match", (await focused()) === "Blackberry");
	await page.waitForTimeout(700); // the buffer expires
	await page.keyboard.press("c");
	t.ok("a single letter jumps", (await focused()) === "Cherry");
	await page.keyboard.press("c");
	t.ok("repeating it cycles to the next match", (await focused()) === "Cranberry");
	t.ok("typeahead left exactly one zero", (await zeros(type)) === 1);

	// ── Items changing underneath a focused group ──
	const dyn = '.card[id="dynamic"]';
	await clickItem(dyn, "Charlie");
	// dispatchEvent, not click(): a real click would move focus to the button
	// and the point of this check is what happens to focus *inside* the group.
	await page.getByRole("button", { name: "Add a row" }).dispatchEvent("click");
	await page.waitForTimeout(120);
	t.ok("adding a row does not create a second zero", (await zeros(dyn)) === 1);
	t.ok("and does not move focus", (await focused()) === "Charlie");
	t.ok(
		"the zero is still on the focused item",
		await page.evaluate(() => document.activeElement?.getAttribute("tabindex") === "0"),
	);

	// Delete the row that currently has focus. It is at index 2 after the add
	// ("Alpha", "New 1", "Charlie", …), so removing index 1 keeps it; remove the
	// focused one instead, via the page's own control after re-ordering focus.
	await clickItem(dyn, "New 1");
	const before = await page.evaluate(
		(sel) => [...document.querySelectorAll(`${sel} [data-roving-item]`)].map((el) => el.textContent.trim()),
		dyn,
	);
	await page.getByRole("button", { name: "Remove the second row" }).dispatchEvent("click");
	await page.waitForTimeout(120);
	t.ok("removing the focused row does not strand focus on <body>", (await focused()) !== "BODY");
	t.ok(
		"focus lands back inside the group",
		await page.evaluate((sel) => !!document.activeElement?.closest(`${sel} [data-roving-focus]`), dyn),
	);
	t.ok(
		"on whatever took its index",
		(await focused()) === before[2],
	);
	t.ok("and there is still exactly one zero", (await zeros(dyn)) === 1);

	// Arrows keep working over the rebuilt list.
	await page.keyboard.press("ArrowDown");
	t.ok("arrows still work after the list changed", (await focused()) !== before[2]);
	t.ok("still one zero", (await zeros(dyn)) === 1);

	// ── RTL ──
	const rtl = '.card[id="rtl"]';
	const rtlItems = await page.evaluate(
		(sel) => [...document.querySelectorAll(`${sel} [data-roving-item]`)].map((el) => el.textContent.trim()),
		rtl,
	);
	await page.locator(`${rtl} [data-roving-item]`).first().click();
	await page.keyboard.press("ArrowLeft");
	t.ok("in RTL, ArrowLeft advances in DOM order", (await focused()) === rtlItems[1]);
	await page.keyboard.press("ArrowRight");
	t.ok("and ArrowRight goes back", (await focused()) === rtlItems[0]);

	// ── Nested groups ──
	const nest = '.card[id="nested"]';
	const outer = page.locator(`${nest} [role="toolbar"]`);
	const inner = page.locator(`${nest} [role="group"]`);

	await outer.locator("> [data-roving-item]", { hasText: "Before" }).click();
	await page.keyboard.press("ArrowRight");
	t.ok(
		"the outer group arrows onto the nested container",
		await page.evaluate(() => document.activeElement?.getAttribute("role") === "group"),
	);
	await page.keyboard.press("ArrowDown");
	t.ok("an arrow on the container steps into the inner group", (await focused()) === "Open");

	await page.keyboard.press("ArrowDown");
	t.ok("the inner group handles its own axis", (await focused()) === "Merged");
	t.ok(
		"and the outer group's stop did not move with it",
		await page.evaluate(
			(sel) =>
				[...document.querySelector(`${sel} [role="toolbar"]`).children]
					.find((el) => el.getAttribute("tabindex") === "0")
					?.getAttribute("role") === "group",
			nest,
		),
	);

	// A key the inner group does not act on must not fall through to the outer
	// one either — the nearest group owns the event outright.
	await page.keyboard.press("ArrowRight");
	t.ok("a key the inner group ignores does not walk the outer one", (await focused()) === "Merged");

	// Leaving the nest restores the inner group to no stop of its own.
	await page.locator("h1").click();
	await page.waitForTimeout(50);
	t.ok(
		"the inner group gives its stop back on the way out",
		await page.evaluate(
			(sel) =>
				[...document.querySelectorAll(`${sel} [role="group"] [data-roving-item]`)].every(
					(el) => el.getAttribute("tabindex") === "-1",
				),
			nest,
		),
	);
	t.ok(
		"and the nest is one tab stop again",
		(await page.locator(`${nest} [tabindex="0"]`).count()) === 1,
	);

} finally {
	await app.close();
}

t.done();
