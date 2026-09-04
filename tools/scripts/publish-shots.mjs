// Put the PNGs somewhere a pull request body can point at, and print the
// markdown to paste into it.
//
//   node tools/scripts/publish-shots.mjs                 # everything in .shots
//   node tools/scripts/publish-shots.mjs --dir .shots/x  # somewhere else
//   node tools/scripts/publish-shots.mjs --dry-run       # print, upload nothing
//
// A PR body cannot reference a file on your branch and render it as an image,
// and committing screenshots puts binaries in the history of every branch that
// takes one. So they live as assets on one long-lived, non-code release —
// `media-assets` — which is the same arrangement `paper` uses.
//
// Asset names are prefixed with the branch, because several branches shooting
// the same component would otherwise overwrite each other's picture.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../glow/docs.mjs";

const TAG = "media-assets";
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const dirArg = argv.indexOf("--dir");
const dir = join(ROOT, dirArg === -1 ? ".shots" : argv[dirArg + 1]);

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8" }).trim();

if (!existsSync(dir)) {
	console.error(`nothing at ${dir} — run tools/scripts/shots.mjs first`);
	process.exit(1);
}

// GIFs as well as PNGs: a still cannot show an interaction, and
// tools/scripts/demo.mjs writes its recordings into the same directory.
const MEDIA = /\.(png|gif)$/;
const shots = readdirSync(dir).filter((f) => MEDIA.test(f)).sort();
if (!shots.length) {
	console.error(`no PNGs or GIFs in ${dir} — run tools/scripts/shots.mjs or demo.mjs first`);
	process.exit(1);
}

const repo = sh("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]).replace(/[^a-zA-Z0-9._-]/g, "-");

if (!dryRun) {
	// Create the release once, and treat "it already exists" as success: with
	// several worktrees running this at the same time, one of them loses the
	// race and that is fine.
	try {
		sh("gh", ["release", "view", TAG]);
	} catch {
		try {
			sh("gh", [
				"release", "create", TAG,
				"--title", "Media assets",
				"--notes", "Screenshots and GIFs linked from pull request bodies. Not a code release.",
				"--latest=false",
			]);
			console.log(`created release ${TAG}`);
		} catch (e) {
			sh("gh", ["release", "view", TAG]); // rethrows if it really isn't there
		}
	}
}

const lines = [];
for (const png of shots) {
	const asset = `${branch}-${png}`;
	const url = `https://github.com/${repo}/releases/download/${TAG}/${asset}`;
	if (!dryRun) {
		// `gh` names the asset after the file, so upload under a copy that
		// already has the branch prefix in its name.
		const staged = join(dir, asset);
		if (staged !== join(dir, png)) execFileSync("cp", [join(dir, png), staged]);
		sh("gh", ["release", "upload", TAG, staged, "--clobber"]);
		if (staged !== join(dir, png)) execFileSync("rm", [staged]);
	}
	const label = png.replace(MEDIA, "");
	lines.push(`![${label}](${url})`);
	console.log(`${dryRun ? "would upload" : "uploaded"}  ${asset}`);
}

console.log(`\n--- paste into the PR body ---\n`);
console.log(lines.join("\n"));
