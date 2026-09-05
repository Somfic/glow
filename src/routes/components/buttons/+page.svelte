<script lang="ts">
	import Icon from '$lib/icon/Icon.svelte';

	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from "$lib/card/Card.svelte";
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

	// Progress demo: tick a percentage up while the async action runs
	let uploadProgress = $state(0);

	// The form demo reports what the form actually did, so `type` is visible on
	// the page rather than only in the DOM.
	let formEvent = $state('nothing yet');

	async function simulateUpload() {
		uploadProgress = 0;
		while (uploadProgress < 100) {
			await new Promise((resolve) => setTimeout(resolve, 120));
			uploadProgress = Math.min(100, uploadProgress + 5);
		}
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

<Card title="Button Variants" id="button-variants">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Six visual variants for different levels of emphasis
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button label="Primary" variant="primary" tooltip="Primary action" />
		<Button label="Secondary" variant="secondary" tooltip="Secondary action" />
		<Button label="Ghost" variant="ghost" tooltip="Ghost action" />
		<Button label="Outlined" variant="outlined" tooltip="Outlined action" />
		<Button label="Dashed" variant="dashed" tooltip="Dashed action" />
		<Button icon="Trash" label="Delete" variant="danger" tooltip="Delete action" />
		<Button icon="Trash" variant="danger" tooltip="Delete action" />
	</div>
</Card>

<Card title="Sizes" id="button-sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Three steps. <Code>sm</Code> is for chrome — a toolbar, a panel header, anything sitting beside
		text rather than in the page's main flow.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button label="Small" size="sm" />
		<Button label="Medium" size="md" />
		<Button label="Large" size="lg" />
	</div>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-top: 0.75rem;">
		<Button icon="Settings" label="Small" size="sm" variant="outlined" />
		<Button icon="Settings" size="sm" variant="ghost" tooltip="Settings" />
		<Button icon="Settings" size="sm" shape="circle" variant="secondary" tooltip="Settings" />
		<Button label="Save" size="sm" shortcut="s" />
		<Button label="Inbox" size="sm" variant="secondary" count={12} />
		<Button label="Upload" size="sm" onclick={simulateUpload} progress={uploadProgress} />
	</div>
</Card>

<Card title="Buttons with Icons" id="buttons-with-icons">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Add icons to buttons for better visual recognition
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button label="Regular button" />
		<Button icon="Heart" label="With icon" variant="secondary" />
		<Button icon={{ name: 'Heart', fill: true }} label="Filled icon" variant="secondary" />
		<Button icon="Trash" label="Delete" variant="danger" />
	</div>
</Card>

<Card title="Icon-Only Buttons" id="icon-only-buttons">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Compact buttons with only an icon (no label)
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button icon="Info" tooltip="More info" />
		<Button icon="Volleyball" tooltip="Sport" />
		<Button icon="Heart" variant="secondary" tooltip="Like" />
		<Button icon={{ name: 'Heart', fill: true }} variant="secondary" tooltip="Liked" />
		<Button icon="Trash" variant="ghost" tooltip="Delete" />
		<Button icon="Settings" variant="outlined" tooltip="Settings" />
	</div>
</Card>

<Card title="Disabled" id="button-disabled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Disabled dims a button. It never hands one a fill or a border it did not already have, so a
		transparent variant stays transparent.
	</Text>
	<div
		style="display: grid; grid-template-columns: repeat(2, max-content); gap: 0.5rem; align-items: center; justify-items: start;"
	>
		<Button label="Primary" />
		<Button label="Primary" disabled />
		<Button label="Secondary" variant="secondary" />
		<Button label="Secondary" variant="secondary" disabled />
		<Button label="Ghost" variant="ghost" />
		<Button label="Ghost" variant="ghost" disabled />
		<Button label="Outlined" variant="outlined" />
		<Button label="Outlined" variant="outlined" disabled />
		<Button label="Dashed" variant="dashed" />
		<Button label="Dashed" variant="dashed" disabled />
		<Button icon="Trash" label="Danger" variant="danger" />
		<Button icon="Trash" label="Danger" variant="danger" disabled />
		<Button icon="Heart" ariaLabel="Like" />
		<Button icon="Heart" ariaLabel="Like" disabled />
	</div>
</Card>

<Card title="Loading State" id="button-loading-state">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Buttons automatically show loading state during async operations. The cursor also shows a
		spinner!
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button label="Click me (2s delay)" onclick={simulateAsync} />
		<Button icon="Download" label="Download" variant="secondary" onclick={simulateAsync} />
	</div>
</Card>

<Card title="Progress" id="button-progress">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <Code>progress</Code> (0-100) to draw a bar along the bottom of the button while it is loading,
		and <Code>progressLabel</Code> to swap the label for live status text.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
		<Button
			label="Upload"
			onclick={simulateUpload}
			progress={uploadProgress}
			progressLabel={`Uploading ${uploadProgress}%`}
		/>
		<Button
			icon="Download"
			label="Download"
			variant="secondary"
			onclick={simulateUpload}
			progress={uploadProgress}
			progressLabel={`${uploadProgress}%`}
		/>
		<Button
			icon="Upload"
			variant="outlined"
			tooltip="Upload"
			onclick={simulateUpload}
			progress={uploadProgress}
		/>
		<Button label="Bar only" variant="ghost" onclick={simulateUpload} progress={uploadProgress} />
	</div>
</Card>

<Card title="Button Group" id="button-group">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Group related buttons together with connected borders
	</Text>
	<ButtonGroup>
		<Button label="First" />
		<Button icon="Volleyball" />
		<Button label="Third" />
	</ButtonGroup>
</Card>

<Card title="Form Actions" id="button-form-actions">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>type</Code> mirrors the native attribute, and defaults to <Code>button</Code> — a button in
		a form runs its <Code>onclick</Code> and nothing else. Ask for <Code>submit</Code> or
		<Code>reset</Code> when the form should respond.
	</Text>
	<form
		id="type-demo"
		onsubmit={(event) => {
			event.preventDefault();
			formEvent = 'submit';
		}}
		onreset={() => (formEvent = 'reset')}
		style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;"
	>
		<Button label="Save" type="submit" />
		<Button label="Clear" type="reset" variant="outlined" />
		<Button label="Preview" variant="ghost" onclick={() => (formEvent = 'onclick only')} />
	</form>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Last form event: <Code>{formEvent}</Code>
	</Text>
</Card>

<Card title="Usage" id="usage">
	<Heading level={3} id="basic-button">Basic Button</Heading>
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Button } from 'glow-ui';
</script>

<Button label="Click me" variant="primary" />
<Button icon="Heart" label="Like" variant="secondary" />
<Button icon="Trash" variant="ghost" tooltip="Delete" />`}
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
			{ prop: 'label', type: 'string', default: '-', description: 'Button text label' },
			{ prop: 'icon', type: 'IconName', default: '-', description: 'Icon to display' },
			{
				prop: 'variant',
				type: "'primary' | 'secondary' | 'ghost' | 'outlined' | 'dashed' | 'danger'",
				default: "'primary'",
				description:
					'Visual style variant. An icon-only button with no variant renders bare — no fill, no border'
			},
			{
				prop: 'size',
				type: "'sm' | 'md' | 'lg'",
				default: "'md'",
				description: 'Control size. sm is the compact step for toolbars and panel chrome'
			},
			{
				prop: 'shape',
				type: "'default' | 'circle'",
				default: "'default'",
				description: 'Circle drops the label and renders a round icon button'
			},
			{
				prop: 'onclick',
				type: '() => void | Promise&lt;void&gt;',
				default: '-',
				description: 'Click handler (supports async)'
			},
			{
				prop: 'type',
				type: "'button' | 'submit' | 'reset'",
				default: "'button'",
				description: 'Native button type. The default does not submit the form it sits in'
			},
			{
				prop: 'disabled',
				type: 'boolean',
				default: 'false',
				description: 'Disable button interactions'
			},
			{
				prop: 'loading',
				type: 'boolean',
				default: 'false',
				description: 'Force the loading state. An async onclick sets it on its own'
			},
			{
				prop: 'progress',
				type: 'number',
				default: '-',
				description: 'Progress (0-100) shown as a bar at the bottom while loading'
			},
			{
				prop: 'progressLabel',
				type: 'string',
				default: '-',
				description: 'Label shown inside the button while loading, in place of the label'
			},
			{
				prop: 'tooltip',
				type: 'string | TooltipOptions',
				default: '-',
				description: 'Tooltip text, or the options object the tooltip action takes (position, delay)'
			},
			{
				prop: 'count',
				type: 'number',
				default: '-',
				description: 'Badge rendered after the label'
			},
			{
				prop: 'shortcut',
				type: 'string',
				default: '-',
				description: 'Keyboard shortcut, shown as a Kbd and registered globally'
			},
			{
				prop: 'image',
				type: 'string',
				default: '-',
				description: 'Avatar image URL rendered in place of the icon'
			},
			{
				prop: 'selected',
				type: 'boolean',
				default: 'false',
				description: 'Draws a selection ring, and a neutral fill on the flat variants'
			},
			{
				prop: 'fullWidth',
				type: 'boolean',
				default: 'false',
				description: 'Stretch to the width of the container'
			},
			{
				prop: 'ariaLabel',
				type: 'string',
				default: '-',
				description: 'Accessible name — needed on an icon-only button, where there is no label'
			},
			{
				prop: 'children',
				type: 'Snippet',
				default: '-',
				description: 'Button content, when a plain label is not enough'
			},
			{ prop: 'class', type: 'string', default: '-', description: 'Extra classes on the button' },
			{ prop: 'style', type: 'string', default: '-', description: 'Inline style on the button' }
		]}
	/>
</Card>

<Card title="Features" id="features">
	<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
		<li><Text>🎨 Six visual variants (primary, secondary, ghost, outlined, dashed, danger)</Text></li>
		<li><Text>🎯 Icon support with automatic cursor mirroring</Text></li>
		<li><Text>⏳ Automatic loading state for async operations</Text></li>
		<li><Text>📐 Consistent 32px size across all buttons</Text></li>
		<li><Text>🎭 Icon-only mode (no label)</Text></li>
		<li><Text>🔗 Button groups for connected layouts</Text></li>
		<li><Text>♿ Fully accessible with proper ARIA attributes</Text></li>
	</ul>
</Card>
