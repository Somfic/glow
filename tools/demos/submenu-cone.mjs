// The submenu safe triangle, which is a path and so cannot be shown in a still.
//
//   node tools/scripts/demo.mjs submenu-cone
//
// The drawn pointer is the whole point here: what the viewer has to see is the
// cursor leaving the trigger row, travelling across the row *below* it, and the
// submenu staying open the whole way. Then the same menu closing when the
// pointer goes somewhere the panel isn't, so it doesn't just look sticky.

export const route = "/components/context-menu";

const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];

/** Walk the pointer along a straight line, shooting as it goes. */
async function glide(r, from, to, steps = 7) {
	for (let i = 1; i <= steps; i++) {
		await r.point(from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps);
		await r.shot(2);
	}
}

export default async function demo({ r, page }) {
	const card = page.locator('.card[id="submenu-intent"]');
	await card.scrollIntoViewIfNeeded();
	await page.waitForTimeout(300);

	const zone = card.locator(".card").first();
	const [zx, zy] = centre(await zone.boundingBox());

	await r.say("Right-click, then hover a submenu row");
	await r.point(zx, zy);
	await r.shot(6);

	await page.evaluate(() => window.__demo.tap());
	await page.mouse.click(zx, zy, { button: "right" });
	await page.waitForTimeout(250);
	await r.shot(4);

	const share = await page
		.locator(".context-menu .submenu-row", { hasText: "Share" })
		.first()
		.boundingBox();
	await r.point(...centre(share));
	await page.waitForTimeout(250);
	await r.shot(8);

	await r.say("The path to the panel is diagonal — it crosses the row below");
	await r.shot(8);

	// Aim at the panel's last row: the line spends most of its length over the
	// "Move to" row, which is the crossing a naive mouseleave closes on.
	const target = await page
		.locator('.submenu-panel .menu-item:has-text("Airdrop")')
		.first()
		.boundingBox();
	await glide(r, centre(share), centre(target));
	await r.shot(10);

	await r.say("Still open. Move somewhere it isn't, and it closes");
	await r.shot(8);

	await r.point(...centre(share));
	await r.shot(3);
	const del = await page
		.locator('.context-menu .menu-item:has-text("Delete")')
		.first()
		.boundingBox();
	await glide(r, centre(share), centre(del), 5);
	await r.shot(12);

	await r.say();
	await r.shot(4);
}
