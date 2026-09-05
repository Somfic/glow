// AnimatedText — a component that is nothing at all in a still.
//
// Two things a screenshot cannot carry: that the words arrive one at a time
// behind a caret, and that a `text` which grows mid-reveal is picked up rather
// than restarted. The second is the whole reason the component exists, so it
// gets the second half of the GIF.
//
// Recorded with motion on, so `prefers-reduced-motion` is NOT in force here —
// what that produces is the finished paragraph, which is a still, and lives in
// the docs page instead.

export const route = "/components/animated-text";

export default async function demo({ r, at, page }) {
	const replay = "#reveal button";

	await r.say("Text arrives a word at a time, behind a caret");
	await r.point(...(await at(replay)));
	await r.shot(4);

	await r.click(...(await at(replay)));
	// Frames are taken one at a time, so the reveal is caught by shooting
	// through it rather than by waiting for it to land.
	await r.shot(26);
	await r.shot(4);

	await r.say("The box is sized against the whole string, so nothing reflows");
	await r.shot(4);

	await page.locator("#streaming").scrollIntoViewIfNeeded();
	await page.waitForTimeout(500);
	await r.say("And the text can grow mid-reveal — it carries on, it doesn't restart");
	await r.shot(5);

	const stream = "#streaming button";
	await r.point(...(await at(stream)));
	await r.shot(3);
	await r.click(...(await at(stream)));
	await r.shot(44);

	await r.say();
	await r.shot(4);
}
