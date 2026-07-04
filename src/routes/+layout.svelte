<script lang="ts">
	import '$lib/style/glow.scss';
	import { page } from '$app/state';
	import Page from '$lib/page/Page.svelte';
	import ToastContainer from '$lib/toast/ToastContainer.svelte';
	import type { SidebarItem, SidebarGroup } from '$lib/sidebar/Sidebar.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();

	// Examples that render their own full-bleed shell — they want viewport
	// lock + no sidebar. Other examples (e.g. /examples/github) reuse the
	// docs shell and just style their content area.
	const bareRoutes = ['/examples/linear', '/examples/spotify', '/examples/spark', '/examples/steam'];
	const isBareExample = $derived(
		bareRoutes.some((r) => page.url.pathname.startsWith(r))
	);

	const sidebarConfig: { title: string; topItems: SidebarItem[]; groups: SidebarGroup[] } = {
		title: 'Glow UI',
		topItems: [
			{ label: 'Home', href: '/', icon: 'House' },
			{ label: 'Components', href: '/components', icon: 'LayoutGrid' }
		],
		groups: [
			{
				label: 'Form & Input',
				items: [
					{ label: 'Button', href: '/components/buttons', icon: 'MousePointerClick' },
					{ label: 'Input', href: '/components/inputs', icon: 'TextCursorInput' },
					{ label: 'File Upload', href: '/components/file-upload', icon: 'CloudUpload' }
				]
			},
			{
				label: 'Data Display',
				items: [
					{ label: 'Table', href: '/components/table', icon: 'Table' },
					{ label: 'Data', href: '/components/data', icon: 'ClipboardList' },
					{ label: 'Card', href: '/components/card', icon: 'Square' },
					{ label: 'Pill', href: '/components/pill', icon: 'Tag' },
					{ label: 'Avatar', href: '/components/avatar', icon: 'CircleUser' },
					{ label: 'Media', href: '/components/media', icon: 'Image' }
				]
			},
			{
				label: 'Navigation',
				items: [
					{ label: 'Tabs', href: '/components/tabs', icon: 'PanelTop' },
					{ label: 'Split', href: '/components/split', icon: 'Columns2' },
					{ label: 'Sortable', href: '/components/sortable', icon: 'GripVertical' },
					{ label: 'Tier List', href: '/components/tierlist', icon: 'Rows3' },
					{ label: 'Table of Contents', href: '/components/toc', icon: 'BookOpen' },
					{ label: 'Dropdown Menu', href: '/components/dropdown', icon: 'ChevronDown' },
					{ label: 'Context Menu', href: '/components/context-menu', icon: 'MousePointer' }
				]
			},
			{
				label: 'Feedback',
				items: [
					{ label: 'Modal', href: '/components/modal', icon: 'MessageSquare' },
				{ label: 'Command Palette', href: '/components/command-palette', icon: 'Command' },
					{ label: 'Command Popover', href: '/components/command-popover', icon: 'TextCursor' },
					{ label: 'Drawer', href: '/components/drawer', icon: 'PanelRight' },
					{ label: 'Toast', href: '/components/toast', icon: 'Bell' },
				{ label: 'Notification Center', href: '/components/notification-center', icon: 'BellRing' },
					{ label: 'Tooltip', href: '/components/tooltip', icon: 'Info' },
					{ label: 'Banner', href: '/components/banner', icon: 'Flag' }
				]
			},
			{
				label: 'Typography & Code',
				items: [
					{ label: 'Typography', href: '/components/typography', icon: 'Type' },
					{ label: 'Code', href: '/components/code', icon: 'Code' }
				]
			},
			{
				label: 'Visual Effects',
				items: [
					{ label: 'Cursor', href: '/components/cursor', icon: 'MousePointer' },
					{ label: 'Glow', href: '/components/glow', icon: 'Flame' }
				]
			},
			{
				label: 'Examples',
				items: [
					{ label: 'Form', href: '/examples/form', icon: 'ClipboardList' },
					{ label: 'Linear', href: '/examples/linear', icon: 'CircleDot' },
					{ label: 'Spotify', href: '/examples/spotify', icon: 'Music' },
					{ label: 'GitHub', href: '/examples/github', icon: 'Github' },
					{ label: 'Steam', href: '/examples/steam', icon: 'Gamepad2' },
					{ label: 'Spark', href: '/examples/spark', icon: 'Zap' }
				]
			}
		]
	};
</script>

{#if isBareExample}
	<Page title="Glow UI" layout="bare">
		{@render children?.()}
	</Page>
{:else}
	<Page title="Glow UI" {sidebarConfig}>
		{@render children?.()}
	</Page>
{/if}

<ToastContainer />
