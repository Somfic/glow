// Button's `sm` size, and the sidebar's collapse toggle now that it is one.
//
// Both halves are geometry, and geometry is exactly what a type-check and a
// build cannot see: whether the size steps still read as one family, whether
// the badge/bar/kbd that ride inside a button still fit at 14px, and whether
// the toggle's icon lands on the same column as the nav icons underneath it.
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("button sizes + sidebar toggle");
const eq = (label, actual, expected) =>
	t.ok(`${label} — ${JSON.stringify(actual)}`, actual === expected);
const near = (label, actual, expected, tol = 0.5) =>
	t.ok(`${label} — ${actual} ≈ ${expected}`, Math.abs(actual - expected) <= tol);

const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

try {
	const page = app.page;
	await open(page, "/components/buttons");

	const sizes = page.locator("#button-sizes");
	const box = async (loc) => await loc.boundingBox();

	const sm = await box(sizes.getByRole("button", { name: "Small", exact: true }).first());
	const md = await box(sizes.getByRole("button", { name: "Medium", exact: true }));
	const lg = await box(sizes.getByRole("button", { name: "Large", exact: true }));

	eq("sm is 30px tall", sm.height, 30);
	eq("md is still 34px tall", md.height, 34);
	near("lg is still ~45px tall", lg.height, 45.25, 0.5);
	t.ok(`the three steps are strictly increasing — ${sm.height}/${md.height}/${lg.height}`,
		sm.height < md.height && md.height < lg.height);
	// Nothing lands on a half device pixel: a fractional height leaves a
	// half-covered row along the edge, which is what a reviewer sees when they
	// zoom into a screenshot.
	eq("sm sits on whole pixels", sm.height % 1, 0);

	// The pieces that ride inside a button are the ones most likely to break at
	// a smaller size: a badge that overflows, a bar thicker than the corner
	// radius, a Kbd taller than the content box it sits in.
	const inside = async (parent, child) => {
		const p = await box(parent);
		const c = await box(child);
		return c.y >= p.y - 0.5 && c.y + c.height <= p.y + p.height + 0.5;
	};

	const counted = sizes.locator("button").filter({ hasText: "Inbox" });
	t.ok("the count badge fits inside a sm button", await inside(counted, counted.locator(".count")));

	const shortcutted = sizes.locator("button").filter({ hasText: "Save" });
	t.ok("the shortcut Kbd fits inside a sm button", await inside(shortcutted, shortcutted.locator(".kbd")));

	const circle = sizes.locator("button.shape-circle.size-sm").first();
	const circleBox = await box(circle);
	eq("a sm circle is square", circleBox.width, circleBox.height);
	eq("a sm circle is 32px", circleBox.width, 32);

	const iconOnly = sizes.locator("button.icon-only.size-sm").first();
	const iconBox = await box(iconOnly);
	eq("a sm icon-only button is square", Math.round(iconBox.width), Math.round(iconBox.height));

	// The progress bar only exists while loading, so it has to be driven rather
	// than inspected: a track injected by hand would miss Svelte's scoping
	// class and pick up none of the component's CSS. It must stay thinner than
	// at md, or a 30px button gets a visible band instead of a hairline.
	const uploader = sizes.locator("button").filter({ hasText: "Upload" });
	await uploader.click();
	const track = uploader.locator(".progress-track");
	await track.waitFor();
	eq("the sm progress bar is 2px", await track.evaluate((el) => getComputedStyle(el).height), "2px");
	t.ok("the bar stays inside the button", await inside(uploader, track));
	// Let the upload finish, so the rest of the run isn't racing a disabled button.
	await page.waitForFunction(
		() => ![...document.querySelectorAll("#button-sizes button")].some((b) => b.disabled),
		null,
		{ timeout: 10000 },
	);

	// ---- the sidebar toggle -------------------------------------------------
	//
	// The docs shell renders the same <Sidebar>, so it is testable from any route.
	const toggle = page.locator(".sidebar .collapse-toggle");
	const rail = page.locator("aside.sidebar");

	eq("the toggle is a glow Button", await toggle.evaluate((el) => el.classList.contains("bare")), true);
	eq("it names itself when expanded", await toggle.getAttribute("aria-label"), "Collapse sidebar");

	const navIcon = page.locator(".sidebar .sidebar-item .icon").first();
	const centreX = async (loc) => {
		const b = await box(loc);
		return b.x + b.width / 2;
	};

	const centreY = async (loc) => {
		const b = await box(loc);
		return b.y + b.height / 2;
	};
	// Expanded, the chevron sits beside the rail's title. A 30px button next to
	// an 18px line box is exactly the pairing that misses a centre line.
	near("the toggle centres against the rail title", await centreY(toggle), await centreY(page.locator(".sidebar .sidebar-title")));

	await toggle.click();
	await page.waitForFunction(() => document.querySelector("aside.sidebar").classList.contains("collapsed"));
	// The width transition has to land before the boxes mean anything.
	await page.waitForFunction(() => document.querySelector("aside.sidebar").getBoundingClientRect().width === 56);

	eq("clicking collapses the rail", await rail.evaluate((el) => el.classList.contains("collapsed")), true);
	eq("it renames itself when collapsed", await toggle.getAttribute("aria-label"), "Expand sidebar");
	eq("and swaps the chevron", await toggle.locator("svg").evaluate((el) => el.classList.contains("lucide-chevrons-right")), true);

	// The whole point of the rail's layout: one icon column, no jog between the
	// toggle and the items under it.
	near("the toggle's icon centres on the nav icon column", await centreX(toggle.locator(".icon")), await centreX(navIcon));

	await toggle.click();
	await page.waitForFunction(() => !document.querySelector("aside.sidebar").classList.contains("collapsed"));
	eq("clicking again expands it", await rail.evaluate((el) => el.classList.contains("collapsed")), false);
	eq("and the name goes back", await toggle.getAttribute("aria-label"), "Collapse sidebar");

	// Below 768px the rail is a drawer, where a collapse control makes no sense.
	await page.setViewportSize({ width: 700, height: 900 });
	eq("it is hidden on a narrow viewport", await toggle.evaluate((el) => getComputedStyle(el).display), "none");
	await page.setViewportSize({ width: 1280, height: 900 });
} finally {
	await app.close();
}

t.done();
