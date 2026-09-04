<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Skeleton from '$lib/skeleton/Skeleton.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	let loading = $state(true);

	const people = [
		{ name: 'Ada Lovelace', role: 'Analytical engines' },
		{ name: 'Grace Hopper', role: 'Compilers' },
		{ name: 'Alan Turing', role: 'Computability' }
	];
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Skeleton | Glow UI</title></svelte:head>

<Heading level={1}>Skeleton</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Shimmering placeholders that hold a layout's shape while its data loads. Use a skeleton when you
	know what's coming and roughly how big it is; reach for a
	<Link href="/components/spinner">Spinner</Link> when you don't.
</Text>

<Card title="Shapes" id="shapes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>rect</Code> is the generic block. <Code>text</Code> is thinner with a tighter radius, sized
		in <Code>em</Code> so it tracks the surrounding font size. <Code>circle</Code> forces height to
		match width.
	</Text>
	<Flex gap="lg">
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>rect</Code></Text>
			<Skeleton width={220} height={48} />
		</div>
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>text</Code></Text>
			<Skeleton shape="text" width={220} />
		</div>
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>circle</Code></Text>
			<Skeleton shape="circle" width={48} />
		</div>
	</Flex>
</Card>

<Card title="Sizing" id="sizing">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Numbers are treated as pixels; strings pass through as-is, so percentages and
		<Code>calc()</Code> both work. With no <Code>width</Code> the skeleton fills its container.
	</Text>
	<Flex gap="sm">
		<Skeleton height={12} />
		<Skeleton width="75%" height={12} />
		<Skeleton width="50%" height={12} />
		<Skeleton width={120} height={12} />
	</Flex>
</Card>

<Card title="Paragraphs" id="count">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>count</Code> stacks rows with consistent spacing — one prop instead of an
		<Code>{'{#each}'}</Code> block.
	</Text>
	<Skeleton shape="text" count={4} />
</Card>

<Card title="Swapping in real content" id="swap">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The point of a skeleton is that nothing jumps when the data lands. Toggle the button and watch the
		rows stay put.
	</Text>
	<Button
		variant="secondary"
		label={loading ? 'Load data' : 'Reset to loading'}
		onclick={() => (loading = !loading)}
		style="margin-bottom: 1rem;"
	/>
	<Flex gap="md">
		{#each people as person, i}
			<Flex direction="horizontal" gap="md" align="center">
				{#if loading}
					<Skeleton shape="circle" width={36} />
					<div style="flex: 1;">
						<Skeleton shape="text" width={140} style="margin-bottom: 0.4rem;" />
						<Skeleton shape="text" width={90} />
					</div>
				{:else}
					<Avatar name={person.name} size="md" />
					<div style="flex: 1;">
						<Text>{person.name}</Text>
						<Text size="sm" variant="secondary">{person.role}</Text>
					</div>
				{/if}
			</Flex>
		{/each}
	</Flex>
</Card>

<Card title="Card placeholders" id="cards">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Compose a few skeletons to sketch a whole card, then repeat it across the grid you're about to
		fill.
	</Text>
	<Grid min="200px" gap="md">
		{#each Array(3) as _}
			<div class="card-skeleton">
				<Skeleton height={110} style="margin-bottom: 0.75rem;" />
				<Skeleton shape="text" width="80%" style="margin-bottom: 0.4rem;" />
				<Skeleton shape="text" width="55%" />
			</div>
		{/each}
	</Grid>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Skeleton, Avatar, Text } from 'glow';

  let user = $state(null);
</script>

{#if user}
  <Avatar name={user.name} size="md" />
  <Text>{user.name}</Text>
{:else}
  <Skeleton shape="circle" width={36} />
  <Skeleton shape="text" width={140} />
{/if}

<!-- A four-line paragraph placeholder -->
<Skeleton shape="text" count={4} />`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		Skeletons are decorative: they render with <Code>aria-hidden="true"</Code>, so screen readers skip
		them instead of announcing a wall of empty boxes. Announce the loading state yourself on the
		region that's filling — e.g. <Code>aria-busy="true"</Code> on the container.
	</Text>
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
			{ prop: 'width', type: 'number | string', default: '100%', description: 'Number → px, string → used as-is.' },
			{ prop: 'height', type: 'number | string', default: '1rem (0.9em for text)', description: 'Number → px, string → used as-is. Ignored for circle, which mirrors width.' },
			{ prop: 'shape', type: "'rect' | 'text' | 'circle'", default: 'rect', description: 'Preset height and border radius.' },
			{ prop: 'count', type: 'number', default: '1', description: 'Stacked rows. Renders a spaced group instead of a single bar.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the element (or the group wrapper when count > 1).' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the element (or the group wrapper when count > 1).' }
		]}
	/>
</Card>

<style lang="scss">
	.card-skeleton {
		padding: 0.75rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		background: var(--glow-bg-surface-element);
	}
</style>
