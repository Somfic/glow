<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Pill"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Pill', href: '/components/pill' }
	]}
>
	<Heading level={1}>Pill</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Compact labels for tags, categories, and status indicators. Supports text, icons, and images.
	</Text>

	<Group label="Basic" id="basic">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Simple text pills for tags and labels
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill label="Design" />
			<Pill label="Frontend" />
			<Pill label="Svelte" />
		</div>
	</Group>

	<Group label="With Icons" id="icons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Pills with leading icons for visual context
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill icon="Star" label="Featured" />
			<Pill icon="Check" label="Verified" />
			<Pill icon="AlertTriangle" label="Warning" />
			<Pill icon="Clock" label="Pending" />
		</div>
	</Group>

	<Group label="Colored" id="colored">
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
	</Group>

	<Group label="With Images" id="images">
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
	</Group>

	<Group label="Removable" id="removable">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Pills with a remove button for dismissible tags
		</Text>
		<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
			<Pill label="Svelte" onRemove={() => {}} />
			<Pill label="TypeScript" onRemove={() => {}} />
			<Pill icon="Tag" label="Design" onRemove={() => {}} />
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Pill } from 'glow-ui';
</script>

<!-- Text pill -->
<Pill label="Tag" />

<!-- With icon -->
<Pill icon="Star" label="Featured" />

<!-- Colored -->
<Pill icon="Check" label="Success" color="#22c55e" />

<!-- Image pill -->
<Pill image="/avatar.jpg" label="User" />

<!-- Removable -->
<Pill label="Dismiss me" onRemove={() => handleRemove()} />`}
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
				{ prop: 'label', type: 'string', default: '-', description: 'Text label (required for text/icon pills)' },
				{ prop: 'icon', type: 'IconName', default: '-', description: 'Leading icon name' },
				{ prop: 'image', type: 'string', default: '-', description: 'Image URL (creates avatar-style pill)' },
				{ prop: 'color', type: 'string', default: '-', description: 'Tint color for background, border, and text' },
				{ prop: 'onRemove', type: '() => void', default: '-', description: 'Remove callback (shows X button)' }
			]}
		/>
	</Group>
</Page>
