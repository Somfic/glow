<script lang="ts">
	import type { Snippet } from 'svelte';
	import ThemeProvider, { type ThemeMode } from '../style/ThemeProvider.svelte';
	import ToastContainer, { type ToastPosition } from '../toast/ToastContainer.svelte';
	import CursorProvider from '../cursor/CursorProvider.svelte';

	type Density = 'compact' | 'default' | 'spacious';

	interface Props {
		/** `dark` (default) or `light`. */
		theme?: ThemeMode;
		/**
		 * Accent colour — shorthand for the `--glow-primary` seed. Hovers, actives,
		 * soft tints and `--glow-secondary` all derive from it, so this one value
		 * retunes the palette.
		 */
		accent?: string;
		/**
		 * Further `--glow-*` seed overrides, e.g. `{ '--glow-bg-base': '#000' }`.
		 * Merged after `accent`, so an explicit `--glow-primary` here wins.
		 */
		tokens?: Record<string, string>;
		/** Vertical rhythm for Field/Section. Sets `data-density`. */
		density?: Density;
		/** Where toasts stack. */
		toastPosition?: ToastPosition;
		/** Mount the custom cursor. Off by default — it replaces the native one. */
		cursor?: boolean;
		/** Class on the wrapper. The wrapper is `display: contents`, so this is for hooks, not layout. */
		class?: string;
		children: Snippet;
	}

	let {
		theme = 'dark',
		accent,
		tokens,
		density,
		toastPosition = 'top-right',
		cursor = false,
		class: className,
		children
	}: Props = $props();

	const allTokens = $derived(accent ? { '--glow-primary': accent, ...tokens } : tokens);

	// The wrapper below themes everything rendered in the component tree, and does
	// so during SSR. It cannot reach two things:
	//   - Overlays that `use:portal` into <body> (Popover, Modal, Drawer,
	//     CommandPalette, tooltips) land outside the wrapper entirely.
	//   - The page canvas — `html, body` sit above it.
	// So mirror the same theme onto <html>. Portals only exist after mount, and
	// the canvas keeps its stylesheet default until then, so nothing flashes.
	$effect(() => {
		const root = document.documentElement;
		const previousTheme = root.dataset.theme;
		const previousDensity = root.dataset.density;
		const applied = Object.entries(allTokens ?? {});

		root.dataset.theme = theme;
		if (density) root.dataset.density = density;
		for (const [key, value] of applied) root.style.setProperty(key, value);

		return () => {
			if (previousTheme === undefined) delete root.dataset.theme;
			else root.dataset.theme = previousTheme;

			if (density) {
				if (previousDensity === undefined) delete root.dataset.density;
				else root.dataset.density = previousDensity;
			}

			for (const [key] of applied) root.style.removeProperty(key);
		};
	});
</script>

<ThemeProvider {theme} tokens={allTokens} class={className}>
	<div class="glow-root" data-density={density}>
		{@render children()}
	</div>
	<ToastContainer position={toastPosition} />
	{#if cursor}
		<CursorProvider />
	{/if}
</ThemeProvider>

<style>
	/* Layout-neutral: Root is a theming/singleton host, not a box. */
	.glow-root {
		display: contents;
	}
</style>
