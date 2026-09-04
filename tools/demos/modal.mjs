// The reference demo — copy this shape for a new component.
//
// Keep it short: a GIF that runs longer than about eight seconds gets scrolled
// past. Say what is about to happen, do one thing, hold on the result.

export const route = "/components/modal";

export default async function demo({ r, at, page }) {
	await r.say("A modal, opened from a button");
	await r.shot(6);

	await r.point(...(await at('.card[id] button')));
	await r.shot(3);

	await r.click(...(await at('.card[id] button')));
	// Frames are taken one at a time, so the open transition is caught by
	// shooting through it rather than by waiting for it to finish.
	await r.shot(10);

	await r.say("Escape closes it, and focus goes back to the button");
	await r.shot(8);

	await page.keyboard.press("Escape");
	await r.shot(10);

	await r.say();
	await r.shot(4);
}
