<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Pagination from '$lib/pagination/Pagination.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	// A stand-in dataset so the demo can show real slicing rather than just
	// moving a page counter around.
	const rows = Array.from({ length: 137 }, (_, i) => ({
		id: i + 1,
		name: `Record ${String(i + 1).padStart(3, '0')}`,
		owner: ['Ada', 'Grace', 'Alan', 'Katherine'][i % 4]
	}));

	let page = $state(1);
	let pageSize = $state(10);
	const visible = $derived(rows.slice((page - 1) * pageSize, page * pageSize));

	let smallPage = $state(1);
	let smallSize = $state(10);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Pagination | Glow UI</title></svelte:head>

<Heading level={1}>Pagination</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A page control with first/prev/next/last, a live range readout, and an optional page-size picker. It
	owns no data — bind <Code>page</Code> and slice yourself. <Link href="/components/table">Table</Link>
	embeds this automatically when you give it a <Code>pageSize</Code>.
</Text>

<Card title="Driving a list" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		{rows.length} records, {pageSize} per page. The control is bound to <Code>page</Code>; the rows
		below are a plain <Code>slice</Code>.
	</Text>
	<div class="rows">
		{#each visible as row (row.id)}
			<div class="row">
				<Text size="sm">{row.name}</Text>
				<Text size="sm" variant="secondary">{row.owner}</Text>
			</div>
		{/each}
	</div>
	<Pagination total={rows.length} bind:page bind:pageSize />
</Card>

<Card title="Page size picker" id="page-size">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <Code>pageSizeOptions</Code> and a select appears on the right. Changing the size resets to
		page 1, so the user never lands past the end.
	</Text>
	<Pagination total={rows.length} bind:page={smallPage} bind:pageSize={smallSize} pageSizeOptions={[5, 10, 25, 50]} />
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Page {smallPage}, {smallSize} per page.
	</Text>
</Card>

<Card title="Edge cases" id="edges">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Total pages is always at least 1, so an empty result set still renders a coherent
		"0–0 of 0" rather than a broken control. If <Code>total</Code> shrinks under you — a filter
		narrowing the set while the user is on page 9 — <Code>page</Code> is clamped back into range
		automatically.
	</Text>
	<Flex gap="lg">
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">Empty</Text>
			<Pagination total={0} />
		</div>
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">Single page</Text>
			<Pagination total={7} />
		</div>
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Pagination } from 'glow';

  let page = $state(1);
  let pageSize = $state(10);

  const visible = $derived(rows.slice((page - 1) * pageSize, page * pageSize));
</script>

{#each visible as row (row.id)}
  <Row {row} />
{/each}

<Pagination
  total={rows.length}
  bind:page
  bind:pageSize
  pageSizeOptions={[10, 25, 50]}
/>`}
	/>
</Card>

<Card title="Server-side paging" id="server">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>total</Code> is the full row count, not the loaded count — so hand it the number the server
		reports and fetch a window whenever <Code>page</Code> changes.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Pagination } from 'glow';

  let page = $state(1);
  let pageSize = $state(25);
  let total = $state(0);
  let rows = $state([]);

  $effect(() => {
    // Re-runs whenever page or pageSize changes.
    fetch('/api/records?page=' + page + '&size=' + pageSize)
      .then((r) => r.json())
      .then((res) => {
        rows = res.rows;
        total = res.total;
      });
  });
</script>

<Pagination {total} bind:page bind:pageSize />`}
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
			{ prop: 'total', type: 'number', default: '—', description: 'Required. Total row count across all pages.' },
			{ prop: 'page', type: 'number', default: '1', description: 'Bindable. Current 1-indexed page. Clamped when total or pageSize changes.' },
			{ prop: 'pageSize', type: 'number', default: '10', description: 'Bindable. Rows per page.' },
			{ prop: 'pageSizeOptions', type: 'number[]', default: '—', description: 'Renders a size picker. Ignored unless it holds more than one option.' }
		]}
	/>
</Card>

<style lang="scss">
	.rows {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;

		&:not(:last-child) {
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		}
	}
</style>
