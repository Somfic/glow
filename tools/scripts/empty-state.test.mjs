// The empty states that are *not* reachable from a docs page, plus the five
// hand-rolled ones that were folded into <EmptyState>.
//
//   node tools/scripts/empty-state.test.mjs
//   node tools/scripts/empty-state.test.mjs --no-build
//   node tools/scripts/empty-state.test.mjs --shoot     # + PNGs into .shots/
//
// Two halves, because the states live in two different places.
//
// Table's empty/loading rows and VirtualList's default empty body have no demo
// on the docs site — every table on /components/table has rows — so the first
// half compiles a throwaway Vite app that mounts them directly. That is what
// makes the colspan assertion possible at all: the bug only shows on a
// `variant="simple"` table that also has `selectable` set, which is a
// combination no page in the repo renders. The fixture is generated into a
// temp directory and deleted again, so nothing is added to the docs routes.
//
// The other four copies (NotificationCenter, CommandPalette, CommandPopover,
// MultiSelectInput) are reachable by driving the real docs pages, so the second
// half does that rather than mounting anything.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle, setTheme } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");
const shoot = process.argv.includes("--shoot");
const SHOTS = join(ROOT, ".shots");
const FIXTURE = join(ROOT, ".empty-state-fixture");

const t = checks("empty states");

if (shoot) mkdirSync(SHOTS, { recursive: true });

/** The trimmed text of a locator, or null if nothing matches it. */
async function textOf(locator) {
	return (await locator.count()) ? ((await locator.first().textContent()) ?? "").trim() : null;
}

/** A PNG of one fixture/docs element, named after what it shows. */
async function shotOf(page, locator, name) {
	if (!shoot) return;
	await locator.screenshot({ path: join(SHOTS, `empty-state-${name}.png`) });
}

// ── Half one: the states with no docs page ────────────────────────────────

function buildFixture() {
	rmSync(FIXTURE, { recursive: true, force: true });
	mkdirSync(FIXTURE, { recursive: true });

	writeFileSync(
		join(FIXTURE, "index.html"),
		`<!doctype html><html data-theme="dark"><head><meta charset="utf-8"></head>` +
			`<body style="margin:0;padding:24px;background:var(--glow-bg);">` +
			`<div id="app"></div><script type="module" src="/main.js"></script></body></html>\n`,
	);

	writeFileSync(
		join(FIXTURE, "vite.config.js"),
		`import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';\n` +
			`export default { base: './', plugins: [svelte({ preprocess: vitePreprocess() })] };\n`,
	);

	// Every case is one <Table>/<VirtualList> in a labelled box, so a check can
	// address it and a screenshot can be cropped to it.
	writeFileSync(
		join(FIXTURE, "main.js"),
		`import '../src/lib/style/glow.scss';
import { mount } from 'svelte';
import Table from '../src/lib/data/Table.svelte';
import VirtualList from '../src/lib/data/VirtualList.svelte';

const columns = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' }
];
const rowActions = [{ icon: 'Trash', label: 'Delete', onClick: () => {} }];
const rows = Array.from({ length: 150 }, (_, i) => ({
	id: i + 1,
	name: 'Row ' + (i + 1),
	email: 'row' + (i + 1) + '@example.com'
}));

const cases = {
	'simple-empty': [Table, { columns, data: [], selectable: 'multiple', variant: 'simple' }],
	'simple-loading': [Table, { columns, data: [], selectable: 'multiple', variant: 'simple', loading: true }],
	'simple-virtual': [Table, { columns, data: rows, selectable: 'multiple', variant: 'simple', virtual: true, virtualHeight: '160px' }],
	'default-empty': [Table, { columns, data: [], selectable: 'multiple', rowActions }],
	'vlist-empty': [VirtualList, { items: [], itemHeight: 48, height: '260px', renderItem: () => {} }]
};

const app = document.getElementById('app');
for (const [id, [Component, props]] of Object.entries(cases)) {
	const box = document.createElement('div');
	box.id = id;
	box.style.cssText = 'margin-bottom:24px;max-width:720px;';
	app.appendChild(box);
	mount(Component, { target: box, props });
}
`,
	);

	execFileSync(
		join(ROOT, "node_modules/.bin/vite"),
		["build", FIXTURE, "--config", join(FIXTURE, "vite.config.js"), "--logLevel", "error"],
		{ cwd: ROOT, stdio: "inherit" },
	);
}

buildFixture();

const fixture = await launch({ root: join(FIXTURE, "dist"), cwd: ROOT });
t.watch(fixture.page);

try {
	const page = fixture.page;
	await page.evaluate(() => document.fonts.ready);

	/**
	 * The number of columns the header actually renders — which is the number a
	 * full-width cell has to span. Reading it off the DOM rather than off the
	 * props is the whole point: `variant="simple"` drops the select and action
	 * columns, and the colspan has to drop with them.
	 */
	const headerCells = (id) =>
		page.locator(`#${id} thead tr > th`).count();
	const colSpan = (id, cls) =>
		page.locator(`#${id} td.${cls}`).first().evaluate((td) => td.colSpan);

	for (const [id, cls] of [
		["simple-empty", "table-empty"],
		["simple-loading", "table-loading"],
	]) {
		const cols = await headerCells(id);
		const span = await colSpan(id, cls);
		t.ok(`${id}: colspan ${span} spans the ${cols} rendered columns`, span === cols);
	}

	// The virtual row's host cell has no class of its own; it is the only <td>
	// in that table's body.
	{
		const cols = await headerCells("simple-virtual");
		const span = await page
			.locator("#simple-virtual tbody td")
			.first()
			.evaluate((td) => td.colSpan);
		t.ok(`simple-virtual: colspan ${span} spans the ${cols} rendered columns`, span === cols);
	}

	{
		const cols = await headerCells("default-empty");
		const span = await colSpan("default-empty", "table-empty");
		t.ok(
			`default-empty: colspan ${span} spans the ${cols} rendered columns`,
			span === cols,
		);
	}

	// ── The migration itself ──
	t.ok(
		"Table's default empty state is an <EmptyState>",
		(await page.locator("#default-empty td.table-empty .empty-state").count()) === 1,
	);
	t.ok(
		"...at the compact size, so it still fits a table cell",
		(await page.locator("#default-empty td.table-empty .empty-state.size-compact").count()) === 1,
	);
	t.ok(
		"...saying what it always said",
		(await textOf(page.locator("#default-empty td.table-empty .es-title"))) ===
			"No data available",
	);

	t.ok(
		"VirtualList's default empty state is an <EmptyState>",
		(await page.locator("#vlist-empty .empty-state").count()) === 1,
	);
	t.ok(
		"...at the default size, whose 200px floor is the one it used to set itself",
		(await page.locator("#vlist-empty .empty-state.size-default").count()) === 1,
	);
	t.ok(
		"...saying what it always said",
		(await textOf(page.locator("#vlist-empty .es-title"))) === "No items to display",
	);

	for (const theme of ["dark", "light"]) {
		await page.evaluate((m) => (document.documentElement.dataset.theme = m), theme);
		await settle(page, { hideCursor: false });
		await shotOf(page, page.locator("#default-empty"), `table-${theme}`);
		await shotOf(page, page.locator("#vlist-empty"), `virtual-list-${theme}`);
	}
} finally {
	await fixture.close();
	rmSync(FIXTURE, { recursive: true, force: true });
}

// ── Half two: the four copies that a docs page can reach ──────────────────

const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

try {
	// NotificationCenter — the Drawer opens empty on a fresh load.
	await open(page, "/components/notification-center");
	await page.getByRole("button", { name: "Open panel" }).first().click();
	await page.locator(".drawer-card .empty-state, .drawer-card .nc-empty").first().waitFor();
	t.ok(
		"NotificationCenter's empty inbox is an <EmptyState>",
		(await page.locator(".drawer-card .empty-state").count()) === 1,
	);
	t.ok(
		"...keeping the pulsing triplet as its illustration",
		(await page.locator(".drawer-card .empty-state .es-mark span").count()) === 3,
	);
	t.ok(
		"...and its second line",
		(await page.locator(".drawer-card .empty-state .es-description").count()) === 1,
	);
	// The mark's own reduced-motion guard has to survive being handed to
	// EmptyState as a snippet: a 1ms `--glow-dur-*` collapse would strobe the
	// three dots rather than stop them, so the guard drops the loop outright.
	// `launch()` runs with prefers-reduced-motion: reduce.
	t.ok(
		"...with the triplet's reduced-motion guard still in force",
		(await page
			.locator(".drawer-card .empty-state .es-mark span")
			.first()
			.evaluate((el) => getComputedStyle(el).animationName)) === "none",
	);
	// ...and the other half of that pair, on a page that did *not* ask for
	// reduced motion — without this the check above passes just as happily when
	// the animation went missing altogether.
	{
		const lively = await app.open({ reducedMotion: "no-preference" });
		try {
			await open(lively, "/components/notification-center");
			await lively.getByRole("button", { name: "Open panel" }).first().click();
			const dot = lively.locator(".drawer-card .empty-state .es-mark span").first();
			await dot.waitFor();
			// Svelte scopes @keyframes names, so this is `svelte-<hash>-nc-pulse`.
			const name = await dot.evaluate((el) => getComputedStyle(el).animationName);
			t.ok(
				`...and the triplet does pulse when motion is allowed (${name})`,
				name.endsWith("nc-pulse"),
			);
		} finally {
			await lively.close();
		}
	}

	if (shoot) {
		for (const theme of ["dark", "light"]) {
			await setTheme(page, theme);
			await page.getByRole("button", { name: "Open panel" }).first().click();
			await page.locator(".drawer-card .empty-state, .drawer-card .nc-empty").first().waitFor();
			await settle(page);
			await shotOf(page, page.locator(".drawer-card").first(), `notification-center-${theme}`);
		}
		// setTheme() persists, so put it back before the shots that follow.
		await setTheme(page, "dark");
	}

	// CommandPalette — a query that matches nothing.
	await open(page, "/components/command-palette");
	await page.getByRole("button", { name: "Open Palette" }).first().click();
	const cpInput = page.locator(".cp-panel input.cp-input").first();
	await cpInput.waitFor();
	await cpInput.fill("zzzzqqq");
	await page.locator(".cp-panel .empty-state, .cp-panel .cp-empty").first().waitFor();
	t.ok(
		"CommandPalette's no-match line is an <EmptyState>",
		(await page.locator(".cp-panel .empty-state.size-compact").count()) === 1,
	);
	await settle(page);
	await shotOf(page, page.locator(".cp-panel").first(), "command-palette-dark");
	await page.keyboard.press("Escape");

	// CommandPopover — same, from a slash token in the host's own input.
	await open(page, "/components/command-popover");
	await page.locator("input.demo-input").first().click();
	await page.keyboard.type("/zzzzqqq");
	await page.locator(".cpp .empty-state, .cpp .cpp-empty").first().waitFor();
	t.ok(
		"CommandPopover's no-match line is an <EmptyState>",
		(await page.locator(".cpp .empty-state.size-compact").count()) === 1,
	);
	await settle(page);
	await shotOf(page, page.locator(".cpp").first(), "command-popover-dark");

	// MultiSelectInput — a filter that matches nothing.
	await open(page, "/components/inputs");
	const trigger = page.locator('.card[id="multiselect-input"] .multiselect-trigger').first();
	await trigger.scrollIntoViewIfNeeded();
	await trigger.click();
	const search = page.locator(".multiselect-dropdown .search-input").first();
	await search.waitFor();
	await search.fill("zzzzqqq");
	await page.locator(".multiselect-dropdown .empty-state, .multiselect-dropdown .no-results").first().waitFor();
	t.ok(
		"MultiSelectInput's no-results line is an <EmptyState>",
		(await page.locator(".multiselect-dropdown .empty-state.size-compact").count()) === 1,
	);
	await settle(page);
	await shotOf(page, page.locator(".multiselect-dropdown").first(), "multi-select-dark");
} finally {
	await app.close();
}

t.done();
