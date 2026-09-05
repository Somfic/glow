// AnimatedText — the half of it a screenshot cannot show.
//
//   node tools/scripts/animated-text.test.mjs
//   node tools/scripts/animated-text.test.mjs --no-build
//
// A GIF shows that the words arrive. What it cannot show is that the string
// they arrive as is the string that was handed in: every check here is about
// the text being complete and correct, not about it looking nice.
//
// The first run asks for `reducedMotion: "no-preference"` — the harness's
// default freezes exactly the thing under test. The second turns the
// preference back on, because "shows everything at once" is a claim the
// component makes in JS and not a side effect of the duration tokens.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open } from "../glow/docs.mjs";

const build = !process.argv.includes("--no-build");
const ROUTE = "/components/animated-text";

/** What is painted (the units carrying `.on`) and what was handed in. */
const readState = (card) =>
	card.locator(".animated-text").first().evaluate((el) => ({
		painted: [...el.querySelectorAll(".unit.on")].map((u) => u.textContent).join(""),
		all: el.querySelector(".body").textContent,
		exposed: el.querySelector(".sr-only").textContent,
		carets: el.querySelectorAll(".caret").length,
		complete: el.dataset.complete === "true"
	}));

const t = checks("animated text");
const app = await launch({ build, cwd: ROOT, reducedMotion: "no-preference" });
t.watch(app.page);
const { page } = app;

try {
	await open(page, ROUTE);

	const reveal = page.locator("#reveal");
	await reveal.getByRole("button").click();
	await page.waitForTimeout(400);

	// Mid-flight: some of the text, and a prefix of it — a reveal that dropped
	// or reordered a unit would still be "some of the text".
	const mid = await readState(reveal);
	t.ok(
		`mid-reveal shows a prefix (${mid.painted.length}/${mid.all.length} chars)`,
		mid.painted.length > 0 && mid.painted.length < mid.all.length && mid.all.startsWith(mid.painted)
	);
	t.ok("a caret marks the head", mid.carets === 1);

	// Alignment, as an invariant rather than as a look: the caret is an empty
	// inline element, so its box IS the font box of the text around it and the
	// two have to report identical extents. An em-guessed height would land
	// fractions of a device pixel out and only show up when someone zooms.
	const caretBox = await reveal
		.locator(".animated-text")
		.first()
		.evaluate((el) => {
			const caret = el.querySelector(".caret").getBoundingClientRect();
			const units = [...el.querySelectorAll(".unit")];
			const prev = units[units.findIndex((u) => !u.classList.contains("on")) - 1];
			const glyph = prev.getBoundingClientRect();
			return { dTop: caret.top - glyph.top, dBottom: caret.bottom - glyph.bottom, dLeft: caret.left - glyph.right };
		});
	t.ok(
		`the caret sits on the text's own extents (${caretBox.dTop} / ${caretBox.dBottom} / ${caretBox.dLeft})`,
		caretBox.dTop === 0 && caretBox.dBottom === 0 && caretBox.dLeft === 0
	);

	await page.waitForTimeout(4000);
	const end = await readState(reveal);
	t.ok(`the whole text lands (${end.painted.length} chars)`, end.painted === end.all);
	t.ok("the caret goes when there is nothing left to reveal", end.carets === 0);

	// The fragments are one span per word, so a stray whitespace text node
	// between them would be a real space in the middle of the sentence — the
	// template is written on one unbroken line to prevent exactly that.
	t.ok("the fragments spell the source string", end.all === end.exposed);
	t.ok(
		"the fragments are hidden from assistive tech",
		(await reveal.locator(".animated-text .body").first().getAttribute("aria-hidden")) === "true"
	);
	// The accessible name of the whole thing, as a screen reader would compute
	// it: one string, not a pile of one-word nodes.
	const name = await reveal
		.locator(".animated-text")
		.first()
		.evaluate((el) =>
			[...el.children]
				.filter((c) => c.getAttribute("aria-hidden") !== "true")
				.map((c) => c.textContent)
				.join("")
		);
	t.ok(
		`the text reaches assistive tech exactly once (${name.length} chars)`,
		name === end.exposed
	);

	// No reflow: the box is sized against the whole string from the first
	// frame, so it may not change while the words land.
	const box = reveal.locator(".animated-text").first();
	await reveal.getByRole("button").click();
	await page.waitForTimeout(120);
	const early = await box.boundingBox();
	await page.waitForTimeout(700);
	const during = await box.boundingBox();
	await page.waitForTimeout(4000);
	const settled = await box.boundingBox();
	t.ok(
		`the box never moves (${early.height} / ${during.height} / ${settled.height})`,
		Math.abs(early.height - settled.height) < 0.6 &&
			Math.abs(during.height - settled.height) < 0.6 &&
			Math.abs(early.width - settled.width) < 0.6 &&
			Math.abs(early.y - settled.y) < 0.6
	);

	// The interruption case: `text` grows under a running reveal. Sample it all
	// the way through and check two invariants — what is painted is always a
	// prefix of the current string (nothing duplicated, nothing out of order),
	// and each sample still starts with the one before it (nothing dropped,
	// nothing rewound) for as long as the text is only appended to.
	//
	// Trailing whitespace is trimmed off both sides of that comparison on
	// purpose: a stream's last unit really does lose its trailing space the
	// moment a word lands after it, which changes nothing anyone can see.
	const stream = page.locator("#streaming");
	await stream.getByRole("button").click();
	let dropped = null;
	let notPrefix = null;
	let last = "";
	let longest = 0;
	let seen = 0;
	for (let i = 0; i < 40; i++) {
		await page.waitForTimeout(150);
		const s = await readState(stream);
		const painted = s.painted.replace(/\s+$/, "");
		if (!s.all.startsWith(s.painted)) notPrefix ??= `${s.painted.length} of ${s.all.length}`;
		if (!painted.startsWith(last)) dropped ??= `${last.length} → ${painted.length}`;
		last = painted;
		longest = Math.max(longest, painted.length);
		seen = s.all.length;
	}
	t.ok(
		`an interrupted reveal never duplicates or reorders (${longest} chars seen)`,
		notPrefix === null
	);
	t.ok(`an appended text never drops what was already revealed (${dropped ?? "held"})`, dropped === null);

	await page.waitForTimeout(3000);
	const streamed = await readState(stream);
	t.ok(
		`the grown text ends complete (${streamed.painted.length}/${seen})`,
		streamed.painted === streamed.all && streamed.complete
	);

	// Granularity has to change what a step is without changing the string:
	// `character` splits per grapheme, `line` per newline, and both have to
	// join back to the same source.
	const gran = page.locator("#granularity");
	for (const mode of ["character", "line", "word"]) {
		await gran.getByRole("button", { name: mode, exact: true }).click();
		await page.waitForTimeout(2500);
		const g = await readState(gran);
		t.ok(`granularity="${mode}" reveals the same string`, g.painted === g.exposed);
	}

	// Pausing has to stop the reveal where it stands rather than finish it.
	const play = page.locator("#playback");
	await play.scrollIntoViewIfNeeded();
	// This one loops, so it spends `loopDelay` sitting at nothing revealed:
	// pausing there would pass the check without proving anything.
	let paused = await readState(play);
	for (let i = 0; i < 60 && !(paused.painted.length > 0 && !paused.complete); i++) {
		await page.waitForTimeout(100);
		paused = await readState(play);
	}
	await play.getByRole("button", { name: /Pause/ }).click();
	paused = await readState(play);
	await page.waitForTimeout(900);
	const still = await readState(play);
	t.ok(
		`playing={false} holds in place (${paused.painted.length} → ${still.painted.length})`,
		paused.painted === still.painted
	);
	await play.getByRole("button", { name: /Play/ }).click();
	await page.waitForTimeout(900);
	const resumed = await readState(play);
	t.ok(
		`and resumes from there (${still.painted.length} → ${resumed.painted.length})`,
		resumed.painted.length > still.painted.length && resumed.all.startsWith(resumed.painted)
	);

	t.ok(
		"cursor={false} renders no caret at all",
		(await page.locator("#no-cursor .caret").count()) === 0
	);
} finally {
	await app.close();
}

const t2 = checks("animated text, reduced motion");
const reduced = await launch({ build: false, cwd: ROOT, reducedMotion: "reduce" });
t2.watch(reduced.page);

try {
	await open(reduced.page, ROUTE);
	const reveal = reduced.page.locator("#reveal");
	await reveal.getByRole("button").click();
	// Deliberately shorter than a single unit at the default 13 words a second:
	// anything still animating has not finished by here.
	await reduced.page.waitForTimeout(60);
	const s = await readState(reveal);
	t2.ok(`the whole text is there at once (${s.painted.length} chars)`, s.painted === s.all);
	// A blink collapsed to the 1ms duration token would be a strobe, which is
	// worse than the motion it was meant to suppress — so the caret is not
	// rendered under reduced motion at all.
	t2.ok("no caret to blink", (await reduced.page.locator(".caret").count()) === 0);
} finally {
	await reduced.close();
}

t.done();
t2.done();
