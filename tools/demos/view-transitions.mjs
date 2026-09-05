// Navigating the docs with view transitions on.
//
// The whole point is invisible in a still, and nearly invisible in a GIF at
// its real speed: the crossfade is `--glow-dur-base`, which at 11fps is two
// frames. So the demo slows the `root` group down for the recording and says
// so in the caption — everything else, including the sidebar sitting the
// transition out, is exactly what the site does.

export const route = "/components/card";

const SLOW = `::view-transition-old(root), ::view-transition-new(root) {
	animation-duration: 1.2s !important;
}`;

const link = (href) => `.glow-root > .sidebar a[href="${href}"]`;

export default async function demo({ r, at, page }) {
	await page.addStyleTag({ content: SLOW });

	// The two top items, not a component deep in the rail: the sidebar's nav
	// scrolls, and `at()` will happily hand back the centre of a link that is
	// below the fold, which the mouse then clicks straight past.
	await r.say("Navigating between pages (crossfade slowed 8×)");
	await r.shot(6);

	await r.point(...(await at(link("/"))));
	await r.shot(3);

	await r.click(...(await at(link("/"))));
	// Shot through the transition rather than after it: the frames in the
	// middle are the ones that show the content dissolving while the rail
	// beside it holds still.
	await r.shot(16);

	await r.say("The rail never fades — only its highlight moved");
	await r.shot(8);

	await r.point(...(await at(link("/components"))));
	await r.shot(3);
	await r.click(...(await at(link("/components"))));
	await r.shot(16);

	await r.say();
	await r.shot(4);
}
