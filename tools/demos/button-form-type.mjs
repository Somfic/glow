// `type` is not a look, it is what the form does when you click — which is
// exactly the thing a still cannot show. The card reports its own submit and
// reset events, so the GIF is a readout rather than a claim.

export const route = "/components/buttons";

export default async function demo({ r, at, page }) {
	// The card is below the fold, and frames are viewport screenshots.
	await page.locator("#button-form-actions").scrollIntoViewIfNeeded();
	await page.waitForTimeout(300);

	await r.say("Three buttons in one form");
	await r.shot(7);

	await r.say("type=\"submit\" submits it");
	await r.click(...(await at('#button-form-actions button:nth-of-type(1)')));
	await r.shot(9);

	await r.say("A plain button runs its onclick and leaves the form alone");
	await r.click(...(await at('#button-form-actions button:nth-of-type(3)')));
	await r.shot(11);

	await r.say("type=\"reset\" resets it");
	await r.click(...(await at('#button-form-actions button:nth-of-type(2)')));
	await r.shot(9);

	await r.say();
	await r.shot(4);
}
