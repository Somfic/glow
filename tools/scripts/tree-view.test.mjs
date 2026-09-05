// TreeView's keyboard model and its indent guides, neither of which is visible
// from the markup.
//
//   node tools/scripts/tree-view.test.mjs
//   node tools/scripts/tree-view.test.mjs --no-build
//
// The one that is worth a script rather than a reviewer's eye is Down/Up: they
// have to walk the *visible* nodes, which means stepping out of a folder onto
// whatever comes after it. A tree that walks siblings instead passes every unit
// test and is wrong the moment a folder has a last child. The guide alignment
// is measured off the real geometry — a chevron's centre against the gradient
// stop it is supposed to share — rather than eyeballed in a screenshot.

import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const noBuild = process.argv.includes("--no-build");

const t = checks("tree view");
const app = await launch({ build: !noBuild, cwd: ROOT });
t.watch(app.page);
const { page } = app;

const tree = (card) => page.locator(`.card[id="${card}"] [role="tree"]`).first();

/** The visible nodes of a tree, in the order a person sees them. */
const visible = (card) =>
	tree(card).evaluate((el) =>
		[...el.querySelectorAll('[role="treeitem"]')].map((n) => n.dataset.treeId),
	);

const focused = () => page.evaluate(() => document.activeElement?.dataset?.treeId ?? null);

const attr = (card, id, name) =>
	tree(card).locator(`[data-tree-id="${id}"]`).first().getAttribute(name);

try {
	await open(page, "/components/tree-view");
	await settle(page);

	// ── Collapsed subtrees are not in the DOM ──
	const start = await visible("files");
	t.ok("a collapsed folder renders none of its children", !start.includes("favicon"));
	t.ok("an expanded folder renders its children", start.includes("TreeView.svelte"));

	// ── Expand / collapse ──
	await tree("files").locator('[data-tree-id="static"] .twisty').first().click();
	await page.waitForTimeout(150);
	t.ok("clicking the twisty expands", (await visible("files")).includes("favicon"));
	t.ok("aria-expanded follows", (await attr("files", "static", "aria-expanded")) === "true");
	t.ok(
		"the twisty does not also select",
		(await attr("files", "static", "aria-selected")) === "false",
	);

	await tree("files").locator('[data-tree-id="static"] .twisty').first().click();
	await page.waitForTimeout(150);
	t.ok("clicking it again collapses", !(await visible("files")).includes("favicon"));
	t.ok("and unmounts the children", (await attr("files", "static", "aria-expanded")) === "false");

	// ── One tab stop ──
	const tabbable = await tree("files").evaluate(
		(el) => [...el.querySelectorAll('[role="treeitem"]')].filter((n) => n.tabIndex === 0).length,
	);
	t.ok("exactly one treeitem is tabbable", tabbable === 1);

	await tree("files").locator('[data-tree-id="src"]').first().focus();
	t.ok(
		"focusing a node moves the tab stop to it",
		(await attr("files", "src", "tabindex")) === "0",
	);
	await page.keyboard.press("Tab");
	t.ok(
		"Tab leaves the tree rather than walking it",
		await page.evaluate(() => {
			const owner = document.activeElement?.closest('[role="tree"]');
			return owner !== document.querySelector('.card[id="files"] [role="tree"]');
		}),
	);

	// ── Down walks the visible nodes, across parent boundaries ──
	// index.ts is the last child of lib; routes is lib's next sibling. A tree
	// that moved between siblings would have nowhere to go from index.ts.
	await tree("files").locator('[data-tree-id="index.ts"]').first().focus();
	await page.keyboard.press("ArrowDown");
	t.ok("Down leaves a folder for the next visible node", (await focused()) === "routes");
	await page.keyboard.press("ArrowUp");
	t.ok("Up comes back into the folder it came from", (await focused()) === "index.ts");

	const order = await visible("files");
	await tree("files").locator(`[data-tree-id="${order[0]}"]`).first().focus();
	let walked = [order[0]];
	for (let i = 1; i < order.length; i++) {
		await page.keyboard.press("ArrowDown");
		walked.push(await focused());
	}
	t.ok("Down visits every visible node exactly once, in order", walked.join() === order.join());
	await page.keyboard.press("ArrowDown");
	t.ok("Down stops at the last node", (await focused()) === order[order.length - 1]);

	// ── Home / End ──
	await page.keyboard.press("Home");
	t.ok("Home goes to the first visible node", (await focused()) === order[0]);
	await page.keyboard.press("End");
	t.ok("End goes to the last one", (await focused()) === order[order.length - 1]);

	// ── Right expands then descends; Left collapses then ascends ──
	await tree("files").locator('[data-tree-id="static"]').first().focus();
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(150);
	t.ok("Right on a closed node expands it", (await attr("files", "static", "aria-expanded")) === "true");
	t.ok("...and stays put", (await focused()) === "static");

	await page.keyboard.press("ArrowRight");
	t.ok("Right on an open node descends to the first child", (await focused()) === "favicon");
	await page.keyboard.press("ArrowLeft");
	t.ok("Left on a leaf ascends to the parent — a round trip", (await focused()) === "static");
	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(150);
	t.ok("Left on an open node collapses it", (await attr("files", "static", "aria-expanded")) === "false");
	t.ok("...and still stays put", (await focused()) === "static");

	// Collapsing an ancestor of the focused node must not drop focus on the floor.
	await tree("files").locator('[data-tree-id="types.ts"]').first().focus();
	await tree("files").locator('[data-tree-id="src"] .twisty').first().click();
	await page.waitForTimeout(200);
	t.ok("collapsing an ancestor moves focus up to it", (await focused()) === "src");
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(200);

	// ── Selection ──
	await tree("files").locator('[data-tree-id="index.ts"] .label').first().click();
	await page.waitForTimeout(100);
	t.ok("clicking a row selects it", (await attr("files", "index.ts", "aria-selected")) === "true");
	t.ok(
		"single-select deselects the previous one",
		(await attr("files", "types.ts", "aria-selected")) === "false",
	);
	t.ok(
		"and it is reported out of the component",
		(await page.locator('.card[id="files"] .pill').first().textContent())?.trim() === "index.ts",
	);

	const multi = tree("selection");
	await multi.locator('[data-tree-id="index.ts"] .label').first().click();
	await multi.locator('[data-tree-id="types.ts"] .label').first().click({ modifiers: ["ControlOrMeta"] });
	await page.waitForTimeout(100);
	const chosen = await multi.evaluate(
		(el) => [...el.querySelectorAll('[aria-selected="true"]')].map((n) => n.dataset.treeId),
	);
	t.ok("ctrl-click adds to the selection in multiple mode", chosen.length === 2);
	t.ok(
		"the count is reported",
		(await page.locator('.card[id="selection"]').getByText("2 selected").count()) === 1,
	);
	t.ok(
		"aria-multiselectable is set only on the multi-select tree",
		(await multi.getAttribute("aria-multiselectable")) === "true" &&
			(await tree("files").getAttribute("aria-multiselectable")) === null,
	);

	// ── Disabled nodes ──
	await tree("files").locator('[data-tree-id="node_modules"] .label').first().click();
	await page.waitForTimeout(100);
	t.ok(
		"a disabled node is not selectable",
		(await attr("files", "node_modules", "aria-selected")) === "false",
	);

	// ── aria-level tracks the real depth ──
	t.ok("aria-level is 1 at the root", (await attr("guides", "src", "aria-level")) === "1");
	t.ok("...and counts down the tree", (await attr("guides", "types.ts", "aria-level")) === "4");
	t.ok(
		"a subtree is wrapped in role=group",
		(await tree("guides").locator('[data-tree-id="src"] > [role="group"]').count()) === 1,
	);

	// ── The indent guides line up with the chevrons ──
	//
	// Measured, not eyeballed. The guides are a repeating gradient on the row
	// whose period is the indent and whose line sits at half of it; a chevron
	// sits at the centre of a twisty box that is exactly one indent wide. So the
	// invariant is: guide k of a deep row is at the same x as the chevron of the
	// ancestor at level k, for every k, and every one of those x's is a whole
	// number of device pixels at DPR 2.
	const geometry = await tree("guides").evaluate((el) => {
		const rows = ["src", "lib", "tree-view", "types.ts"].map((id) => {
			const item = el.querySelector(`[data-tree-id="${id}"]`);
			const row = item.querySelector(".tree-row");
			const twisty = row.querySelector(".twisty");
			const cs = getComputedStyle(row);
			const rowBox = row.getBoundingClientRect();
			const tBox = twisty.getBoundingClientRect();
			return {
				id,
				level: Number(item.getAttribute("aria-level")),
				// x of the chevron's centre, relative to the row's left edge.
				chevron: tBox.x + tBox.width / 2 - rowBox.x,
				padLeft: parseFloat(cs.paddingLeft),
				guideStart: parseFloat(cs.backgroundPositionX),
				guideWidth: parseFloat(cs.backgroundSize),
			};
		});
		return { rows, indent: parseFloat(getComputedStyle(el).getPropertyValue("--glow-tree-indent")) };
	});

	const { rows, indent } = geometry;
	const deepest = rows[rows.length - 1];
	// Guide k (0-based) is drawn at guideStart + (k + 0.5) * indent.
	const guides = Array.from(
		{ length: Math.round(deepest.guideWidth / indent) },
		(_, k) => deepest.guideStart + (k + 0.5) * indent,
	);
	t.ok(
		`one guide per ancestor level (${guides.length} for level ${deepest.level})`,
		guides.length === deepest.level - 1,
	);
	const misaligned = rows
		.slice(0, -1)
		.filter((r, k) => Math.abs(guides[k] - r.chevron) > 0.001)
		.map((r) => r.id);
	t.ok(
		`every guide sits on its ancestor's chevron (${guides.map((g) => g.toFixed(2)).join(", ")} vs ${rows
			.slice(0, -1)
			.map((r) => r.chevron.toFixed(2))
			.join(", ")})`,
		misaligned.length === 0,
	);
	const dpr = await page.evaluate(() => devicePixelRatio);
	t.ok(
		`no guide lands on a fractional device pixel (dpr ${dpr})`,
		guides.every((g) => Math.abs(g * dpr - Math.round(g * dpr)) < 0.001),
	);
	t.ok(
		"each level is exactly one indent further in than the last",
		rows.every((r, i) => i === 0 || Math.abs(r.chevron - rows[i - 1].chevron - indent) < 0.001),
	);

	// ── Controlled expansion ──
	await page.locator('.card[id="controlled"]').getByRole("button", { name: "Collapse all" }).click();
	await page.waitForTimeout(150);
	t.ok("an outside control can collapse everything", (await visible("controlled")).length === 4);
	await page.locator('.card[id="controlled"]').getByRole("button", { name: "Expand all" }).click();
	await page.waitForTimeout(150);
	const all = await visible("controlled");
	t.ok("...and expand everything", all.includes("types.ts") && all.includes("favicon"));
	t.ok(
		"the bound array is what the tree is reading",
		(await page.locator('.card[id="controlled"] code').last().textContent())?.includes("tree-view"),
	);
} finally {
	await app.close();
}

t.done();
