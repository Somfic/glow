// Record a component's interaction as a GIF, for a pull request body.
//
//   node tools/scripts/demo.mjs accordion              # → .shots/accordion-dark.gif
//   node tools/scripts/demo.mjs accordion --theme light
//   node tools/scripts/demo.mjs accordion --no-build
//
// A still cannot show an interaction. Anything whose point is what happens when
// you click, hover, drag or wait wants one of these next to its screenshots;
// `publish-shots.mjs` uploads the GIFs alongside the PNGs.
//
// The demo itself lives in `tools/demos/<name>.mjs`, one file per component, so
// that parallel branches each add a file rather than all editing one. It looks
// like:
//
//   export const route = "/components/accordion";
//   export default async function demo({ r, at, page }) {
//     await r.say("Opening a panel");
//     await r.click(...(await at("#basic button")));
//     await r.shot(6);
//   }
//
// Unlike `shots.mjs` this runs with motion ON — the animation is usually the
// thing being demonstrated, so freezing it would defeat the purpose.

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, recorder } from "../harness/index.mjs";
import { ROOT, open, settle } from "../glow/docs.mjs";

const argv = process.argv.slice(2);
const VALUED = new Set(["--theme", "--out", "--fps", "--width"]);
let name;
const opt = { theme: "dark", out: ".shots", fps: "11", width: "900" };
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (VALUED.has(a)) opt[a.slice(2)] = argv[++i];
	else if (a === "--no-build") opt.noBuild = true;
	else if (!a.startsWith("--")) name = a;
}

if (!name) {
	console.error("usage: node tools/scripts/demo.mjs <name> [--theme light] [--no-build]");
	process.exit(1);
}

const file = join(ROOT, "tools/demos", `${name}.mjs`);
if (!existsSync(file)) {
	console.error(`no demo at tools/demos/${name}.mjs — write one, see the header of this file`);
	process.exit(1);
}

const mod = await import(pathToFileURL(file).href);
if (typeof mod.default !== "function") throw new Error(`${name}.mjs has no default export`);
if (!mod.route) throw new Error(`${name}.mjs does not export a \`route\``);

const outDir = join(ROOT, opt.out);
mkdirSync(outDir, { recursive: true });

const { page, close } = await launch({
	// No `root`: launch() defaults it to the built site under `cwd`. Passing the
	// repo root instead serves the repo, and every route 404s.
	build: !opt.noBuild,
	cwd: ROOT,
	// The motion IS the subject here, unlike shots.mjs.
	reducedMotion: "no-preference",
	// 1 rather than 2: a retina GIF is four times the bytes for a format that
	// is already the wrong tool for detail, and GitHub will scale it down anyway.
	deviceScaleFactor: 1,
});

try {
	await open(page, mod.route, { theme: opt.theme });
	await settle(page);

	const r = await recorder(page, { dir: join(ROOT, ".frames") });

	/** Centre of the first match, as [x, y] — feed it straight to r.click/point. */
	const at = async (selector) => {
		const box = await page.locator(selector).first().boundingBox();
		if (!box) throw new Error(`nothing to point at: ${selector}`);
		return [box.x + box.width / 2, box.y + box.height / 2];
	};

	await mod.default({ page, r, at, theme: opt.theme });

	if (!r.frames) throw new Error("the demo took no frames — call r.shot()");
	const out = join(outDir, `${name}-${opt.theme}.gif`);
	r.gif(out, { fps: Number(opt.fps), width: Number(opt.width) });
	console.log(`${out}  (${r.frames} frames)`);
} finally {
	await close();
}
