<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Media from '$lib/media/Media.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';

	const tracks = [
		{ title: 'Weightless', artist: 'Marconi Union', length: '8:08' },
		{ title: 'Teardrop', artist: 'Massive Attack', length: '5:29' },
		{ title: 'Porcelain', artist: 'Moby', length: '4:01' }
	];

	const cover = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200';

	let selected = $state(0);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>List Item | Glow UI</title></svelte:head>

<Heading level={1}>List Item</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	One row of a list: a title, an optional second line, and snippets on either side. It handles the
	fiddly parts — rendering as a link, a button, or an inert div depending on which props you pass, and
	keeping hover and active states consistent across all three.
</Text>

<Card title="Title and subtitle" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The minimum useful row. <Code>subtitleIcon</Code> puts a small glyph before the second line.
	</Text>
	<div class="list">
		<ListItem title="Design review" subtitle="Tomorrow, 10:00" subtitleIcon="Calendar" />
		<ListItem title="Deploy pipeline" subtitle="Passing" subtitleIcon="CircleCheck" />
		<ListItem title="Title only" />
	</div>
</Card>

<Card title="Leading and trailing" id="slots">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>leading</Code> is for covers, avatars, and icons; <Code>trailing</Code> for durations,
		badges, and row actions. Both are snippets, so anything goes.
	</Text>
	<div class="list">
		{#each tracks as track, i}
			<ListItem
				title={track.title}
				subtitle={track.artist}
				active={i === selected}
				onclick={() => (selected = i)}
			>
				{#snippet leading()}
					<div class="cover"><Media src={cover} alt={track.title} fit="cover" /></div>
				{/snippet}
				{#snippet trailing()}
					<Flex direction="horizontal" gap="sm" align="center">
						<Text size="sm" variant="secondary">{track.length}</Text>
						<Icon name="EllipsisVertical" size={16} />
					</Flex>
				{/snippet}
			</ListItem>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Row {selected + 1} is marked <Code>active</Code>.
	</Text>
</Card>

<Card title="Interaction modes" id="interaction">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <Code>href</Code> to render an anchor, <Code>onclick</Code> to render a button, or neither for
		a plain non-interactive row. Only the first two pick up hover affordances and the pointer cursor.
	</Text>
	<div class="list">
		<ListItem title="A link" subtitle={'Renders as <a href>'} href="/components/list" subtitleIcon="ExternalLink" />
		<ListItem
			title="A button"
			subtitle={'Renders as <button>'}
			subtitleIcon="MousePointerClick"
			onclick={() => toast.info('Row clicked')}
		/>
		<ListItem title="Inert" subtitle="Renders as a div — no hover, no cursor" subtitleIcon="Minus" />
	</div>
</Card>

<Card title="Custom body" id="children">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>children</Code> snippet replaces the title/subtitle stack entirely, while keeping the
		leading and trailing columns and all the row chrome.
	</Text>
	<div class="list">
		<ListItem onclick={() => toast.info('Opened thread')}>
			{#snippet leading()}
				<Avatar name="Grace Hopper" size="sm" />
			{/snippet}
			<Flex gap="xs">
				<Flex direction="horizontal" gap="sm" align="center">
					<Text>Grace Hopper</Text>
					<Pill label="author" variant="outlined" />
					<Text size="sm" variant="secondary">2h ago</Text>
				</Flex>
				<Text size="sm" variant="secondary">
					Left a comment on the compiler proposal — worth a read before Thursday.
				</Text>
			</Flex>
			{#snippet trailing()}
				<Button variant="ghost" icon="Reply" />
			{/snippet}
		</ListItem>
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { ListItem, Avatar, Text } from 'glow';

  let selected = $state(0);
<\/script>

{#each people as person, i}
  <ListItem
    title={person.name}
    subtitle={person.role}
    subtitleIcon="Briefcase"
    active={i === selected}
    onclick={() => (selected = i)}
  >
    {#snippet leading()}
      <Avatar name={person.name} size="sm" />
    {/snippet}
    {#snippet trailing()}
      <Text size="sm" variant="secondary">{person.location}</Text>
    {/snippet}
  </ListItem>
{/each}`}
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
			{ prop: 'title', type: 'string', default: '—', description: 'Primary line.' },
			{ prop: 'subtitle', type: 'string', default: '—', description: 'Secondary line below the title.' },
			{ prop: 'subtitleIcon', type: 'IconProp', default: '—', description: 'Small icon before the subtitle. Defaults to 11px.' },
			{ prop: 'active', type: 'boolean', default: 'false', description: 'Marks the row as the current selection.' },
			{ prop: 'href', type: 'string', default: '—', description: 'Render as <a href>.' },
			{ prop: 'onclick', type: '(e: MouseEvent) => void', default: '—', description: 'Render as <button> with this handler.' },
			{ prop: 'leading', type: 'Snippet', default: '—', description: 'Left column — covers, avatars, icons.' },
			{ prop: 'trailing', type: 'Snippet', default: '—', description: 'Right column — badges, durations, actions.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Replaces the default title/subtitle layout.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the row.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the row.' }
		]}
	/>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/table">Table</Link> — for tabular data with sorting, selection, and
			pagination.
		</Text>
		<Text size="sm">
			<Link href="/components/sortable">Sortable</Link> — drag-to-reorder, which composes with these
			rows.
		</Text>
		<Text size="sm">
			<Link href="/components/virtual-list">VirtualList</Link> — when the list is long enough that
			rendering every row hurts.
		</Text>
		<Text size="sm">
			Seen in context in the <Link href="/examples/spotify">Spotify</Link> and
			<Link href="/examples/steam">Steam</Link> examples.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	.list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		overflow: hidden;
	}

	.cover {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		flex: 0 0 auto;
	}
</style>
