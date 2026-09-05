// The published package has four entry points, and `svelte-package` copies the
// three secondary ones (`forms.ts`, `data-display.ts`, `layout.ts`) through a
// per-file transpile that neither links nor type-checks them. A merge once left
// `data-display.ts` with an orphaned `export { … }` member list; the transpile
// happily emitted `export { Sparkline, SparklineProps, };` — a duplicate export
// of `Sparkline` and an export of a binding that does not exist — and
// `bun run build`, which is CI's only gate, exited 0. So the broken barrel was
// publishable.
//
// This closes that: after packaging, import every entry from `dist/` so node
// parses and links it. Components are stubbed (see `entry-stub-hooks.mjs`) —
// what is under test is the barrel, not the runtime.
//
//   node tools/scripts/check-entries.mjs [dist-dir]
import { register } from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const ENTRIES = ["index.js", "forms.js", "data-display.js", "layout.js"];

const dist = resolvePath(process.argv[2] ?? "dist");
register(new URL("./entry-stub-hooks.mjs", import.meta.url));

let failed = 0;
for (const entry of ENTRIES) {
	const file = resolvePath(dist, entry);
	if (!existsSync(file)) {
		console.error(`  ✗ ${entry} — not in ${dist}; run \`npm run package\` first`);
		failed++;
		continue;
	}
	try {
		const mod = await import(pathToFileURL(file).href);
		console.log(`  ✓ ${entry} — ${Object.keys(mod).length} exports link`);
	} catch (err) {
		console.error(`  ✗ ${entry} — ${err.message}`);
		failed++;
	}
}

if (failed) {
	console.error(`\nentry points: ${failed} of ${ENTRIES.length} do not link`);
	process.exit(1);
}
console.log(`\nentry points: all ${ENTRIES.length} link`);
