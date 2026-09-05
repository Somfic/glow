// Two things about <Button> that neither the build nor svelte-check can see:
// what a real <form> does when you click one, and what a variant with no fill
// of its own looks like once it is disabled.
//
// The first is deliberately asserted against a form that records its own
// submit/reset events rather than against the `type` attribute. The attribute
// is the mechanism; "did the form submit" is the bug that was reported.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open, setTheme } from "../glow/docs.mjs";

const t = checks("button type + disabled treatment");
const eq = (label, actual, expected) =>
	t.ok(`${label} — ${JSON.stringify(actual)}`, actual === expected);

const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

// A colour is "not painted" when it is fully transparent. Every token this
// component reaches for resolves through color-mix to an rgba(), so alpha is
// the only reliable read — a `transparent` computes as rgba(0, 0, 0, 0).
const alpha = (css) => {
	const m = css.match(/rgba?\(([^)]+)\)/);
	if (!m) return css === "transparent" ? 0 : 1;
	const parts = m[1].split(/[,/]/).map((s) => parseFloat(s));
	return parts.length > 3 ? parts[3] : 1;
};

try {
	const page = app.page;
	await open(page, "/components/buttons");

	// ---- type ---------------------------------------------------------------

	eq(
		"a plain Button renders type=button",
		await page.locator("#button-variants button").first().getAttribute("type"),
		"button",
	);

	// The reported bug in its original shape: a Button that was never meant to
	// submit anything, moved into a form. Wrapping an already-rendered button is
	// what makes this a test of the component and not of the demo page.
	const submittedByDefaultButton = await page.evaluate(() => {
		const button = document.querySelector("#button-variants button");
		const form = document.createElement("form");
		form.id = "wrapper-probe";
		button.parentElement.insertBefore(form, button);
		form.appendChild(button);

		let submitted = false;
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			submitted = true;
		});
		button.click();
		return submitted;
	});
	t.ok(
		"a Button inside a form does not submit it when clicked",
		submittedByDefaultButton === false,
	);

	// ...and the other half: a caller who asks for a submit button gets one.
	const demo = page.locator("#button-form-actions");
	eq(
		'type="submit" reaches the element',
		await demo.getByRole("button", { name: "Save" }).getAttribute("type"),
		"submit",
	);
	eq(
		'type="reset" reaches the element',
		await demo.getByRole("button", { name: "Clear" }).getAttribute("type"),
		"reset",
	);

	const formEvent = async () => await page.locator("#button-form-actions").innerText();

	await demo.getByRole("button", { name: "Save" }).click();
	t.ok(
		"the submit button submits the form",
		(await formEvent()).includes("submit"),
	);

	await demo.getByRole("button", { name: "Preview" }).click();
	t.ok(
		"the plain button runs its onclick and leaves the form alone",
		(await formEvent()).includes("onclick only"),
	);

	await demo.getByRole("button", { name: "Clear" }).click();
	t.ok("the reset button resets the form", (await formEvent()).includes("reset"));

	// ---- disabled -----------------------------------------------------------
	//
	// Every variant, in both themes. The invariant is a comparison against the
	// button's own enabled resting state, not against a fixed colour: a variant
	// that rests with no fill must not gain one, and a variant that rests with
	// no border must not gain one. What it may always do is dim its text.
	const variants = ["primary", "secondary", "ghost", "outlined", "dashed", "danger", "bare"];

	for (const theme of ["dark", "light"]) {
		await setTheme(page, theme);

		const rows = await page.evaluate(() => {
			const cells = [...document.querySelectorAll("#button-disabled button")];
			return cells.map((el) => {
				const s = getComputedStyle(el);
				return {
					variant: ["primary", "secondary", "ghost", "outlined", "dashed", "danger", "bare"]
						.find((v) => el.classList.contains(v)),
					disabled: el.disabled,
					background: s.backgroundColor,
					border: s.borderTopColor,
					color: s.color,
				};
			});
		});

		for (const variant of variants) {
			const on = rows.find((r) => r.variant === variant && !r.disabled);
			const off = rows.find((r) => r.variant === variant && r.disabled);
			if (!on || !off) {
				t.ok(`${theme}: ${variant} appears enabled and disabled on the page`, false);
				continue;
			}

			if (alpha(on.background) === 0) {
				t.ok(
					`${theme}: disabled ${variant} gains no fill — ${off.background}`,
					alpha(off.background) === 0,
				);
			}
			if (alpha(on.border) === 0) {
				t.ok(
					`${theme}: disabled ${variant} gains no border — ${off.border}`,
					alpha(off.border) === 0,
				);
			}
			t.ok(
				`${theme}: disabled ${variant} dims its text — ${on.color} → ${off.color}`,
				off.color !== on.color,
			);
		}
	}

	await setTheme(page, "dark");
} finally {
	await app.close();
}

t.done();
