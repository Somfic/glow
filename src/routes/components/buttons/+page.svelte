<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	// Async action for loading demo
	async function simulateAsync() {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		alert('Action completed!');
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Buttons | Glow UI</title></svelte:head>

<Heading level={1}>Buttons</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Versatile button components with multiple variants, icons, and loading states.
	</Text>

	<Group label="Button Variants" id="button-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Four visual variants for different levels of emphasis
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<Button label="Primary" variant="primary" />
			<Button label="Secondary" variant="secondary" />
			<Button label="Ghost" variant="ghost" />
			<Button icon="Trash" label="Delete" variant="danger" />
		</div>
	</Group>

	<Group label="Buttons with Icons" id="buttons-with-icons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Add icons to buttons for better visual recognition
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<Button label="Regular button" />
			<Button icon="Heart" label="With icon" variant="secondary" />
			<Button icon="Trash" label="Delete" variant="danger" />
		</div>
	</Group>

	<Group label="Icon-Only Buttons" id="icon-only-buttons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Compact buttons with only an icon (no label)
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<Button icon="Info" />
			<Button icon="Volleyball" />
			<Button icon="Heart" variant="secondary" />
			<Button icon="Trash" variant="ghost" />
		</div>
	</Group>

	<Group label="Loading State" id="button-loading-state">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Buttons automatically show loading state during async operations. The cursor also shows a
			spinner!
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<Button label="Click me (2s delay)" onclick={simulateAsync} />
			<Button icon="Download" label="Download" variant="secondary" onclick={simulateAsync} />
		</div>
	</Group>

	<Group label="Button Group" id="button-group">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Group related buttons together with connected borders
		</Text>
		<ButtonGroup>
			<Button label="First" />
			<Button icon="Volleyball" />
			<Button label="Third" />
		</ButtonGroup>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="basic-button">Basic Button</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Button } from 'glow-ui';
</script>

<Button label="Click me" variant="primary" />
<Button icon="Heart" label="Like" variant="secondary" />
<Button icon="Trash" variant="ghost" />`}
		/>

		<Heading level={3} id="async-button">Async Button</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  async function handleClick() {
    await fetch('/api/save');
    alert('Saved!');
  }
</script>

<Button label="Save" onclick={handleClick} />`}
		/>

		<Heading level={3} id="button-group-usage">Button Group</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { ButtonGroup, Button } from 'glow-ui';
</script>

<ButtonGroup>
  <Button label="First" />
  <Button label="Second" />
  <Button label="Third" />
</ButtonGroup>`}
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
				{ prop: 'label', type: 'string', default: '-', description: 'Button text label' },
				{ prop: 'icon', type: 'IconName', default: '-', description: 'Icon to display' },
				{ prop: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'danger'", default: "'primary'", description: 'Visual style variant' },
				{ prop: 'onclick', type: '() => void | Promise&lt;void&gt;', default: '-', description: 'Click handler (supports async)' },
				{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disable button interactions' }
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🎨 Four visual variants (primary, secondary, ghost, danger)</Text></li>
			<li><Text>🎯 Icon support with automatic cursor mirroring</Text></li>
			<li><Text>⏳ Automatic loading state for async operations</Text></li>
			<li><Text>📐 Consistent 32px size across all buttons</Text></li>
			<li><Text>🎭 Icon-only mode (no label)</Text></li>
			<li><Text>🔗 Button groups for connected layouts</Text></li>
			<li><Text>♿ Fully accessible with proper ARIA attributes</Text></li>
		</ul>
	</Group>
