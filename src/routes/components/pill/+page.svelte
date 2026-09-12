<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from "$lib/card/Card.svelte";
	import Pill from '$lib/pill/Pill.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Input from '$lib/input/Input.svelte';
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Pill | Glow UI</title></svelte:head>

<Heading level={1}>Pill</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Compact labels for tags, categories, and status indicators. Supports text, icons, and images.
	</Text>

	<Card title="Basic" id="basic">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Simple text pills for tags and labels
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill label="Design" />
			<Pill label="Frontend" />
			<Pill label="Svelte" />
		</div>
	</Card>

	<Card title="Sizes" id="sizes">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			<Code>sm</Code> is the default, for pills inline in a table cell or a list row.
			<Code>md</Code> is exactly as tall as an Input, so a pill can sit in a row with one.
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill icon="Tag" label="Small" />
			<Pill icon="Tag" label="Medium" size="md" />
		</div>
		<div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; max-width: 24rem;">
			<Input type="text" value="" placeholder="Sits flush beside an input" />
			<Pill icon="Check" label="Saved" size="md" color="#22c55e" />
		</div>
	</Card>

	<Card title="With Icons" id="icons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Pills with leading icons for visual context
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill icon="Star" label="Featured" />
			<Pill icon="Check" label="Verified" />
			<Pill icon="AlertTriangle" label="Warning" />
			<Pill icon="Clock" label="Pending" />
		</div>
	</Card>

	<Card title="Colored" id="colored">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Tinted pills for semantic meaning or categorization
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill icon="Check" label="Success" color="#22c55e" />
			<Pill icon="AlertTriangle" label="Warning" color="#f59e0b" />
			<Pill icon="X" label="Error" color="#ef4444" />
			<Pill icon="Info" label="Info" color="#3b82f6" />
			<Pill icon="Star" label="Featured" color="#a855f7" />
			<Pill label="Custom" color="#ec4899" />
		</div>
	</Card>

	<Card title="With Images" id="images">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Image-only avatars and image + label combinations
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill image="https://i.pravatar.cc/100?img=1" />
			<Pill image="https://i.pravatar.cc/100?img=2" />
			<Pill image="https://i.pravatar.cc/100?img=3" />
		</div>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
			<Pill image="https://i.pravatar.cc/100?img=1" label="Alice" />
			<Pill image="https://i.pravatar.cc/100?img=2" label="Bob" />
			<Pill image="https://i.pravatar.cc/100?img=3" label="Charlie" />
		</div>
	</Card>

	<Card title="Interactive" id="interactive">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			An <Code>onclick</Code> or an <Code>href</Code> makes the pill a button or a link, which
			hovers and takes focus. <Code>selected</Code> inverts it, for a filter row.
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill label="All" selected onclick={() => {}} />
			<Pill label="Design" onclick={() => {}} />
			<Pill label="Frontend" onclick={() => {}} />
			<Pill label="Outlined" variant="outlined" onclick={() => {}} />
			<Pill icon="ExternalLink" label="Docs" href="#interactive" />
		</div>
	</Card>

	<Card title="Removable" id="removable">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Pills with a remove button for dismissible tags
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill label="Svelte" onRemove={() => {}} />
			<Pill label="TypeScript" onRemove={() => {}} />
			<Pill icon="Tag" label="Design" onRemove={() => {}} />
		</div>
	</Card>

	<Card title="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Pill } from 'glow-ui';
<\/script>

<!-- Text pill -->
<Pill label="Tag" />

<!-- With icon -->
<Pill icon="Star" label="Featured" />

<!-- Colored -->
<Pill icon="Check" label="Success" color="#22c55e" />

<!-- Image pill -->
<Pill image="/avatar.jpg" label="User" />

<!-- Removable -->
<Pill label="Dismiss me" onRemove={() => handleRemove()} />

<!-- Input-height, to sit in a row with a control -->
<Pill icon="Check" label="Saved" size="md" />`}
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
				{ prop: 'label', type: 'string', default: '-', description: 'Text label (required for text/icon pills)' },
				{ prop: 'icon', type: 'IconName', default: '-', description: 'Leading icon name' },
				{ prop: 'image', type: 'string', default: '-', description: 'Image URL (creates avatar-style pill)' },
				{ prop: 'color', type: 'string', default: '-', description: 'Tint color for background, border, and text' },
				{ prop: 'size', type: "'sm' | 'md'", default: "'sm'", description: 'Font size of the pill; its height follows. md matches an Input' },
				{ prop: 'variant', type: "'filled' | 'outlined'", default: "'filled'", description: 'Outlined drops the fill and keeps the border' },
				{ prop: 'selected', type: 'boolean', default: 'false', description: 'Renders as an inverted (or solid color) pill' },
				{ prop: 'href', type: 'string', default: '-', description: 'Renders the pill as a link' },
				{ prop: 'onclick', type: '(e: MouseEvent) => void', default: '-', description: 'Renders the pill as a button' },
				{ prop: 'onRemove', type: '() => void', default: '-', description: 'Remove callback (shows X button)' }
			]}
		/>
	</Card>
