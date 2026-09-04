import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/** The repo root, wherever this worktree happens to live. */
export const ROOT = new URL("../..", import.meta.url).pathname;

/**
 * Every documented route, read off the filesystem rather than kept in a list.
 *
 * This is the one decision in here worth defending: a hardcoded catalogue
 * would have to be edited by every branch that adds a component, so a dozen
 * parallel worktrees would all conflict on this file and on nothing else.
 * Discovery means a new `src/routes/components/<name>/+page.svelte` is shot by
 * `shots.mjs` the moment it exists, with no shared file touched.
 */
export function routes({ examples = false, root = ROOT } = {}) {
	const found = [];
	for (const group of examples ? ["components", "examples"] : ["components"]) {
		const dir = join(root, "src/routes", group);
		if (!existsSync(dir)) continue;
		for (const name of readdirSync(dir, { withFileTypes: true })) {
			if (!name.isDirectory()) continue;
			if (!existsSync(join(dir, name.name, "+page.svelte"))) continue;
			found.push(`/${group}/${name.name}`);
		}
	}
	return found.sort();
}

/** `/components/file-upload` → `file-upload`, for naming a PNG. */
export const slug = (route) => route.replace(/^\/+/, "").replace(/\//g, "-");

/**
 * Put the page in a known theme.
 *
 * Writes the preference and reloads rather than stamping `data-theme` on
 * `<html>` directly: the attribute alone would look right but leave the store
 * disagreeing, and the parts that read the theme in JS (Sidebar, and the
 * shader's palette) would still be rendering for the old one.
 */
export async function setTheme(page, mode) {
	await page.evaluate((m) => localStorage.setItem("glow-theme", m), mode);
	await page.reload({ waitUntil: "load" });
	await settle(page);
	const applied = await page.evaluate(() => document.documentElement.dataset.theme);
	if (applied !== mode) throw new Error(`theme is ${applied}, asked for ${mode}`);
}

/** Go to a docs route and wait for it to stop moving. */
export async function open(page, route, { theme } = {}) {
	const base = new URL(page.url()).origin;
	await page.goto(`${base}${route}`, { waitUntil: "load" });
	if (theme) await setTheme(page, theme);
	else await settle(page);
}

/**
 * Wait for the things that are still in flight after `load`, and park the two
 * that would otherwise differ between runs.
 *
 * The custom cursor is drawn into the page and sits wherever the mouse was
 * left, so it has to go or it lands in a screenshot at a random offset. The
 * shader canvases are told to hold still by `reducedMotion` in `launch()`, but
 * they still need a frame or two to have painted anything at all.
 */
export async function settle(page, { hideCursor = true } = {}) {
	await page.evaluate(() => document.fonts.ready);
	await page.waitForLoadState("networkidle").catch(() => {});
	if (hideCursor) {
		await page.addStyleTag({
			content: ".cursor-container{display:none!important}",
		}).catch(() => {});
		// Park the real pointer too, so nothing is left in a hover state.
		await page.mouse.move(-50, -50);
	}
	if (await page.locator("canvas.glow-canvas").count()) {
		await page.waitForTimeout(400);
	}
	// Two frames: one to apply the above, one to paint it.
	await page.evaluate(
		() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
	);
}

/**
 * The documented examples on the current page.
 *
 * Docs pages are written as `<Card title="…" id="…">` per example, so an
 * id-bearing card is exactly one thing worth showing on its own. Nested cards
 * (the catalogue page has them) have no id and are skipped.
 */
export async function cards(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll(".card[id]")].map((el) => ({
			id: el.id,
			title: el.querySelector(".header-title")?.textContent?.trim() ?? el.id,
		})),
	);
}

/** Shoot one card by id, with a little air around it. */
export async function shootCard(page, id, path, { pad = 12 } = {}) {
	const card = page.locator(`.card[id="${id}"]`).first();
	await card.scrollIntoViewIfNeeded();
	await settle(page, { hideCursor: false });
	const box = await card.boundingBox();
	if (!box) throw new Error(`card #${id} has no box`);
	const view = page.viewportSize();
	await page.screenshot({
		path,
		clip: {
			x: Math.max(0, box.x - pad),
			y: Math.max(0, box.y - pad),
			width: Math.min(box.width + pad * 2, view.width - Math.max(0, box.x - pad)),
			height: Math.min(box.height + pad * 2, view.height - Math.max(0, box.y - pad)),
		},
	});
	return path;
}

/** The portalled components, which is where layering goes wrong. */
export const OVERLAYS = ["Modal", "Drawer", "Popover", "CommandPalette", "Toast", "Tooltip"];
