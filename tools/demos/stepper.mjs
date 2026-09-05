// The step-to-step transition: a marker filling in, the connector behind it
// colouring, and a completed step being clicked to go back.

export const route = "/components/stepper";

export default async function demo({ r, at, page }) {
	// Frames are viewport screenshots, so the card has to be on screen before
	// anything is pointed at — boundingBox() is viewport-relative too.
	await page.locator("#navigation").scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);

	await r.say("A wizard, two steps in");
	await r.shot(6);

	const next = await at('#navigation button:has-text("Next")');
	await r.point(...next);
	await r.shot(3);

	await r.click(...next);
	// Shoot *through* the transition rather than waiting for it to settle.
	await r.shot(8);

	await r.click(...next);
	await r.shot(8);

	await r.say("A completed step is a button — it goes back");
	await r.shot(6);

	await r.click(...(await at("#navigation .stepper button.step-inner")));
	await r.shot(10);

	await r.say();
	await r.shot(4);
}
