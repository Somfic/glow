/**
 * Media must not fetch off-screen — neither `src` nor `fallback`.
 *
 * `src` has always been held behind an IntersectionObserver, but `fallback`
 * was rendered as a plain eager <img> outside that gate, so a long grid fired
 * one request per tile the moment it mounted. That is invisible in a
 * screenshot and obvious in a request log, which is what this counts.
 *
 * Every unsplash URL is intercepted and answered locally, so the run is
 * offline, deterministic, and fast.
 */
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

// A 1x1 transparent PNG.
const PIXEL = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
	"base64"
);

const t = checks("media-lazy");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

const asked = [];
await app.page.route("https://images.unsplash.com/**", async (route) => {
	const u = new URL(route.request().url());
	if (u.searchParams.get("sig") !== null) asked.push(u.pathname + "?" + u.searchParams.get("sig"));
	await route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
});

try {
	await open(app.page, "/components/media");

	const grid = app.page.locator("#lazy .tile");
	const total = await grid.count();
	t.ok(`the grid has tiles to test (${total})`, total >= 12);

	// The card sits below two others, so nothing in it is near the viewport yet.
	await app.page.waitForTimeout(500);
	const stills = () => asked.filter((u) => u.includes("1506744038136")).length;
	const fulls = () => asked.filter((u) => u.includes("1469474968028")).length;
	console.log(`  before scroll: ${stills()} stills, ${fulls()} fulls, of ${total} tiles`);
	t.ok("no tile fetches before the grid is scrolled to", asked.length === 0);

	await grid.first().scrollIntoViewIfNeeded();
	await app.page.waitForTimeout(700);
	const afterTop = asked.length;
	t.ok(`scrolling to the grid fetches stills (${stills()})`, stills() > 0);
	t.ok(`…and the src of what is on screen (${fulls()})`, fulls() > 0);
	t.ok(`…but not the whole grid (${afterTop} of ${total * 2})`, afterTop < total * 2);

	t.ok(
		"a fallback that has loaded is marked loading=lazy",
		(await app.page.locator("#lazy .tile img.fallback-layer").first().getAttribute("loading")) ===
			"lazy"
	);

	await grid.nth(total - 1).scrollIntoViewIfNeeded();
	await app.page.waitForTimeout(700);
	t.ok(`scrolling on fetches more (${asked.length})`, asked.length > afterTop);

	await grid.first().scrollIntoViewIfNeeded();
	await app.page.waitForTimeout(400);
	t.ok(
		"a still already seen is not re-requested on the way back",
		new Set(asked).size === asked.length
	);
} finally {
	await app.close();
}

t.done();
