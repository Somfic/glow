// The two things a still cannot show: a range being dragged out under the
// pointer, and the grid being walked with the arrow keys.

export const route = "/components/calendar";

const day = (card, iso) => `#${card} .day[data-iso="${iso}"]`;

export default async function demo({ r, at, page }) {
	// The field lives well down the page; put it in the middle of the viewport so
	// the popover it opens has room below it in frame.
	await page.locator("#form-control").scrollIntoViewIfNeeded();
	await page.waitForTimeout(400);

	await r.say("A date field opens the calendar in a popover");
	await r.shot(5);

	const trigger = "#form-control .control.wide .date-trigger";
	await r.point(...(await at(trigger)));
	await r.shot(3);
	await r.click(...(await at(trigger)));
	// Shot through the open transition rather than after it: frames are taken one
	// at a time, so waiting for the popover would skip the movement entirely.
	await r.shot(8);

	await r.say("The first click opens a range…");
	await r.shot(4);
	await r.click(...(await at('.popover-content .day[data-iso="2026-03-09"]')));
	await r.shot(4);

	await r.say("…and the pending span previews under the pointer");
	for (const iso of ["2026-03-11", "2026-03-13", "2026-03-16", "2026-03-18"]) {
		await r.point(...(await at(`.popover-content .day[data-iso="${iso}"]`)));
		await r.shot(2);
	}
	await r.shot(4);

	await r.click(...(await at('.popover-content .day[data-iso="2026-03-18"]')));
	await r.say("A complete range commits it and closes the field");
	await r.shot(8);

	// ── Keyboard ──
	await page.locator("#single").scrollIntoViewIfNeeded();
	await page.waitForTimeout(400);
	await r.say("The grid is one tab stop — arrows move, PageDown pages the month");
	await r.shot(5);

	await page.locator('#single .day[tabindex="0"]').focus();
	for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "End", "ArrowDown"]) {
		await page.keyboard.press(key);
		await r.shot(3);
	}
	await page.keyboard.press("PageDown");
	await r.shot(6);
	await page.keyboard.press("Enter");
	await r.shot(8);

	await r.say();
	await r.shot(3);
}
