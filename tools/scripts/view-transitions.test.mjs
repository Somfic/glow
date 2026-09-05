// Page transitions: on by default, named on exactly one shell, switchable off.
//
//   node tools/scripts/view-transitions.test.mjs [--no-build]
//
// Runs with motion ON, because a transition is the subject. `viewTransition`
// declines under `prefers-reduced-motion`, which is what `launch()` sets by
// default — so the harness default would make every assertion here vacuous.
//
// The case worth pinning is the duplicate name. Two elements sharing one
// `view-transition-name` makes the browser abandon the transition outright and
// say nothing: the navigation still works, the page still changes, and only the
// animation is gone. `/components/sidebar` renders a live second `<Sidebar>`
// inside a card, so it is the page that would break first.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const t = checks("view transitions");
const app = await launch({
	build: !process.argv.includes("--no-build"),
	cwd: ROOT,
	reducedMotion: "no-preference",
});
t.watch(app.page);

const page = app.page;
/**
 * Every named element except `<html>`, which the UA names `root` itself — that
 * is the group the content panel crossfades in, not something Glow set.
 */
const names = () =>
	page.evaluate(() =>
		[...document.querySelectorAll("*")]
			.filter((el) => el !== document.documentElement)
			.map((el) => [el.tagName.toLowerCase() + "." + (typeof el.className === "string" ? el.className.split(" ").filter((c) => c && !c.startsWith("svelte-")).join(".") : ""), getComputedStyle(el).viewTransitionName])
			.filter(([, n]) => n && n !== "none")
	);

try {
	await page.setViewportSize({ width: 1280, height: 720 });
	await open(page, "/components/buttons");

	t.ok("Root turns transitions on without being asked",
		(await page.evaluate(() => document.documentElement.dataset.glowTransitions)) === "on");

	const shell = await names();
	t.ok(`exactly one element is named — ${JSON.stringify(shell)}`, shell.length === 1);
	t.ok("and it is the shell's sidebar", shell[0]?.[0] === "aside.sidebar" && shell[0][1] === "glow-sidebar");

	// The page that renders a second live Sidebar. Before this change the docs
	// site avoided the clash with a `.glow-root > .sidebar` child combinator in
	// its own stylesheet; now Page decides, so the demo rail must come out
	// unnamed on its own.
	await open(page, "/components/sidebar");
	const withDemo = await names();
	t.ok(`still exactly one name with a second live Sidebar on the page — ${withDemo.length}`,
		withDemo.length === 1);
	const railCount = await page.evaluate(() => document.querySelectorAll("aside.sidebar").length);
	t.ok(`the page really does render more than one rail — ${railCount}`, railCount > 1);

	// The transition actually runs. `startViewTransition` firing is the signal;
	// a duplicate name would leave it starting and then abandoning, so also
	// check it reached `ready`.
	await open(page, "/components/buttons");
	await page.evaluate(() => {
		window.__vt = { started: 0, ready: 0, failed: 0 };
		const real = document.startViewTransition.bind(document);
		document.startViewTransition = (cb) => {
			window.__vt.started++;
			const tr = real(cb);
			tr.ready.then(() => window.__vt.ready++, () => window.__vt.failed++);
			return tr;
		};
	});
	await page.click('.sidebar a[href="/components/card"]');
	await page.waitForTimeout(900);
	const vt = await page.evaluate(() => window.__vt);
	t.ok(`a sidebar navigation starts a transition — ${JSON.stringify(vt)}`, vt.started === 1);
	t.ok("and the browser does not abandon it", vt.ready === 1 && vt.failed === 0);

	// Switched off. `<Root transitions={false}>` drives both halves from one
	// prop; what is flipped here is the half that survives outside a component
	// — the `<html>` flag `viewTransition` reads, since it is called from the
	// router's hook where Svelte context cannot reach. The name stays on the
	// rail and is inert, because a `view-transition-name` does nothing at all
	// unless something starts a transition.
	await page.evaluate(() => (document.documentElement.dataset.glowTransitions = "off"));
	await settle(page);

	await page.evaluate(() => (window.__vt = { started: 0, ready: 0, failed: 0 }));
	await page.click('.sidebar a[href="/components/buttons"]');
	await page.waitForTimeout(900);
	t.ok("and no transition is started at all",
		(await page.evaluate(() => window.__vt.started)) === 0);
} finally {
	await app.close();
}

t.done();
