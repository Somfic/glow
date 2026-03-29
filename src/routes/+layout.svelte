<script>
	import '$lib/style/glow.scss';
	import Page from '$lib/page/Page.svelte';

	const sidebarConfig = {
		title: 'Glow UI',
		topItems: [
			{ label: 'Home', href: '/', icon: 'Home' },
			{ label: 'Components', href: '/components', icon: 'Layout' }
		],
		groups: [
			{
				label: 'Form & Input',
				items: [
					{ label: 'Button', href: '/components/buttons', icon: 'MousePointerClick' },
					{ label: 'Input', href: '/components/inputs', icon: 'TextCursorInput' }
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
					{ label: 'Image', href: '/components/image', icon: 'Image' }
				]
			},
			{
				label: 'Navigation',
				items: [
					{ label: 'Tabs', href: '/components/tabs', icon: 'PanelTop' },
					{ label: 'Table of Contents', href: '/components/toc', icon: 'BookOpen' },
					{ label: 'Dropdown Menu', href: '/components/dropdown', icon: 'ChevronDown' }
				]
			},
			{
				label: 'Feedback',
				items: [
					{ label: 'Modal', href: '/components/modal', icon: 'MessageSquare' },
					{ label: 'Drawer', href: '/components/drawer', icon: 'PanelRight' },
					{ label: 'Toast', href: '/components/toast', icon: 'Bell' },
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
					{ label: 'Gradient Mesh', href: '/components/gradient', icon: 'Sparkles' }
				]
			}
		]
	};
</script>

<Page title="Glow UI" {sidebarConfig}>
	<slot />
</Page>
