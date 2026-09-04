<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Lightbox, { type RelatedMedia } from '$lib/media/Lightbox.svelte';
	import Media from '$lib/media/Media.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	type Shot = { src: string; thumb: string; alt: string; type: 'image' | 'video' };

	const gallery: Shot[] = [
		{
			src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
			thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
			alt: 'Lake at dusk',
			type: 'image'
		},
		{
			src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600',
			thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
			alt: 'Sunlit valley',
			type: 'image'
		},
		{
			src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600',
			thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
			alt: 'Foggy forest',
			type: 'image'
		},
		{
			src: 'https://www.w3schools.com/html/mov_bbb.mp4',
			thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
			alt: 'Sample video',
			type: 'video'
		}
	];

	let open = $state(false);
	let index = $state(0);
	const active = $derived(gallery[index]);

	// `related` is the filmstrip along the bottom of the lightbox. Each entry
	// carries its own onClick, so the parent decides what "next" means.
	const related: RelatedMedia[] = $derived(
		gallery.map((shot, i) => ({
			src: shot.thumb,
			type: shot.type,
			alt: shot.alt,
			active: i === index,
			onClick: () => (index = i)
		}))
	);

	function show(i: number) {
		index = i;
		open = true;
	}

	// A bare lightbox with no filmstrip and no info panel.
	let simpleOpen = $state(false);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Lightbox | Glow UI</title></svelte:head>

<Heading level={1}>Lightbox</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A full-screen media overlay for images, plain video, and HLS streams — with an optional filmstrip of
	related items and a slot for captions or metadata. Pairs with
	<Link href="/components/media">Media</Link>, which handles the inline, in-page case.
</Text>

<Card title="Gallery" id="gallery">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Click a thumbnail to open it full-screen, then use the filmstrip at the bottom to move between
		items. Escape, the close button, or a click on the backdrop all dismiss it.
	</Text>
	<Grid min="160px" gap="sm">
		{#each gallery as shot, i (shot.src)}
			<button class="thumb" onclick={() => show(i)}>
				<Media src={shot.thumb} alt={shot.alt} fit="cover" />
				{#if shot.type === 'video'}
					<span class="badge"><Pill icon="Play" label="Video" variant="filled" /></span>
				{/if}
			</button>
		{/each}
	</Grid>
</Card>

<Card title="Without a filmstrip" id="simple">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Omit <Code>related</Code> and the children snippet and you get a bare overlay — one image, a close
		button, nothing else.
	</Text>
	<Button variant="secondary" label="Open single image" icon="Maximize2" onclick={() => (simpleOpen = true)} />
	<Lightbox
		open={simpleOpen}
		src={gallery[1].src}
		alt={gallery[1].alt}
		onClose={() => (simpleOpen = false)}
	/>
</Card>

<Card title="Video and HLS" id="video">
	<Text variant="secondary" size="sm">
		Set <Code>type="video"</Code> and the overlay renders a looping, autoplaying
		<Code>&lt;video&gt;</Code> with native controls. Sources containing <Code>.m3u8</Code> (or
		<Code>playlist</Code>) are attached through <Code>hls.js</Code> where the browser lacks native
		HLS. <Code>startPosition</Code> takes a 0–1 ratio and seeks there once metadata loads — handy for
		resuming, or for skipping a title card. The last item in the gallery above is a video.
	</Text>
</Card>

<Card title="Info panel" id="info">
	<Text variant="secondary" size="sm">
		The <Code>children</Code> snippet renders below the media. Clicks inside it don't dismiss the
		overlay, so captions, credits, tag pills, and download buttons all work. The gallery above uses it
		for the title and position counter.
	</Text>
</Card>

<Card title="Preloaded video" id="preloaded">
	<Text variant="secondary" size="sm">
		<Code>preloadedVideo</Code> takes an existing <Code>HTMLVideoElement</Code> and physically moves it
		into the overlay, preserving playback position and play/pause state. That's the trick for
		expanding an already-playing inline video to full-screen without a visible restart.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Lightbox } from 'glow';
  import type { RelatedMedia } from 'glow';

  const shots = [
    { src: '/one.jpg', thumb: '/one-sm.jpg', alt: 'One' },
    { src: '/two.jpg', thumb: '/two-sm.jpg', alt: 'Two' }
  ];

  let open = $state(false);
  let index = $state(0);

  const related: RelatedMedia[] = $derived(
    shots.map((s, i) => ({
      src: s.thumb,
      alt: s.alt,
      active: i === index,
      onClick: () => (index = i)
    }))
  );
</script>

<button onclick={() => (open = true)}>Open</button>

<Lightbox
  {open}
  src={shots[index].src}
  alt={shots[index].alt}
  {related}
  onClose={() => (open = false)}
>
  <Text>{shots[index].alt}</Text>
</Lightbox>`}
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
			{ prop: 'open', type: 'boolean', default: '—', description: 'Required, bindable. Whether the overlay is mounted.' },
			{ prop: 'src', type: 'string', default: '—', description: 'Required. Full-size media URL.' },
			{ prop: 'onClose', type: '() => void', default: '—', description: 'Required. Fired by the close button, the backdrop, and Escape.' },
			{ prop: 'type', type: "'image' | 'video'", default: 'image', description: 'Which element to render.' },
			{ prop: 'alt', type: 'string', default: "''", description: 'Alt text for the image.' },
			{ prop: 'poster', type: 'string', default: '—', description: 'Poster frame for video.' },
			{ prop: 'related', type: 'RelatedMedia[]', default: '[]', description: 'Filmstrip along the bottom. Each entry owns its own onClick.' },
			{ prop: 'startPosition', type: 'number', default: '0', description: 'Video start point as a 0–1 ratio of duration.' },
			{ prop: 'preloadedVideo', type: 'HTMLVideoElement', default: '—', description: 'Adopt an existing video element instead of creating one, preserving playback.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Info panel below the media. Clicks here do not dismiss.' }
		]}
	/>
</Card>

<Card title="Types" id="types">
	<CodeBlock
		language="ts"
		code={`type RelatedMedia = {
  src: string;
  type?: 'image' | 'video';
  alt?: string;
  active?: boolean;
  onClick: () => void;
};`}
	/>
</Card>

<Lightbox
	{open}
	src={active.src}
	type={active.type}
	alt={active.alt}
	{related}
	onClose={() => (open = false)}
>
	<Flex direction="horizontal" gap="sm" align="center" justify="center">
		<Text>{active.alt}</Text>
		<Pill label={`${index + 1} / ${gallery.length}`} variant="outlined" />
	</Flex>
</Lightbox>

<style lang="scss">
	.thumb {
		position: relative;
		display: block;
		height: 120px;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		overflow: hidden;
		background: var(--glow-bg-surface-element);
		cursor: pointer;
		transition: border-color 120ms ease, transform 120ms ease;

		&:hover {
			border-color: var(--glow-primary);
			transform: translateY(-2px);
		}
	}

	.badge {
		position: absolute;
		bottom: 0.5rem;
		left: 0.5rem;
	}
</style>
