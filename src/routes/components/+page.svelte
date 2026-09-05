<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Flex from '$lib/layout/Flex.svelte';

	// One entry per page under /components. Keep this in sync with the sidebar
	// groups in +layout.svelte — between them they're the catalogue.
	const components = [
		{
			category: 'Layout & Shell',
			items: [
				{ name: 'Page', href: '/components/page', description: 'The app shell — title, layout mode, top nav or sidebar' },
				{ name: 'Sidebar', href: '/components/sidebar', description: 'Fixed navigation rail with groups and a collapsed mode' },
				{ name: 'Layout', href: '/components/layout', description: 'Flex, Grid, Spacer, and Divider primitives' },
				{ name: 'Card', href: '/components/card', description: 'Content cards' },
				{ name: 'Accordion', href: '/components/accordion', description: 'Collapsible sections, single or multiple open at a time' },
				{ name: 'Split', href: '/components/split', description: 'Resizable pane container' },
				{ name: 'Scroll Area', href: '/components/scroll-area', description: 'Themed scroll container with live fade masks on the edges that have more content' },
				{ name: 'Theme', href: '/components/theme', description: 'Light/dark and accent theming via design tokens' }
			]
		},
		{
			category: 'Form & Input',
			items: [
				{ name: 'Button', href: '/components/buttons', description: 'Buttons and button groups' },
				{ name: 'Input', href: '/components/inputs', description: 'One component, fifteen input types' },
				{ name: 'Calendar', href: '/components/calendar', description: 'Themeable month grid for single, multiple, and range selection' },
				{ name: 'Settings & Fields', href: '/components/settings', description: 'Field, FieldRow, SettingsSection, SettingsShell' },
				{ name: 'File Upload', href: '/components/file-upload', description: 'Drag-drop file picker with previews' },
				{ name: 'Image Upload', href: '/components/image-upload', description: 'Avatar and thumbnail picker with an optional crop step' }
			]
		},
		{
			category: 'Data Display',
			items: [
				{ name: 'Table', href: '/components/table', description: 'Data tables with sorting, selection, and pagination' },
				{ name: 'Data', href: '/components/data', description: 'Key-value pairs for detail panels' },
				{ name: 'Virtual List', href: '/components/virtual-list', description: 'Windowed rendering and infinite scroll for long lists' },
				{ name: 'Charts', href: '/components/charts', description: 'Sparkline and LineChart — hand-rolled SVG, no charting dependency' },
				{ name: 'Empty State', href: '/components/empty-state', description: 'The placeholder for a list with nothing in it yet, and the nudge to fill it' },
				{ name: 'Animated Number', href: '/components/animated-number', description: 'A number that tweens or rolls to its new value' },
				{ name: 'Animated Text', href: '/components/animated-text', description: 'Text that reveals progressively, the way streamed output arrives' },
				{ name: 'List Item', href: '/components/list', description: 'One list row: title, subtitle, leading and trailing slots' },
				{ name: 'Timeline', href: '/components/timeline', description: 'Activity feeds and event history, with markers and timestamps' },
				{ name: 'Diff View', href: '/components/diff-view', description: 'A code diff the way a pull request shows one — unified or side by side' },
				{ name: 'Stepper', href: '/components/stepper', description: 'Where you are in a multi-step flow, horizontal or vertical, with an error state' },
				{ name: 'Pagination', href: '/components/pagination', description: 'Page controls with a range readout and size picker' },
				{ name: 'Pill', href: '/components/pill', description: 'Tags, labels, and status indicators' },
				{ name: 'Avatar', href: '/components/avatar', description: 'User avatars with initials and grouping' },
				{ name: 'Media', href: '/components/media', description: 'Crossfading images and video with loading states' },
				{ name: 'Lightbox', href: '/components/lightbox', description: 'Full-screen media overlay with a filmstrip' }
			]
		},
		{
			category: 'Navigation',
			items: [
				{ name: 'Tabs', href: '/components/tabs', description: 'Tab navigation' },
				{ name: 'Sortable', href: '/components/sortable', description: 'Drag-to-reorder action with handles and groups' },
				{ name: 'Tier List', href: '/components/tierlist', description: 'Cross-container dragging, built from Sortable' },
				{ name: 'Table of Contents', href: '/components/toc', description: 'Sticky navigation for long content' },
				{ name: 'Breadcrumb', href: '/components/breadcrumb', description: 'The trail to the current page, collapsing to a menu when it runs out of room' },
				{ name: 'Popover', href: '/components/popover', description: 'The anchoring primitive — flips, clamps, and portals' },
				{ name: 'Popover Menu', href: '/components/popover-menu', description: 'Rich menus: items, toggles, submenus, custom snippets' },
				{ name: 'Context Menu', href: '/components/context-menu', description: 'The same menu entries, opened by right-click' }
			]
		},
		{
			category: 'Feedback',
			items: [
				{ name: 'Modal', href: '/components/modal', description: 'Dialogs and modals' },
				{ name: 'Command Palette', href: '/components/command-palette', description: 'Modular, extendable command launcher' },
				{ name: 'Command Popover', href: '/components/command-popover', description: 'Inline anchored picker for slash-commands and autocomplete' },
				{ name: 'Drawer', href: '/components/drawer', description: 'Slide-in side panels' },
				{ name: 'Toast', href: '/components/toast', description: 'Toast notifications' },
				{ name: 'Confirm', href: '/components/confirm', description: 'Promise-returning confirm, alert and prompt dialogs' },
				{ name: 'Notification Center', href: '/components/notification-center', description: 'Persistent, browsable inbox' },
				{ name: 'Tooltip', href: '/components/tooltip', description: 'Hover tooltips, including inside the cursor' },
				{ name: 'Hover Card', href: '/components/hover-card', description: 'Rich hover previews with open/close intent delays' },
				{ name: 'Banner', href: '/components/banner', description: 'Alert banners' },
				{ name: 'Spinner', href: '/components/spinner', description: 'Loading spinners' },
				{ name: 'Skeleton', href: '/components/skeleton', description: 'Shimmering placeholders that hold a layout in place' },
				{ name: 'Progress', href: '/components/progress', description: 'Linear and circular progress, determinate or not' }
			]
		},
		{
			category: 'Typography & Code',
			items: [
				{ name: 'Typography', href: '/components/typography', description: 'Heading, Text, Link, Kbd, Section, Markdown' },
				{ name: 'Icon', href: '/components/icon', description: 'The full Lucide set, typed and searchable' },
				{ name: 'Code', href: '/components/code', description: 'Inline code and syntax-highlighted blocks' }
			]
		},
		{
			category: 'Visual Effects',
			items: [
				{ name: 'Cursor', href: '/components/cursor', description: 'Context-aware custom cursor' },
				{ name: 'Glow', href: '/components/glow', description: 'Flowing sheets of light (WebGL shader)' }
			]
		},
		{
			category: 'Utilities',
			items: [
				{ name: 'Actions & Helpers', href: '/components/utilities', description: 'useModal, registerShortcut, trapFocus, portal' },
				{ name: 'Roving Focus', href: '/components/roving-focus', description: 'One tab stop, arrow keys inside — the roving tabindex action' }
			]
		}
	];
</script>

<svelte:head><title>Components | Glow UI</title></svelte:head>

<Heading level={1}>Components</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Every component in the library has a page here, with live demos and a props table.
</Text>

<Flex gap="lg">
	{#each components as category}
		<Flex gap="sm">
			<Heading level={2}>{category.category}</Heading>
			<Grid min="280px" gap="md">
				{#each category.items as component}
					<Card href={component.href} title={component.name} description={component.description} />
				{/each}
			</Grid>
		</Flex>
	{/each}
</Flex>
