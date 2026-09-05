<script lang="ts">
	import type { NavItem } from './Navigation.svelte';
	import type { SidebarItem, SidebarGroup } from '../sidebar/Sidebar.svelte';
	import Navigation from './Navigation.svelte';
	import Sidebar from '../sidebar/Sidebar.svelte';

	type SidebarConfig = {
		title?: string;
		topItems?: SidebarItem[];
		groups?: SidebarGroup[];
		/** Show a light/dark switch at the bottom of the rail. */
		themeToggle?: boolean;
	};

	type Layout = 'contained' | 'full' | 'bare';

	type Props = {
		title: string;
		navItems?: NavItem[];
		/** Layout mode: 'contained' (centered, padded), 'full' (full-width, padded), 'bare' (no shell, fills viewport — for app-style layouts). */
		layout?: Layout;
		/** @deprecated Use `layout` instead. 'normal' maps to 'contained'. */
		size?: 'normal' | 'full';
		sidebarConfig?: SidebarConfig;
		children?: () => any;
	};

	let { title, navItems, layout, size, sidebarConfig, children }: Props = $props();

	const effectiveLayout: Layout = $derived(
		layout ?? (size === 'full' ? 'full' : 'contained')
	);

	let sidebarOpen = $state(false);
	let sidebarCollapsed = $state(false);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

{#if effectiveLayout === 'bare'}
	<div class="page bare">
		{@render children?.()}
	</div>
{:else if sidebarConfig}
	<div class="page-surround" aria-hidden="true"></div>
	<Sidebar
		title={sidebarConfig.title}
		topItems={sidebarConfig.topItems}
		groups={sidebarConfig.groups}
		themeToggle={sidebarConfig.themeToggle}
		open={sidebarOpen}
		bind:collapsed={sidebarCollapsed}
		onclose={() => (sidebarOpen = false)}
	/>
	<div class="page sidebar-mode {effectiveLayout}" class:sidebar-collapsed={sidebarCollapsed}>
		<button class="mobile-menu-toggle" onclick={() => (sidebarOpen = !sidebarOpen)}>
			☰
		</button>
		<div class="content">
			<article>
				{@render children?.()}
			</article>
		</div>
	</div>
{:else}
	<div class={`page ${effectiveLayout}`}>
		<div class="header">
			<div class="navigation">
				<div class="left"><div class="title">{title}</div></div>
				<div class="center">
					<Navigation navItems={navItems ?? []} />
				</div>
				<div class="right"></div>
			</div>
		</div>
		<div class="content">
			<article>
				{@render children?.()}
			</article>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	// `bare` is its own thing: pins to the viewport and lets children own
	// their own scroll regions. Used for full-bleed app shells.
	.page.bare {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;

		& > :global(*) {
			flex: 1 1 auto;
			min-height: 0;
		}
	}

	// Standard page — relies on document scroll. No internal overflow tricks,
	// so the browser scrollbar sits at the viewport's right edge regardless of
	// sidebar width or zoom level.
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-width: 0;

		// Beside a sidebar the page becomes a recessed panel. The ground behind
		// it is painted in the sidebar's own colour (see .page-surround), so the
		// rail and the gutter read as one continuous shell with the content
		// sunk into it.
		//
		// Flush on the left — the panel meets the rail directly — and inset on
		// the other three sides. The left corners still round, which works
		// because the notch they open reveals the sidebar's colour, the same
		// colour as the rest of the ground.
		//
		// The fill is the canvas colour, so cards inside keep exactly the
		// surface-on-canvas contrast they have on a page with no sidebar.
		&.sidebar-mode {
			--page-gutter: 0.5rem;
			--page-rail: 240px;

			margin: var(--page-gutter) var(--page-gutter) var(--page-gutter) 0;
			margin-left: var(--page-rail);
			background: var(--glow-bg-base);
			border: 1px solid var(--glow-border-color);
			border-radius: $radius;
			// No drop shadow: the panel is sunk below the shell, not raised
			// above it, and the fill step plus the hairline carry the edge.
			transition: margin-left 0.2s ease;

			// Pinned to the viewport and scrolled internally, so the scrollbar
			// lands inside the rounded panel instead of at the viewport edge.
			// This is the one place the "no internal overflow" note above does
			// not hold: the panel has a visible edge, and a document scrollbar
			// riding outside it breaks the enclosure.
			height: calc(100vh - var(--page-gutter) * 2);
			height: calc(100dvh - var(--page-gutter) * 2);
			min-height: 0;
			// The panel itself is the scroller, not .content — .content is
			// max-width-capped and centred, so scrolling it would park the
			// scrollbar in the middle of the panel instead of on its edge.
			// overflow-x stays hidden so the radius still clips.
			overflow: hidden auto;
			// Keeps a scroll-anchored heading clear of the rounded top edge.
			scroll-padding-top: $space-lg;

			&.sidebar-collapsed {
				--page-rail: 56px;
			}

			// The rail goes off-canvas below this width, so there is nothing to
			// sit beside — drop back to full bleed and to document scroll,
			// which is what mobile browser chrome expects.
			@media (max-width: 768px) {
				margin: 0;
				height: auto;
				min-height: 100vh;
				overflow: visible;
				border: none;
				border-radius: 0;
			}
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: $space-sm $space-lg;

			.navigation {
				display: flex;
				align-items: center;
				justify-content: space-between;
				background-color: var(--glow-bg-surface);
				border-radius: 100px;
				padding: $space-sm $space-lg;
				width: 100%;
				max-width: 1200px;
				margin: 1rem auto;
			}
		}

		.content {
			width: 100%;
			min-width: 0;
			flex: 1 1 auto;
			padding: 2rem clamp(1rem, 4vw, 3rem);

			// The article inside .content sets vertical rhythm.
			> :global(article) {
				display: flex;
				flex-direction: column;
				min-width: 0;
			}
		}

		// `contained` (default for non-sidebar pages) — cap and centre.
		// Sidebar pages are full-width within the sidebar offset so they
		// adapt to viewport width; opt back in to a cap with `layout="contained"`.
		&.contained:not(.sidebar-mode) .content {
			max-width: 1200px;
			margin: 0 auto;
		}

		&.contained.sidebar-mode .content {
			max-width: 1200px;
			margin: 0 auto;
		}

		// `full` — content fills the available width (viewport minus sidebar).
		&.full .content {
			max-width: none;
		}
	}

	// Paints the shell behind the rail and the gutter. A fixed, negative-z
	// layer rather than a rule on <body>, because Page's stylesheet is loaded
	// for every route that uses Page — including the ones with no sidebar,
	// which must keep the plain canvas.
	.page-surround {
		position: fixed;
		inset: 0;
		z-index: -1;
		background: var(--glow-bg-surface);
		pointer-events: none;

		@media (max-width: 768px) {
			display: none;
		}
	}

	.mobile-menu-toggle {
		display: none;
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 98;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		color: var(--glow-fg);
		width: 40px;
		height: 40px;
		border-radius: $radius-md;
		font-size: 1.25rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;

		@media (max-width: 768px) {
			display: flex;
		}
	}
</style>
