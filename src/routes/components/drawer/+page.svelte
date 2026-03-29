<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import Drawer from '$lib/drawer/Drawer.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Input from '$lib/input/Input.svelte';

	let rightDrawer: Drawer;
	let leftDrawer: Drawer;
	let smallDrawer: Drawer;
	let largeDrawer: Drawer;
	let formDrawer: Drawer;
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Drawer | Glow UI</title></svelte:head>

<Heading level={1}>Drawer</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Slide-in panel from the edge of the screen for secondary content, forms, and detail views.
</Text>

<Group label="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Drawers slide in from the right by default. Click the backdrop or press Escape to close.
	</Text>
	<div style="display: flex; gap: 0.5rem;">
		<Button label="Open right drawer" onclick={() => rightDrawer.open()} />
		<Button label="Open left drawer" variant="secondary" onclick={() => leftDrawer.open()} />
	</div>
</Group>

<Group label="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Available in small (320px), medium (420px), and large (600px). Goes full-width on mobile.
	</Text>
	<div style="display: flex; gap: 0.5rem;">
		<Button label="Small" variant="secondary" onclick={() => smallDrawer.open()} />
		<Button label="Large" variant="secondary" onclick={() => largeDrawer.open()} />
	</div>
</Group>

<Group label="With form" id="form">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Drawers can contain forms with action buttons in the footer.
	</Text>
	<Button label="Edit profile" onclick={() => formDrawer.open()} />
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Drawer, Button } from 'glow-ui';

  let drawer;
</script>

<Button label="Open" onclick={() => drawer.open()} />

<Drawer
  bind:this={drawer}
  title="Details"
  subtitle="View and edit"
  icon="Settings"
  side="right"
  size="medium"
  actions={[
    { label: 'Cancel', variant: 'secondary', onclick: () => drawer.close() },
    { label: 'Save', variant: 'primary', onclick: () => drawer.close() }
  ]}
>
  <p>Drawer content goes here.</p>
</Drawer>`}
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
			{ prop: 'title', type: 'string', default: '-', description: 'Drawer heading' },
			{ prop: 'subtitle', type: 'string', default: '-', description: 'Secondary heading text' },
			{ prop: 'icon', type: 'IconName', default: '-', description: 'Header icon' },
			{ prop: 'actions', type: 'Action[]', default: '[]', description: 'Footer action buttons' },
			{ prop: 'size', type: "'small' | 'medium' | 'large'", default: "'medium'", description: 'Drawer width (320/420/600px)' },
			{ prop: 'side', type: "'left' | 'right'", default: "'right'", description: 'Which edge to slide from' },
			{ prop: 'showCloseButton', type: 'boolean', default: 'true', description: 'Show close button in header' },
			{ prop: 'closeOnBackdropClick', type: 'boolean', default: 'true', description: 'Close when clicking backdrop' },
			{ prop: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on Escape key' },
			{ prop: 'onClose', type: '() => void', default: '-', description: 'Callback when drawer closes' },
			{ prop: 'onOpen', type: '() => void', default: '-', description: 'Callback when drawer opens' }
		]}
	/>
</Group>

<Group label="Methods" id="methods">
	<Table
		variant="simple"
		columns={[
			{ key: 'method', label: 'Method', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ method: 'open()', description: 'Opens the drawer' },
			{ method: 'close()', description: 'Closes the drawer' },
			{ method: 'toggle()', description: 'Toggles the drawer open/closed' },
			{ method: 'isOpenState()', description: 'Returns whether the drawer is open' }
		]}
	/>
</Group>

<!-- Drawer instances -->

<Drawer bind:this={rightDrawer} title="Right drawer" subtitle="Slides in from the right" icon="PanelRight">
	<Text>This is a standard right-side drawer. It's great for detail views, settings panels, or any secondary content.</Text>
</Drawer>

<Drawer bind:this={leftDrawer} title="Left drawer" side="left" icon="PanelLeft">
	<Text>This drawer slides in from the left. Useful for navigation or filter panels.</Text>
</Drawer>

<Drawer bind:this={smallDrawer} title="Small drawer" size="small">
	<Text>A compact 320px drawer for quick actions or simple content.</Text>
</Drawer>

<Drawer bind:this={largeDrawer} title="Large drawer" size="large" icon="Maximize2">
	<Text>A wider 600px drawer for complex content, forms, or data tables.</Text>
</Drawer>

<Drawer
	bind:this={formDrawer}
	title="Edit profile"
	icon="User"
	actions={[
		{ label: 'Cancel', variant: 'secondary', onclick: () => formDrawer.close() },
		{ label: 'Save changes', variant: 'primary', onclick: () => formDrawer.close() }
	]}
>
	<div style="display: flex; flex-direction: column; gap: 1rem;">
		<Input type="text" label="Name" placeholder="Jane Cooper" />
		<Input type="text" label="Email" placeholder="jane@example.com" />
		<Input type="textarea" label="Bio" placeholder="Tell us about yourself..." />
	</div>
</Drawer>
