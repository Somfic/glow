// Keyboard movement is invisible in a still: the only thing that changes
// between two frames of a roving-tabindex group is where the focus ring is.
// So this demo never clicks anything — every move is a real key, which is also
// what keeps `:focus-visible` on and the ring painted.

export const route = "/components/roving-focus";

/** Put a card at the top of the viewport so the ring has room to travel. */
async function show(page, id) {
	await page.locator(`.card[id="${id}"]`).scrollIntoViewIfNeeded();
	await page.evaluate(() => window.scrollBy(0, -60));
	await page.waitForTimeout(200);
}

export default async function demo({ r, page }) {
	await show(page, "toolbar");
	await r.say("A toolbar is one tab stop — Tab reaches it once");
	// Tab in from the page rather than calling .focus(): the browser only paints
	// a focus ring for focus it believes came from the keyboard.
	await page.locator('.card[id="toolbar"] [data-roving-item]').first().focus();
	await page.keyboard.press("Home");
	await r.shot(8);

	await r.say("The arrow keys move inside it, and the tab stop moves with them");
	for (let i = 0; i < 4; i++) {
		await page.keyboard.press("ArrowRight");
		await r.shot(4);
	}
	await page.keyboard.press("End");
	await r.shot(6);
	await page.keyboard.press("Home");
	await r.shot(6);

	await show(page, "dynamic");
	await r.say("Focus a row, then change the list underneath it");
	await page.locator('.card[id="dynamic"] [data-roving-item]').nth(2).focus();
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowDown");
	await r.shot(8);

	// dispatchEvent rather than click: a real click would move focus to the
	// button, and the point is that focus never leaves the group.
	await page.getByRole("button", { name: "Add a row" }).dispatchEvent("click");
	await page.waitForTimeout(150);
	await r.say("A new row appears — still exactly one tabindex=0");
	await r.shot(10);

	// Step onto the row that is about to be deleted.
	await page.keyboard.press("ArrowUp");
	await r.shot(6);
	await page.getByRole("button", { name: "Remove the second row" }).dispatchEvent("click");
	await page.waitForTimeout(150);
	await r.say("Delete the focused row and focus lands on what took its place");
	await r.shot(12);

	await page.keyboard.press("ArrowDown");
	await r.shot(6);
	await r.say();
	await r.shot(4);
}
