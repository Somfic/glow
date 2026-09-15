// Shortcut specs: what a menu row prints, and whether the keys actually fire.
//
// Both halves need a browser. The spelling is platform-dependent (⌘ vs Ctrl)
// and decided from `navigator`, and "the key fires" is a listener on `window`
// reacting to a real keydown — neither is visible to a type-check, and the
// display half silently regresses to a hint the moment nothing binds it.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("shortcut specs");

const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

try {
	const page = app.page;
	await open(page, "/components/popover-menu");

	const apple = await page.evaluate(() =>
		/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
	);
	const mod = apple ? "⌘" : "Ctrl+";

	await page.locator("#shortcuts").getByRole("button", { name: "Edit" }).click();
	const row = page.locator(".menu-item", { hasText: "Undo" }).first();
	await row.waitFor();

	const printed = await row.locator(".kbd").innerText();
	t.ok(`'mod+z' prints as ${JSON.stringify(printed)} on this platform`, printed === `${mod}Z`);

	const redo = await page.locator(".menu-item", { hasText: "Redo" }).first().locator(".kbd").innerText();
	t.ok(`'mod+shift+z' prints as ${JSON.stringify(redo)}`, redo === (apple ? "⇧⌘Z" : "Ctrl+Shift+Z"));

	await page.keyboard.press("Escape");

	// A handler that matched called preventDefault, so `defaultPrevented` is
	// the one signal available from outside that the binding is live — the
	// docs' items deliberately do nothing else.
	const fires = (init) =>
		page.evaluate((init) => {
			const e = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
			window.dispatchEvent(e);
			return e.defaultPrevented;
		}, init);

	const cmd = apple ? { metaKey: true } : { ctrlKey: true };
	t.ok("mod+z fires while the menu is closed", await fires({ key: "z", code: "KeyZ", ...cmd }));
	t.ok("mod+shift+z fires", await fires({ key: "Z", code: "KeyZ", shiftKey: true, ...cmd }));
	t.ok("a bare z does not", !(await fires({ key: "z", code: "KeyZ" })));
	t.ok("an unbound mod+q does not", !(await fires({ key: "q", code: "KeyQ", ...cmd })));

	// A disabled row prints its key and binds nothing: the event has to come
	// back untouched, or the row would be stopping whatever else wanted it.
	const disabled = page.locator("#disabled");
	await disabled.getByRole("button", { name: "Options" }).click();
	const share = page.locator(".menu-item", { hasText: "Share" }).first();
	await share.waitFor();
	t.ok("a disabled row still prints its shortcut", (await share.locator(".kbd").count()) === 1);
	await page.keyboard.press("Escape");
	t.ok("a disabled row's key is left alone", !(await fires({ key: "u", code: "KeyU", ...cmd })));
} finally {
	await app.close();
}

t.done();
