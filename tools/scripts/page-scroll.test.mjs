// The content panel's scroll position across a navigation.
//
//   node tools/scripts/page-scroll.test.mjs [--no-build]
//
// Beside a sidebar, `Page` makes its panel the scroller rather than the
// document (Page.svelte, `.page.sidebar-mode`), which puts the offset out of
// SvelteKit's reach — `window.scrollY` is always 0 here, so resetting it is a
// no-op and page two used to open at page one's offset.
//
// The viewport is deliberately short: at the harness default the docs pages fit
// and nothing scrolls, which is why this went unnoticed for so long.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open } from "../glow/docs.mjs";

const PANEL = ".page.sidebar-mode";
const LONG = "/components/buttons";
const OTHER = "/components/card";

const t = checks("page panel scroll");
const app = await launch({ build: !process.argv.includes("--no-build"), cwd: ROOT });
t.watch(app.page);

const page = app.page;
const top = () => page.evaluate((s) => document.querySelector(s).scrollTop, PANEL);
const scrollTo = async (y) => {
	await page.evaluate(([s, v]) => (document.querySelector(s).scrollTop = v), [PANEL, y]);
	await page.waitForTimeout(120);
};
/** Click a sidebar link the way a reader does, rather than calling goto(). */
const via = async (href) => {
	await page.click(`.sidebar a[href="${href}"]`);
	await page.waitForFunction((h) => location.pathname === h, href);
	await page.waitForTimeout(400);
};

try {
	await page.setViewportSize({ width: 1280, height: 720 });
	await open(page, LONG);

	// The premise. If the panel ever stops being the scroller, every assertion
	// below would pass for the wrong reason, so state it outright.
	const geom = await page.evaluate((s) => {
		const el = document.querySelector(s);
		return { over: el.scrollHeight - el.clientHeight, doc: document.scrollingElement.scrollHeight - innerHeight };
	}, PANEL);
	t.ok(`the panel is the scroller, not the document — panel +${geom.over}px, document +${geom.doc}px`,
		geom.over > 400 && geom.doc <= 0);

	await scrollTo(900);
	t.ok("scrolled down the first page", (await top()) === 900);

	await via(OTHER);
	t.ok(`a new page opens at the top — ${await top()}`, (await top()) === 0);

	// Back should return to where you were, which is what the browser does for a
	// document that scrolls itself. Resetting to 0 on every navigation would
	// pass the assertion above and fail this one.
	await page.goBack();
	await page.waitForTimeout(500);
	t.ok(`back restores the offset — ${await top()}`, (await top()) === 900);

	await page.goForward();
	await page.waitForTimeout(500);
	t.ok(`forward restores the other page's offset — ${await top()}`, (await top()) === 0);

	// A hash is an explicit request to land somewhere other than the top, so the
	// reset must not undo the anchor scroll. The router does the scrolling before
	// the after-navigate hook runs, so the only thing being asserted here is that
	// the reset stands down — which is why it has to be a real client-side
	// navigation and not a `goto()` to the URL.
	// Read the anchor off the destination, not off wherever we happen to be —
	// a hash that matches nothing is supposed to fall back to the top, so
	// picking the id from the wrong page tests the fallback instead.
	await via(LONG);
	const anchor = await page.evaluate(() => [...document.querySelectorAll(".card[id]")].at(-2)?.id);
	await via(OTHER);
	const deepLink = await page.evaluate(
		([href]) => {
			const a = document.createElement("a");
			a.href = href;
			a.id = "deep-link-probe";
			a.textContent = "probe";
			a.style.cssText = "display:block;padding:1rem";
			document.querySelector(".content").prepend(a);
			return href;
		},
		[`${LONG}#${anchor}`]
	);
	await page.click("#deep-link-probe");
	await page.waitForTimeout(700);
	t.ok(
		`a hash link lands on the anchor, not the top — ${deepLink} at ${await top()}`,
		(await top()) > 200
	);
} finally {
	await app.close();
}

t.done();
