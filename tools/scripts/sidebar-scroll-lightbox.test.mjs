// The sidebar rail's scroll affordance.
//
// The rail used to hide its own scrollbar (`scrollbar-width: none`) while being
// the scroller itself, so a nav taller than the viewport gave no hint at all
// that there was more below. It now scrolls in a `<ScrollArea scrollbar="none"
// fade>` wrapped around the nav only — the header, its collapse toggle and the
// footer stay outside, or they would scroll away with the items.
//
// What this asserts, in the order the bug report raises it:
//   1. there *is* an affordance: a bottom fade, on, over an overflowing nav;
//   2. the chrome did not go into the scroller with it;
//   3. the fade reads the rail's own (scoped `data-theme="dark"`) surface, not
//      the page's — PR #24 pinned the docs rail dark in both themes;
//   4. the collapsed rail's icon column is still on the 56px rail's centre
//      line, i.e. neither the fade nor a scrollbar gutter shoved it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, setTheme } from "../glow/docs.mjs";

const t = checks("sidebar scroll affordance");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

/** Everything the assertions need, read off the live docs rail in one pass. */
const RAIL = () => {
	const aside = document.querySelector("aside.sidebar");
	const area = aside?.querySelector(".scroll-area");
	const vp = area?.querySelector(".viewport");
	const fade = (name) => {
		const el = area?.querySelector(`.fade-${name}`);
		return el ? { on: el.classList.contains("on"), bg: getComputedStyle(el).backgroundImage } : null;
	};
	const box = (sel) => {
		const el = aside?.querySelector(sel);
		return el ? el.getBoundingClientRect().top : null;
	};
	return {
		hasArea: !!area,
		areaCls: area?.className ?? "",
		// The rail itself must no longer be the scroller.
		railScroll: aside ? aside.scrollHeight - aside.clientHeight : -1,
		navScroll: vp ? vp.scrollHeight - vp.clientHeight : -1,
		scrollTop: vp?.scrollTop ?? -1,
		gutter: vp ? vp.offsetWidth - vp.clientWidth : -1,
		top: fade("top"),
		bottom: fade("bottom"),
		headerTop: box(".sidebar-header"),
		footerTop: box(".sidebar-footer"),
		// Inside the scroller, so it *should* move.
		firstItemTop: box(".sidebar-item"),
		railBg: aside ? getComputedStyle(aside).backgroundColor : "",
		pageBg: getComputedStyle(document.body).backgroundColor,
	};
};

/** Centre x of every nav item icon, and the rail's own centre. */
const ICONS = () => {
	const aside = document.querySelector("aside.sidebar");
	const r = aside.getBoundingClientRect();
	return {
		railCentre: r.left + r.width / 2,
		width: r.width,
		centres: [...aside.querySelectorAll(".sidebar-item svg")].map((el) => {
			const b = el.getBoundingClientRect();
			return b.left + b.width / 2;
		}),
	};
};

try {
	await open(app.page, "/components/buttons");

	const at_rest = await app.page.evaluate(RAIL);
	t.ok("the nav is in a ScrollArea", at_rest.hasArea);
	t.ok("with the scrollbar off", at_rest.areaCls.includes("sb-none"));
	t.ok("and the fades on", at_rest.areaCls.includes("faded"));
	t.ok("the rail itself no longer scrolls", at_rest.railScroll === 0);
	t.ok("the nav overflows", at_rest.navScroll > 0);
	t.ok("no scrollbar gutter is reserved", at_rest.gutter === 0);
	t.ok("there is a trailing affordance", at_rest.bottom?.on === true);
	t.ok("and no leading one at the top", at_rest.top?.on === false);

	// The fade is a gradient to a colour; it has to be the rail's colour. PR #24
	// pins the docs rail dark, so in light mode the page background and the rail
	// background differ and a fade painted with the wrong one is obvious.
	await setTheme(app.page, "light");
	const light = await app.page.evaluate(RAIL);
	const rgb = light.railBg.match(/\d+/g)?.slice(0, 3).join(", ");
	t.ok(
		"in light mode the rail is still dark",
		light.railBg !== light.pageBg,
	);
	t.ok(
		"the fade paints the rail's scoped surface, not the page's",
		!!rgb && !!light.bottom?.bg?.includes(rgb),
	);

	// Scrolling the nav must not take the chrome with it.
	await app.page.evaluate(() => {
		// Fall back to the rail itself so this still runs — and still reports what
		// the chrome did — against the unfixed code, where the rail *is* the scroller.
		const vp =
			document.querySelector("aside.sidebar .scroll-area .viewport") ||
			document.querySelector("aside.sidebar");
		vp.scrollTop = vp.scrollHeight;
	});
	await app.page.waitForTimeout(200);
	const scrolled = await app.page.evaluate(RAIL);
	t.ok("scrolling moved the nav", scrolled.firstItemTop < light.firstItemTop);
	t.ok("the header stayed put", scrolled.headerTop === light.headerTop);
	t.ok("the footer stayed put", scrolled.footerTop === light.footerTop);
	t.ok("the leading fade came on", scrolled.top?.on === true);
	t.ok("the trailing one went off", scrolled.bottom?.on === false);

	// The collapsed rail is 56px of icon column and nothing else; a fade or a
	// gutter that took width there would push every icon off the centre line.
	await open(app.page, "/components/buttons");
	await setTheme(app.page, "dark");
	await app.page.getByRole("button", { name: "Collapse sidebar" }).click();
	await app.page.waitForFunction(
		() => document.querySelector("aside.sidebar").getBoundingClientRect().width === 56,
	);
	await app.page.waitForTimeout(300);
	const icons = await app.page.evaluate(ICONS);
	const off = icons.centres.filter((c) => Math.abs(c - icons.railCentre) > 0.01);
	t.ok("the collapsed rail is 56px", icons.width === 56);
	t.ok(
		`all ${icons.centres.length} icons are on the rail's centre line`,
		icons.centres.length > 0 && off.length === 0,
	);
	// ---- Lightbox ---------------------------------------------------------
	// It was the one styled component in src/lib that never `@use`d theme.scss,
	// so a `$token` in it would not have compiled. The substitution has to be
	// pixel-neutral: every value replaced matched its token exactly, so the
	// browser must still report the numbers the literals produced.
	const src = readFileSync(join(ROOT, "src/lib/media/Lightbox.svelte"), "utf8");
	t.ok("Lightbox @uses theme.scss", /@use '\.\.\/style\/theme\.scss' as \*;/.test(src));
	t.ok("the unused `scale` import is gone", !/\bscale\b/.test(src.split("</script>")[0]));
	const style = src.slice(src.indexOf("<style"));
	const literals = [...style.matchAll(/(?:border-radius|padding|gap|top|right|bottom|left):[^;]*?\b(4px|6px|8px|12px|18px|0\.25rem|0\.5rem|1rem|1\.5rem|2rem)\b/g)];
	t.ok(
		`no tokenisable literal is left in its styles${literals.length ? ` (${literals.map((m) => m[0]).join("; ")})` : ""}`,
		literals.length === 0,
	);

	await open(app.page, "/components/lightbox");
	await app.page.locator("#gallery .thumb").first().click();
	await app.page.locator(".lightbox-overlay").waitFor({ state: "visible" });
	await app.page.waitForTimeout(300);
	const lb = await app.page.evaluate(() => {
		const g = (sel, prop) => {
			const el = document.querySelector(sel);
			return el ? getComputedStyle(el)[prop] : null;
		};
		return {
			overlayPadding: g(".lightbox-overlay", "padding"),
			closeTop: g(".lightbox-close", "top"),
			closeRight: g(".lightbox-close", "right"),
			infoBottom: g(".lightbox-info", "bottom"),
			mediaRadius: g(".lightbox-media", "borderRadius"),
			stripBottom: g(".lightbox-related", "bottom"),
			stripLeft: g(".lightbox-related", "left"),
			stripGap: g(".lightbox-related", "gap"),
			stripPadding: g(".lightbox-related", "padding"),
			stripRadius: g(".lightbox-related", "borderRadius"),
			itemRadius: g(".related-item", "borderRadius"),
		};
	});
	const same = (name, got, want) => t.ok(`${name} is still ${want}`, got === want);
	same("the overlay's padding", lb.overlayPadding, "32px");
	same("the close button's inset", `${lb.closeTop}/${lb.closeRight}`, "16px/16px");
	same("the info panel's offset", lb.infoBottom, "24px");
	same("the media radius", lb.mediaRadius, "12px");
	same("the filmstrip's inset", `${lb.stripBottom}/${lb.stripLeft}`, "16px/16px");
	same("the filmstrip's gap", lb.stripGap, "8px");
	same("the filmstrip's padding", lb.stripPadding, "8px");
	same("the filmstrip's radius", lb.stripRadius, "8px");
	same("a thumbnail's radius", lb.itemRadius, "6px");
} finally {
	await app.close();
}

t.done();
