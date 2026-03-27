<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Spinner from '$lib/spinner/Spinner.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Spinner | Glow UI</title></svelte:head>

<Heading level={1}>Spinner</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Loading indicator for async operations.
</Text>

<Group label="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Spinners at different sizes
	</Text>
	<div style="display: flex; gap: 1.5rem; align-items: center;">
		<Spinner size={12} />
		<Spinner size={16} />
		<Spinner size={24} />
		<Spinner size={32} />
		<Spinner size={48} />
	</div>
</Group>

<Group label="Colors" id="colors">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Custom spinner colors
	</Text>
	<div style="display: flex; gap: 1.5rem; align-items: center;">
		<Spinner size={24} />
		<Spinner size={24} color="#ef4444" />
		<Spinner size={24} color="#22c55e" />
		<Spinner size={24} color="#3b82f6" />
		<Spinner size={24} color="#eab308" />
	</div>
</Group>

<Group label="Inline with Text" id="inline">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Spinners work inline with text content
	</Text>
	<Text>
		<Spinner size={14} /> Loading results...
	</Text>
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Spinner } from 'glow-ui';
</script>

<Spinner />
<Spinner size={24} />
<Spinner size={32} color="#ef4444" />`}
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
			{ prop: 'size', type: 'number | string', default: '16', description: 'Spinner size (number for px, or CSS string)' },
			{ prop: 'color', type: 'string', default: 'primary', description: 'Spinner color (any CSS color value)' }
		]}
	/>
</Group>
