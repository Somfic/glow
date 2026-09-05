// Navigation view transitions on the docs site.
//
//   node tools/scripts/view-transitions.test.mjs
//   node tools/scripts/view-transitions.test.mjs --no-build
//
// Three things are worth asserting here and none of them are visible from the
// markup: that a browser without the API navigates exactly as it always did,
// that a reader who asked for reduced motion gets no transition at all, and
// that the persistent chrome is left out of the crossfade instead of being
// faded into a copy of itself.
//
// The last one is asked of the compositor, not of the DOM: during a transition
// the real elements are still in the tree and still "visible" while what you
// see is a stack of snapshot pseudo-elements painted over them. So the checks
// read `document.getAnimations()` — whose entries name the pseudo-element they
// drive — and compare screenshots of the sidebar region taken mid-transition
// and after it, which are byte-identical PNGs only if nothing moved.
//
// The transition is slowed to 2s for the duration of the run. Catching a 150ms
// crossfade in the middle by sleeping for half of it is a coin flip, and the
// point is what is animating, not how fast.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

/** Count calls to startViewTransition, and remember whether they ran. */
const INSTRUMENT = () => {
	const vt = { calls: 0, ready: 0, abandoned: 0, finished: 0 };
	window.__vt = vt;
	const original = document.startViewTransition;
	if (!original) return;
	document.startViewTransition = function (callback) {
		vt.calls++;
		const transition = original.call(document, callback);
		// A rejected `ready` is how the browser reports that it gave up — a
		// duplicate view-transition-name being the failure this suite exists to
		// catch, since the navigation still works and nothing else says a word.
		transition.ready.then(
			() => vt.ready++,
			() => vt.abandoned++,
		);
		transition.finished.finally(() => vt.finished++);
		return transition;
	};
};

const SLOW = `::view-transition-old(root), ::view-transition-new(root) { animation-duration: 2s !important; }`;

const t = checks("view transitions");
// Motion on: the transition is the subject, so the default reducedMotion of
// launch() would switch off the very thing under test.
const app = await launch({
	build: !noBuild,
	cwd: ROOT,
	reducedMotion: "no-preference",
});
t.watch(app.page);
const { page } = app;

/**
 * How many distinct colours a screenshot contains, counted by handing the PNG
 * back to the browser to decode. A panel that is being covered by something
 * opaque comes back as one or two.
 */
const colours = async (buffer) =>
	page.evaluate(async (b64) => {
		const img = new Image();
		img.src = `data:image/png;base64,${b64}`;
		await img.decode();
		const canvas = new OffscreenCanvas(img.width, img.height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		const { data } = ctx.getImageData(0, 0, img.width, img.height);
		const seen = new Set();
		for (let i = 0; i < data.length; i += 4)
			seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
		return seen.size;
	}, buffer.toString("base64"));

/** The content panel's box — everything the crossfade is supposed to cover. */
const contentClip = async (p) => {
	const box = await p.locator(".page.sidebar-mode > .content").first().boundingBox();
	if (!box) throw new Error("no content panel");
	const view = p.viewportSize();
	return {
		x: box.x,
		y: box.y,
		width: Math.min(box.width, view.width - box.x),
		height: Math.min(box.height, view.height - box.y),
	};
};

/** The sidebar's box, for a clip that never includes the content panel. */
const sidebarClip = async (p) => {
	const box = await p.locator(".glow-root > .sidebar").boundingBox();
	if (!box) throw new Error("no sidebar");
	return { x: box.x, y: box.y, width: box.width, height: box.height };
};

try {
	await page.addInitScript(INSTRUMENT);

	// ---- the transition runs, and the sidebar is not in it --------------------
	await open(page, "/components/card");
	await page.addStyleTag({ content: SLOW });
	await page.evaluate(() => (window.__vt.calls = 0));

	await page.click('.glow-root > .sidebar a[href="/components/timeline"]');
	await page.waitForTimeout(900); // mid-flight, with 2s to play with

	const running = await page.evaluate(() =>
		document.getAnimations().map((a) => a.effect?.pseudoElement ?? ""),
	);
	t.ok("startViewTransition was called", (await page.evaluate(() => window.__vt.calls)) === 1);
	t.ok(
		"the content region is mid-crossfade",
		running.some((p) => p.includes("view-transition-new(root)")),
	);
	t.ok(
		"nothing is animating the sidebar",
		!running.some((p) => p.includes("glow-docs-sidebar")),
	);
	t.ok(
		"one sidebar in the tree, not two",
		(await page.locator(".glow-root > .sidebar").count()) === 1,
	);

	const mid = await page.screenshot({ clip: await sidebarClip(page) });
	const midContent = await page.screenshot({ clip: await contentClip(page) });
	await page.waitForFunction(() => window.__vt.finished === 1);
	await settle(page);
	const after = await page.screenshot({ clip: await sidebarClip(page) });
	t.ok("the sidebar paints identically mid-transition and after", mid.equals(after));

	// The content panel has to be *painted* in the middle of the crossfade, not
	// merely present. Naming .page-surround once put that full-viewport
	// background on top of the crossfading content — z-index does not apply
	// inside the view-transition tree — and the panel went blank for the length
	// of every navigation, which no DOM assertion would have noticed.
	t.ok("the content panel is painted mid-transition", (await colours(midContent)) > 20);

	t.ok(
		"the destination rendered",
		(await page.locator("h1").first().textContent())?.trim() === "Timeline",
	);
	const state = await page.evaluate(() => ({ ...window.__vt }));
	t.ok("the transition was not abandoned", state.ready === 1 && state.abandoned === 0);

	// ---- a page carrying a second, live <Sidebar> -----------------------------
	// /components/sidebar documents the component by rendering one. A
	// view-transition-name matched by both it and the shell's rail would make
	// the browser drop the transition on the floor.
	await page.evaluate(() => Object.assign(window.__vt, { calls: 0, ready: 0, abandoned: 0, finished: 0 }));
	await page.click('.glow-root > .sidebar a[href="/components/sidebar"]');
	// Let it finish, not merely start: clicking again mid-transition makes the
	// browser abandon this one, and the counters below would then be reporting
	// on the wrong navigation.
	await page.waitForFunction(() => window.__vt.finished === 1);
	t.ok(
		"the demo Sidebar does not collide with the shell's name",
		(await page.evaluate(() => window.__vt.abandoned)) === 0,
	);
	t.ok(
		"two sidebars on the page, one of them named",
		(await page.locator(".sidebar").count()) > 1 &&
			(await page.locator(".glow-root > .sidebar").count()) === 1,
	);

	// ---- the shader canvas survives being snapshotted -------------------------
	await page.evaluate(() => Object.assign(window.__vt, { calls: 0, ready: 0, abandoned: 0, finished: 0 }));
	await page.click('.glow-root > .sidebar a[href="/"]');
	// While a transition is in flight the canvas on screen is the snapshot the
	// browser took, not the live element — sampling before it ends would only
	// prove that a still image is still.
	await page.waitForFunction(() => window.__vt.finished === 1);
	await page.waitForTimeout(300);
	const canvas = page.locator("canvas.glow-canvas").first();
	const box = await canvas.boundingBox();
	t.ok("the home shader canvas has a box", !!box && box.width > 0 && box.height > 0);
	if (box) {
		const clip = { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 300) };
		const frameA = await page.screenshot({ clip });
		await page.waitForTimeout(250);
		const frameB = await page.screenshot({ clip });
		// Two different frames means the shader is still drawing: a canvas that
		// was torn or blanked by the snapshot would hold one image forever.
		t.ok("the shader is still animating after the transition", !frameA.equals(frameB));
	}

	// ---- no API: navigation is untouched --------------------------------------
	const bare = await app.open({ reducedMotion: "no-preference" });
	await bare.addInitScript(() => {
		delete Document.prototype.startViewTransition;
	});
	await bare.addInitScript(INSTRUMENT);
	await open(bare, "/components/card");
	t.ok(
		"startViewTransition really is gone",
		await bare.evaluate(() => !("startViewTransition" in document)),
	);
	await bare.click('.glow-root > .sidebar a[href="/components/timeline"]');
	await bare.waitForFunction(
		() => document.querySelector("h1")?.textContent?.trim() === "Timeline",
	);
	await settle(bare);
	t.ok(
		"without the API the destination still renders",
		await bare.locator(".card[id]").first().isVisible(),
	);
	t.ok("nothing tried to transition", (await bare.evaluate(() => window.__vt.calls)) === 0);
	await bare.context().close();

	// ---- reduced motion: no transition is started -----------------------------
	const calm = await app.open({ reducedMotion: "reduce" });
	await calm.addInitScript(INSTRUMENT);
	await open(calm, "/components/card");
	t.ok(
		"the API is present in this context",
		await calm.evaluate(() => typeof document.startViewTransition === "function"),
	);
	await calm.click('.glow-root > .sidebar a[href="/components/timeline"]');
	await calm.waitForFunction(
		() => document.querySelector("h1")?.textContent?.trim() === "Timeline",
	);
	t.ok(
		"under prefers-reduced-motion no transition is started",
		(await calm.evaluate(() => window.__vt.calls)) === 0,
	);
	t.ok(
		"and the destination is there anyway",
		await calm.locator(".card[id]").first().isVisible(),
	);
	await calm.context().close();
} finally {
	await app.close();
}

t.done();
