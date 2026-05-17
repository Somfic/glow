<script lang="ts" module>
	import { type IconProp } from '../icon/Icon.svelte';

	export type SidebarItem = {
		label: string;
		href: string;
		icon?: IconProp;
	};

	export type SidebarGroup = {
		label: string;
		items: SidebarItem[];
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import { tooltip } from '../tooltip/tooltip.svelte.js';

	type Props = {
		title?: string;
		topItems?: SidebarItem[];
		groups?: SidebarGroup[];
		children?: Snippet;
		open?: boolean;
		collapsed?: boolean;
		onclose?: () => void;
		oncollapse?: (collapsed: boolean) => void;
	};

	let {
		title = '',
		topItems = [],
		groups = [],
		children,
		open = $bindable(false),
		collapsed = $bindable(false),
		onclose,
		oncollapse
	}: Props = $props();

	let activePath = $state('');

	function updatePath() {
		activePath = window.location.pathname;
	}

	onMount(() => {
		updatePath();
		// Track SvelteKit client-side navigations via URL changes
		const observer = new MutationObserver(() => {
			if (activePath !== window.location.pathname) {
				updatePath();
			}
		});
		observer.observe(document.querySelector('head > title') || document.head, {
			childList: true,
			subtree: true,
			characterData: true
		});
		window.addEventListener('popstate', updatePath);
		return () => {
			observer.disconnect();
			window.removeEventListener('popstate', updatePath);
		};
	});

	function isActive(href: string): boolean {
		if (href === '/') return activePath === '/';
		return activePath === href || activePath.startsWith(href + '/');
	}

	function handleItemClick(href: string) {
		// Eagerly update the active path for instant feedback
		activePath = href;
		onclose?.();
	}

	function toggleCollapse() {
		collapsed = !collapsed;
		oncollapse?.(collapsed);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sidebar-overlay" onclick={onclose} onkeydown={onclose}></div>
{/if}

<aside class="sidebar" class:open class:collapsed>
	<!--
		Layout principle: icon columns stay pinned. Item padding-left, margin,
		and the header logo all sit at the same x in both states. Only the
		labels' width and opacity transition. This keeps icons stable so the
		expand/collapse motion is just "a band on the right slides in/out."
	-->
	<div class="sidebar-header">
		<span class="sidebar-logo" aria-hidden="true">✦</span>
		<span class="sidebar-title">{title}</span>
		<button class="collapse-toggle" onclick={toggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
			<Icon name={collapsed ? 'ChevronsRight' : 'ChevronsLeft'} size={16} />
		</button>
	</div>
	<nav class="sidebar-nav">
		{#each topItems as item}
			<a href={item.href} class="sidebar-item" class:is-active={isActive(item.href)} onclick={() => handleItemClick(item.href)} use:tooltip={collapsed ? { content: item.label, position: 'right', useCursor: false } : { content: '' }}>
				{#if item.icon}<Icon {...resolveIcon(item.icon)} size={resolveIcon(item.icon).size ?? 16} />{/if}
				<span class="sidebar-item-label">{item.label}</span>
			</a>
		{/each}

		{#each groups as group}
			<div class="sidebar-group">
				<!-- The label and divider both render; CSS swaps which is visible
				     based on collapsed state, so neither has a layout-shift jump. -->
				<span class="sidebar-group-label">{group.label}</span>
				<div class="sidebar-group-divider"></div>
				{#each group.items as item}
					<a href={item.href} class="sidebar-item" class:is-active={isActive(item.href)} onclick={() => handleItemClick(item.href)} use:tooltip={collapsed ? { content: item.label, position: 'right', useCursor: false } : { content: '' }}>
						{#if item.icon}<Icon {...resolveIcon(item.icon)} size={resolveIcon(item.icon).size ?? 16} />{/if}
						<span class="sidebar-item-label">{item.label}</span>
					</a>
				{/each}
			</div>
		{/each}
	</nav>
	{#if children}<div class="sidebar-children">{@render children()}</div>{/if}
</aside>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.sidebar-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 99;

		@media (max-width: 768px) {
			display: block;
		}
	}

	$expanded-width: 240px;
	$collapsed-width: 56px;
	// Icon column starts here from the sidebar's left edge. Stays constant
	// across both states so icons never shift horizontally.
	$icon-x: 1.25rem;
	$transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: $expanded-width;
		height: 100vh;
		background: var(--glow-bg-surface);
		border-right: 1px solid var(--glow-border-color);
		display: flex;
		flex-direction: column;
		z-index: 100;
		overflow-x: hidden;
		overflow-y: auto;
		transition: width $transition;

		// Hide the scrollbar — scrolling still works via wheel/trackpad/touch.
		// Visible scrollbars in a narrow rail look noisy and reserve width
		// that breaks the icon-column alignment.
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}

		&.collapsed {
			width: $collapsed-width;
		}

		@media (max-width: 768px) {
			transform: translateX(-100%);
			transition: transform $transition, width $transition;

			&.open {
				transform: translateX(0);
			}
		}
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		// Padding-left aligns the logo with the item icons below.
		padding: 1.25rem 0.875rem 1.25rem $icon-x;
		min-height: 56px;
		transition: padding $transition, gap $transition;

		.collapsed & {
			// Symmetric horizontal padding so the toggle (the only visible
			// thing left) lands in the centre of the 56px-wide rail.
			// (56 - 28 toggle) / 2 = 14px = 0.875rem.
			padding-left: 0.875rem;
			// Collapse the inter-item gap too — otherwise the residual gap
			// between the (zero-width) title and the toggle pushes the toggle
			// off-centre.
			gap: 0;
		}
	}

	.sidebar-logo {
		font-size: $text-lg;
		font-weight: $weight-bold;
		color: var(--glow-fg);
		flex-shrink: 0;
		// Sized like the item icons (16px) so column alignment is exact.
		width: 16px;
		text-align: center;
		line-height: 1;
		opacity: 1;
		transition: opacity $transition, width $transition;

		.collapsed & {
			opacity: 0;
			width: 0;
		}
	}

	.sidebar-title {
		flex: 1;
		min-width: 0;
		font-weight: $weight-bold;
		font-size: $text-lg;
		color: var(--glow-fg);
		white-space: nowrap;
		overflow: hidden;
		opacity: 1;
		transition: opacity $transition;

		.collapsed & {
			opacity: 0;
		}
	}

	.collapse-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		background: none;
		border: 0;
		border-radius: 6px;
		color: var(--glow-text-muted);
		cursor: pointer;
		transition: color 0.15s, background-color 0.15s;

		&:hover {
			color: var(--glow-fg);
			background: var(--glow-fg-soft);
		}

		@media (max-width: 768px) {
			display: none;
		}
	}

	.sidebar-nav {
		flex: 1;
		padding-bottom: 1rem;
	}

	.sidebar-children {
		padding: 0 1rem 1rem;
		opacity: 1;
		transition: opacity $transition;

		.collapsed & {
			opacity: 0;
			pointer-events: none;
		}
	}

	.sidebar-group {
		position: relative;
	}

	// Label fades out & loses height; divider fades in & gains height. Both
	// always rendered so neither requires a DOM rebuild.
	.sidebar-group-label {
		display: block;
		text-transform: uppercase;
		font-size: $text-xs;
		color: var(--glow-text-muted);
		font-weight: $weight-bold;
		letter-spacing: 0.05em;
		padding: 1.5rem 1rem 0.5rem $icon-x;
		white-space: nowrap;
		overflow: hidden;
		opacity: 1;
		max-height: 3rem;
		transition: opacity $transition, max-height $transition, padding-top $transition, padding-bottom $transition;

		.collapsed & {
			opacity: 0;
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
		}
	}

	.sidebar-group-divider {
		height: 1px;
		background: var(--glow-border-color);
		margin: 0 0.75rem;
		opacity: 0;
		max-height: 0;
		transition: opacity $transition, max-height $transition, margin-top $transition, margin-bottom $transition;

		.collapsed & {
			opacity: 1;
			max-height: 1px;
			margin-top: 0.75rem;
			margin-bottom: 0.5rem;
		}
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		// Margin + padding split so the icon's absolute x is the same as
		// `$icon-x` (margin 0.5rem + padding 0.75rem = 1.25rem) while the
		// hover/active pill sits inset from the sidebar edges.
		padding: 0.5rem 0.75rem;
		margin: 0 0.5rem;
		border-radius: 8px;
		font-size: $text-sm;
		color: var(--glow-text-secondary);
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		transition: background-color 0.15s, color 0.15s;

		&:hover {
			background: var(--glow-fg-soft);
		}

		&.is-active {
			color: var(--glow-primary);
			background: var(--glow-primary-soft);
		}
	}

	.sidebar-item-label {
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 1;
		max-width: 200px;
		transition: opacity $transition, max-width $transition, margin-left $transition;

		.collapsed & {
			opacity: 0;
			max-width: 0;
			// Pull leftward so the gap collapses cleanly without leaving an empty cell.
			margin-left: -0.5rem;
		}
	}
</style>
