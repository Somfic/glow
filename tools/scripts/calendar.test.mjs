// The calendar grid is keyboard-first and portalled, and neither of those shows
// up in a screenshot. This drives the docs page in Chrome and asserts the parts
// that a still frame cannot: roving tabindex, arrow-key navigation, the pending
// range, and that the picker's panel is actually painted on top and focused.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("calendar");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);
const p = app.page;
const focusedISO = () => p.evaluate(() => document.activeElement?.dataset?.iso);

try {
	await open(p, "/components/calendar");

	// ── One tab stop, arrow keys inside it ──
	const grid = p.locator("#single .grid");
	t.ok("the month is a single tab stop", (await grid.locator('button[tabindex="0"]').count()) === 1);

	await grid.locator('button[tabindex="0"]').focus();
	t.ok("focus starts on the selected day", (await focusedISO()) === "2026-03-12");
	await p.keyboard.press("ArrowRight");
	t.ok("ArrowRight moves a day", (await focusedISO()) === "2026-03-13");
	await p.keyboard.press("ArrowDown");
	t.ok("ArrowDown moves a week", (await focusedISO()) === "2026-03-20");
	await p.keyboard.press("Home");
	t.ok("Home goes to the start of the week", (await focusedISO()) === "2026-03-16");
	await p.keyboard.press("End");
	t.ok("End goes to the end of the week", (await focusedISO()) === "2026-03-22");
	await p.keyboard.press("PageDown");
	t.ok("PageDown moves a month", (await focusedISO()) === "2026-04-22");
	await p.keyboard.press("Enter");
	t.ok("Enter selects the focused day", (await p.locator("#single").innerText()).includes("2026-04-22"));
	t.ok("still a single tab stop after selecting", (await grid.locator('button[tabindex="0"]').count()) === 1);

	// ── Unavailable days stay in the grid ──
	const weekend = p.locator('#bounds .day[data-iso="2026-03-14"]');
	t.ok("a blocked day is aria-disabled", (await weekend.getAttribute("aria-disabled")) === "true");
	// Playwright refuses to click an aria-disabled element, which is the point;
	// dispatch the event directly to prove the handler itself is the guard.
	await weekend.dispatchEvent("click");
	t.ok("clicking it selects nothing", (await p.locator('#bounds .day.selected[data-iso="2026-03-14"]').count()) === 0);

	// ── Range: pending preview, and the swap ──
	await p.locator('#range .day[data-iso="2026-03-04"]').click();
	await p.locator('#range .day[data-iso="2026-03-08"]').hover();
	t.ok("hover previews the pending range", (await p.locator("#range td.preview").count()) === 5);
	await p.locator('#range .day[data-iso="2026-03-02"]').click();
	t.ok(
		"closing the range before its start swaps the ends",
		(await p.locator("#range").innerText()).includes("2026-03-02 → 2026-03-04")
	);

	// ── Picker: portalled, on top, focused ──
	await p.locator("#picker button.date-picker-trigger").first().click();
	await p.waitForSelector(".popover-content .calendar");
	t.ok(
		"the panel is painted above the page",
		await p.evaluate(() => {
			const el = document.querySelector('.popover-content .day[tabindex="0"]');
			const r = el.getBoundingClientRect();
			return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest(".day") === el;
		})
	);
	t.ok("opening moves focus into the grid", await p.evaluate(() => document.activeElement?.classList.contains("day")));
	await p.keyboard.press("ArrowRight");
	await p.keyboard.press("Enter");
	// The popover leaves on a Svelte `transition:` whose duration is a number,
	// which `prefers-reduced-motion` does not collapse — wait for it to go
	// rather than sampling the DOM once.
	await p.waitForSelector(".popover-content", { state: "detached" });
	t.ok("a complete answer closes the picker", (await p.locator(".popover-content").count()) === 0);
} finally {
	await app.close();
}

t.done();
