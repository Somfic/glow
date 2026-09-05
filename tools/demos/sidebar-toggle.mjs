// The rail's collapse control, now a `<Button size="sm">`. The point of this
// one is the hover fill and the icon swap — neither of which a still shows,
// and both of which are the parts that came from Button rather than from
// hand-rolled CSS.
export const route = "/components/sidebar";

const toggle = "#live .collapse-toggle";

export default async function demo({ r, at, page }) {
	await page.locator("#live").scrollIntoViewIfNeeded();

	await r.say("The rail's collapse control is a glow Button");
	await r.shot(6);

	await r.point(...(await at(toggle)));
	// Hold on the hover: the fill under the chevron is Button's own
	// `bare` state layer, not a colour this file picks.
	await r.shot(8);

	await r.click(...(await at(toggle)));
	await r.shot(12);

	await r.say("Collapsed, it swaps the chevron and renames itself");
	await r.shot(10);

	await r.click(...(await at(toggle)));
	await r.shot(12);

	await r.say();
	await r.shot(4);
}
