// Every CSS duration in `src/lib` should be a `--glow-dur-*` token, because
// those are what `global.scss` collapses to 1ms under `prefers-reduced-motion`.
// A hardcoded `0.2s` looks identical at rest and silently opts its component
// out of the preference, which is exactly the kind of bug no screenshot and no
// type-check can catch. So assert it in a real browser, from both sides:
//
//   1. Under `reduce`, sweep every documented route and fail on any element
//      still reporting a transition longer than 1ms — that is a literal.
//   2. Under `reduce`, fail on any *looping* animation that is still running.
//      Those must not merely collapse: a 1ms `infinite` is a strobe, i.e. worse
//      than the motion it was meant to suppress. They have to be switched off.
//   3. Under `no-preference`, assert a sample of the same selectors report the
//      token's real value. Without this half, `transition: none` would pass (1)
//      and (2) while quietly deleting the motion for everybody.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open, routes } from "../glow/docs.mjs";

const t = checks("motion css tokens");
const build = !process.argv.includes("--no-build");

/**
 * The known exceptions, each one a literal that this sweep really does find.
 *
 * All but the first live in `src/routes` — demo-only CSS written on a docs page
 * rather than in a component, and so outside the library audit. They are real
 * and this list is the record of them; it should only ever shrink. `route: "*"`
 * matches anywhere, for the parts of the docs shell that are on every page.
 */
const KNOWN = [
	// The sidebar's collapse control is a hand-rolled ghost icon button, and
	// `feat/button-small` is deleting the whole rule block in favour of the
	// real <Button>. Fixing the duration here would only conflict with that.
	{ route: "*", cls: /\bcollapse-toggle\b/ },
	{ route: "/components/cursor", cls: /\bdemo-btn\b/ },
	{ route: "/components/icon", cls: /\bcell\b/ },
	{ route: "/components/tooltip", cls: /\bdemo-btn\b|\bdemo-text\b|\bdemo-box\b/ },
	{ route: "/components/lightbox", cls: /\bthumb\b/ },
	{ route: "/components/settings", cls: /\bprompt-tab\b|\baspect-btn\b/ },
	{ route: "/components/sidebar", cls: /\bframe-content\b/ },
	{ route: "/components/sortable", cls: /\bsort-row\b|\bsort-tag\b|\bdrag-handle\b/ },
	{ route: "/components/tierlist", cls: /\btl-reset\b|\btl-card\b/ },
	// A `pulse-mark 1.6s infinite` and a `blink 1s steps(1) infinite`, both
	// written on the docs page rather than in a component.
	{ route: "/components/empty-state", cls: /\bpulse-mark\b|\bsvelte-/ },
	{ route: "/components/split", cls: /\bsvelte-/ },
];

/** Read every element's motion, as the browser resolved it. */
const MOTION = () =>
	[...document.querySelectorAll("*")].map((el) => {
		const s = getComputedStyle(el);
		return {
			tag: el.tagName.toLowerCase(),
			cls: typeof el.className === "string" ? el.className : "",
			td: s.transitionDuration,
			tp: s.transitionProperty,
			an: s.animationName,
			ad: s.animationDuration,
			ai: s.animationIterationCount,
		};
	});

/** "0.15s, 1ms" → [150, 1] */
const ms = (list) =>
	list
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean)
		.map((v) => (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000));

const app = await launch({ build });
t.watch(app.page);

try {
	const all = routes();

	// ---- (1) and (2): the sweep, with motion suppressed -------------------
	const slow = [];
	const looping = [];
	for (const route of all) {
		await open(app.page, route);
		for (const el of await app.page.evaluate(MOTION)) {
			const where = `${route} ${el.tag}${el.cls ? "." + el.cls.trim().split(/\s+/).join(".") : ""}`;
			if (KNOWN.some((k) => (k.route === "*" || k.route === route) && k.cls.test(el.cls))) continue;
			// >1ms is the tell: a token collapsed, a literal did not.
			if (ms(el.td).some((d) => d > 1)) slow.push(`${where} → ${el.tp} ${el.td}`);
			if (el.an !== "none" && el.ai.split(",").some((c) => c.trim() === "infinite"))
				looping.push(`${where} → ${el.an} ${el.ad}`);
		}
	}
	const uniq = (a) => [...new Set(a)];
	for (const line of uniq(slow)) console.log(`      still animating: ${line}`);
	for (const line of uniq(looping)) console.log(`      still looping:   ${line}`);
	t.ok(`no transition outlives the reduced-motion collapse (${uniq(slow).length} offenders)`, slow.length === 0);
	t.ok(`no looping animation still runs under reduced motion (${uniq(looping).length} offenders)`, looping.length === 0);

	// ---- (3): the same selectors, with motion allowed ---------------------
	// One case per token, spread across the files this branch touched, so a
	// token that resolves to nothing fails here rather than passing (1) silently.
	// A second context in the same browser, with the preference off.
	const real = await app.open({ reducedMotion: "no-preference" });
	{
		const cases = [
			["/components/buttons", "button.primary", "td", 150, "Button hover — fast"],
			["/components/icon", ".icon", "td", 150, "Icon colour — fast"],
			["/components/typography", ".link", "td", 150, "Link colour — fast"],
			["/components/pill", ".pill", "td", 150, "Pill — fast"],
			["/components/table", ".table-row", "td", 150, "Table row — fast"],
			["/components/tabs", ".tab", "td", 150, "Tab hover — fast"],
			["/components/toc", ".toc-item", "td", 150, "TOC rail — fast"],
			["/components/inputs", ".checkbox-box", "td", 150, "Checkbox — fast"],
			["/components/inputs", ".toggle", "td", 220, "Toggle track — base"],
			["/components/inputs", ".toggle-slider", "td", 220, "Toggle knob — base"],
			["/components/avatar", ".avatar-wrapper", "td", 220, "Avatar fan-out — base"],
			["/components/list", ".list-item.interactive", "td", 100, "List row — instant"],
			["/components/spinner", ".spinner", "ad", 800, "Spinner loop — glacial x1.6"],
			["/components/skeleton", ".skeleton", "ad", 1400, "Skeleton shimmer — glacial x2.8"],
		];
		for (const [route, sel, key, expect, label] of cases) {
			await open(real, route);
			const got = await real.evaluate(
				([s, k]) => {
					const el = document.querySelector(s);
					if (!el) return null;
					const cs = getComputedStyle(el);
					return k === "td" ? cs.transitionDuration : cs.animationDuration;
				},
				[sel, key],
			);
			if (got === null) {
				t.ok(`${label} — ${sel} not on ${route}`, false);
				continue;
			}
			const durations = ms(got);
			t.ok(
				`${label} — ${sel} is ${got}`,
				durations.length > 0 && durations.every((d) => Math.abs(d - expect) < 1),
			);
		}

		// The knob and the track have to move as one, or the toggle visibly
		// tears. They were 0.2s apiece before; keep them on the same token.
		await open(real, "/components/inputs");
		const pair = await real.evaluate(() => {
			const g = (s) => getComputedStyle(document.querySelector(s)).transitionDuration;
			return [g(".toggle"), g(".toggle-slider")];
		});
		t.ok(`toggle track and knob share a duration — ${pair.join(" / ")}`, pair[0] === pair[1]);

		// The new easing token has to actually resolve; an undefined var() would
		// silently fall back to `ease` and nothing above would notice.
		await open(real, "/components/split");
		const quint = await real.evaluate(
			() => getComputedStyle(document.querySelector(".split-pane")).transitionTimingFunction,
		);
		t.ok(`--glow-ease-out-quint resolves — ${quint}`, quint.includes("0.22, 1, 0.36, 1"));
	}
} finally {
	await app.close();
}
t.done();
