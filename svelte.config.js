import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html',
			precompress: false,
			strict: true
		}),
		prerender: {
			// A broken internal link and a page that *failed to render* are not the
			// same severity, and 'warn' lumped them together. A 404 is worth keeping
			// visible without failing the build; a 5xx means the route threw, so it
			// is silently absent from `build/` afterwards — and `bun run build` is
			// the only gate CI has, so a warning there ships a missing page.
			handleHttpError: (details) => {
				if (details.status >= 500) throw new Error(details.message);
				console.warn(details.message);
			},
			// Missing anchors stay a warning: they are content drift, not a
			// page that failed to exist.
			handleMissingId: 'warn'
		}
	}
};

export default config;
