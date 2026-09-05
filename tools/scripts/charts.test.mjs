// The chart interactions a static screenshot cannot show: the hover crosshair,
// its tooltip, and the keyboard equivalent. Also leaves two hover shots in
// `.shots/` for a pull request, since `shots.mjs` never touches the page.
//
//   node tools/scripts/charts.test.mjs [--no-build]

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, setTheme, settle } from "../glow/docs.mjs";

const t = checks("charts — crosshair, tooltip, keyboard");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

const shots = join(ROOT, ".shots");
mkdirSync(shots, { recursive: true });

const page = app.page;

try {
	await open(page, "/components/charts");

	// Assert properties of the components, not of the examples, so this survives
	// the next rewording of the docs page.
	const sparkline = page.locator(".sparkline svg .line").first();
	t.ok("sparkline draws a path", ((await sparkline.getAttribute("d")) ?? "").startsWith("M"));

	const plot = page.locator(".line-chart .plot").first();
	await plot.scrollIntoViewIfNeeded();
	const box = await plot.boundingBox();

	t.ok("no tooltip before the pointer arrives", (await page.locator(".line-chart .tooltip").count()) === 0);

	await page.mouse.move(box.x + box.width * 0.62, box.y + box.height / 2);
	const tooltip = page.locator(".line-chart .tooltip").first();
	await tooltip.waitFor({ state: "visible" });
	t.ok("hover opens a tooltip", await tooltip.isVisible());
	t.ok("the tooltip carries a readout", (await tooltip.innerText()).trim().length > 0);
	t.ok("the crosshair is drawn", (await page.locator(".line-chart .crosshair").count()) > 0);

	// The tooltip must never sit under the pointer, or it would flicker.
	const box2 = await tooltip.boundingBox();
	t.ok("the tooltip clears the plot's right edge", box2.x + box2.width <= box.x + box.width + 1);

	await page.mouse.move(-50, -50);
	await page.waitForTimeout(50);
	t.ok("leaving closes it", (await page.locator(".line-chart .tooltip").count()) === 0);

	// Keyboard: the same readout, announced through the live region.
	await plot.focus();
	await page.keyboard.press("ArrowRight");
	const live = page.locator(".line-chart [aria-live]").first();
	const announced = (await live.innerText()).trim();
	t.ok("arrow keys move the crosshair", (await page.locator(".line-chart .crosshair").count()) > 0);
	t.ok("and announce a readout", announced.length > 0);

	await page.keyboard.press("Escape");
	t.ok("escape clears it", (await page.locator(".line-chart .crosshair").count()) === 0);

	// Every LineChart ships its data as a table, hidden or not.
	t.ok(
		"the data table is in the DOM",
		(await page.locator(".line-chart table caption").count()) > 0
	);

	for (const theme of ["dark", "light"]) {
		await setTheme(page, theme);
		const card = page.locator('.card[id="line-chart"]').first();
		await card.scrollIntoViewIfNeeded();
		await settle(page, { hideCursor: true });
		const target = await card.locator(".plot").first().boundingBox();
		await page.mouse.move(target.x + target.width * 0.62, target.y + target.height / 2);
		await page.locator(".line-chart .tooltip").first().waitFor({ state: "visible" });
		const cardBox = await card.boundingBox();
		await page.screenshot({
			path: join(shots, `components-charts-crosshair-${theme}.png`),
			clip: { x: cardBox.x - 12, y: cardBox.y - 12, width: cardBox.width + 24, height: cardBox.height + 24 }
		});
	}
} finally {
	await app.close();
}

t.done();
