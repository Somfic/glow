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

	.page.bare {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;

		// Children fill remaining height — apps lay out their own scroll regions.
		& > :global(*) {
			flex: 1 1 auto;
			min-height: 0;
		}
	}

	.page {
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;

		&.sidebar-mode {
			margin-left: 240px;
			min-height: 100vh;
			align-items: stretch;
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
			padding: 0.5rem 2rem;
			width: 100%;
			max-width: 1400px;

			.navigation {
				display: flex;
				align-items: center;
				justify-content: space-between;
				background-color: var(--glow-bg-surface);
				border-radius: 100px;
				padding: 0.5rem 2rem;
				width: 100%;
				max-width: 1200px;
				margin: 1rem;
			}
		}

		.header,
		.content {
			@media only screen and (max-width: 600px) {
				padding: 0 0.5rem;
			}

			@media only screen and (min-width: 600px) {
				padding: 0 2rem;
			}

			@media only screen and (min-width: 768px) {
				padding: 0 3rem;
			}

			@media only screen and (min-width: 768px) {
				padding: 0 4rem;
			}

			@media only screen and (min-width: 1200px) {
				padding: 0 5rem;
			}
		}

		&.sidebar-mode .content {
			display: flex;
			flex-direction: column;
			width: 100%;
			max-width: 1111px;
			margin: 0 auto;
			padding: 2rem 3rem;

			@media only screen and (max-width: 600px) {
				padding: 1rem;
			}
		}

		&.normal .content {
			display: flex;
			flex-direction: column;
			width: 100%;
			max-width: 1111px;
		}

		&.full .content {
			width: 100%;
		}
	}

	.mobile-menu-toggle {
		display: none;
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 98;
		background: var(--glow-bg-surface);
		border: 1px solid $border-color;
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
