<script lang="ts">
	import type { NavItem } from './Navigation.svelte';
	import type { SidebarItem, SidebarGroup } from '../sidebar/Sidebar.svelte';
	import Navigation from './Navigation.svelte';
	import Sidebar from '../sidebar/Sidebar.svelte';

	type SidebarConfig = {
		title?: string;
		topItems?: SidebarItem[];
		groups?: SidebarGroup[];
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
	<Sidebar
		title={sidebarConfig.title}
		topItems={sidebarConfig.topItems}
		groups={sidebarConfig.groups}
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

		&.sidebar-mode {
			margin-left: 240px;
			transition: margin-left 0.2s ease;

			&.sidebar-collapsed {
				margin-left: 56px;
			}

			@media (max-width: 768px) {
				margin-left: 0;

				&.sidebar-collapsed {
					margin-left: 0;
				}
			}
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 1.5rem;

			.navigation {
				display: flex;
				align-items: center;
				justify-content: space-between;
				background-color: var(--glow-bg-surface);
				border-radius: 100px;
				padding: 0.5rem 1.5rem;
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
		border-radius: 8px;
		font-size: 1.25rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;

		@media (max-width: 768px) {
			display: flex;
		}
	}
</style>
