<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import MediaCard from '$lib/media/MediaCard.svelte';
	import Group from '$lib/group/Group.svelte';

	const components = [
		{
			category: 'Form & Input',
			items: [
				{ name: 'Button', href: '/components/buttons', description: 'Buttons and button groups' },
				{ name: 'Input', href: '/components/inputs', description: 'Form inputs and controls' }
			]
		},
		{
			category: 'Data Display',
			items: [
				{ name: 'Table', href: '/components/table', description: 'Data tables with sorting and selection' },
				{ name: 'List', href: '/components/list', description: 'Lists and virtual scrolling' },
				{ name: 'Property List', href: '/components/property-list', description: 'Key-value pairs for detail panels' },
				{ name: 'Card', href: '/components/card', description: 'Content cards' },
				{ name: 'Pill', href: '/components/pill', description: 'Tags, labels, and status indicators' },
				{ name: 'Avatar', href: '/components/avatar', description: 'User avatars with initials and status' }
			]
		},
		{
			category: 'Navigation',
			items: [
				{ name: 'Tabs', href: '/components/tabs', description: 'Tab navigation' },
				{ name: 'Table of Contents', href: '/components/toc', description: 'Sticky navigation for long content' },
				{ name: 'Dropdown Menu', href: '/components/dropdown', description: 'Contextual action menus' }
			]
		},
		{
			category: 'Feedback',
			items: [
				{ name: 'Modal', href: '/components/modal', description: 'Dialogs and modals' },
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

	{#each components as category}
		<Group>
			<Heading level={2}>{category.category}</Heading>
			<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
				{#each category.items as component}
					<a href={component.href} style="text-decoration: none;">
						<div
							style="padding: 1.5rem; background: #1e1f29; border: 1px solid #30313C; border-radius: 12px; transition: all 0.15s; height: 100%;"
							onmouseenter={(e) => {
								e.currentTarget.style.borderColor = '#8B6DED';
								e.currentTarget.style.background = 'rgba(139, 109, 237, 0.05)';
							}}
							onmouseleave={(e) => {
								e.currentTarget.style.borderColor = '#30313C';
								e.currentTarget.style.background = '#1e1f29';
							}}
						>
							<div style="font-weight: 600; font-size: 1.125rem; color: #eee; margin-bottom: 0.5rem;">
								{component.name}
							</div>
							<div style="font-size: 0.875rem; color: rgba(238, 238, 238, 0.7);">
								{component.description}
							</div>
						</div>
					</a>
				{/each}
			</div>
		</Group>
	{/each}
