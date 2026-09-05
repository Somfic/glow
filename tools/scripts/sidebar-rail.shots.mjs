// The collapsed rail, which no card shot can reach.
//
// `shots.mjs --cards sidebar` catches the live sidebar in whatever state the
// page loads in (expanded), and the collapsed state is the one that matters for
// the header toggle — it is the only thing left in a 56px rail. So: click it,
// then shoot the card, in both themes.
//
// Run this AFTER shots.mjs, which wipes the output directory.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, setTheme, shootCard } from "../glow/docs.mjs";

const out = join(ROOT, ".shots");
mkdirSync(out, { recursive: true });

const t = checks("sidebar rail — collapsed");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

try {
	for (const theme of ["dark", "light"]) {
		await open(app.page, "/components/sidebar");
		await setTheme(app.page, theme);
		// The card's own Collapse button, not the header chevron — clicking the
		// chevron would leave it under the pointer and painted as hovered.
		await app.page.locator('#live button:has-text("Collapse")').first().click();
		await app.page.waitForFunction(
			() => document.querySelector("#live aside.sidebar").getBoundingClientRect().width === 56,
		);
		const path = join(out, `sidebar-live-collapsed-${theme}.png`);
		await shootCard(app.page, "live", path);
		t.ok(`${theme}: shot the collapsed rail`, true);
	}
} finally {
	await app.close();
}

t.done();
