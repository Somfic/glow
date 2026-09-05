// AnimatedList is entirely motion: a still of it is a list. This walks the four
// things that make rows move — a re-sort, a filter that removes and restores, an
// insert, and a delete — and shoots through each transition rather than waiting
// for it to finish.

export const route = "/components/animated-list";

/** Put a card at the top of the viewport and let the scroll settle. */
async function show(page, id) {
	await page.locator(`.card[id="${id}"]`).first().scrollIntoViewIfNeeded();
	await page.waitForTimeout(350);
}

export default async function demo({ r, at, page }) {
	const button = (card, label) =>
		at(`.card[id="${card}"] button:has-text("${label}")`);

	await show(page, "reorder");
	await r.say("Rows are keyed by id, so a re-sort moves them");
	await r.shot(5);

	await r.click(...(await button("reorder", "By latency")));
	await r.shot(11);
	await r.click(...(await button("reorder", "Shuffle")));
	await r.shot(11);

	await show(page, "filter");
	await r.say("Filtering: rows leave in place, the rest close the gap");
	await r.shot(5);

	await r.click(...(await button("filter", "Design")));
	await r.shot(10);
	await r.click(...(await button("filter", "All")));
	await r.shot(12);

	await show(page, "add-remove");
	await r.say("An insert pushes the list down; a delete pulls it back up");
	await r.shot(5);

	await r.click(...(await button("add-remove", "Add task")));
	await r.shot(11);

	const remove = await at('.card[id="add-remove"] .animated-list > .row:nth-child(2) button');
	await r.click(...remove);
	await r.shot(12);

	await r.say();
	await r.shot(4);
}
