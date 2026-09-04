// Screenshots of the docs, for a pull request.
//
//   node tools/scripts/shots.mjs                    # every route, both themes
//   node tools/scripts/shots.mjs tabs accordion     # only these routes
//   node tools/scripts/shots.mjs --cards tabs       # one shot per example card
//   node tools/scripts/shots.mjs --theme dark       # one theme instead of two
//   node tools/scripts/shots.mjs --motion           # don't freeze animation
//   node tools/scripts/shots.mjs --no-build         # use the build already there
//   node tools/scripts/shots.mjs --out .shots/mine  # somewhere else
//
// `--cards` is the mode to reach for in a PR: one tight, retina shot per
// documented example, named after the card's id, which is also how you diff a
// change to an existing component.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { ROOT, cards, open, routes, setTheme, shootCard, slug } from "../glow/docs.mjs";

/**
 * A flat parse. Flags that take a value have to consume the next token, or
 * `--theme dark` leaves `dark` looking like a route name and nothing matches.
 */
const VALUED = new Set(["--theme", "--out"]);
const argv = process.argv.slice(2);
const opts = { theme: null, out: ".shots" };
const flags = new Set();
const only = [];
for (let i = 0; i < argv.length; i++) {
	const arg = argv[i];
	if (VALUED.has(arg)) {
		opts[arg.slice(2)] = argv[++i];
	} else if (arg.startsWith("--")) {
		flags.add(arg.slice(2));
	} else {
		only.push(arg);
	}
}

const flag = (name) => flags.has(name);
const perCard = flag("cards");
const themes = opts.theme ? [opts.theme] : ["dark", "light"];
const out = join(ROOT, opts.out);

const all = routes({ examples: flag("examples") });
const wanted = only.length
	? all.filter((r) => only.some((o) => r === o || r.endsWith(`/${o}`)))
	: all;

if (!wanted.length) {
	console.error(`no routes matched ${only.join(", ")}\nknown:\n  ${all.join("\n  ")}`);
	process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const t = checks(`shots — ${wanted.length} route(s) × ${themes.length} theme(s)`);
const app = await launch({
	build: !flag("no-build"),
	cwd: ROOT,
	reducedMotion: flag("motion") ? "no-preference" : "reduce",
});
t.watch(app.page);

let written = 0;
try {
	for (const theme of themes) {
		await setTheme(app.page, theme);
		for (const route of wanted) {
			await open(app.page, route);
			const name = slug(route);
			if (perCard) {
				const found = await cards(app.page);
				if (!found.length) t.ok(`${name}: has example cards`, false);
				for (const card of found) {
					await shootCard(app.page, card.id, join(out, `${name}-${card.id}-${theme}.png`));
					written++;
				}
			} else {
				await app.page.screenshot({
					path: join(out, `${name}-${theme}.png`),
					fullPage: true,
				});
				written++;
			}
			t.ok(`${name} (${theme})`, true);
		}
	}
} finally {
	await app.close();
}

console.log(`\n${written} png → ${out}`);
t.done();
