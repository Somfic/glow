// The two things a still cannot show: unfolding the unchanged middle of a
// file, and the same diff switching between unified and side-by-side.

export const route = "/components/diff-view";

// `scrollIntoViewIfNeeded()` moves the card just far enough to be technically
// visible, which for a card taller than the viewport leaves the part being
// demonstrated off the bottom of every frame. Centre it instead.
async function scrollTo(page, selector) {
	await page.locator(selector).evaluate((el) => el.scrollIntoView({ block: 'center' }));
	await page.waitForTimeout(500);
}

export default async function demo({ r, at, page }) {
	await scrollTo(page, "#collapse");
	await r.say("Unchanged lines fold away, three either side of a change");
	await r.shot(8);

	const expander = "#collapse .diff-view .expand";
	await r.point(...(await at(expander)));
	await r.shot(3);
	await r.click(...(await at(expander)));
	await r.shot(10);

	await r.say("Expanding one puts the lines back in place");
	await r.shot(8);

	await scrollTo(page, "#modes");
	await r.say("The same diff, unified or side by side");
	await r.shot(8);

	const split = "#modes button:has-text('Split')";
	await r.click(...(await at(split)));
	await r.shot(10);

	await r.say("Long lines scroll both panes together — or wrap");
	await r.shot(6);

	const wrapToggle = "#modes button:has-text('Scrolling')";
	await r.click(...(await at(wrapToggle)));
	await r.shot(12);

	await r.say();
	await r.shot(4);
}
