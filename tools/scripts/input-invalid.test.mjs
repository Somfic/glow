// The error state of <Input>, across every type it can render.
//
//   node tools/scripts/input-invalid.test.mjs
//   node tools/scripts/input-invalid.test.mjs --no-build
//
// `Input` used to paint the error border by reaching into whatever the chosen
// type rendered, through a hand-maintained list of selectors (`:global(input)`,
// `:global(.text-input)`, `:global(.number-input)`, `:global(.popover-trigger)`).
// A type whose control matched none of them rendered with no error border and
// said nothing about it — nine of the fifteen types were in that state, and
// `.popover-trigger` had not existed since PopoverMenu renamed it
// `.builtin-trigger`.
//
// So the assertion here is deliberately mechanism-blind. It reads the danger
// colour off the theme, then asks each `.input.invalid` on the docs page
// whether *anything* it renders draws a border in that colour. It would have
// passed just as well for the old selector list, had the list been complete.
//
// The last check is the one that pins the fix rather than its result: it drops
// a control the library has never seen into an invalid wrapper and asserts the
// control opts into the error colour from its own `border` declaration. That is
// what "adding a sixteenth type needs no edit to Input.svelte" means, stated as
// something that can fail.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open, setTheme } from "../glow/docs.mjs";

const t = checks("input invalid state");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

/** Types that draw a frame, and so must repaint it in the danger colour. */
const FRAMED = [
	"text",
	"password",
	"number",
	"textarea",
	"select",
	"multiselect",
	"radio",
	"checkbox",
	"date",
	"time",
	"color",
	"pin",
];

/**
 * Types with no border anywhere in their control — a switch, a slider track and
 * a row of star glyphs. There is nothing to repaint, so the message below the
 * control is the whole error state and this list is documentation, not a
 * shortfall. Asserted so that a type quietly losing its frame shows up here.
 */
const FRAMELESS = ["toggle", "range", "rating"];

/**
 * Survey the error-states card: for each labelled wrapper, whether any element
 * inside it paints a border in `--glow-color-danger`, and which selector that
 * element is. The selector is what makes the failure readable — "radio renders
 * .radio-input, no error border" rather than "radio: false".
 */
async function survey(page) {
	return page.evaluate(() => {
		const probe = document.createElement("span");
		document.body.appendChild(probe);
		probe.style.color = "var(--glow-color-danger)";
		const danger = getComputedStyle(probe).color;
		probe.remove();

		const named = (el) =>
			el.className && typeof el.className === "string"
				? "." + el.className.trim().split(/\s+/).filter((c) => c !== "input").join(".")
				: el.tagName.toLowerCase();

		const out = {};
		for (const wrap of document.querySelectorAll("#error-states .input")) {
			const label = wrap.querySelector(".input-label")?.textContent.trim();
			if (!label) continue;
			// The frame is whichever descendant actually draws a border; find the
			// outermost one so a nested swatch or cell cannot stand in for it.
			let frame = null;
			let red = null;
			for (const el of wrap.querySelectorAll("*")) {
				const cs = getComputedStyle(el);
				if (parseFloat(cs.borderTopWidth) === 0 || cs.borderTopStyle === "none") continue;
				if (!frame) frame = { selector: named(el), color: cs.borderTopColor };
				if (cs.borderTopColor === danger) {
					red = named(el);
					break;
				}
			}
			out[label] = { frame: frame?.selector ?? "(no border)", color: frame?.color ?? null, red };
		}
		return { danger, out };
	});
}

try {
	const page = app.page;
	await open(page, "/components/inputs");

	for (const theme of ["dark", "light"]) {
		await setTheme(page, theme);
		const { danger, out } = await survey(page);

		t.ok(`${theme}: --glow-color-danger resolves (${danger})`, /^rgb/.test(danger));

		for (const type of FRAMED) {
			const r = out[type];
			t.ok(
				`${theme}: ${type} — ${r ? `${r.frame} ${r.red ? "is danger" : `is ${r.color}`}` : "missing"}`,
				!!r?.red
			);
		}

		for (const type of FRAMELESS) {
			t.ok(`${theme}: ${type} draws no frame, so nothing to repaint`, out[type]?.frame === "(no border)");
		}

		// Inside a <Field> the wrapper renders as `.input.in-field` with no label
		// and no message of its own, so the survey above cannot see it — but the
		// frame is the same frame and still has to carry the error.
		const inField = await page.evaluate(() => {
			const probe = document.createElement("span");
			document.body.appendChild(probe);
			probe.style.color = "var(--glow-color-danger)";
			const danger = getComputedStyle(probe).color;
			probe.remove();
			return [...document.querySelectorAll("#error-in-field .input.in-field")].map((wrap) => {
				const frame = [...wrap.querySelectorAll("*")].find(
					(el) => parseFloat(getComputedStyle(el).borderTopWidth) > 0
				);
				return frame ? getComputedStyle(frame).borderTopColor === danger : false;
			});
		});
		t.ok(
			`${theme}: a Field's error reaches the control it wraps (${inField.length} of them)`,
			inField.length === 2 && inField.every(Boolean)
		);

		// The two controls that must not be caught by the fix.
		t.ok(
			`${theme}: a valid input keeps its neutral border`,
			out["valid, for comparison"] && !out["valid, for comparison"].red
		);
		t.ok(
			`${theme}: a disabled input with an error stays disabled-grey`,
			out["disabled with an error"] && !out["disabled with an error"].red
		);
	}

	// A type nobody has written yet. Nothing in Input.svelte names it, and it is
	// injected after paint, so no build step has seen it either.
	const opensIn = await page.evaluate(() => {
		const probe = document.createElement("span");
		document.body.appendChild(probe);
		probe.style.color = "var(--glow-color-danger)";
		const danger = getComputedStyle(probe).color;
		probe.remove();

		const wrap = document.querySelector("#error-states .input.invalid");
		const el = document.createElement("div");
		// Exactly what theme.scss's `$border` compiles to — the declaration any
		// new control's frame would carry.
		el.style.border = "1px solid var(--glow-border-color)";
		wrap.appendChild(el);
		const got = getComputedStyle(el).borderTopColor;
		el.remove();
		return { got, danger };
	});
	t.ok(
		`a control Input.svelte has never heard of inherits the error colour — ${opensIn.got}`,
		opensIn.got === opensIn.danger
	);
} finally {
	await app.close();
}

t.done();
