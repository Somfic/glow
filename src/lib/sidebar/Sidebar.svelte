<script lang="ts" module>
	import type { IconName } from '../icon/Icon.svelte';

	export type SidebarItem = {
		label: string;
		href: string;
		icon?: IconName;
		iconFilled?: boolean;
	};

	export type SidebarGroup = {
		label: string;
		items: SidebarItem[];
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import Icon from '../icon/Icon.svelte';
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
		open = false,
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
	<div class="sidebar-header">
		<span class="sidebar-title">
			{#if collapsed}
				✦
			{:else}
				✦ {title}
			{/if}
		</span>
		<button class="collapse-toggle" onclick={toggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
			<Icon name={collapsed ? 'ChevronsRight' : 'ChevronsLeft'} size={16} />
		</button>
	</div>
	<nav class="sidebar-nav">
		{#key collapsed}
			{#each topItems as item}
				<a href={item.href} class="sidebar-item" class:is-active={isActive(item.href)} onclick={() => handleItemClick(item.href)} use:tooltip={collapsed ? { content: item.label, position: 'right', useCursor: false } : { content: '' }}>
					{#if item.icon}<Icon name={item.icon} size={16} fill={item.iconFilled} />{/if}
					{#if !collapsed}<span class="sidebar-item-label">{item.label}</span>{/if}
				</a>
			{/each}

			{#each groups as group}
				<div class="sidebar-group">
					{#if !collapsed}
						<span class="sidebar-group-label">{group.label}</span>
					{:else}
						<div class="sidebar-group-divider"></div>
					{/if}
					{#each group.items as item}
						<a href={item.href} class="sidebar-item" class:is-active={isActive(item.href)} onclick={() => handleItemClick(item.href)} use:tooltip={collapsed ? { content: item.label, position: 'right', useCursor: false } : { content: '' }}>
							{#if item.icon}<Icon name={item.icon} size={16} fill={item.iconFilled} />{/if}
							{#if !collapsed}<span class="sidebar-item-label">{item.label}</span>{/if}
						</a>
					{/each}
				</div>
			{/each}
		{/key}
	</nav>
	{#if children && !collapsed}{@render children()}{/if}
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

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 240px;
		height: 100vh;
		background: $bg-surface;
		border-right: 1px solid $border-color;
		display: flex;
		flex-direction: column;
		z-index: 100;
		overflow-y: auto;
		transition: width 0.2s ease;

		&.collapsed {
			width: 56px;
		}

		@media (max-width: 768px) {
			transform: translateX(-100%);
			transition: transform 0.2s ease, width 0.2s ease;

			&.open {
				transform: translateX(0);
			}
		}
	}

	.sidebar-header {
		padding: 1.25rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-height: 56px;

		.collapsed & {
			padding: 1.25rem 0.5rem;
			justify-content: center;
			flex-direction: column;
			gap: 0.25rem;
		}
	}

	.sidebar-title {
		font-weight: 700;
		font-size: $text-lg;
		color: $fg;
		white-space: nowrap;
		overflow: hidden;

		.collapsed & {
			font-size: $text-base;
		}
	}

	.collapse-toggle {
		background: none;
		border: none;
		color: $text-muted;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.15s;

		&:hover {
			color: $fg;
		}

		@media (max-width: 768px) {
			display: none;
		}
	}

	.sidebar-nav {
		flex: 1;
		padding-bottom: 1rem;
	}

	.sidebar-group-label {
		display: block;
		text-transform: uppercase;
		font-size: $text-xs;
		color: $text-muted;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 1.5rem 1rem 0.5rem;
		white-space: nowrap;
		overflow: hidden;
	}

	.sidebar-group-divider {
		height: 1px;
		background: $border-color;
		margin: 0.75rem 0.75rem 0.5rem;
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		margin: 0 0.5rem;
		border-radius: 8px;
		font-size: $text-sm;
		color: $text-secondary;
		text-decoration: none;
		transition: all 0.15s;
		white-space: nowrap;
		overflow: hidden;

		.collapsed & {
			justify-content: center;
			padding: 0.5rem;
			margin: 0 0.25rem;
		}

		&:hover {
			background: rgba($fg, 0.03);
		}

		&.is-active {
			background: $secondary;
			color: $primary;
		}
	}

	.sidebar-item-label {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
