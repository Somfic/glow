// Scroll position across a navigation. The point is a thing that *stops*
// happening, so the GIF has to show the scroll being carried down the page
// first — otherwise there is nothing for the reset to be visible against.

export const route = "/components/buttons";

const PANEL = ".page.sidebar-mode";

export default async function demo({ r, at, page }) {
	// The panel is the scroller, not the document, so this is the element the
	// bug was about — scrolling the window here would do nothing at all.
	const scroll = (y) => page.evaluate(([s, v]) => (document.querySelector(s).scrollTop = v), [PANEL, y]);

	await r.say("Read a page down to the bottom");
	await r.shot(6);

	for (const y of [300, 700, 1100, 1500, 1900]) {
		await scroll(y);
		await r.shot(2);
	}
	await r.shot(6);

	await r.say("Then pick another page from the rail");
	const link = await at('.sidebar a[href="/components/card"]');
	await r.point(...link);
	await r.shot(6);

	await r.click(...link);
	// Shoot through the crossfade: a stale offset would show up in these frames
	// even though the settled position is right.
	await r.shot(12);

	await r.say("It opens at the top — and Back returns to where you were");
	await r.shot(8);

	await page.goBack();
	await r.shot(12);
	await r.shot(8);

	await r.say();
	await r.shot(4);
}
