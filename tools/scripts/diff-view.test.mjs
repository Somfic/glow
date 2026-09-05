// The rendered DiffView: alignment, the sticky gutters, expanding a fold, and
// the non-colour signals. The algorithm underneath has its own browser-free
// test in `diff.test.mjs`.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("diff-view");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);

try {
	await open(app.page, "/components/diff-view");
	const page = app.page;

	// --- alignment ----------------------------------------------------------
	// The invariant, not a screenshot: within a row every cell starts at the
	// same y and is the same height, so a line number can never ride above or
	// below the code it numbers.
	const unified = await page.evaluate(() => {
		const view = document.querySelector("#unified .diff-view");
		return [...view.querySelectorAll("tr.line")].map((tr) => {
			const cells = [...tr.children].map((td) => {
				const r = td.getBoundingClientRect();
				const cs = getComputedStyle(td);
				return { top: r.top, height: r.height, size: cs.fontSize, lh: cs.lineHeight, family: cs.fontFamily };
			});
			return cells;
		});
	});
	t.ok("the unified view rendered its rows", unified.length > 5);
	t.ok(
		"every cell in a row shares one top edge",
		unified.every((cells) => cells.every((c) => Math.abs(c.top - cells[0].top) < 0.01))
	);
	t.ok(
		"every cell in a row shares one height",
		unified.every((cells) => cells.every((c) => Math.abs(c.height - cells[0].height) < 0.01))
	);
	t.ok(
		"numbers and code share a font, a size and a line-height",
		unified.every((cells) =>
			cells.every((c) => c.size === cells[0].size && c.lh === cells[0].lh && c.family === cells[0].family)
		)
	);
	// A row on a fractional height is how a gutter and its code end up half a
	// device pixel apart further down a long file.
	t.ok(
		"a row is a whole number of pixels tall",
		unified.every((cells) => Math.abs(cells[0].height - Math.round(cells[0].height)) < 0.01)
	);
	t.ok("every row is the same height", new Set(unified.map((c) => Math.round(c[0].height))).size === 1);

	// --- split: the two panes cannot drift ----------------------------------
	const split = await page.evaluate(() => {
		const view = document.querySelector("#split .diff-view");
		return [...view.querySelectorAll("tr.line")].map((tr) => {
			const [oldNum, oldCode, newNum, newCode] = [...tr.children].map((td) => td.getBoundingClientRect());
			return { oldNum: oldNum.top, oldCode: oldCode.top, newNum: newNum.top, newCode: newCode.top, h: oldCode.height, h2: newCode.height };
		});
	});
	t.ok("the split view rendered its rows", split.length > 5);
	t.ok(
		"the two panes agree on every row's top edge",
		split.every((r) => Math.abs(r.oldCode - r.newCode) < 0.01 && Math.abs(r.oldNum - r.newNum) < 0.01)
	);
	t.ok(
		"the two panes agree on every row's height",
		split.every((r) => Math.abs(r.h - r.h2) < 0.01)
	);
	t.ok(
		"a number sits on the same line as the code it numbers",
		split.every((r) => Math.abs(r.oldNum - r.oldCode) < 0.01)
	);

	// --- one scroller, so the panes cannot scroll apart ----------------------
	const scrollers = await page.evaluate(() => {
		const view = document.querySelector("#split .diff-view");
		return view.querySelectorAll(".scroller").length;
	});
	t.ok("split mode has exactly one horizontal scroller", scrollers === 1);

	// --- the sticky gutters -------------------------------------------------
	const sticky = await page.evaluate(async () => {
		const view = document.querySelector("#wrapping .diff-view");
		const scroller = view.querySelector(".scroller");
		const num = view.querySelector("td.num");
		const sign = view.querySelector("td.sign");
		const before = { num: num.getBoundingClientRect().left, sign: sign.getBoundingClientRect().left };
		scroller.scrollLeft = 300;
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		return {
			scrolled: scroller.scrollLeft,
			numMoved: Math.abs(num.getBoundingClientRect().left - before.num),
			signMoved: Math.abs(sign.getBoundingClientRect().left - before.sign)
		};
	});
	t.ok("a long line scrolls horizontally", sticky.scrolled > 100);
	t.ok("the number gutter holds its place", sticky.numMoved < 1);
	t.ok("the +/- gutter holds its place — it is the signal colour is not", sticky.signMoved < 1);

	// --- colour is not the only signal --------------------------------------
	const signals = await page.evaluate(() => {
		const view = document.querySelector("#unified .diff-view");
		const row = (type) => view.querySelector(`tr.line:has([data-type='${type}'])`);
		const text = (tr) => tr.querySelector(".visually-hidden")?.textContent.trim() ?? "";
		const bg = (tr) => getComputedStyle(tr.querySelector("td.code")).backgroundColor;
		const add = row("add");
		const remove = row("remove");
		const context = [...view.querySelectorAll("tr.line")].find((tr) => tr.querySelector("[data-type='context']"));
		return {
			addGlyph: add.querySelector("td.sign .glyph").textContent,
			removeGlyph: remove.querySelector("td.sign .glyph").textContent,
			addText: text(add),
			removeText: text(remove),
			contextText: text(context),
			addBg: bg(add),
			removeBg: bg(remove),
			contextBg: bg(context),
			hidden: getComputedStyle(add.querySelector(".visually-hidden")).position
		};
	});
	t.ok("an added line carries a + in the gutter", signals.addGlyph === "+");
	t.ok("a removed line carries a − in the gutter", signals.removeGlyph === "−");
	t.ok("a screen reader is told a line was added", /^Added line \d+:$/.test(signals.addText));
	t.ok("a screen reader is told a line was removed", /^Removed line \d+:$/.test(signals.removeText));
	t.ok("an unchanged line says so too", /^Unchanged line \d+:$/.test(signals.contextText));
	t.ok("that text is out of the layout but in the tree", signals.hidden === "absolute");
	t.ok(
		"the three line kinds are three different colours",
		new Set([signals.addBg, signals.removeBg, signals.contextBg]).size === 3
	);
	t.ok(
		"the tints resolve to a real colour in this theme",
		!/rgba\(0, 0, 0, 0\)/.test(signals.addBg) && !/rgba\(0, 0, 0, 0\)/.test(signals.removeBg)
	);

	// --- word runs ----------------------------------------------------------
	const words = await page.evaluate(() => {
		const paired = document.querySelector("#words .diff-view");
		const rewrite = document.querySelectorAll("#words .diff-view")[1];
		return {
			paired: paired.querySelectorAll(".seg.changed").length,
			rewrite: rewrite.querySelectorAll(".seg.changed").length,
			tinted: [...paired.querySelectorAll(".seg.changed")].every(
				(s) => getComputedStyle(s).backgroundColor !== getComputedStyle(s.closest("td")).backgroundColor
			)
		};
	});
	t.ok("paired lines get word runs", words.paired > 0);
	t.ok("the runs are tinted apart from the line they sit in", words.tinted);
	t.ok("a whole-line rewrite gets none", words.rewrite === 0);

	// --- expanding a fold ---------------------------------------------------
	const expander = page.locator("#collapse .diff-view .expand").first();
	t.ok("a folded region offers an expander", await expander.isVisible());
	t.ok("the expander says how much it hides", /Expand \d+ unchanged lines/.test(await expander.textContent()));
	t.ok("it is a real button in the tab order", (await expander.evaluate((b) => b.tagName)) === "BUTTON");
	t.ok("it reports its state", (await expander.getAttribute("aria-expanded")) === "false");

	const rowsBefore = await page.locator("#collapse .diff-view tr.line").count();
	const hidden = Number((await expander.textContent()).match(/\d+/)[0]);
	await expander.click();
	await page.waitForTimeout(100);
	const rowsAfter = await page.locator("#collapse .diff-view tr.line").count();
	t.ok("expanding reveals exactly the lines it promised", rowsAfter - rowsBefore === hidden);
	t.ok(
		"rows added by an expander line up like the rest",
		await page.evaluate(() => {
			const view = document.querySelector("#collapse .diff-view");
			return [...view.querySelectorAll("tr.line")].every((tr) => {
				const tops = [...tr.children].map((td) => td.getBoundingClientRect().top);
				return tops.every((y) => Math.abs(y - tops[0]) < 0.01);
			});
		})
	);

	// The expander is a row of exactly one line, so unfolding does not shift the
	// rhythm of the rows around it.
	const expanderHeight = await page.evaluate(() => {
		const view = document.querySelector("#collapse .diff-view");
		const gap = view.querySelector("tr.gap");
		const line = view.querySelector("tr.line");
		return gap ? gap.getBoundingClientRect().height - line.getBoundingClientRect().height : 0;
	});
	t.ok("a fold is exactly one line tall", Math.abs(expanderHeight) < 1.01);

	// --- switching modes keeps the alignment --------------------------------
	await page.locator("#modes button", { hasText: "Split" }).click();
	await page.waitForTimeout(100);
	t.ok(
		"the switched-to split view is aligned too",
		await page.evaluate(() => {
			const view = document.querySelector("#modes .diff-view");
			if (view.dataset.mode !== "split") return false;
			return [...view.querySelectorAll("tr.line")].every((tr) => {
				const tops = [...tr.children].map((td) => td.getBoundingClientRect().top);
				return tops.every((y) => Math.abs(y - tops[0]) < 0.01);
			});
		})
	);
} finally {
	await app.close();
}
t.done();
