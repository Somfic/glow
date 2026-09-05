// AnimatedNumber — the component in the library a still says least about.
//
// Three things a screenshot cannot carry: that the number counts rather than
// cuts, that a second change mid-count retargets from where the digits
// currently are instead of restarting, and that the odometer's wheels roll.
//
// Recorded with motion on, so `prefers-reduced-motion` is NOT in force here —
// the snap it produces is a still, and lives in the docs page instead.

export const route = "/components/animated-number";

export default async function demo({ r, at, page }) {
	const button = "#tween button";

	await r.say("A new value counts up to itself, rather than cutting to it");
	await r.point(...(await at(button)));
	await r.shot(4);

	await r.click(...(await at(button)));
	// Frames are taken one at a time, so the tween is caught by shooting
	// through it rather than by waiting for it to land.
	await r.shot(10);
	await r.shot(4);

	await r.say("Change it again mid-count: it retargets from where it is");
	await r.click(...(await at(button)));
	await r.shot(4);
	// Halfway through the run, not after it: this second click is the point.
	await r.click(...(await at(button)));
	await r.shot(12);

	await r.say('mode="odometer" rolls each digit on its own wheel');
	await page.locator("#odometer").scrollIntoViewIfNeeded();
	await page.waitForTimeout(400);
	await r.shot(4);

	const advance = "#odometer button";
	await r.click(...(await at(advance)));
	await r.shot(12);

	await r.say();
	await r.shot(4);
}
