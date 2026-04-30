<script lang="ts" module>
	export type ThemeMode = 'dark' | 'light';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** `dark` (default) or `light`. Sets `data-theme` on the wrapper div. */
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

	let { theme = 'dark', tokens, class: className, children }: Props = $props();

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
