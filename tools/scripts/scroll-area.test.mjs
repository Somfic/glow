import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("scroll-area");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);
try {
	await open(app.page, "/components/scroll-area");

	const info = await app.page.evaluate(() => {
		const out = [];
		document.querySelectorAll(".scroll-area").forEach((el) => {
			const vp = el.querySelector(".viewport");
			out.push({
				cls: el.className,
				gutter: vp.offsetWidth - vp.clientWidth,
				overflowY: vp.scrollHeight - vp.clientHeight,
				overflowX: vp.scrollWidth - vp.clientWidth,
				tabindex: vp.getAttribute("tabindex"),
				role: vp.getAttribute("role"),
				fades: [...el.querySelectorAll(".fade.on")].map((f) => f.className.match(/fade-\w+/)[0])
			});
		});
		return out;
	});
	t.ok(
		"an area that fits its content is not a tab stop",
		info.some((a) => a.overflowY === 0 && a.overflowX === 0 && a.tabindex === null)
	);
	t.ok(
		"horizontal overflow raises the trailing fade",
		info.some((a) => a.overflowX > 0 && a.fades.includes("fade-right"))
	);
	t.ok(
		"scrollbar=always reserves a gutter",
		info.some((a) => a.cls.includes("sb-always") && a.gutter > 0)
	);

	const first = app.page.locator(".scroll-area .viewport").first();
	t.ok("a scrollable area is a tab stop", (await first.getAttribute("tabindex")) === "0");
	await first.focus();
	await app.page.keyboard.press("PageDown");
	await app.page.waitForTimeout(200);
	t.ok("keyboard scrolls it", (await first.evaluate((e) => e.scrollTop)) > 0);
	t.ok(
		"the leading fade switches on once scrolled",
		await app.page
			.locator(".scroll-area")
			.first()
			.locator(".fade-top")
			.evaluate((e) => e.classList.contains("on"))
	);

	// The drawer is portalled to <body> and animates in, so wait for the area
	// itself rather than polling once.
	await app.page.getByRole("button", { name: "Open drawer" }).click();
	const inDrawer = app.page.locator(".drawer-card .scroll-area .viewport");
	await inDrawer.waitFor({ state: "visible" });
	await app.page.waitForTimeout(400);
	const drawerArea = await inDrawer.evaluate((vp) => ({
		overflow: vp.scrollHeight - vp.clientHeight,
		containment: getComputedStyle(vp).overscrollBehaviorY,
		// The drawer body must not have grown to fit the log: the area caps it.
		bodyOverflow: (() => {
			const body = vp.closest(".card-body");
			return body ? body.scrollHeight - body.clientHeight : -1;
		})()
	}));
	t.ok("it scrolls inside a portalled Drawer", drawerArea.overflow > 0);
	t.ok("the wheel does not hand off to the drawer", drawerArea.containment === "contain");
	t.ok("the drawer body itself does not also scroll", drawerArea.bodyOverflow === 0);
} finally {
	await app.close();
}
t.done();
