// Node module hooks that replace every `.svelte` / `.svelte.js` module in
// `dist/` with a stub carrying the same export names, and every stylesheet a
// barrel imports for its side effect with an empty one, so `check-entries.mjs`
// can *link* the built barrels without a Svelte runtime or a Sass compiler.
//
// Linking is the point: node resolves every re-exported name at link time, so a
// barrel that re-exports a binding its target doesn't have fails here. Nothing
// is evaluated — a `.svelte.js` rune module is raw `$state` on disk and a
// component pulls in WebGL / shiki / hls.js, neither of which this is about.
//
// The stub mirrors the real file's export surface rather than inventing one, so
// a name the barrel gets wrong still fails: the stub is built from the target,
// not from the barrel's request.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STUBBED = /\.(?:svelte(?:\.[jt]s)?|s?css)$/;
const RUNE_MODULE = /\.svelte\.[jt]s$/;

/** Every top-level export name a module declares, types excluded. */
function exportNames(body) {
	const names = new Set();
	for (const m of body.matchAll(
		/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g
	))
		names.add(m[1]);
	for (const m of body.matchAll(/export\s*\{([^}]*)\}/g))
		for (const part of m[1].split(",")) {
			// `export { type IconName }` is erased by the transpile, so a stub that
			// declared it would be a syntax error rather than a fixture.
			if (/^\s*type\s/.test(part)) continue;
			const name = part.trim().split(/\s+as\s+/).pop().trim();
			if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
		}
	names.delete("default");
	return names;
}

export async function resolve(specifier, context, next) {
	if (!STUBBED.test(specifier)) return next(specifier, context);
	return { url: new URL(specifier, context.parentURL).href, format: "module", shortCircuit: true };
}

export async function load(url, context, next) {
	if (!STUBBED.test(url)) return next(url, context);

	let src = "";
	if (!url.endsWith("css")) {
		try {
			src = readFileSync(fileURLToPath(url), "utf8");
		} catch {
			// A missing file is itself a finding — let the empty stub make the
			// barrel's re-export fail rather than crashing the hook.
		}
	}

	const isComponent = url.endsWith(".svelte");
	// A component's `<script module>` block is the one place it exports anything
	// besides itself (`resolveIcon`, say); a rune module exports from its body.
	const body = isComponent
		? (src.match(/<script[^>]*\bmodule\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "")
		: RUNE_MODULE.test(url)
			? src
			: "";

	const lines = [...exportNames(body)].map((n) => `export const ${n} = undefined;`);
	// Only a component is guaranteed a default export; a rune module has one
	// only if it says so.
	if (isComponent || /export\s+default\b/.test(body)) lines.unshift("export default function stub() {}");

	return { format: "module", shortCircuit: true, source: lines.join("\n") };
}
