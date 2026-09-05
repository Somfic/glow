import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("stepper");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

/**
 * Geometry of one stepper, read out of the browser rather than off a
 * screenshot: the invariant is that the marker's centre line and the *first*
 * line box of the label agree, which a picture can only suggest.
 */
const geometry = (page, selector) =>
	page.evaluate((sel) => {
		const stepper = document.querySelector(sel);
		return [...stepper.querySelectorAll(".step")].map((step) => {
			const marker = step.querySelector(".marker").getBoundingClientRect();
			const bubble = step.querySelector(".bubble").getBoundingClientRect();
			const label = step.querySelector(".label");
			const labelBox = label.getBoundingClientRect();
			const leading = parseFloat(getComputedStyle(label).lineHeight);
			// The label's own box spans every wrapped line, so its centre is the
			// centre of the *block*; the first line box is one `line-height` down
			// from its top, which is what the marker has to agree with.
			const range = document.createRange();
			range.selectNodeContents(label);
			const ink = range.getClientRects()[0];
			const connector = step.querySelector(".connector")?.getBoundingClientRect();
			return {
				markerY: marker.top + marker.height / 2,
				markerX: marker.left + marker.width / 2,
				markerH: marker.height,
				bubbleY: bubble.top + bubble.height / 2,
				lines: range.getClientRects().length,
				leading,
				firstLineY: labelBox.top + leading / 2,
				blockY: labelBox.top + labelBox.height / 2,
				// Where the glyphs themselves land inside that line box.
				inkY: ink.top + ink.height / 2,
				connectorY: connector ? connector.top + connector.height / 2 : null,
				connectorX: connector ? connector.left + connector.width / 2 : null
			};
		});
	}, selector);

try {
	await open(app.page, "/components/stepper");

	// --- states -------------------------------------------------------------
	const states = await app.page.evaluate(() =>
		[...document.querySelectorAll("#states .stepper")].map((s) =>
			[...s.querySelectorAll(".step")].map((step) => ({
				state: step.dataset.state,
				current: step.getAttribute("aria-current"),
				announced: step.querySelector(".visually-hidden").textContent.trim()
			}))
		)
	);
	const first = states[0];
	t.ok("the current step carries aria-current='step'", first.filter((s) => s.current === "step").length === 1);
	t.ok(
		"only the current step carries it",
		first.every((s) => (s.state === "current") === (s.current === "step"))
	);
	t.ok("completed steps are marked complete", first.some((s) => s.state === "complete"));
	t.ok("an error step is marked as an error", first.some((s) => s.state === "error"));
	t.ok(
		"every step announces its state as text, not only as a colour",
		first.every((s) => s.announced.length > 0) && first.some((s) => s.announced === "Error")
	);

	const semantics = await app.page.evaluate(() => {
		const s = document.querySelector("#basic .stepper");
		return { tag: s.tagName, kids: [...s.children].every((c) => c.tagName === "LI"), label: s.getAttribute("aria-label") };
	});
	t.ok("it is an ordered list of list items, not a pile of divs", semantics.tag === "OL" && semantics.kids);
	t.ok("the list has an accessible name", !!semantics.label);

	// --- navigation ---------------------------------------------------------
	t.ok(
		"a non-interactive stepper renders no buttons",
		(await app.page.locator("#basic .stepper button").count()) === 0
	);
	t.ok(
		"and no tab stops",
		await app.page.evaluate(() => document.querySelectorAll("#basic .stepper [tabindex], #basic .stepper button, #basic .stepper a").length === 0)
	);

	const nav = app.page.locator("#navigation .stepper").first();
	t.ok(
		"navigation='complete' makes only the completed steps buttons",
		await nav.evaluate((s) =>
			[...s.querySelectorAll(".step")].every(
				(step) => (step.querySelector(".step-inner").tagName === "BUTTON") === (step.dataset.state === "complete")
			)
		)
	);
	await nav.locator("button.step-inner").first().click();
	t.ok(
		"clicking a completed step goes back to it",
		await nav.evaluate((s) => s.querySelector(".step").getAttribute("aria-current") === "step")
	);

	// Back where the rest of the page expects it.
	await app.page.getByRole("button", { name: "Next" }).click();

	const jump = app.page.locator("#navigation .stepper").last();
	t.ok(
		"navigation='all' makes every step a button",
		await jump.evaluate((s) => [...s.querySelectorAll(".step-inner")].every((el) => el.tagName === "BUTTON"))
	);

	// --- keyboard -----------------------------------------------------------
	await jump.locator("button.step-inner").first().focus();
	await app.page.keyboard.press("Tab");
	t.ok(
		"Tab walks from one interactive step to the next",
		await jump.evaluate((s) => {
			const buttons = [...s.querySelectorAll("button.step-inner")];
			return document.activeElement === buttons[1];
		})
	);
	await app.page.keyboard.press("Enter");
	t.ok(
		"Enter activates the focused step",
		await jump.evaluate((s) => s.querySelectorAll(".step")[1].getAttribute("aria-current") === "step")
	);
	t.ok(
		"a focused step shows a focus ring",
		await jump.evaluate((s) => {
			const el = s.querySelectorAll("button.step-inner")[1];
			el.focus();
			return getComputedStyle(el).boxShadow !== "none";
		})
	);

	// --- alignment ----------------------------------------------------------
	// Half a CSS pixel is invisible at 100% and obvious once zoomed, so these are
	// exact-to-a-tenth rather than "looks about right".
	for (const [name, sel] of [
		["vertical", "#alignment .narrow .stepper"],
		["horizontal", "#alignment .medium .stepper"]
	]) {
		const steps = await geometry(app.page, sel);
		t.ok(`${name}: a label really does wrap, so the check means something`, steps.some((s) => s.lines > 1));
		t.ok(
			`${name}: the marker is centred on the first line of its label`,
			steps.every((s) => Math.abs(s.markerY - s.firstLineY) < 0.01)
		);
		t.ok(
			`${name}: which is not the same as the centre of the block`,
			steps.some((s) => s.lines > 1 && Math.abs(s.markerY - s.blockY) > 1)
		);
		t.ok(
			`${name}: and the glyphs land on it too`,
			// Not exact: the font's ascent and descent are not symmetrical, so its
			// ink box cannot be perfectly centred in a line box of even height.
			// Half a CSS pixel is the rounding, not a layout error.
			steps.every((s) => Math.abs(s.markerY - s.inkY) <= 0.5)
		);
		t.ok(
			`${name}: the marker box is exactly one line tall`,
			steps.every((s) => s.markerH === s.leading)
		);
		t.ok(
			`${name}: the glyph inside the marker sits on that same centre`,
			steps.every((s) => Math.abs(s.bubbleY - s.markerY) < 0.5)
		);
		const linked = steps.filter((s) => s.connectorY !== null);
		t.ok(
			`${name}: the connector runs on the marker centre line`,
			name === "vertical"
				? linked.every((s) => Math.abs(s.connectorX - s.markerX) < 0.5)
				: linked.every((s) => Math.abs(s.connectorY - s.markerY) < 0.5)
		);
	}

	// The resting geometry must be a whole number of CSS pixels: a fractional one
	// lands on a half device pixel and blurs an edge that should be crisp.
	const whole = await app.page.evaluate(() => {
		const s = document.querySelector("#basic .stepper");
		const step = s.querySelector(".step");
		const line = getComputedStyle(s).getPropertyValue("--stepper-line").trim();
		return {
			line,
			marker: step.querySelector(".marker").getBoundingClientRect().height,
			bubble: step.querySelector(".bubble").getBoundingClientRect().height
		};
	});
	t.ok(
		"the marker box and the bubble are whole pixels tall",
		Number.isInteger(whole.marker) && Number.isInteger(whole.bubble)
	);
} finally {
	await app.close();
}

t.done();
