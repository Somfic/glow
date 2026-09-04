// The PIN field is one real <input> painted as N cells, so almost none of its
// behaviour is visible from the markup: what matters is where the caret lands
// and what the element's value is after a keystroke, a multi-character insert
// or a Backspace. Assert those in a real browser.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("pin input");
// `checks` only has ok(); fold the actual into the label so a failure says what
// it got rather than just which line it was.
const eq = (label, actual, expected) =>
	t.ok(`${label} — ${JSON.stringify(actual)}`, actual === expected);
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

try {
	const page = app.page;
	await open(page, "/components/inputs");

	const pin = page.locator(".pin-input").first();
	const field = pin.locator("input.pin-field");
	const cells = pin.locator(".pin-cell");

	/** Index of the cell currently painted as active, or -1. */
	const active = () =>
		pin.evaluate((el) => [...el.querySelectorAll(".pin-cell")].findIndex((c) => c.classList.contains("active")));
	const value = () => field.inputValue();

	eq("iOS is offered the SMS code", await field.getAttribute("autocomplete"), "one-time-code");
	eq("numeric codes get the numeric keypad", await field.getAttribute("inputmode"), "numeric");
	eq("alphanumeric codes do not", await page.locator(".pin-input").nth(2).locator("input").getAttribute("inputmode"), "text");
	eq("the six cells are painted", await cells.count(), 6);

	// The card ships with "4821" in a six-cell field, so cell 4 is the first empty one.
	await field.evaluate((el) => el.focus());
	eq("tabbing in lands on the first empty cell", await active(), 4);

	const clickCell = async (i) => {
		const box = await cells.nth(i).boundingBox();
		await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	};

	await clickCell(5);
	eq("clicking past the code still lands on the first empty cell", await active(), 4);

	await clickCell(1);
	eq("clicking a filled cell goes to that cell", await active(), 1);

	await page.keyboard.press("End");
	await page.keyboard.type("56");
	eq("typing advances and fills", await value(), "482156");

	await page.keyboard.press("Backspace");
	eq("backspace past the end clears the last cell", await value(), "48215");

	await page.keyboard.press("Home");
	eq("Home jumps to the first cell", await active(), 0);
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	eq("arrows walk between cells", await active(), 2);

	// Clear, then insert the whole code in one event — the shape a paste, an iOS
	// autofill and an IME commit all arrive in.
	await page.keyboard.press("ControlOrMeta+a");
	await page.keyboard.press("Backspace");
	eq("select-all clears the field", await value(), "");

	await page.keyboard.insertText("123-456");
	eq("a pasted code survives its separators", await value(), "123456");
	eq("and leaves the caret at the end", await active(), 5);

	await page.keyboard.insertText("9");
	eq("a full code takes no more characters", await value(), "123456");

	await page.keyboard.press("ControlOrMeta+a");
	await page.keyboard.insertText("abc123");
	eq("a numeric field drops letters", await value(), "123");
} finally {
	await app.close();
}
t.done();
