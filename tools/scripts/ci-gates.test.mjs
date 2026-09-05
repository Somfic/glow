// `bun run build` is the only gate CI has, and it used to pass on two things it
// should not. This asserts both holes stay shut. It needs no browser and no
// build of the docs site, so it is cheap enough to run on every change.
//
//   node tools/scripts/ci-gates.test.mjs
//
// (1) Prerender. `handleHttpError: 'warn'` treated "this link 404s" and "this
//     route threw while rendering" as the same thing. The second means the page
//     is silently absent from `build/` and the build still exits 0 — proven by
//     adding a route that throws: the build wrote 82 pages, not the sabotaged
//     one, and exited 0. The handler now throws on 5xx and warns on the rest.
//
// (2) Entry points. `svelte-package` transpiles `forms.ts` / `data-display.ts` /
//     `layout.ts` file by file, so a barrel that does not link still ships. A
//     merge on PR #22 left `data-display.ts` with an orphaned `export { … }`
//     member list; the emitted `dist/data-display.js` had a duplicate export and
//     an export of a binding that does not exist, and the build was green.
//     `check-entries.mjs`, now part of `npm run package`, links every entry.
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checks } from "../harness/check.mjs";

const root = resolve(fileURLToPath(import.meta.url), "../../..");
const t = checks("ci gates");

// ---- (1) the prerender handler, called directly ------------------------
const { default: config } = await import(new URL("../../svelte.config.js", import.meta.url));
const handle = config.kit?.prerender?.handleHttpError;

t.ok("handleHttpError is a handler, not the blanket 'warn'", typeof handle === "function");

if (typeof handle === "function") {
	const call = (status) => {
		try {
			handle({ status, path: "/probe", referrer: "/", referenceType: "linked", message: `${status} /probe` });
			return null;
		} catch (err) {
			return err;
		}
	};
	// A route that throws during prerender surfaces as a 500 on its own entry.
	// That page does not reach `build/`, so it must fail the build.
	t.ok("a 500 during prerender throws", call(500) instanceof Error);
	// A broken internal link stays visible without failing the build — that was
	// the original intent of 'warn' and it is still worth keeping.
	t.ok("a 404 link does not throw", call(404) === null);
	t.ok("a 403 link does not throw", call(403) === null);
}

// ---- (2) the entry-point link check, against a sabotaged copy ----------
const entryCheck = join(root, "tools/scripts/check-entries.mjs");
const run = (dist) => spawnSync(process.execPath, [entryCheck, dist], { cwd: root, encoding: "utf8" });

const dist = join(root, "dist");
let real;
try {
	real = run(dist);
} catch {
	real = null;
}

if (!real || /not in /.test(real.stderr ?? "")) {
	t.ok("dist/ is packaged — run `npm run package` first", false);
} else {
	t.ok(`the real dist/ links (${real.status === 0 ? "exit 0" : real.stderr.trim()})`, real.status === 0);

	// Reproduce the PR #22 shape: a barrel left with an orphaned member list.
	// The transpile turns it into `export { Sparkline, SparklineProps, };` —
	// a duplicate export plus a binding that does not exist.
	const tmp = mkdtempSync(join(tmpdir(), "glow-entries-"));
	try {
		cpSync(dist, tmp, { recursive: true });
		const barrel = join(tmp, "data-display.js");
		writeFileSync(barrel, readFileSync(barrel, "utf8") + "\nexport { Sparkline, SparklineProps, };\n");
		const broken = run(tmp);
		t.ok("a barrel that does not link fails the check", broken.status !== 0);
		t.ok(
			"…and says why",
			/Duplicate export|does not provide an export/.test(`${broken.stdout}${broken.stderr}`)
		);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

t.done();
