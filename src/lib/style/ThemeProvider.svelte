<script lang="ts" module>
	// Canonical definition lives beside the shared store in ./theme.svelte.ts.
	// Re-exported here so existing
	// `import { type ThemeMode } from '.../ThemeProvider.svelte'` keeps working.
	export type { ThemeMode } from './theme.svelte.js';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/**
		 * `dark` or `light`. Stamps `data-theme` on the wrapper div, which is what
		 * re-runs the token recipes for this subtree.
		 *
		 * Omit it to inherit the surrounding theme and only apply `tokens`. That
		 * matters: a wrapper that always stamps a concrete value would shadow an
		 * ancestor's theme, so a subtree that just wants a different accent would
		 * be pinned to dark for ever.
		 */
		theme?: ThemeMode;
		/**
		 * Inline `--glow-*` overrides on the wrapper div. Useful for accent
		 * theming a subtree without changing the global theme:
		 * `<ThemeProvider tokens={{ '--glow-primary': '#1db954' }}>`.
		 */
		tokens?: Record<string, string>;
		/** Optional class on the wrapper div. */
		class?: string;
		children: Snippet;
	}

	let { theme, tokens, class: className, children }: Props = $props();

	const styleString = $derived(
		tokens
			? Object.entries(tokens)
					.map(([k, v]) => `${k}: ${v}`)
					.join('; ')
			: undefined
	);
</script>

<div data-theme={theme} class={className} style={styleString}>
	{@render children()}
</div>

<style>
	div {
		display: contents;
	}
</style>
