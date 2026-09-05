// The slide is the component, and a still cannot show it — nor can it show
// that the group now answers the arrow keys.
//
//   node tools/scripts/demo.mjs radio-input
//
// The date-range example is the one to drive: its options are deliberately
// uneven ("Day" against "All time"), so the indicator's width animation is
// visible and not just its travel.

export const route = "/components/inputs";

const CARD = '.card[id="radio-input-sizes"]';
const group = `${CARD} .radio-input[aria-label="Range, medium"]`;

export default async function demo({ r, at, page }) {
	// The radio examples are a long way down a page of fifteen input types.
	await page.locator(CARD).scrollIntoViewIfNeeded();
	await page.evaluate(() => window.scrollBy(0, -80));
	await page.waitForTimeout(200);

	await r.say("A highlight that slides between the options");
	await r.shot(6);

	// Narrow → widest: the indicator has to grow as well as travel.
	const option = (n) => `${group} .radio-option:nth-of-type(${n})`;
	await r.point(...(await at(option(4))));
	await r.shot(3);
	await r.click(...(await at(option(4))));
	// Frames are taken one at a time, so the slide is caught by shooting
	// through it rather than by waiting for it to land.
	await r.shot(10);

	await r.click(...(await at(option(1))));
	await r.shot(10);

	await r.say("Arrow keys move it too — the group is one tab stop");
	await r.shot(6);

	await page.locator(`${group} .radio-option[tabindex="0"]`).focus();
	for (const _ of [0, 1, 2]) {
		await page.keyboard.press("ArrowRight");
		await r.shot(6);
	}

	await r.say();
	await r.shot(4);
}
