<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import MediaCard from '$lib/media/MediaCard.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Card | Glow UI</title></svelte:head>

<Heading level={1}>Card</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A versatile card component for displaying media content with badges, tags, and actions.
	</Text>

	<Group label="Basic Card" id="basic-card">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Card with image, badge, title, tags, and action buttons
		</Text>
		<MediaCard
			src="https://placekitten.com/400/300"
			badge="#1"
			badgeVariant="success"
			title={'Card Title'}
			tags={[{ label: 'person', color: '#ec4899' }]}
			actions={[
				{ icon: 'Heart', label: '5', onclick: () => alert('Liked!') },
				{ icon: 'Trash', onclick: () => alert('Deleted!') }
			]}
		/>
	</Group>

	<Group label="Card Variants" id="card-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Different badge variants for different states
		</Text>
		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
			<MediaCard
				src="https://placekitten.com/400/300"
				badge="New"
				badgeVariant="success"
				title="Success Badge"
				tags={[{ label: 'new', color: '#22c55e' }]}
			/>
			<MediaCard
				src="https://placekitten.com/401/300"
				badge="Featured"
				badgeVariant="info"
				title="Info Badge"
				tags={[{ label: 'featured', color: '#3b82f6' }]}
			/>
			<MediaCard
				src="https://placekitten.com/402/300"
				badge="Sale"
				badgeVariant="warning"
				title="Warning Badge"
				tags={[{ label: 'sale', color: '#f59e0b' }]}
			/>
			<MediaCard
				src="https://placekitten.com/403/300"
				badge="Sold Out"
				badgeVariant="error"
				title="Error Badge"
				tags={[{ label: 'unavailable', color: '#ef4444' }]}
			/>
		</div>
	</Group>

	<Group label="Card with Multiple Actions" id="card-with-actions">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Cards can have multiple action buttons with icons and labels
		</Text>
		<MediaCard
			src="https://placekitten.com/404/300"
			title="Action-Rich Card"
			tags={[
				{ label: 'photos', color: '#8b5cf6' },
				{ label: 'animals', color: '#06b6d4' }
			]}
			actions={[
				{ icon: 'Heart', label: '42', onclick: () => alert('42 likes!') },
				{ icon: 'MessageCircle', label: '12', onclick: () => alert('12 comments!') },
				{ icon: 'Share', onclick: () => alert('Shared!') },
				{ icon: 'Trash', onclick: () => alert('Deleted!') }
			]}
		/>
	</Group>

	<Group label="Card with Multiple Tags" id="card-with-tags">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Use colorful tags to categorize or highlight card attributes
		</Text>
		<MediaCard
			src="https://placekitten.com/405/300"
			title="Multi-Tagged Card"
			tags={[
				{ label: 'nature', color: '#22c55e' },
				{ label: 'photography', color: '#8b5cf6' },
				{ label: 'professional', color: '#f59e0b' },
				{ label: 'featured', color: '#3b82f6' }
			]}
			actions={[{ icon: 'Heart', label: '128', onclick: () => alert('Liked!') }]}
		/>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="basic-usage">Basic Card</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { MediaCard } from 'glow-ui';
</script>

<MediaCard
  src="https://example.com/image.jpg"
  badge="#1"
  badgeVariant="success"
  title="Card Title"
  tags={[
    { label: 'category', color: '#ec4899' }
  ]}
  actions={[
    { icon: 'Heart', label: '5', onclick: () => console.log('Liked!') },
    { icon: 'Trash', onclick: () => console.log('Deleted!') }
  ]}
/>`}
		/>

		<Heading level={3} id="minimal-card">Minimal Card</Heading>
		<CodeBlock
			language="svelte"
			code={`<MediaCard
  src="https://example.com/image.jpg"
  title="Simple Card"
/>`}
		/>
	</Group>

	<Group label="Props" id="props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'src', type: 'string', default: 'required', description: 'Image source URL' },
				{ prop: 'title', type: 'string', default: '-', description: 'Card title' },
				{ prop: 'badge', type: 'string', default: '-', description: 'Badge text (top-left corner)' },
				{ prop: 'badgeVariant', type: "'success' | 'info' | 'warning' | 'error'", default: "'info'", description: 'Badge color variant' },
				{ prop: 'tags', type: 'Tag[]', default: '[]', description: 'Array of tags with label and color' },
				{ prop: 'actions', type: 'CardAction[]', default: '[]', description: 'Action buttons with icon, label, and onclick' }
			]}
		/>
	</Group>

	<Group label="Type Definitions" id="types">
		<CodeBlock
			language="typescript"
			code={`interface Tag {
  label: string;
  color: string; // Hex color code
}

interface CardAction {
  icon: IconName;
  label?: string;
  onclick: () => void;
}

type BadgeVariant = 'success' | 'info' | 'warning' | 'error';`}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🖼️ Image display with aspect ratio preservation</Text></li>
			<li><Text>🏷️ Top-left badge with multiple color variants</Text></li>
			<li><Text>🎨 Customizable color tags</Text></li>
			<li><Text>⚡ Action buttons with icons and labels</Text></li>
			<li><Text>📱 Responsive design</Text></li>
			<li><Text>🎯 Hover effects and transitions</Text></li>
			<li><Text>♿ Accessible with proper ARIA attributes</Text></li>
		</ul>
	</Group>
