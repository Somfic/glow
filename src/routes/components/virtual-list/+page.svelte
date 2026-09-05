<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import VirtualList from '$lib/data/VirtualList.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Spinner from '$lib/spinner/Spinner.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	type Row = { id: number; name: string; email: string };

	const names = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Barbara Liskov', 'Donald Knuth'];

	function makeRows(from: number, count: number): Row[] {
		return Array.from({ length: count }, (_, i) => {
			const id = from + i;
			const name = names[id % names.length];
			return { id, name, email: `${name.split(' ')[0].toLowerCase()}${id}@example.com` };
		});
	}

	// 50k rows: enough that rendering them all would lock the tab, which is the
	// whole point of the component.
	const big = makeRows(1, 50_000);

	// Variable-height demo — every third row is taller.
	const mixed = makeRows(1, 500);
	function heightFor(_row: Row, index: number) {
		return index % 3 === 0 ? 96 : 56;
	}

	let visibleRange = $state({ start: 0, end: 0 });

	// Infinite scroll demo
	let feed = $state(makeRows(1, 30));
	let loading = $state(false);
	let hasMore = $derived(feed.length < 120);

	async function loadMore() {
		loading = true;
		// Stand in for a network round trip.
		await new Promise((r) => setTimeout(r, 700));
		feed = [...feed, ...makeRows(feed.length + 1, 30)];
		loading = false;
	}

	let empty = $state<Row[]>([]);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

{#snippet row(item: Row)}
	<ListItem title={item.name} subtitle={item.email}>
		{#snippet leading()}
			<Avatar name={item.name} size="sm" />
		{/snippet}
		{#snippet trailing()}
			<Text size="sm" variant="secondary">#{item.id}</Text>
		{/snippet}
	</ListItem>
{/snippet}

{#snippet mixedRow(item: Row, index: number)}
	<div class="mixed-row" class:tall={index % 3 === 0}>
		<Text size="sm">{item.name}</Text>
		<Text size="sm" variant="secondary">
			{index % 3 === 0 ? '96px row' : '56px row'} · index {index}
		</Text>
	</div>
{/snippet}

{#snippet emptyState()}
	<Flex gap="sm" align="center" justify="center" style="height: 100%;">
		<Text variant="secondary">Nothing here yet</Text>
		<Button variant="secondary" label="Add 200 rows" onclick={() => (empty = makeRows(1, 200))} />
	</Flex>
{/snippet}

{#snippet loadingState()}
	<Flex direction="horizontal" gap="sm" align="center" justify="center" style="padding: 1rem;">
		<Spinner size={14} />
		<Text size="sm" variant="secondary">Loading more…</Text>
	</Flex>
{/snippet}

{#snippet endState()}
	<Flex justify="center" style="padding: 1rem;">
		<Text size="sm" variant="secondary">End of feed — {feed.length} rows</Text>
	</Flex>
{/snippet}

<svelte:head><title>Virtual List | Glow UI</title></svelte:head>

<Heading level={1}>Virtual List</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Renders only the rows in view, so list length stops mattering. It handles fixed and variable row
	heights, infinite scroll, and empty/loading/end states.
	<Link href="/components/table">Table</Link> uses it internally for large datasets — reach for
	<Code>VirtualList</Code> directly when your rows aren't a table.
</Text>

<Card title="50,000 rows" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Scroll it. Only the visible window plus a few overscan rows exist in the DOM at any moment — the
		range readout below updates as you go.
	</Text>
	<div class="frame">
		<VirtualList
			items={big}
			itemHeight={57}
			renderItem={row}
			height="100%"
			onVisibleRangeChange={(start, end) => (visibleRange = { start, end })}
		/>
	</div>
	<Flex direction="horizontal" gap="sm" align="center" style="margin-top: 0.75rem;">
		<Pill label={`rows ${visibleRange.start}–${visibleRange.end}`} variant="outlined" />
		<Text size="sm" variant="secondary">of {big.length.toLocaleString()} mounted</Text>
	</Flex>
</Card>

<Card title="Variable row heights" id="variable">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>itemHeight</Code> also accepts a function. Offsets are accumulated once and the first
		visible row is found by binary search, so mixed heights cost the same to scroll as fixed ones — but
		the function must be cheap and stable, since it's called per row.
	</Text>
	<div class="frame short">
		<VirtualList items={mixed} itemHeight={heightFor} renderItem={mixedRow} height="100%" gap={4} />
	</div>
</Card>

<Card title="Infinite scroll" id="infinite">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>onLoadMore</Code> fires when the scroll position comes within <Code>threshold</Code> pixels
		of the bottom, as long as <Code>hasMore</Code> is true and <Code>loading</Code> is false — so it
		won't double-fire while a fetch is in flight. Scroll to the bottom to pull the next 30 rows.
	</Text>
	<div class="frame short">
		<VirtualList
			items={feed}
			itemHeight={57}
			renderItem={row}
			height="100%"
			{hasMore}
			{loading}
			onLoadMore={loadMore}
			{loadingState}
			{endState}
			threshold={120}
		/>
	</div>
</Card>

<Card title="Empty state" id="empty">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>emptyState</Code> replaces the list body when <Code>items</Code> is empty.
	</Text>
	<div class="frame short">
		<VirtualList items={empty} itemHeight={57} renderItem={row} height="100%" {emptyState} />
	</div>
	{#if empty.length > 0}
		<Button
			variant="ghost"
			label="Clear"
			icon="X"
			onclick={() => (empty = [])}
			style="margin-top: 0.75rem;"
		/>
	{/if}
</Card>

<Card title="Overscan" id="overscan">
	<Text variant="secondary" size="sm">
		<Code>overscan</Code> is how many extra rows are rendered above and below the viewport. The
		default of 3 is a deliberate trade: enough that fast flicks don't flash blank space, few enough
		that the DOM stays small. Raise it if you see gaps while scrolling on slower devices; lower it if
		each row is expensive to mount.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { VirtualList, ListItem } from 'glow';

  let items = $state([]);
  let loading = $state(false);
  let hasMore = $state(true);

  async function loadMore() {
    loading = true;
    const next = await fetchPage(items.length);
    items = [...items, ...next];
    hasMore = next.length > 0;
    loading = false;
  }
<\/script>

{#snippet row(item)}
  <ListItem title={item.name} subtitle={item.email} />
{/snippet}

<VirtualList
  {items}
  itemHeight={57}
  renderItem={row}
  height="600px"
  {hasMore}
  {loading}
  onLoadMore={loadMore}
/>`}
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
			{ prop: 'items', type: 'T[]', default: '[]', description: 'The full dataset. Only the visible window is rendered.' },
			{ prop: 'itemHeight', type: 'number | (item, index) => number', default: '60', description: 'Required. Row height in px, or a function for variable heights.' },
			{ prop: 'renderItem', type: 'Snippet<[T, number]>', default: '—', description: 'Required. Row snippet, called with the item and its index.' },
			{ prop: 'height', type: 'string | number', default: '100%', description: 'Container height. Must resolve to something concrete for virtualisation to work.' },
			{ prop: 'gap', type: 'number', default: '0', description: 'Pixel gap between rows, included in offset maths.' },
			{ prop: 'overscan', type: 'number', default: '3', description: 'Extra rows rendered above and below the viewport.' },
			{ prop: 'hasMore', type: 'boolean', default: 'false', description: 'Whether more rows can be loaded.' },
			{ prop: 'loading', type: 'boolean', default: 'false', description: 'Suppresses further onLoadMore calls while true.' },
			{ prop: 'onLoadMore', type: '() => Promise<void> | void', default: '—', description: 'Fired near the bottom when hasMore is true and loading is false.' },
			{ prop: 'threshold', type: 'number', default: '200', description: 'Distance from the bottom, in px, that triggers onLoadMore.' },
			{ prop: 'emptyState', type: 'Snippet', default: '—', description: 'Shown when items is empty.' },
			{ prop: 'loadingState', type: 'Snippet', default: '—', description: 'Shown at the bottom while loading.' },
			{ prop: 'endState', type: 'Snippet', default: '—', description: 'Shown at the bottom when hasMore is false.' },
			{ prop: 'onScroll', type: '(scrollTop, scrollHeight) => void', default: '—', description: 'Raw scroll callback.' },
			{ prop: 'onVisibleRangeChange', type: '(start, end) => void', default: '—', description: 'Fired when the rendered index range changes.' }
		]}
	/>
</Card>

<Card title="Gotchas" id="gotchas">
	<Flex gap="sm">
		<Text size="sm">
			<strong>Give it a real height.</strong> The default <Code>100%</Code> only works if the parent
			has a resolved height. Inside an auto-height container the list collapses and virtualisation
			has nothing to measure.
		</Text>
		<Text size="sm">
			<strong>Keep <Code>itemHeight</Code> honest.</strong> Rows are absolutely positioned from the
			declared height. If the real row is taller, content overlaps — measure once and hard-code it, or
			return the exact height from the function.
		</Text>
		<Text size="sm">
			<strong>Append, don't mutate.</strong> Reassign <Code>items</Code> (<Code
				>items = [...items, ...next]</Code
			>) so the offset table recomputes.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	.frame {
		height: 400px;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		overflow: hidden;
	}

	.frame.short {
		height: 300px;
	}

	.mixed-row {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15rem;
		height: 100%;
		padding: 0 0.75rem;
		border-radius: 8px;
		background: var(--glow-bg-surface-element);
	}

	.mixed-row.tall {
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
	}
</style>
