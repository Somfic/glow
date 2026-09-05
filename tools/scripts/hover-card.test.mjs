// HoverCard's interaction, which is the whole component.
//
//   node tools/scripts/hover-card.test.mjs
//   node tools/scripts/hover-card.test.mjs --no-build
//
// Everything worth getting wrong here is timing and hit-testing, neither of
// which is visible from the markup: the open delay is not the close delay, and
// the pointer has to survive the dead space between the trigger and the card.
// So these checks drive a real pointer and ask the browser what is painted at
// the point in question, rather than whether a node exists.

import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");
const shots = join(ROOT, ".shots");

const t = checks("hover card");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

const card = () => page.locator(".hover-card", { hasText: "Ada Lovelace" });
const isOpen = async () => (await card().count()) > 0;
const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

try {
	await open(page, "/components/hover-card");
	await settle(page);

	const trigger = page.locator('.card[id="basic"] a').first();
	const tBox = await trigger.boundingBox();
	const tCentre = centre(tBox);

	// ── Open is deliberately slow ──
	await page.mouse.move(tCentre.x, tCentre.y);
	await page.waitForTimeout(250);
	t.ok("does not open on the way past (250ms < openDelay)", !(await isOpen()));
	await page.waitForTimeout(600);
	t.ok("opens once the pointer has rested (850ms > openDelay)", await isOpen());

	// ── The gap between trigger and card is survivable ──
	const cBox = await card().boundingBox();
	const gapY = (tBox.y + tBox.height + cBox.y) / 2;
	const painted = await page.evaluate(
		([x, y]) => document.elementFromPoint(x, y)?.className ?? "",
		[tCentre.x, gapY],
	);
	t.ok("the gap is covered by the bridge", String(painted).includes("hover-card-bridge"));

	await page.mouse.move(tCentre.x, gapY);
	// Comfortably longer than closeDelay: a naive pointerleave would have closed
	// the card by now, and the bridge is the only reason it hasn't.
	await page.waitForTimeout(500);
	t.ok("stays open while the pointer pauses in the gap", await isOpen());

	const cCentre = centre(cBox);
	await page.mouse.move(cCentre.x, cCentre.y);
	await page.waitForTimeout(400);
	t.ok("stays open on the card itself", await isOpen());

	// The one state the per-card screenshots can't reach: a card opened by an
	// actual pointer, over the example it belongs to.
	mkdirSync(shots, { recursive: true });
	const example = await page.locator('.card[id="basic"]').boundingBox();
	await page.screenshot({
		path: join(shots, "hover-card-hovered.png"),
		clip: {
			x: example.x - 12,
			y: example.y - 12,
			width: example.width + 24,
			height: cBox.y + cBox.height + 24 - example.y,
		},
	});

	// ── Close is deliberately quick, but not instant ──
	await page.mouse.move(5, 5);
	await page.waitForTimeout(60);
	t.ok("does not close the instant the pointer leaves", await isOpen());
	await page.waitForTimeout(500);
	t.ok("closes shortly after (closeDelay)", !(await isOpen()));

	// ── Keyboard ──
	// The keyboard example is the one whose card has something focusable in it,
	// which is the case this is about.
	const kbCard = () => page.locator(".hover-card", { hasText: "announced as the trigger" });
	const kbTrigger = page.locator('.card[id="keyboard"] a').first();
	// Tab first so the browser counts the interaction as keyboard, which is what
	// :focus-visible — and therefore focus-opening — keys off.
	await page.locator("h1").click();
	await page.keyboard.press("Tab");
	await kbTrigger.focus();
	await page.waitForTimeout(120);
	t.ok("focus opens it immediately", (await kbCard().count()) > 0);

	t.ok(
		"a focus-opened card is not hidden from assistive tech",
		await page.evaluate(
			() =>
				[...document.querySelectorAll(".hover-card")].some(
					(el) => el.textContent.includes("announced as the trigger") &&
						el.getAttribute("aria-hidden") === null,
				),
		),
	);
	t.ok(
		"the trigger describes itself with the card",
		await page.evaluate(() => {
			const id = document.activeElement?.getAttribute("aria-describedby");
			return !!id && !!document.getElementById(id)?.classList.contains("hover-card");
		}),
	);

	await page.keyboard.press("Tab");
	t.ok(
		"Tab moves into the card, not past it",
		await page.evaluate(() => !!document.activeElement?.closest(".hover-card")),
	);

	await page.keyboard.press("Escape");
	// Popover fades its panel out over a hardcoded 150ms that `reducedMotion`
	// does not collapse, so the node outlives the state change.
	await page.waitForTimeout(400);
	t.ok("Escape closes it", (await kbCard().count()) === 0);

	// ── Async content ──
	mkdirSync(shots, { recursive: true });
	await page.getByRole("button", { name: "Show loading state" }).click();
	await page.waitForTimeout(300);
	t.ok(
		"an in-flight onOpen renders skeletons",
		await page.locator(".hover-card .skeleton").first().isVisible(),
	);
	await page.mouse.move(5, 5);
	await page.waitForTimeout(200);
	await page.screenshot({ path: join(shots, "hover-card-loading.png") });

	await page.waitForTimeout(4200);
	t.ok(
		"the resolved content replaces them",
		await page.locator(".hover-card", { hasText: "Alan Turing" }).isVisible(),
	);
} finally {
	await app.close();
}

t.done();
