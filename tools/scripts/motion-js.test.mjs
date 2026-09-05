// The JS-driven motion, which `prefers-reduced-motion` does not reach on its own.
//
//   node tools/scripts/motion-js.test.mjs
//   node tools/scripts/motion-js.test.mjs --no-build
//
// `global.scss` collapses every `--glow-dur-*` token to 1ms under the query, so
// a CSS transition built from tokens is already handled. A Svelte `transition:`
// whose duration is a number in the component is not: that number is JS, and
// nothing collapses it. Each of the components below therefore asks the query
// itself (see `src/lib/util/reducedMotion.svelte.ts`).
//
// So this asserts the behaviour, not the number. It samples the surface every
// frame from just before the trigger until well past the longest duration in
// the library, and asks whether anything moved:
//
//   reduce         → every frame identical, and already at rest on the first
//   no-preference  → some frame differs, i.e. the animation still exists
//
// The second half matters as much as the first — "honours reduced motion" is
// cheap to achieve by deleting the animation, and that is not the fix.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

/**
 * Each case: the docs route, what to click, and the element whose geometry the
 * transition moves.
 *
 * The surface is the element the `transition:` is declared on, not the
 * component's outermost node — a Modal fades its overlay and scales its
 * container, and only the container moves.
 */
const CASES = [
	{
		name: "Modal",
		route: "/components/modal",
		surface: ".modal-container",
	},
	{
		name: "Drawer",
		route: "/components/drawer",
		surface: ".drawer-container",
	},
	{
		name: "Popover",
		route: "/components/popover",
		surface: ".popover-content",
	},
	{
		name: "Command palette",
		route: "/components/command-palette",
		surface: ".cp-panel",
		trigger: (page) => page.getByRole("button", { name: "Open Palette" }),
	},
	{
		name: "Toast",
		route: "/components/toast",
		surface: ".toast-wrapper",
	},
	{
		// The panel slides sideways on a tab change, so the trigger is the second
		// tab rather than the first button on the page.
		name: "Tabs",
		route: "/components/tabs",
		surface: ".card[id] .tabs-panel",
		trigger: (page) => page.locator('.card[id] [role="tab"]').nth(1),
		// `opacity: 1` is passed to both flys, so this one only ever moves in x.
		checkOpacity: false,
	},
];

/** Longer than the longest duration in the library (320ms) plus a delay. */
const WINDOW_MS = 700;

/**
 * Watch one element every frame, starting now.
 *
 * Installed before the click rather than sampled after it: by the time an
 * `await` on the click resolves, a 120ms transition can already be over, and a
 * test that cannot see the animation cannot tell suppressed from finished.
 */
async function watchFrames(page, selector, ms) {
	await page.evaluate(
		([sel, budget]) => {
			window.__motionSamples = [];
			const t0 = performance.now();
			const tick = () => {
				const el = document.querySelector(sel);
				if (el) {
					const cs = getComputedStyle(el);
					// The transition's own output — transform, opacity, height —
					// rather than the bounding rect. A rect also moves when the
					// component repositions itself (Popover anchors to its trigger
					// on the frame after it mounts), which is layout, not motion.
					window.__motionSamples.push({
						o: Number(cs.opacity),
						tf: cs.transform,
						h: el.offsetHeight,
					});
				}
				if (performance.now() - t0 < budget) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		},
		[selector, ms],
	);
}

/** Did any sampled frame differ from the first? Half a pixel is the floor. */
function moved(samples) {
	const [a] = samples;
	return samples.some(
		(s) => Math.abs(s.o - a.o) > 0.01 || s.tf !== a.tf || Math.abs(s.h - a.h) > 0.5,
	);
}

async function run(t, page, { name, route, surface, trigger: pick, checkOpacity = true }, motion) {
	await open(page, route);

	const trigger = pick ? pick(page) : page.locator(".card[id] button").first();
	if (!(await trigger.count())) return t.ok(`${name} (${motion}): has a trigger`, false);

	await watchFrames(page, surface, WINDOW_MS);
	await trigger.click();
	await page.waitForTimeout(WINDOW_MS + 100);
	const samples = await page.evaluate(() => window.__motionSamples);

	// Without frames there is nothing to conclude: an element that never
	// appeared would otherwise pass the "did not move" half by default.
	if (!t.ok(`${name} (${motion}): surface was on screen`, samples.length >= 3)) return;

	if (motion === "reduce") {
		t.ok(`${name} (reduce): does not animate`, !moved(samples));
		// A snap, not a fast run: the first frame is the resting state, so there
		// is never a frame painted at the transition's starting position.
		if (checkOpacity) t.ok(`${name} (reduce): starts at rest`, samples[0].o >= 0.99);
	} else {
		t.ok(`${name} (no-preference): still animates`, moved(samples));
	}
}

const t = checks("JS-driven motion under prefers-reduced-motion");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);

try {
	for (const c of CASES) await run(t, app.page, c, "reduce");

	// A second context rather than a second browser: `reducedMotion` is a
	// context option, and the built site is already being served.
	const motionPage = await app.open({ reducedMotion: "no-preference" });
	t.watch(motionPage);
	try {
		for (const c of CASES) await run(t, motionPage, c, "no-preference");
	} finally {
		await motionPage.context().close();
	}
} finally {
	await app.close();
}

t.done();
