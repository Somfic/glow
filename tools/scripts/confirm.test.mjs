// The promise-returning confirm() / alert() / prompt() helpers.
//
//   node tools/scripts/confirm.test.mjs
//   node tools/scripts/confirm.test.mjs --no-build
//
// Everything worth checking here is about focus and keys, and neither is
// visible from the markup: which element the browser actually put focus on,
// whether Tab wraps inside the dialog, and whether Enter reaches the dialog or
// the button under it. So these ask the page for `document.activeElement`
// rather than for a class name.
//
// The waits after a dialog opens are not paranoia: `<Modal>` places focus in a
// `setTimeout`, so a key pressed the instant the overlay appears still lands on
// whatever opened it.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("confirm / alert / prompt");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);
const page = app.page;

const activeText = () =>
	page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
const openDialog = async (name) => {
	await page.getByRole("button", { name, exact: true }).click();
	await page.waitForSelector(".modal-overlay");
	await page.waitForTimeout(300);
};
const closed = () => page.waitForSelector(".modal-overlay", { state: "detached" });
const toast = (text) =>
	page.locator(".toast-container").getByText(text, { exact: true }).first().isVisible();

try {
	await open(page, "/components/confirm");

	// The safe action takes focus, and Escape settles the promise as a cancel.
	await openDialog("Ask");
	t.ok("focus opens on the cancelling button", (await activeText()) === "Cancel");
	await page.keyboard.press("Escape");
	await closed();
	t.ok("escape cancels", await toast("Cancelled"));
	t.ok("focus returns to the opener", (await activeText()) === "Ask");

	// Enter belongs to the focused button, so it cancels from the default focus.
	await openDialog("Ask");
	await page.keyboard.press("Enter");
	await closed();
	t.ok("enter on cancel cancels", await toast("Cancelled"));

	// With focus off the buttons, Enter is the dialog's and confirms.
	await openDialog("Ask");
	await page.locator(".modal-container").click({ position: { x: 10, y: 10 } });
	await page.keyboard.press("Enter");
	await closed();
	t.ok("enter elsewhere confirms", await toast("Published"));

	// Destructive dialogs get the same safe default, and Tab stays inside.
	await openDialog("Aurora");
	t.ok("danger focuses cancel, not delete", (await activeText()) === "Cancel");
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	t.ok("tab wraps within the dialog", (await activeText()) === "Cancel");
	await page.keyboard.press("Escape");
	await closed();
	t.ok("cancelled delete left the project", await page.getByRole("button", { name: "Aurora" }).isVisible());

	// Prompt: the field is focused with its contents selected, Enter submits.
	await openDialog("Rename workspace");
	t.ok(
		"prompt focuses the field",
		await page.locator(".modal-overlay input").evaluate((el) => el === document.activeElement),
	);
	await page.keyboard.type("Globex");
	await page.keyboard.press("Enter");
	await closed();
	t.ok("prompt resolves with the typed value", await toast("Renamed to Globex"));

	// A queue, not a stack.
	await openDialog("Ask three things");
	t.ok("one scrim at a time", (await page.locator(".modal-overlay").count()) === 1);
	await page.keyboard.press("Escape");
	await page.waitForSelector(".modal-overlay input");
	await page.waitForTimeout(300);
	t.ok(
		"the queued prompt gets focus too",
		await page.locator(".modal-overlay input").evaluate((el) => el === document.activeElement),
	);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(400);
	t.ok("the third follows", await page.locator(".modal-overlay").getByText("That was the last one.").first().isVisible());
	await page.keyboard.press("Escape");
	await closed();
	t.ok("the queue drains", (await page.locator(".modal-overlay").count()) === 0);

	// `required` gates the accepting button rather than the submit.
	await openDialog("Rename workspace");
	await page.fill(".modal-overlay input", "");
	t.ok("required disables the accepting button", await page.getByRole("button", { name: "Rename" }).isDisabled());
	t.ok("the dialog is aria-modal", await page.locator('.modal-overlay[aria-modal="true"]').isVisible());
	await page.keyboard.press("Escape");
	await closed();
} finally {
	await app.close();
}
t.done();
