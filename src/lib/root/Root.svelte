<script lang="ts">
	// Root pulls in the stylesheet, so mounting it is all an app needs to do —
	// no separate `import 'glow/styles'` to remember, and no chance of the
	// tokens being missing while components that depend on them render.
	// Bundlers hoist CSS imports out of the module graph, so this lands in the
	// document once no matter where Root is mounted or how often.
	// Apps that want the tokens without Root can still import 'glow/styles'
	// directly; importing both is harmless.
	import '../style/glow.scss';
	import { onNavigate } from '$app/navigation';
	import { viewTransition } from '../util/viewTransition.js';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import ThemeProvider from '../style/ThemeProvider.svelte';
	import { theme as themeStore, type ThemeMode } from '../style/theme.svelte.js';
	import ToastContainer, { type ToastPosition } from '../toast/ToastContainer.svelte';
	import ConfirmDialog from '../confirm/ConfirmDialog.svelte';
	import CursorProvider from '../cursor/CursorProvider.svelte';

	type Density = 'compact' | 'default' | 'spacious';

	interface Props {
		/**
		 * `dark` or `light`. Omit to let Glow manage it: the shared store picks up
		 * a previously stored choice, else the OS `prefers-color-scheme`, and any
		 * theme switch in the tree (e.g. the sidebar's) can then flip it. Passing
		 * a value pins the theme and those switches stop having an effect.
		 */
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
		/**
		 * Crossfade between pages, keeping a `Page`'s sidebar still. On by
		 * default; `Page` can override it for one shell.
		 *
		 * Glow owns no router, so this cannot start a transition on its own —
		 * the app still hands `viewTransition` to its navigation hook
		 * (`onNavigate(viewTransition)` in SvelteKit). What this does own is
		 * everything else: which elements are named, what the animation looks
		 * like, and whether `viewTransition` agrees to run at all, so the two
		 * halves can never disagree.
		 */
		transitions?: boolean;
		/** Class on the wrapper. The wrapper is `display: contents`, so this is for hooks, not layout. */
		class?: string;
		children: Snippet;
	}

	let {
		theme,
		accent,
		tokens,
		density,
		toastPosition = 'top-right',
		cursor = false,
		transitions = true,
		class: className,
		children
	}: Props = $props();

	// A getter, not the value: a descendant reading this at init would otherwise
	// snapshot whatever `transitions` was at mount and never see it change.
	setContext('glow:transitions', () => transitions);

	onNavigate(viewTransition);

	// Also stamped on <html>, because `viewTransition` is called from the
	// router's navigation hook — outside any component, where context cannot
	// reach it. One attribute keeps the naming and the decision to animate from
	// drifting apart.
	$effect(() => {
		const root = document.documentElement;
		const previous = root.dataset.glowTransitions;
		root.dataset.glowTransitions = transitions ? 'on' : 'off';
		return () => {
			if (previous === undefined) delete root.dataset.glowTransitions;
			else root.dataset.glowTransitions = previous;
		};
	});

	const allTokens = $derived(accent ? { '--glow-primary': accent, ...tokens } : tokens);

	// Uncontrolled: adopt the stored/system preference, and let the store keep
	// stamping <html> so any theme switch in the tree works.
	// Controlled: claim <html> so the prop wins and switches become inert.
	$effect(() => {
		if (theme === undefined) {
			themeStore.hydrate();
			return;
		}
		return themeStore.claim();
	});


	// Tokens and density have to reach <html>, not just the wrapper below, for
	// two reasons:
	//   - Overlays that `use:portal` into <body> (Popover, Modal, Drawer,
	//     CommandPalette, tooltips) land outside the wrapper entirely.
	//   - The page canvas — `html, body` sit above it.
	//
	// `data-theme` is deliberately NOT set here when uncontrolled: the store
	// already owns that attribute, and having two writers meant the wrapper's
	// SSR value ('dark') shadowed a light <html> for the whole app tree.
	$effect(() => {
		const root = document.documentElement;
		const previousTheme = root.dataset.theme;
		const previousDensity = root.dataset.density;
		const applied = Object.entries(allTokens ?? {});

		if (theme !== undefined) root.dataset.theme = theme;
		if (density) root.dataset.density = density;
		for (const [key, value] of applied) root.style.setProperty(key, value);

		return () => {
			if (theme !== undefined) {
				if (previousTheme === undefined) delete root.dataset.theme;
				else root.dataset.theme = previousTheme;
			}

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
	<ConfirmDialog />
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
