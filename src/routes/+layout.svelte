<script lang="ts">
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { viewTransition } from '$lib/util/viewTransition.js';
	import './view-transitions.scss';
	import Root from '$lib/root/Root.svelte';
	import Page from '$lib/page/Page.svelte';
	import type { SidebarItem, SidebarGroup } from '$lib/sidebar/Sidebar.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();

	// Crossfade the content panel between docs pages. The helper hands back
	// `undefined` — i.e. navigate normally — where the API is missing or the
	// user asked for reduced motion, and `onNavigate` registers via `onMount`,
	// so none of this runs while prerendering.
	onNavigate(viewTransition);

	// Examples that render their own full-bleed shell — they want viewport
	// lock + no sidebar. Other examples (e.g. /examples/github) reuse the
	// docs shell and just style their content area.
	const bareRoutes = ['/examples/linear', '/examples/spotify', '/examples/spark', '/examples/steam'];
	const isBareExample = $derived(
		bareRoutes.some((r) => page.url.pathname.startsWith(r))
	);

	const sidebarConfig: {
		title: string;
		topItems: SidebarItem[];
		groups: SidebarGroup[];
		themeToggle: boolean;
	} = {
		title: 'Glow UI',
		themeToggle: true,
		topItems: [
			{ label: 'Home', href: '/', icon: 'House' },
			{ label: 'Components', href: '/components', icon: 'LayoutGrid' }
		],
		groups: [
			{
				label: 'Layout & Shell',
				items: [
					{ label: 'Page', href: '/components/page', icon: 'LayoutTemplate' },
					{ label: 'Sidebar', href: '/components/sidebar', icon: 'PanelLeft' },
					{ label: 'Layout', href: '/components/layout', icon: 'LayoutDashboard' },
					{ label: 'Card', href: '/components/card', icon: 'Square' },
					{ label: 'Accordion', href: '/components/accordion', icon: 'ChevronsDownUp' },
					{ label: 'Split', href: '/components/split', icon: 'Columns2' },
					{ label: 'Scroll Area', href: '/components/scroll-area', icon: 'ScrollText' },
					{ label: 'Theme', href: '/components/theme', icon: 'Palette' }
				]
			},
			{
				label: 'Form & Input',
				items: [
					{ label: 'Button', href: '/components/buttons', icon: 'MousePointerClick' },
					{ label: 'Input', href: '/components/inputs', icon: 'TextCursorInput' },
					{ label: 'Calendar', href: '/components/calendar', icon: 'CalendarDays' },
					{ label: 'Settings & Fields', href: '/components/settings', icon: 'SlidersHorizontal' },
					{ label: 'File Upload', href: '/components/file-upload', icon: 'CloudUpload' },
					{ label: 'Image Upload', href: '/components/image-upload', icon: 'ImagePlus' }
				]
			},
			{
				label: 'Data Display',
				items: [
					{ label: 'Table', href: '/components/table', icon: 'Table' },
					{ label: 'Data', href: '/components/data', icon: 'ClipboardList' },
					{ label: 'Virtual List', href: '/components/virtual-list', icon: 'List' },
					{ label: 'Charts', href: '/components/charts', icon: 'ChartLine' },
					{ label: 'Empty State', href: '/components/empty-state', icon: 'Inbox' },
					{ label: 'Animated Number', href: '/components/animated-number', icon: 'TrendingUp' },
					{ label: 'List Item', href: '/components/list', icon: 'Rows2' },
					{ label: 'Timeline', href: '/components/timeline', icon: 'History' },
					{ label: 'Pagination', href: '/components/pagination', icon: 'ChevronsRight' },
					{ label: 'Pill', href: '/components/pill', icon: 'Tag' },
					{ label: 'Avatar', href: '/components/avatar', icon: 'CircleUser' },
					{ label: 'Media', href: '/components/media', icon: 'Image' },
					{ label: 'Lightbox', href: '/components/lightbox', icon: 'Maximize2' }
				]
			},
			{
				label: 'Navigation',
				items: [
					{ label: 'Tabs', href: '/components/tabs', icon: 'PanelTop' },
					{ label: 'Sortable', href: '/components/sortable', icon: 'GripVertical' },
					{ label: 'Tier List', href: '/components/tierlist', icon: 'Rows3' },
					{ label: 'Table of Contents', href: '/components/toc', icon: 'BookOpen' },
					{ label: 'Breadcrumb', href: '/components/breadcrumb', icon: 'ChevronRight' },
					{ label: 'Popover', href: '/components/popover', icon: 'SquareArrowOutUpRight' },
					{ label: 'Popover Menu', href: '/components/popover-menu', icon: 'ChevronDown' },
					{ label: 'Context Menu', href: '/components/context-menu', icon: 'MousePointer' },
					{ label: 'View Transitions', href: '/components/view-transitions', icon: 'Repeat' }
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
					{ label: 'Confirm', href: '/components/confirm', icon: 'CircleQuestionMark' },
					{ label: 'Notification Center', href: '/components/notification-center', icon: 'BellRing' },
					{ label: 'Tooltip', href: '/components/tooltip', icon: 'Info' },
					{ label: 'Hover Card', href: '/components/hover-card', icon: 'IdCard' },
					{ label: 'Banner', href: '/components/banner', icon: 'Flag' },
					{ label: 'Spinner', href: '/components/spinner', icon: 'LoaderCircle' },
					{ label: 'Skeleton', href: '/components/skeleton', icon: 'Blocks' },
					{ label: 'Progress', href: '/components/progress', icon: 'Gauge' }
				]
			},
			{
				label: 'Typography & Code',
				items: [
					{ label: 'Typography', href: '/components/typography', icon: 'Type' },
					{ label: 'Icon', href: '/components/icon', icon: 'Shapes' },
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
				label: 'Utilities',
				items: [{ label: 'Actions & Helpers', href: '/components/utilities', icon: 'Wrench' }]
			},
			{
				label: 'Examples',
				items: [
					{ label: 'Form', href: '/examples/form', icon: 'ClipboardList' },
					{ label: 'Sandbox', href: '/examples/sandbox', icon: 'ScanEye' },
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

<!-- Root supplies the stylesheet, the theme and the toast container, so the
     layout no longer imports glow.scss or mounts ToastContainer itself. It has
     no theme prop on purpose: that leaves the shared store in charge, which is
     what makes the sidebar's switch work. -->
<Root>
	{#if isBareExample}
		<Page title="Glow UI" layout="bare">
			{@render children?.()}
		</Page>
	{:else}
		<Page title="Glow UI" {sidebarConfig}>
			{@render children?.()}
		</Page>
	{/if}
</Root>
