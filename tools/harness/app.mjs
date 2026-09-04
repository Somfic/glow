import { join } from "node:path";
import { chromium } from "playwright-core";
import { devServer, existing, staticSite } from "./site.mjs";

/** `vite build` alone, not `bun run build` — see the note on `build` below. */
export const BUILD_DOCS = "bunx vite build";

/**
 * Get the docs site onto a port and open it in Chrome.
 *
 * `playwright-core` and the browser you already have, rather than `playwright`
 * and a downloaded one: the full package's postinstall pulls a few hundred
 * megabytes of browser binaries, which every `bun install` and every CI run
 * would then pay for to support a script that only runs on a laptop.
 *
 * Always `await app.close()` in a `finally` — a leaked Chrome holds the port
 * and the next run will not tell you why it is hanging.
 */
export async function launch({
	// one of these three decides where the site comes from
	url,
	dev,
	root,
	/**
	 * `true` for `vite build`, or a command of your own.
	 *
	 * Deliberately not `bun run build`: that is `vite build && npm run package`,
	 * and the `svelte-package` half writes `dist/` for consumers. It roughly
	 * doubles the wait and nothing in here ever reads it.
	 */
	build,
	cwd = process.cwd(),
	viewport = { width: 1280, height: 900 },
	/**
	 * Screenshots default to frozen motion. `global.scss` collapses every
	 * `--glow-dur-*` to 1ms under `prefers-reduced-motion`, and `Glow.svelte`
	 * parks its shader loop, so this one flag makes almost the whole library
	 * hold still — which is what makes two runs of `shots.mjs` comparable.
	 * Pass `reducedMotion: "no-preference"` when the motion *is* the subject.
	 */
	reducedMotion = "reduce",
	/** 2 gives retina-sharp PNGs, which is what you want in a pull request. */
	deviceScaleFactor = 2,
	quiet = false,
	...rest
} = {}) {
	const site = url
		? existing(url)
		: dev
			? await devServer(dev === true ? "bun run dev" : dev, { cwd })
			: await staticSite({
					root: root ?? join(cwd, "build"),
					build: build === true ? BUILD_DOCS : build,
					cwd,
					quiet,
				});

	const browser = await chromium.launch({ channel: "chrome" });
	const context = await browser.newContext({
		viewport,
		reducedMotion,
		deviceScaleFactor,
		...rest,
	});
	const page = await context.newPage();
	await page.goto(site.url);

	return {
		page,
		context,
		browser,
		url: site.url,
		/** Open a second page in the same browser (a narrow viewport, say). */
		async open(options = {}) {
			const ctx = await browser.newContext({
				viewport,
				reducedMotion,
				deviceScaleFactor,
				...options,
			});
			const p = await ctx.newPage();
			await p.goto(site.url);
			return p;
		},
		async close() {
			await browser.close().catch(() => {});
			await site.close();
		},
	};
}
