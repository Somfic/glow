// The two failures that a build, a type-check and a glance at the markup all
// miss: an <Icon> with a name that isn't in IconName, and a Tooltip that paints
// the same colour whatever the theme is.
//
//   node tools/scripts/icon-fallback-tooltip-theme.test.mjs
//   node tools/scripts/icon-fallback-tooltip-theme.test.mjs --no-build
//   node tools/scripts/icon-fallback-tooltip-theme.test.mjs --dev-warning
//
// Both are questions about what the browser actually painted, not about what
// the DOM contains — an empty <span> is a node like any other, and
// `rgba(0,0,0,0.9)` is a valid background in either theme. So every assertion
// here reads a measured box or a computed colour.
//
// `--dev-warning` adds a second pass against `bun run dev`, because
// `import.meta.env.DEV` is false in the built site by construction: the point of
// that pass is that the warning fires there and *not* in the production run
// above.

import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");
const devPass = process.argv.includes("--dev-warning");
const shots = join(ROOT, ".shots");

const t = checks("icon fallback + tooltip theme");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

/** Every `[glow]` line the page logged, at any console level. */
const glowLogs = [];
page.on("console", (m) => {
	const text = m.text();
	if (text.includes("[glow]")) glowLogs.push(text);
});

/**
 * Flatten a stack of CSS colours to the sRGB triplet a person would see, by
 * painting them in order onto a 1x1 canvas and reading the pixel back.
 *
 * Parsing the strings here would not work: `color-mix()` computes to
 * `oklab(0.19 0.002 -0.009 / 0.92)`, which is neither sRGB nor parseable with a
 * regex, and the tokens are translucent so they have to be composited anyway.
 * The browser already knows how to do both.
 */
const flatten = (page, layers) =>
	page.evaluate((colors) => {
		const c = document.createElement("canvas");
		c.width = c.height = 1;
		const g = c.getContext("2d");
		for (const color of colors) {
			g.fillStyle = color;
			g.fillRect(0, 0, 1, 1);
		}
		const d = g.getImageData(0, 0, 1, 1).data;
		return { r: d[0], g: d[1], b: d[2] };
	}, layers);

const lum = ({ r, g, b }) => {
	const f = (c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const contrast = (a, b) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

const rgb = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

try {
	// ─────────────────────────────────────────────────────────────────────
	// Icon: an unknown name
	// ─────────────────────────────────────────────────────────────────────
	await open(page, "/components/icon");
	await settle(page);

	const boxesIn = (cardId) =>
		page.$$eval(`.card[id="${cardId}"] .icon`, (els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				const svg = el.querySelector("svg");
				const s = svg?.getBoundingClientRect();
				return {
					y: Math.round(r.top * 100) / 100,
					w: Math.round(r.width * 100) / 100,
					h: Math.round(r.height * 100) / 100,
					svgW: s ? Math.round(s.width * 100) / 100 : 0,
					svgH: s ? Math.round(s.height * 100) / 100 : 0,
				};
			}),
		);

	// The `size` card and the `unknown-name` card render the same six sizes, in
	// the same order — one with a real name, one with a name lucide dropped.
	const real = (await boxesIn("size")).slice(0, 6);
	const missing = (await boxesIn("unknown-name")).slice(0, 6);

	t.ok("the unknown-name card rendered six icons", missing.length === 6);
	t.ok(
		"an unknown name paints something (non-zero svg box)",
		missing.length > 0 && missing.every((b) => b.svgW > 0 && b.svgH > 0),
	);
	t.ok(
		"the fallback occupies exactly the real icon's box at every size",
		real.length === 6 &&
			missing.length === 6 &&
			real.every((r, i) => r.w === missing[i].w && r.h === missing[i].h),
	);
	if (real.length === 6 && missing.length === 6) {
		console.log(
			`        real    ${real.map((b) => `${b.w}x${b.h}`).join(" ")}\n` +
				`        missing ${missing.map((b) => `${b.w}x${b.h}`).join(" ")}`,
		);
	}

	// A same-size box is not the same thing as a shared centre line: the last row
	// of the card puts a real 24px icon and the fallback in one line of text, and
	// they have to sit on the same rectangle or the fix has traded an invisible
	// icon for a nudged baseline.
	const pair = (await boxesIn("unknown-name")).slice(6, 8);
	t.ok(
		`the fallback shares its box with a real icon inline in text (y ${pair.map((b) => b.y).join(" vs ")})`,
		pair.length === 2 && pair[0].y === pair[1].y && pair[0].h === pair[1].h,
	);

	// The fallback has to be recognisable as wrong, not just present. Danger red
	// is the one colour in the palette that never reads as an ordinary icon.
	const strokes = await page.$$eval(`.card[id="unknown-name"] .icon svg`, (els) =>
		els.map((el) => getComputedStyle(el).stroke),
	);
	const dangerCss = await page.evaluate(() =>
		getComputedStyle(document.documentElement).getPropertyValue("--glow-color-danger").trim(),
	);
	const danger = await flatten(page, [dangerCss]);
	const painted = await Promise.all(strokes.map((s) => flatten(page, [s])));
	// The first six are the bad name at six sizes; the rest of the card pairs it
	// with a real icon, which has to keep inheriting currentColor.
	t.ok(
		`the fallback glyph is painted in the danger colour (${strokes[0]} vs ${dangerCss})`,
		painted.length >= 6 && painted.slice(0, 6).every((p) => contrast(p, danger) < 1.05),
	);
	t.ok(
		"a real icon in the same card still inherits currentColor",
		painted.slice(6).length > 0 && painted.slice(6).some((p) => contrast(p, danger) > 2),
	);

	t.ok(
		"a production build logs no [glow] icon warning",
		glowLogs.length === 0,
	);
	if (glowLogs.length) console.log(`        ${glowLogs.join("\n        ")}`);

	// ─────────────────────────────────────────────────────────────────────
	// Tooltip: the theme
	// ─────────────────────────────────────────────────────────────────────
	const sample = async (mode) => {
		await open(page, "/components/tooltip", { theme: mode });
		await settle(page);
		const trigger = page.locator('.card[id="basic-tooltips"] .demo-btn').first();
		const box = await trigger.boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.locator(".tooltip").waitFor({ state: "visible", timeout: 4000 });
		return await page.evaluate(() => {
			const cs = getComputedStyle(document.querySelector(".tooltip"));
			// The colour behind the tooltip is not any one element's: <body> is
			// transparent on this page and the card's own fill is translucent. Walk
			// up from the card collecting every non-transparent layer, outermost
			// first, and let the canvas composite them.
			const behind = [];
			for (let el = document.querySelector('.card[id="basic-tooltips"]'); el; el = el.parentElement) {
				const bg = getComputedStyle(el).backgroundColor;
				if (bg !== "transparent" && !/,\s*0\)$/.test(bg)) behind.unshift(bg);
			}
			return { bg: cs.backgroundColor, fg: cs.color, behind };
		});
	};

	const dark = await sample("dark");
	const light = await sample("light");
	console.log(
		`        dark  bg ${dark.bg} fg ${dark.fg}\n        light bg ${light.bg} fg ${light.fg}`,
	);

	t.ok(
		"the tooltip is not the same colour in both themes",
		dark.bg !== light.bg || dark.fg !== light.fg,
	);

	for (const [mode, s] of [
		["dark", dark],
		["light", light],
	]) {
		// Both the card and the tooltip are translucent, so each layer has to be
		// composited onto the one under it to get the colour a reader sees.
		const cardBg = await flatten(page, ["white", ...s.behind]);
		const bg = await flatten(page, ["white", ...s.behind, s.bg]);
		const fg = await flatten(page, ["white", ...s.behind, s.bg, s.fg]);
		t.ok(
			`${mode}: tooltip text clears 4.5:1 against its own background (${contrast(fg, bg).toFixed(2)}:1)`,
			contrast(fg, bg) >= 4.5,
		);
		// The whole point of an inverted overlay: it must not read as one more
		// surface of the page it floats over.
		t.ok(
			`${mode}: tooltip reads as an overlay, not a surface (${contrast(bg, cardBg).toFixed(2)}:1 vs card ${rgb(cardBg)})`,
			contrast(bg, cardBg) >= 3,
		);
	}

	// The one state shots.mjs cannot reach: a tooltip is only on screen while
	// something is hovered, so the picture for the pull request has to be taken
	// from here.
	mkdirSync(shots, { recursive: true });
	for (const mode of ["dark", "light"]) {
		await open(page, "/components/tooltip", { theme: mode });
		await settle(page);
		const card = page.locator('.card[id="inverted-surface"]');
		const trigger = card.locator(".demo-btn").nth(1);
		// This card is below the fold, and `mouse.move` works in viewport
		// coordinates — without the scroll it hovers whatever happens to be there.
		await trigger.scrollIntoViewIfNeeded();
		await settle(page);
		const b = await trigger.boundingBox();
		await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
		await page.locator(".tooltip").waitFor({ state: "visible", timeout: 4000 });
		const c = await card.boundingBox();
		await page.screenshot({
			path: join(shots, `tooltip-inverted-surface-${mode}.png`),
			clip: { x: c.x - 12, y: c.y - 48, width: c.width + 24, height: c.height + 60 },
		});
	}

	// ─────────────────────────────────────────────────────────────────────
	// Icon: the dev-only warning
	// ─────────────────────────────────────────────────────────────────────
	if (devPass) {
		const devApp = await launch({ dev: true, cwd: ROOT });
		try {
			const warns = [];
			devApp.page.on("console", (m) => {
				if (m.text().includes("[glow]")) warns.push(m.text());
			});
			await open(devApp.page, "/components/icon");
			await settle(devApp.page);
			// The card renders the same bad name seven times. One warning, not seven.
			t.ok(
				`dev build warns exactly once for a repeated bad name (${warns.length})`,
				warns.length === 1,
			);
			t.ok(
				"the warning names the offending icon",
				warns.some((w) => w.includes("FileJson")),
			);
			if (warns.length) console.log(`        ${warns[0]}`);
		} finally {
			await devApp.close();
		}
	}
} finally {
	await app.close();
}

t.done();
