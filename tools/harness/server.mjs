import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const TYPES = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".woff2": "font/woff2",
	".wasm": "application/wasm",
};

/**
 * Serve `build/` the way the deployed docs site is served.
 *
 * This differs from the same file in `paper`, and the difference is the whole
 * reason it is worth having: glow builds with `adapter-static` and
 * `fallback: '200.html'` (see svelte.config.js), so an unknown path is *not* a
 * 404 — it is the SPA shell with a 200, which the client router then resolves.
 * A harness that answered 404 there would fail on every route that isn't
 * prerendered.
 *
 * The `.html` candidate matters too: the adapter prerenders `/components` to
 * `build/components.html`, not `build/components/index.html`.
 *
 * Port 0 means the OS picks a free one, so several of these can run at once —
 * which is what makes a worktree per agent workable.
 */
export async function serve(root, port = 0) {
	const server = createServer(async (req, res) => {
		const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
		const candidates = [
			join(root, path),
			join(root, `${path}.html`),
			join(root, path, "index.html"),
		];
		for (const candidate of candidates) {
			try {
				const body = await readFile(candidate);
				res.writeHead(200, {
					"content-type": TYPES[extname(candidate)] ?? "application/octet-stream",
				});
				return res.end(body);
			} catch {}
		}
		// The SPA fallback, with a 200 — see the note above.
		try {
			const body = await readFile(join(root, "200.html"));
			res.writeHead(200, { "content-type": "text/html" });
			res.end(body);
		} catch {
			res.writeHead(404).end("not found");
		}
	});

	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", resolve);
	});

	const actual = server.address().port;
	return {
		port: actual,
		url: `http://localhost:${actual}`,
		close: () => new Promise((resolve) => server.close(resolve)),
	};
}
