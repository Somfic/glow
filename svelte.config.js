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
			// Don't fail the build on broken internal links / missing anchors —
			// surface them as warnings so they remain visible in CI output.
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		}
	}
};

export default config;
