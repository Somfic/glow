// Submenu pointer intent — the "safe triangle".
//
//   node tools/scripts/submenu-cone.test.mjs
//   node tools/scripts/submenu-cone.test.mjs --no-build
//
// The whole point of this feature is the *path* between two points, so a test
// that fires `mouseenter` on the trigger and `mouseleave` on the row proves
// nothing: both of those happen either way, and the bug lives in the twenty
// pointer positions in between. Every case here walks a real cursor with
// `mouse.move` in small steps and then asks what is still open.
//
// Five paths, one per thing that can go wrong:
//   - the diagonal across a sibling row, which must keep the submenu open
//   - a path elsewhere inside the menu, which must close it
//   - a path onto the submenu row next door, which must hand over to it
//   - the same diagonal with the submenu flipped to the left of its parent
//   - a two-level-deep traversal, which must leave both levels open
//
// Plus a keyboard check, because this is a pointer affordance and it would be a
// poor trade to fix hover by breaking arrow keys.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

/** Walk the cursor from a to b in `steps` moves, the way a hand would. */
async function trace(page, [x0, y0], [x1, y1], steps = 24) {
	for (let i = 1; i <= steps; i++) {
		await page.mouse.move(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
		// Real pointermove events arrive milliseconds apart; sending them all in
		// one tick would read as one impossibly fast flick, which is exactly the
		// gesture the velocity rule is supposed to close on.
		await page.waitForTimeout(10);
	}
}

const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];

/** Right-click a spot inside the demo card and wait for the menu. */
async function openContextMenu(page, cardId, where) {
	const zone = page.locator(`.card[id="${cardId}"] .card`).first();
	await zone.scrollIntoViewIfNeeded();
	const box = await zone.boundingBox();
	const [x, y] = where ? where(box, page.viewportSize()) : centre(box);
	await page.mouse.click(x, y, { button: "right" });
	await page.locator(".context-menu").first().waitFor({ state: "visible" });
	await page.waitForTimeout(150);
	return [x, y];
}

/** Hover a submenu row by its label and wait for its panel to land. */
async function hoverSubmenu(page, rowSelector, label) {
	const row = page.locator(rowSelector, { hasText: label }).first();
	const box = await row.boundingBox();
	await page.mouse.move(...centre(box));
	await page.locator(".submenu-panel").first().waitFor({ state: "visible" });
	// The panel is positioned after mount, so its rect is only trustworthy a
	// frame or two later.
	await page.waitForTimeout(150);
	return box;
}

/** Is the named row painted inside an open submenu panel right now? */
async function panelHas(page, text, index = 0) {
	const panel = page.locator(".submenu-panel").nth(index);
	if (!(await panel.count()) || !(await panel.isVisible())) return false;
	return (await panel.locator(`.menu-item:has-text("${text}")`).count()) > 0;
}

/**
 * Is the panel actually *painted*, not merely in the DOM?
 *
 * Worth the extra check: PopoverMenu's submenu panels used to be absolutely
 * positioned inside a Popover whose `overflow-y: auto` clipped them away
 * entirely. Every `isVisible()` in this file passed while nothing was on screen.
 */
async function panelPainted(page, index = 0) {
	const panel = page.locator(".submenu-panel").nth(index);
	if (!(await panel.count())) return false;
	return panel.evaluate((node) => {
		const b = node.getBoundingClientRect();
		const hit = document.elementFromPoint(b.x + b.width / 2, b.y + 8);
		return !!hit && (node === hit || node.contains(hit));
	});
}

const t = checks("submenu safe-triangle");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

try {
	// ── 1. The diagonal that must keep it open ───────────────────────────────
	await open(page, "/components/context-menu");
	await settle(page);
	await openContextMenu(page, "submenu-intent");

	const share = await hoverSubmenu(page, ".context-menu .submenu-row", "Share");
	t.ok("Share submenu opens on hover", await panelHas(page, "Airdrop"));

	// Aim at the *last* row of the panel: that path leaves the trigger row
	// almost immediately and spends most of its length over the sibling
	// submenu row below ("Move to"), which is the crossing that breaks a naive
	// implementation — and breaks it visibly, by swapping the panel's contents.
	const airdrop = await page
		.locator('.submenu-panel .menu-item:has-text("Airdrop")')
		.first()
		.boundingBox();
	await trace(page, centre(share), centre(airdrop));

	t.ok("diagonal across a sibling row keeps the submenu open", await panelHas(page, "Airdrop"));
	t.ok(
		"the sibling row it crossed did not steal the submenu",
		!(await panelHas(page, "Documents")),
	);

	// ── 2. A path that must close it ─────────────────────────────────────────
	// Back onto the trigger, then straight down the middle of the parent menu
	// to the last row. Never toward the panel, so never inside the cone.
	await page.mouse.move(...centre(share));
	await page.waitForTimeout(120);
	const del = await page
		.locator('.context-menu .menu-item:has-text("Delete")')
		.first()
		.boundingBox();
	await trace(page, centre(share), centre(del));

	const closed = await page
		.locator(".submenu-panel")
		.first()
		.waitFor({ state: "hidden", timeout: 1500 })
		.then(() => true)
		.catch(() => false);
	t.ok("moving elsewhere in the menu closes the submenu", closed);

	// ── 3. Handing over between adjacent submenu rows ────────────────────────
	// Walking up the menu from below crosses "Move to", which opens its own
	// submenu on the way, and lands on "Share". A guard that suppressed the
	// switch on a cached verdict would leave Move to open, then time out and
	// close it, ending with nothing open at all — which is worse than the bug
	// it was fixing. So the verdict is recomputed at the row's own coordinates.
	await trace(page, centre(del), centre(share), 10);
	await page.waitForTimeout(400);
	t.ok("crossing one submenu row to reach another hands over", await panelHas(page, "Airdrop"));

	// ── 4. Keyboard is untouched ─────────────────────────────────────────────
	// Arrow keys drive `activeIndex`, which is independent of any of this; if
	// the guard had been wired into the shared highlight it would show up here.
	// Named rather than counted: an open submenu row is `active` too.
	await page.keyboard.press("ArrowDown");
	await page.waitForTimeout(80);
	t.ok(
		"ArrowDown still highlights the first item",
		(await page.locator('.context-menu .menu-item.active:has-text("Open")').count()) === 1,
	);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(200);

	// ── 5. The flipped case: submenu on the LEFT ─────────────────────────────
	// Narrow the window so the demo card's right edge is the viewport's, then
	// right-click against it. The menu flips left of the cursor and the submenu
	// then has no room on its right either, so it swings left of the parent —
	// and the cone has to point the other way with it.
	await page.setViewportSize({ width: 720, height: 820 });
	await open(page, "/components/context-menu");
	await settle(page);
	await openContextMenu(page, "submenu-intent", (box) => [
		box.x + box.width - 6,
		box.y + box.height / 2,
	]);
	const flipRow = await hoverSubmenu(page, ".context-menu .submenu-row", "Share");
	const flipPanel = await page.locator(".submenu-panel").first().boundingBox();
	const flipped = flipPanel.x + flipPanel.width <= flipRow.x + 2;
	t.ok("submenu flipped to the left of its parent", flipped);

	if (flipped) {
		const target = await page
			.locator('.submenu-panel .menu-item:has-text("Airdrop")')
			.first()
			.boundingBox();
		await trace(page, centre(flipRow), centre(target));
		t.ok("leftward diagonal keeps the flipped submenu open", await panelHas(page, "Airdrop"));
	}
	await page.keyboard.press("Escape");
	await page.waitForTimeout(200);

	// ── 6. Two levels deep ───────────────────────────────────────────────────
	await page.setViewportSize({ width: 1280, height: 900 });
	await open(page, "/components/popover-menu");
	await settle(page);
	const card = page.locator('.card[id="submenu-intent"]');
	await card.scrollIntoViewIfNeeded();
	await card.locator("button").first().click();
	await page.locator(".dropdown-menu").first().waitFor({ state: "visible" });
	await page.waitForTimeout(150);

	const moveTo = await hoverSubmenu(page, ".submenu-row", "Move to");
	t.ok("level 1 opens on hover", await panelHas(page, "Inbox"));
	t.ok("level 1 escapes the popover's overflow", await panelPainted(page, 0));

	// Level 1 → the nested "Projects" row, crossing the "Share" row below.
	const projects = await page
		.locator('.submenu-panel .menu-item:has-text("Projects")')
		.first()
		.boundingBox();
	await trace(page, centre(moveTo), centre(projects));
	t.ok("diagonal into level 1 keeps it open", await panelHas(page, "Inbox"));

	// Level 2 opens off that row; the same diagonal again, one level down.
	await page.waitForTimeout(200);
	const glow = await page.locator('.submenu-panel .menu-item:has-text("Glow")').first();
	const opened2 = await glow
		.waitFor({ state: "visible", timeout: 1500 })
		.then(() => true)
		.catch(() => false);
	t.ok("level 2 opens on hover", opened2);

	if (opened2) {
		const paper = await page
			.locator('.submenu-panel .menu-item:has-text("Paper")')
			.first()
			.boundingBox();
		await trace(page, centre(projects), centre(paper));
		// Both levels have to survive: the pointer being inside level 2 is
		// inside level 1's panel too, so level 1's own guard must read it as
		// still-inside rather than as a departure.
		t.ok("level 2 stays open after the diagonal", await panelHas(page, "Paper", 1));
		t.ok("level 1 stays open under it", await panelHas(page, "Inbox", 0));
		t.ok("level 2 is painted over its parent", await panelPainted(page, 1));
	}

	// ── 7. Leaving the menu system entirely ──────────────────────────────────
	const menuBox = await page.locator(".dropdown-menu").first().boundingBox();
	await trace(page, centre(menuBox), [menuBox.x + menuBox.width + 400, menuBox.y + 300], 12);
	const gone = await page
		.locator(".submenu-panel")
		.first()
		.waitFor({ state: "hidden", timeout: 1500 })
		.then(() => true)
		.catch(() => false);
	t.ok("leaving the menu closes the submenus", gone);
} finally {
	await app.close();
}

t.done();
