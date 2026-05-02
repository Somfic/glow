<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Flex from '$lib/layout/Flex.svelte';

	const components = [
		{
			category: 'Form & Input',
			items: [
				{ name: 'Button', href: '/components/buttons', description: 'Buttons and button groups' },
				{ name: 'Input', href: '/components/inputs', description: 'Form inputs and controls' },
				{ name: 'Settings', href: '/components/settings', description: 'Section, Field, FieldRow, SettingsShell' }
			]
		},
		{
			category: 'Data Display',
			items: [
				{ name: 'Table', href: '/components/table', description: 'Data tables with sorting and selection' },
{ name: 'Data', href: '/components/data', description: 'Key-value pairs for detail panels' },
				{ name: 'Card', href: '/components/card', description: 'Content cards' },
				{ name: 'Pill', href: '/components/pill', description: 'Tags, labels, and status indicators' },
				{ name: 'Avatar', href: '/components/avatar', description: 'User avatars with initials and status' },
				{ name: 'Image', href: '/components/image', description: 'Smooth crossfade image transitions' }
			]
		},
		{
			category: 'Navigation',
			items: [
				{ name: 'Tabs', href: '/components/tabs', description: 'Tab navigation' },
				{ name: 'Table of Contents', href: '/components/toc', description: 'Sticky navigation for long content' },
				{ name: 'Popover Menu', href: '/components/popover-menu', description: 'Rich popover menus: items, toggles, submenus, custom snippets' }
			]
		},
		{
			category: 'Feedback',
			items: [
				{ name: 'Modal', href: '/components/modal', description: 'Dialogs and modals' },
				{ name: 'Drawer', href: '/components/drawer', description: 'Slide-in side panels' },
				{ name: 'Toast', href: '/components/toast', description: 'Toast notifications' },
				{ name: 'Tooltip', href: '/components/tooltip', description: 'Hover tooltips' },
				{ name: 'Banner', href: '/components/banner', description: 'Alert banners' },
				{ name: 'Spinner', href: '/components/spinner', description: 'Loading spinners' }
			]
		},
		{
			category: 'Typography & Code',
			items: [
				{ name: 'Typography', href: '/components/typography', description: 'Text and headings' },
				{ name: 'Code', href: '/components/code', description: 'Code blocks and syntax highlighting' }
			]
		},
		{
			category: 'Visual Effects',
			items: [
				{ name: 'Cursor', href: '/components/cursor', description: 'Custom cursor effects' },
				{ name: 'Gradient Mesh', href: '/components/gradient', description: 'Animated gradient backgrounds' }
			]
		}
	];
</script>

<svelte:head><title>Components | Glow UI</title></svelte:head>

<Heading level={1}>Components</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Explore all the components available in the Glow UI library.
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
