// The portalled components, which is where layering goes wrong.
//
//   node tools/scripts/layers.test.mjs
//   node tools/scripts/layers.test.mjs --no-build
//
// Modal, Drawer, Popover and CommandPalette all `use:portal` themselves out to
// <body> and then rely on a z-index to sit above the page (9999, and 10000 for
// a Popover so it can open over a Modal). None of that is visible from the
// component's own markup, and all of it breaks quietly: the element is in the
// DOM and `isVisible()` is true while something else is painted on top of it.
//
// So these checks ask the browser what is actually at the point in question,
// via elementFromPoint, rather than whether the node exists.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

/**
 * Each case: the docs route, how to open the overlay, and the element that
 * actually lands in <body>.
 *
 * The surfaces are the portalled wrappers, not the components' own class names
 * — `.modal-overlay` rather than `.modal`. Worth knowing before you write the
 * next one of these: the wrapper is what carries the z-index.
 */
const CASES = [
	{ name: "Modal", route: "/components/modal", surface: ".modal-overlay" },
	{ name: "Drawer", route: "/components/drawer", surface: ".drawer-overlay" },
	{ name: "Popover", route: "/components/popover", surface: ".popover-content" },
	{
		name: "Command palette",
		route: "/components/command-palette",
		surface: ".cp-overlay",
		// This page documents the palette itself, so its examples are not the
		// id-bearing cards the others use — there is one named button instead.
		trigger: (page) => page.getByRole("button", { name: "Open Palette" }),
	},
];

const t = checks("portalled layers");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

try {
	for (const { name, route, surface, trigger: pick } of CASES) {
		await open(page, route);

		// Default to the first button in the first documented example, which is
		// the trigger on most of these pages. Naming a button per page only
		// where that does not hold keeps the script from rotting every time an
		// example is reworded.
		const trigger = pick ? pick(page) : page.locator(".card[id] button").first();
		if (!(await trigger.count())) {
			t.ok(`${name}: has a trigger`, false);
			continue;
		}
		await trigger.click();
		await settle(page, { hideCursor: false });

		const el = page.locator(surface).first();
		const shown = (await el.count()) > 0 && (await el.isVisible());
		t.ok(`${name}: opens`, shown);
		if (!shown) continue;

		// A portalled surface has left the example card it was declared in. If it
		// is still inside one, `use:portal` did not run and the overlay is
		// trapped in the card's stacking context and its overflow.
		t.ok(
			`${name}: portalled out of the example`,
			await el.evaluate((n) => n.closest(".card") === null),
		);

		// What is painted at the middle of the surface? If it is not the surface
		// or something inside it, the overlay is behind the page.
		const onTop = await el.evaluate((node) => {
			const b = node.getBoundingClientRect();
			const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
			return !!hit && (node === hit || node.contains(hit));
		});
		t.ok(`${name}: nothing painted over it`, onTop);

		// Escape has to close it, or the page is a trap for a keyboard user.
		//
		// Waited for rather than polled once: these overlays leave on a Svelte
		// `transition:`, whose duration is a number in the component and so is
		// not one of the `--glow-dur-*` tokens that `prefers-reduced-motion`
		// collapses. The surface is still painted for a few hundred ms after the
		// keypress even with motion "off", and checking immediately reads that
		// as a stuck overlay.
		await page.keyboard.press("Escape");
		const closed = await el
			.first()
			.waitFor({ state: "hidden", timeout: 2000 })
			.then(() => true)
			.catch(() => false);
		t.ok(`${name}: Escape closes it`, closed);
	}
} finally {
	await app.close();
}

t.done();
