// The docs pages' code samples say what they mean.
//
//   node tools/scripts/docs-code-samples.test.mjs [--no-build]
//
// A code sample containing a literal `</script>` closes the *component's*
// script block, because `vitePreprocess()` finds script blocks with a regex
// rather than from the AST. svelte-check then gives up and parses the whole
// `.svelte` file as raw TypeScript, which is why the docs pages contributed
// ~740 phantom errors and were never actually type-checked.
//
// Escaping it as `<\/script>` inside the template literal fixes the parse. In
// JavaScript `\/` is just `/`, so the rendered text is unchanged — and that is
// exactly the claim worth pinning, because a stray backslash reaching the page
// would be an invisible regression in every sample that shows a Svelte file.

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, open, routes, settle } from "../glow/docs.mjs";

const t = checks("docs code samples");

// Source-level first: no sample may carry an unescaped closing script tag, or
// the file it lives in silently stops being type-checked.
const pages = globSync("src/routes/**/*.svelte", { cwd: ROOT }).sort();
const offenders = [];
for (const rel of pages) {
	const src = readFileSync(`${ROOT}/${rel}`, "utf8");
	for (const m of src.matchAll(/<\/script>/g)) {
		// An odd number of unescaped backticks before it means we are inside a
		// template literal, i.e. this is sample text, not a real script block.
		const ticks = (src.slice(0, m.index).match(/(?<!\\)`/g) ?? []).length;
		if (ticks % 2 === 1) offenders.push(`${rel}@${m.index}`);
	}
}
t.ok(`no unescaped </script> inside a code sample — ${pages.length} pages`, offenders.length === 0);
if (offenders.length) console.log("   ", offenders.slice(0, 10).join("\n    "));

const app = await launch({ build: !process.argv.includes("--no-build"), cwd: ROOT });
t.watch(app.page);

try {
	// Then the rendered side: the escape must not reach the page.
	const withScript = [];
	let leaked = [];
	let sampled = 0;
	for (const route of routes()) {
		await open(app.page, route);
		await settle(app.page);
		const found = await app.page.evaluate(() =>
			[...document.querySelectorAll("pre, code")].map((el) => el.textContent ?? "")
		);
		sampled += found.length;
		for (const text of found) {
			if (text.includes(String.raw`<\/script>`)) leaked.push(route);
			if (text.includes("</script>")) withScript.push(route);
		}
	}

	t.ok(`no sample renders a stray backslash — ${sampled} blocks across ${routes().length} routes`,
		leaked.length === 0);
	if (leaked.length) console.log("   ", [...new Set(leaked)].join(", "));

	// The negative above is only worth something if samples containing a closing
	// script tag exist at all — otherwise it passes on a page of empty strings.
	t.ok(`samples still render </script> — ${new Set(withScript).size} routes do`,
		new Set(withScript).size > 10);
} finally {
	await app.close();
}

t.done();
