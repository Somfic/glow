// AnimatedNumber — the half of it a screenshot cannot show.
//
//   node tools/scripts/animated-number.test.mjs
//   node tools/scripts/animated-number.test.mjs --no-build
//
// Everything here is about motion, so the first run deliberately asks for
// `reducedMotion: "no-preference"` — the harness's default freezes exactly the
// thing under test. The second run turns the preference back on, because
// "snaps to the value" is a claim the component makes and not a side effect of
// the tokens: this animation is driven from JS and cannot ride the CSS
// duration collapse.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open } from "../glow/docs.mjs";

const build = !process.argv.includes("--no-build");
const ROUTE = "/components/animated-number";

const t = checks("animated number");
const app = await launch({ build, cwd: ROOT, reducedMotion: "no-preference" });
t.watch(app.page);
const { page } = app;

try {
	await open(page, ROUTE);

	const card = page.locator("#tween");
	const num = card.locator(".animated-number .value");

	const before = await num.innerText();
	await card.getByRole("button").click();
	await page.waitForTimeout(120);
	const mid = await num.innerText();
	await page.waitForTimeout(1200);
	const after = await num.innerText();
	t.ok(`tween moves (${before} → ${mid} → ${after})`, mid !== before && after !== mid);

	// The point of the sizing ghosts: nothing beside the number may shift while
	// it counts, so the box measured mid-run has to match the settled one.
	const box = card.locator(".animated-number").first();
	await card.getByRole("button").click();
	await page.waitForTimeout(150);
	const during = (await box.boundingBox()).width;
	await page.waitForTimeout(1200);
	const settled = (await box.boundingBox()).width;
	t.ok(`width holds while counting (${during} / ${settled})`, Math.abs(during - settled) < 0.6);

	const odo = page.locator("#odometer");
	const value = odo.locator(".animated-number .value").first();

	// What a wheel is actually showing, measured rather than inferred: the
	// glyph whose box sits in the window, and how far into the window it has
	// travelled. The strips carry all ten digits and are re-anchored to each
	// new target, so neither the text nor the transform alone says this.
	const wheels = () =>
		value.evaluate((el) => {
			let digits = "";
			let shift = null;
			for (const child of el.children) {
				if (!child.classList.contains("digit")) {
					digits += child.textContent;
					continue;
				}
				const window = child.getBoundingClientRect();
				let best = null;
				for (const glyph of child.firstElementChild.children) {
					const box = glyph.getBoundingClientRect();
					const delta = box.top - window.top;
					if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { delta, glyph };
				}
				digits += best.glyph.textContent;
				shift ??= best.delta;
			}
			return { digits, shift };
		});

	// Just before and just after an interruption: a retarget that restarted
	// from the previous value would jump the painted glyph here.
	await odo.getByRole("button").click();
	await page.waitForTimeout(200);
	const priorFrame = await wheels();
	await odo.getByRole("button").click();
	await page.waitForTimeout(30);
	const nextFrame = await wheels();
	t.ok(
		`interrupting retargets from the screen (${priorFrame.shift} → ${nextFrame.shift})`,
		Math.abs(priorFrame.shift - nextFrame.shift) < 6
	);

	await page.waitForTimeout(1200);
	const sr = await odo.locator(".animated-number .sr-only").first().innerText();
	const painted = (await wheels()).digits;
	t.ok(`wheels settle on the announced value (${sr} / ${painted})`, sr === painted);
	// The invariant behind the shared baseline: a line box of `1.2em` is a
	// fractional number of device pixels, so any wheel parked on a non-zero
	// translate sits on its own subpixel offset and the digits go ragged. A
	// settled wheel must therefore be untransformed, not merely close to it.
	const offsets = await page
		.locator("#odometer .animated-number .strip")
		.evaluateAll((els) => els.map((el) => new DOMMatrix(getComputedStyle(el).transform).m42));
	t.ok(
		`settled wheels are untransformed (${offsets.join(", ")})`,
		offsets.length > 0 && offsets.every((y) => y === 0)
	);

	t.ok(
		"the digits are hidden from assistive tech",
		(await odo.locator(".animated-number .value").first().getAttribute("aria-hidden")) === "true"
	);
} finally {
	await app.close();
}

const t2 = checks("animated number, reduced motion");
const reduced = await launch({ build: false, cwd: ROOT, reducedMotion: "reduce" });
t2.watch(reduced.page);

try {
	await open(reduced.page, ROUTE);
	const card = reduced.page.locator("#tween");
	const num = card.locator(".animated-number .value");
	await card.getByRole("button").click();
	await reduced.page.waitForTimeout(60);
	const early = await num.innerText();
	await reduced.page.waitForTimeout(900);
	const later = await num.innerText();
	t2.ok(`snaps rather than counting fast (${early} → ${later})`, early === later);
} finally {
	await reduced.close();
}

t.done();
t2.done();
