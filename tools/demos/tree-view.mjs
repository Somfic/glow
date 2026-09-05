// TreeView: expand/collapse, and then the part a screenshot cannot show at all
// — driving the whole tree from the keyboard with one tab stop.

export const route = "/components/tree-view";

export default async function demo({ r, at, page }) {
	// Park the file-tree card at the top of the viewport; the GIF is the whole
	// viewport, so what is on screen is the whole composition.
	await page.evaluate(() => {
		const card = document.querySelector('.card[id="files"]');
		window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 12 });
	});
	await page.waitForTimeout(300);

	await r.say("Click the chevron to expand — the row itself selects");
	await r.shot(6);

	await r.point(...(await at('[data-tree-id="static"] .twisty')));
	await r.shot(3);
	await r.click(...(await at('[data-tree-id="static"] .twisty')));
	// Shot through the reveal rather than after it: frames are taken one at a
	// time, so this is what catches the animation.
	await r.shot(8);

	await r.say("One tab stop, then the arrows do everything");
	await page.locator('[data-tree-id="src"]').first().focus();
	await r.shot(6);

	// Down walks the *visible* nodes, so it steps out of one folder and into
	// whatever comes next — which is the thing worth showing.
	for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown"]) {
		await page.keyboard.press(key);
		await r.shot(2);
	}

	await r.say("Left collapses, then walks back out to the parent");
	await r.shot(4);
	for (const key of ["ArrowLeft", "ArrowLeft", "ArrowLeft"]) {
		await page.keyboard.press(key);
		await r.shot(5);
	}

	await r.say("Enter selects");
	await page.keyboard.press("Enter");
	await r.shot(8);

	await r.say();
	await r.shot(4);
}
