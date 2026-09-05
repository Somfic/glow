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

	// A wheel's transform just before and just after an interruption: a
	// retarget that restarted from the previous value would jump here.
	const odo = page.locator("#odometer");
	const wheel = odo.locator(".animated-number .strip").first();
	const y = () => wheel.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
	await odo.getByRole("button").click();
	await page.waitForTimeout(200);
	const y0 = await y();
	await odo.getByRole("button").click();
	await page.waitForTimeout(30);
	const y1 = await y();
	t.ok(`interrupting retargets from the screen (${y0} → ${y1})`, Math.abs(y0 - y1) < 6);

	await page.waitForTimeout(1200);
	const sr = await odo.locator(".animated-number .sr-only").first().innerText();
	// What the wheels actually show, read off their transforms rather than
	// their text: every column carries all ten glyphs.
	const painted = await odo
		.locator(".animated-number .value")
		.first()
		.evaluate((el) => {
			let out = "";
			for (const child of el.children) {
				if (child.classList.contains("digit")) {
					const m = new DOMMatrix(getComputedStyle(child.firstElementChild).transform);
					out += String(Math.round(-m.m42 / child.getBoundingClientRect().height) % 10);
				} else out += child.textContent;
			}
			return out;
		});
	t.ok(`wheels settle on the announced value (${sr} / ${painted})`, sr === painted);
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
