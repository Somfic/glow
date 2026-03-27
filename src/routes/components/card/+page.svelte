<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import MediaCard from '$lib/media/MediaCard.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Card | Glow UI</title></svelte:head>

<Heading level={1}>Media Card</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A versatile card component for displaying media content with corner slots and a progress
	indicator.
</Text>

<Group label="Basic Card with Slots" id="basic-card">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Use corner slots to place any content at the four corners of the card
	</Text>
	<MediaCard
		src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop"
	>
		{#snippet topLeft()}
			<Pill label="#1" color="#22c55e" />
		{/snippet}
		{#snippet topRight()}
			<ButtonGroup>
				<Button icon="Heart" variant="ghost" onclick={() => alert('Liked!')} />
				<Button icon="Trash" variant="ghost" onclick={() => alert('Deleted!')} />
			</ButtonGroup>
		{/snippet}
		{#snippet bottomLeft()}
			<span
				style="color: white; font-weight: 600; font-size: 0.875rem; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"
				>Card Title</span
			>
		{/snippet}
		{#snippet bottomRight()}
			<Pill label="nature" color="#22c55e" />
		{/snippet}
	</MediaCard>
</Group>

<Group label="Progress Indicator" id="progress">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Show progress with a primary-colored bar at the bottom of the card
	</Text>
	<div
		style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;"
	>
		<MediaCard
			src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop"
			progress={0.25}
		>
			{#snippet bottomLeft()}
				<span
					style="color: white; font-weight: 600; font-size: 0.875rem; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"
					>25% Complete</span
				>
			{/snippet}
		</MediaCard>
		<MediaCard
			src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop"
			progress={0.6}
		>
			{#snippet bottomLeft()}
				<span
					style="color: white; font-weight: 600; font-size: 0.875rem; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"
					>60% Complete</span
				>
			{/snippet}
		</MediaCard>
		<MediaCard
			src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"
			progress={1}
		>
			{#snippet bottomLeft()}
				<span
					style="color: white; font-weight: 600; font-size: 0.875rem; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"
					>Done</span
				>
			{/snippet}
		</MediaCard>
	</div>
</Group>

<Group label="Card Grid" id="card-grid">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Cards in a responsive grid layout
	</Text>
	<div
		style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;"
	>
		<MediaCard
			src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=300&fit=crop"
			progress={0.3}
		>
			{#snippet topLeft()}
				<Pill label="New" color="#22c55e" />
			{/snippet}
			{#snippet topRight()}
				<Button icon="Heart" variant="ghost" onclick={() => alert('Liked!')} />
			{/snippet}
		</MediaCard>
		<MediaCard
			src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop"
		>
			{#snippet topLeft()}
				<Pill label="Featured" color="#3b82f6" />
			{/snippet}
		</MediaCard>
		<MediaCard
			src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop"
			progress={0.8}
		>
			{#snippet bottomRight()}
				<Pill label="80%" color="#8b5cf6" />
			{/snippet}
		</MediaCard>
	</div>
</Group>

<Group label="Usage" id="usage">
	<Heading level={3} id="basic-usage">Slot-Based Card</Heading>
	<CodeBlock
		language="svelte"
		code={`<script>
  import { MediaCard, Button, Pill } from 'glow-ui';
</script>

<MediaCard src="image.jpg" progress={0.5}>
  {#snippet topLeft()}
    <Pill label="Badge" color="#22c55e" />
  {/snippet}
  {#snippet topRight()}
    <Button icon="Heart" variant="ghost" onclick={() => {}} />
  {/snippet}
  {#snippet bottomLeft()}
    <span>Title</span>
  {/snippet}
  {#snippet bottomRight()}
    <Pill label="tag" color="#8b5cf6" />
  {/snippet}
</MediaCard>`}
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
			{ prop: 'src', type: 'string', default: '-', description: 'Media source URL' },
			{
				prop: 'progress',
				type: 'number',
				default: '-',
				description: 'Progress value (0-1), shows a primary-colored bar at the bottom'
			},
			{
				prop: 'topLeft',
				type: 'Snippet',
				default: '-',
				description: 'Content for the top-left corner (shown on hover)'
			},
			{
				prop: 'topRight',
				type: 'Snippet',
				default: '-',
				description: 'Content for the top-right corner (shown on hover)'
			},
			{
				prop: 'bottomLeft',
				type: 'Snippet',
				default: '-',
				description: 'Content for the bottom-left corner (shown on hover)'
			},
			{
				prop: 'bottomRight',
				type: 'Snippet',
				default: '-',
				description: 'Content for the bottom-right corner (shown on hover)'
			},
			{ prop: 'aspectRatio', type: 'string', default: "'1'", description: 'CSS aspect ratio' },
			{
				prop: 'fit',
				type: "'cover' | 'contain'",
				default: "'cover'",
				description: 'Object-fit for the media'
			},
			{
				prop: 'selected',
				type: 'boolean',
				default: 'false',
				description: 'Show selection outline'
			},
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disable interactions' },
			{ prop: 'onclick', type: '() => void', default: '-', description: 'Click handler' }
		]}
	/>
</Group>
