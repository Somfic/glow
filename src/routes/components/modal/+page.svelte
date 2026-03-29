<script lang="ts">
	import Input from '$lib/input/Input.svelte';

	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Modal from '$lib/modal/Modal.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	let demoModal: any;
	let confirmModal: any;
	let largeModal: any;
	let smallModal: any;
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Modal | Glow UI</title></svelte:head>

<Heading level={1}>Modal</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Accessible modal dialog component with focus management, keyboard navigation, and customizable
	actions.
</Text>

<Group label="Modal Examples" id="modal-examples">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Click the buttons to open different modal variants
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button label="Open Basic Modal" onclick={() => demoModal.open()} />
		<Button label="Open Small Modal" onclick={() => smallModal.open()} variant="secondary" />
		<Button label="Open Confirm Dialog" onclick={() => confirmModal.open()} variant="ghost" />
		<Button label="Open Large Modal" onclick={() => largeModal.open()} />
	</div>
</Group>

<!-- Basic Modal -->
<Modal
	bind:this={demoModal}
	title="Example Modal"
	size="medium"
	actions={[
		{ label: 'Close', onclick: () => demoModal.close() },
		{ label: 'Save', variant: 'primary', onclick: () => demoModal.close() }
	]}
>
	<p>This is a modal dialog with default content.</p>
	<p>
		You can click outside the modal or press Escape to close it. The modal includes focus management
		and keyboard navigation.
	</p>
	<Input type="select" label="Choose an option" options={['Option 1', 'Option 2', 'Option 3']} />
</Modal>

<!-- Small Modal -->
<Modal
	bind:this={smallModal}
	title="Small Modal"
	size="small"
	actions={[{ label: 'Close', onclick: () => smallModal.close() }]}
>
	<p>This is a smaller modal, perfect for simple messages or confirmations.</p>
</Modal>

<!-- Confirm Modal -->
<Modal
	bind:this={confirmModal}
	title="Confirm Delete"
	icon="Trash"
	size="small"
	closeOnBackdropClick={false}
	actions={[
		{ label: 'Cancel', onclick: () => confirmModal.close() },
		{
			label: 'Delete',
			variant: 'primary',
			onclick: () => {
				alert('Item deleted!');
				confirmModal.close();
			}
		}
	]}
>
	<p>Are you sure you want to delete this item? This action cannot be undone.</p>
</Modal>

<!-- Large Modal -->
<Modal
	bind:this={largeModal}
	title="Large Modal with Subtitle"
	subtitle="This demonstrates the subtitle feature"
	icon="Info"
	size="large"
	actions={[{ label: 'Close', onclick: () => largeModal.close() }]}
>
	<p>This modal uses title, subtitle, and icon props for a clean header.</p>
	<p>
		Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		laboris.
	</p>
	<p>
		Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
		pariatur.
	</p>
</Modal>

<Group label="Usage" id="usage">
	<Heading level={3} id="basic-usage">Basic Modal</Heading>
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Modal, Button } from 'glow-ui';

  let modal;
</script>

<Button label="Open Modal" onclick={() => modal.open()} />

<Modal
  bind:this={modal}
  title="Example Modal"
  size="medium"
  actions={[
    { label: 'Close', onclick: () => modal.close() },
    { label: 'Save', variant: 'primary', onclick: () => modal.close() }
  ]}
>
  <p>Modal content goes here.</p>
</Modal>`}
	/>

	<Heading level={3} id="confirm-dialog">Confirm Dialog</Heading>
	<CodeBlock
		language="svelte"
		code={`<script>
  let confirmModal;

  function handleDelete() {
    // Perform delete action
    alert('Deleted!');
    confirmModal.close();
  }
</script>

<Modal
  bind:this={confirmModal}
  title="Confirm Delete"
  icon="Trash"
  size="small"
  closeOnBackdropClick={false}
  actions={[
    { label: 'Cancel', onclick: () => confirmModal.close() },
    { label: 'Delete', variant: 'primary', onclick: handleDelete }
  ]}
>
  <p>Are you sure? This action cannot be undone.</p>
</Modal>`}
	/>

	<Heading level={3} id="with-subtitle">Modal with Subtitle and Icon</Heading>
	<CodeBlock
		language="svelte"
		code={`<Modal
  bind:this={modal}
  title="Title"
  subtitle="Additional context or description"
  icon="Info"
  size="large"
  actions={[
    { label: 'Close', onclick: () => modal.close() }
  ]}
>
  <p>Content here...</p>
</Modal>`}
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
			{ prop: 'title', type: 'string', default: '-', description: 'Modal title' },
			{ prop: 'subtitle', type: 'string', default: '-', description: 'Optional subtitle' },
			{ prop: 'icon', type: 'IconName', default: '-', description: 'Optional header icon' },
			{
				prop: 'size',
				type: "'small' | 'medium' | 'large'",
				default: "'medium'",
				description: 'Modal width'
			},
			{
				prop: 'actions',
				type: 'ModalAction[]',
				default: '[]',
				description: 'Footer action buttons'
			},
			{
				prop: 'closeOnBackdropClick',
				type: 'boolean',
				default: 'true',
				description: 'Allow closing by clicking backdrop'
			}
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
			{ method: 'open()', description: 'Open the modal' },
			{ method: 'close()', description: 'Close the modal' }
		]}
	/>
</Group>

<Group label="Action Type" id="action-type">
	<CodeBlock
		language="typescript"
		code={`interface ModalAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onclick: () => void;
}`}
	/>
</Group>

<Group label="Features" id="features">
	<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
		<li><Text>🎯 Focus trap - keeps keyboard focus inside modal</Text></li>
		<li><Text>⌨️ Escape key to close</Text></li>
		<li><Text>🖱️ Click outside to close (configurable)</Text></li>
		<li><Text>🎨 Three size variants (small, medium, large)</Text></li>
		<li><Text>🏷️ Optional icon and subtitle in header</Text></li>
		<li><Text>⚡ Customizable action buttons in footer</Text></li>
		<li><Text>📱 Responsive and mobile-friendly</Text></li>
		<li><Text>♿ Fully accessible with ARIA attributes</Text></li>
	</ul>
</Group>
