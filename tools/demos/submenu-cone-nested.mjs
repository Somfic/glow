// The same safe triangle, two levels deep, in a PopoverMenu.
//
//   node tools/scripts/demo.mjs submenu-cone-nested
//
// Separate from `submenu-cone.mjs` because it is showing something else: that
// the guard composes down a chain (the pointer inside level 2 is inside level
// 1's panel, so neither closes), and that these panels now portal out of the
// Popover instead of being clipped away by its `overflow-y: auto`.

export const route = "/components/popover-menu";

const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];

async function glide(r, from, to, steps = 6) {
	for (let i = 1; i <= steps; i++) {
		await r.point(from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps);
		await r.shot(2);
	}
}

async function box(page, selector, hasText) {
	return page.locator(selector, hasText ? { hasText } : undefined).first().boundingBox();
}

export default async function demo({ r, page }) {
	const card = page.locator('.card[id="submenu-intent"]');
	await card.scrollIntoViewIfNeeded();
	await page.waitForTimeout(300);

	await r.say("Submenus open on hover and nest as deep as you like");
	const trigger = centre(await card.locator("button").first().boundingBox());
	await r.point(...trigger);
	await r.shot(5);
	await r.click(...trigger);
	await page.waitForTimeout(300);
	await r.shot(6);

	const moveTo = await box(page, ".submenu-row", "Move to");
	await r.point(...centre(moveTo));
	await page.waitForTimeout(300);
	await r.shot(8);

	await r.say("Aim across the row below, into the panel, and on into Projects");
	await r.shot(8);

	const projects = await box(page, '.submenu-panel .menu-item:has-text("Projects")');
	await glide(r, centre(moveTo), centre(projects));
	await page.waitForTimeout(300);
	await r.shot(8);

	const paper = await box(page, '.submenu-panel .menu-item:has-text("Paper")');
	await glide(r, centre(projects), centre(paper), 5);
	await r.shot(12);

	await r.say("Both levels stayed open the whole way");
	await r.shot(10);

	await r.say();
	await r.shot(3);
}
