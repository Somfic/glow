<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Button from '$lib/button/Button.svelte';

	const gaps = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
	const aligns = ['start', 'center', 'end', 'stretch'] as const;
	const justifies = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

{#snippet box(label: string)}
	<div class="box">{label}</div>
{/snippet}

<svelte:head><title>Layout | Glow UI</title></svelte:head>

<Heading level={1}>Layout</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Four primitives that cover the layout you'd otherwise hand-roll with inline styles:
	<Code>Flex</Code>, <Code>Grid</Code>, <Code>Spacer</Code>, and <Code>Divider</Code>. All of them take
	a shared gap scale, so spacing stays consistent across a page.
</Text>

<Card title="Flex direction" id="flex-direction">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>vertical</Code> is the default — it's the direction you want most often when stacking
		sections.
	</Text>
	<Flex direction="horizontal" gap="lg" align="start">
		<div style="flex: 1;">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">vertical</Text>
			<Flex gap="sm">
				{@render box('1')}
				{@render box('2')}
				{@render box('3')}
			</Flex>
		</div>
		<div style="flex: 1;">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">horizontal</Text>
			<Flex direction="horizontal" gap="sm">
				{@render box('1')}
				{@render box('2')}
				{@render box('3')}
			</Flex>
		</div>
	</Flex>
</Card>

<Card title="Gap scale" id="gap">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Shared by <Code>Flex</Code> and <Code>Grid</Code>. Pass a raw CSS length instead when you need
		something off-scale.
	</Text>
	<Flex gap="md">
		{#each gaps as gap}
			<Flex direction="horizontal" gap="md" align="center">
				<div style="width: 3.5rem;"><Code>{gap}</Code></div>
				<Flex direction="horizontal" {gap}>
					{@render box('')}
					{@render box('')}
					{@render box('')}
					{@render box('')}
				</Flex>
			</Flex>
		{/each}
	</Flex>
</Card>

<Card title="Justify" id="justify">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Main-axis distribution. Maps onto the <Code>flex-*</Code> / <Code>space-*</Code> values without
		you having to remember which prefix each one takes.
	</Text>
	<Flex gap="sm">
		{#each justifies as justify}
			<div>
				<Text size="sm" variant="secondary" style="margin-bottom: 0.25rem;"><Code>{justify}</Code></Text>
				<div class="track">
					<Flex direction="horizontal" gap="none" {justify} style="height: 100%;">
						{@render box('a')}
						{@render box('b')}
						{@render box('c')}
					</Flex>
				</div>
			</div>
		{/each}
	</Flex>
</Card>

<Card title="Align" id="align">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Cross-axis alignment. <Code>stretch</Code> is useful for equal-height columns.
	</Text>
	<Flex direction="horizontal" gap="lg">
		{#each aligns as align}
			<div style="flex: 1;">
				<Text size="sm" variant="secondary" style="margin-bottom: 0.25rem;"><Code>{align}</Code></Text>
				<div class="track tall">
					<Flex direction="horizontal" gap="sm" {align} style="height: 100%;">
						<div class="box short">a</div>
						<div class="box">b</div>
						<div class="box tall-box">c</div>
					</Flex>
				</div>
			</div>
		{/each}
	</Flex>
</Card>

<Card title="Grid — responsive columns" id="grid-min">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>min</Code> is the column width below which tracks wrap. This is the
		<Code>repeat(auto-fit, minmax(min, 1fr))</Code> pattern — resize the window to see it reflow.
	</Text>
	<Grid min="140px" gap="sm">
		{#each Array(7) as _, i}
			{@render box(String(i + 1))}
		{/each}
	</Grid>
</Card>

<Card title="Grid — fixed columns" id="grid-cols">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>cols</Code> pins the track count and overrides <Code>min</Code>. Tracks use
		<Code>minmax(0, 1fr)</Code>, so long content shrinks instead of blowing out the grid.
	</Text>
	<Grid cols={4} gap="sm">
		{#each Array(8) as _, i}
			{@render box(String(i + 1))}
		{/each}
	</Grid>
</Card>

<Card title="Grid — auto-fit vs auto-fill" id="grid-auto">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		With only two items and room for more, <Code>fit</Code> (default) collapses the empty tracks and
		lets the items grow; <Code>fill</Code> keeps them reserved. Reach for <Code>fill</Code> only when
		trailing empty cells are intentional.
	</Text>
	<Text size="sm" variant="secondary" style="margin-bottom: 0.25rem;"><Code>auto="fit"</Code></Text>
	<Grid min="120px" auto="fit" gap="sm" style="margin-bottom: 1rem;">
		{@render box('1')}
		{@render box('2')}
	</Grid>
	<Text size="sm" variant="secondary" style="margin-bottom: 0.25rem;"><Code>auto="fill"</Code></Text>
	<Grid min="120px" auto="fill" gap="sm">
		{@render box('1')}
		{@render box('2')}
	</Grid>
</Card>

<Card title="Spacer" id="spacer">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		With no <Code>size</Code> it grows to eat the remaining space — the idiomatic way to push a
		trailing item to the far edge of a row. With a <Code>size</Code> it's a fixed gap.
	</Text>
	<div class="track">
		<Flex direction="horizontal" gap="sm" align="center" style="height: 100%;">
			{@render box('left')}
			<Spacer />
			{@render box('right')}
		</Flex>
	</div>
	<Text size="sm" variant="secondary" style="margin: 1rem 0 0.25rem;">
		<Code>size="4rem"</Code> between the first two
	</Text>
	<div class="track">
		<Flex direction="horizontal" gap="none" align="center" style="height: 100%;">
			{@render box('a')}
			<Spacer size="4rem" />
			{@render box('b')}
			{@render box('c')}
		</Flex>
	</div>
</Card>

<Card title="Divider" id="divider">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A hairline rule with a spacing scale baked into its margins, so consecutive sections don't need
		their own margin bookkeeping.
	</Text>
	<Text>Above the divider</Text>
	<Divider />
	<Text>Below the divider</Text>
	<Divider spacing="lg" />
	<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">
		Vertical, for separating inline controls:
	</Text>
	<Flex direction="horizontal" gap="sm" align="center">
		<Button variant="ghost" label="Edit" />
		<Divider orientation="vertical" spacing="sm" />
		<Button variant="ghost" label="Duplicate" />
		<Divider orientation="vertical" spacing="sm" />
		<Button variant="ghost" label="Delete" />
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Flex, Grid, Spacer, Divider } from 'glow';
<\/script>

<!-- A toolbar: title on the left, actions pushed right -->
<Flex direction="horizontal" gap="sm" align="center">
  <Heading level={2}>Issues</Heading>
  <Spacer />
  <Button label="New issue" variant="primary" />
</Flex>

<Divider />

<!-- A responsive card grid -->
<Grid min="280px" gap="md">
  {#each projects as project}
    <Card title={project.name} description={project.summary} />
  {/each}
</Grid>`}
	/>
</Card>

<Card title="Flex props" id="flex-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'direction', type: "'vertical' | 'horizontal'", default: 'vertical', description: 'Axis children are laid out along.' },
			{ prop: 'gap', type: 'GapSize | string', default: 'md', description: 'Scale token, or any CSS length.' },
			{ prop: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", default: '—', description: 'Cross-axis alignment.' },
			{ prop: 'justify', type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'", default: '—', description: 'Main-axis distribution.' },
			{ prop: 'wrap', type: 'boolean', default: 'false', description: 'Allow children to wrap onto new lines.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>
</Card>

<Card title="Grid props" id="grid-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'min', type: 'string', default: '200px', description: 'Minimum column width before wrapping. Ignored when cols is set.' },
			{ prop: 'cols', type: 'number', default: '—', description: 'Fixed column count. Overrides min.' },
			{ prop: 'auto', type: "'fit' | 'fill'", default: 'fit', description: 'Whether unfilled tracks collapse (fit) or stay reserved (fill).' },
			{ prop: 'gap', type: 'GapSize | string', default: 'md', description: 'Scale token, or any CSS length.' },
			{ prop: 'align', type: 'Align', default: '—', description: 'Cross-axis alignment of items within their cell.' },
			{ prop: 'justify', type: 'Justify', default: '—', description: "Distribution when tracks don't fill the container." }
		]}
	/>
</Card>

<Card title="Spacer & Divider props" id="spacer-divider-props">
	<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>Spacer</Code></Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'size', type: 'string', default: '—', description: 'Fixed size. When omitted the spacer grows to fill remaining space.' }
		]}
	/>
	<Text size="sm" variant="secondary" style="margin: 1.5rem 0 0.5rem;"><Code>Divider</Code></Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal', description: 'Horizontal spans the container width; vertical stretches to the row height.' },
			{ prop: 'spacing', type: "'none' | 'sm' | 'md' | 'lg'", default: 'md', description: 'Margin along the rule’s axis.' }
		]}
	/>
</Card>

<Card title="Gap scale reference" id="scale">
	<Table
		variant="simple"
		columns={[
			{ key: 'token', label: 'Token', render: codeCell },
			{ key: 'value', label: 'Value', render: codeCell }
		]}
		data={[
			{ token: 'none', value: '0' },
			{ token: 'xs', value: '0.25rem' },
			{ token: 'sm', value: '0.5rem' },
			{ token: 'md', value: '1rem' },
			{ token: 'lg', value: '1.5rem' },
			{ token: 'xl', value: '2rem' }
		]}
	/>
</Card>

<style lang="scss">
	.box {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0 0.75rem;
		border-radius: 6px;
		background: var(--glow-bg-surface-element);
		border: 1px solid var(--glow-border-color);
		color: var(--glow-fg-secondary);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	.box.short {
		height: 1.5rem;
	}

	.box.tall-box {
		height: 3.5rem;
	}

	.track {
		border: 1px dashed var(--glow-border-strong);
		border-radius: 8px;
		padding: 0.5rem;
		height: 3.5rem;
	}

	.track.tall {
		height: 5rem;
	}
</style>
