<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from "$lib/card/Card.svelte";
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

	// Enough tiles to run several screens deep, which is the point of the card:
	// the ones below the fold should cost nothing until they're scrolled to.
	const grid = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		still: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&sig=${i}`,
		full: `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&sig=${i}`
	}));
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Media | Glow UI</title></svelte:head>

<Heading level={1}>Media</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Smooth crossfade media component with loading state and dual-layer transitions. Supports images and videos with seamless crossfade between any source type.
</Text>

<Card title="Smooth switching" id="switching">
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
</Card>

<Card title="Object fit" id="fit">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Contain (default) vs cover.
	</Text>
	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
		<div>
			<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">contain</Text>
			<div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid var(--glow-border-color);">
				<Media src={sources[0]} fit="contain" />
			</div>
		</div>
		<div>
			<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">cover</Text>
			<div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; border: 1px solid var(--glow-border-color);">
				<Media src={sources[0]} fit="cover" />
			</div>
		</div>
	</div>
</Card>

<Card title="Lazy grid" id="lazy">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>lazy</Code> (on by default) holds both <Code>src</Code> and
		<Code>fallback</Code> until the tile is within 300px of the viewport, so a
		grid this long costs a screenful of requests rather than
		{grid.length} of them. Scroll and watch the network panel. Pass
		<Code>{'lazy={false}'}</Code> for something above the fold that should not
		wait, and <Code>{'active={false}'}</Code> to deprioritise a whole grid at
		once — behind an open dialog, say.
	</Text>
	<div class="tile-grid">
		{#each grid as tile (tile.id)}
			<div class="tile">
				<Media src={tile.full} fallback={tile.still} fit="cover" alt={`Tile ${tile.id}`} />
			</div>
		{/each}
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Media } from 'glow-ui';
  let src = $state('https://example.com/photo.jpg');
<\/script>

<!-- Basic usage -->
<Media {src} />

<!-- With cover fit -->
<Media {src} fit="cover" />

<!-- Smooth switch: just change the src -->
<Media src={dynamicUrl} fit="cover" />`}
	/>
</Card>

<Card title="Props" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'src', type: 'string', default: '-', description: 'Image or video URL' },
			{
				prop: 'fallback',
				type: 'string',
				default: '-',
				description: 'Still shown beneath src — a poster while a video buffers'
			},
			{
				prop: 'type',
				type: "'image' | 'video' | 'auto'",
				default: "'auto'",
				description: 'Auto sniffs the extension; tell it when the URL hides one'
			},
			{ prop: 'fit', type: "'cover' | 'contain'", default: "'contain'", description: 'Object-fit mode' },
			{
				prop: 'lazy',
				type: 'boolean',
				default: 'true',
				description: 'Hold src and fallback until within 300px of the viewport'
			},
			{
				prop: 'active',
				type: 'boolean',
				default: 'true',
				description: 'External gate — false pauses the video and loads nothing'
			},
			{ prop: 'autoplay', type: 'boolean', default: 'false', description: 'Play once loaded' },
			{ prop: 'muted', type: 'boolean', default: 'true', description: 'Required for autoplay' },
			{ prop: 'loop', type: 'boolean', default: 'true', description: 'Restart on end' },
			{ prop: 'controls', type: 'boolean', default: 'false', description: 'Native video controls' },
			{
				prop: 'startTime',
				type: 'number',
				default: '0',
				description: 'Seek to this fraction of the duration on load'
			}
		]}
	/>
</Card>

<style>
	.tile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 0.75rem;
	}

	.tile {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 8px;
		/* A frame rather than a fill: a tile that hasn't been scrolled to yet is
		   deliberately empty, and the point of the card is lost if it reads as
		   nothing being there at all. */
		border: 1px solid var(--glow-border-color);
	}
</style>
