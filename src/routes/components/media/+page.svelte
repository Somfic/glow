<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Media from '$lib/media/Media.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	const sources = [
		'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
		'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
		'https://www.w3schools.com/html/mov_bbb.mp4'
	];

	let current = $state(0);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Media | Glow UI</title></svelte:head>

<Heading level={1}>Media</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Smooth crossfade media component with loading state and dual-layer transitions. Supports images and videos with seamless crossfade between any source type.
</Text>

<Group label="Smooth switching" id="switching">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Click the buttons to swap the source. The transition crossfades between images and video.
	</Text>
	<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
		<Button variant={current === 0 ? 'primary' : 'secondary'} onclick={() => (current = 0)}>
			Landscape
		</Button>
		<Button variant={current === 1 ? 'primary' : 'secondary'} onclick={() => (current = 1)}>
			Valley
		</Button>
		<Button variant={current === 2 ? 'primary' : 'secondary'} onclick={() => (current = 2)}>
			Video
		</Button>
	</div>
	<div style="width: 100%; height: 400px; border-radius: 12px; overflow: hidden;">
		<Media src={sources[current]} fit="cover" autoplay />
	</div>
</Group>

<Group label="Object fit" id="fit">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Contain (default) vs cover.
	</Text>
	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
		<div>
			<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">contain</Text>
			<div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
				<Media src={sources[0]} fit="contain" />
			</div>
		</div>
		<div>
			<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">cover</Text>
			<div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
				<Media src={sources[0]} fit="cover" />
			</div>
		</div>
	</div>
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Media } from 'glow-ui';
  let src = $state('https://example.com/photo.jpg');
</script>

<!-- Basic usage -->
<Media {src} />

<!-- With cover fit -->
<Media {src} fit="cover" />

<!-- Smooth switch: just change the src -->
<Media src={dynamicUrl} fit="cover" />`}
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
			{ prop: 'src', type: 'string', default: '-', description: 'Image URL' },
			{ prop: 'fit', type: "'cover' | 'contain'", default: "'contain'", description: 'Object-fit mode' }
		]}
	/>
</Group>
