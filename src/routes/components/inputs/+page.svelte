<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Input from '$lib/input/Input.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Inputs | Glow UI</title></svelte:head>

<Heading level={1}>Inputs</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Comprehensive input components for all form types with built-in validation and custom cursor
		states.
	</Text>

	<Group label="Text Input" id="text-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Standard text input with icon, placeholder, and clearable option
		</Text>
		<Input
			type="text"
			label="Text Input"
			placeholder="Enter text..."
			icon="Volleyball"
			clearable={true}
			required={true}
		/>
	</Group>

	<Group label="Number Input" id="number-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Numeric input with min/max validation and step increments
		</Text>
		<Input
			type="number"
			label="Number Input"
			placeholder="Enter number..."
			min={0}
			max={100}
			step={5}
			clearable={true}
		/>
	</Group>

	<Group label="Textarea Input" id="textarea-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Multi-line text input for longer content
		</Text>
		<Input
			type="textarea"
			label="Textarea Input"
			placeholder="Enter multiple lines..."
			rows={3}
			clearable={true}
		/>
	</Group>

	<Group label="Checkbox Input" id="checkbox-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Checkbox with custom cursor states showing checked/unchecked/indeterminate
		</Text>
		<Input type="checkbox" label="Checkbox Input" checkboxLabel="I agree to the terms" />
		<div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
			<Input type="checkbox" checkboxLabel="Unchecked - hover to see empty square" />
			<Input type="checkbox" checked={true} checkboxLabel="Checked - hover to see check mark" />
			<Input
				type="checkbox"
				indeterminate={true}
				checkboxLabel="Indeterminate - hover to see minus"
			/>
		</div>
	</Group>

	<Group label="Toggle Input" id="toggle-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Toggle switch with custom cursor states showing position
		</Text>
		<Input type="toggle" label="Toggle Input" toggleLabel="Enable notifications" />
		<div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
			<Input type="toggle" toggleLabel="Off - hover to see toggle left" />
			<Input type="toggle" checked={true} toggleLabel="On - hover to see toggle right" />
		</div>
	</Group>

	<Group label="Range Input" id="range-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Slider input with optional value display
		</Text>
		<Input type="range" label="Range Input" min={0} max={100} step={5} showValue={true} />
	</Group>

	<Group label="Color Input" id="color-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Color picker using OKLAB color space for perceptually uniform colors
		</Text>
		<Input type="color" label="Color Input (OKLAB)" value="#3b82f6" />
	</Group>

	<Group label="Multi-Select Input" id="multiselect-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Select multiple options from a dropdown list
		</Text>
		<Input
			type="multiselect"
			label="Multi-Select Input"
			placeholder="Choose multiple options..."
			clearable={true}
			options={[
				{ label: 'Red', value: 'red' },
				{ label: 'Green', value: 'green' },
				{ label: 'Blue', value: 'blue' },
				{ label: 'Yellow', value: 'yellow' },
				{ label: 'Purple', value: 'purple' },
				{ label: 'Orange', value: 'orange' },
				{ label: 'Pink', value: 'pink' },
				{ label: 'Cyan', value: 'cyan' }
			]}
		/>
	</Group>

	<Group label="Radio Input" id="radio-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Select one option from a group of radio buttons
		</Text>
		<Input
			type="radio"
			label="Radio Input"
			clearable={true}
			options={[
				{ label: 'Daily', value: 'daily' },
				{ label: 'Weekly', value: 'weekly' },
				{ label: 'Monthly', value: 'monthly' }
			]}
		/>
	</Group>

	<Group label="Select Input" id="select-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Searchable dropdown select with filtering
		</Text>
		<Input
			type="select"
			label="Select Input"
			placeholder="Search and select..."
			clearable={true}
			options={[
				{ label: 'Apple', value: 'apple' },
				{ label: 'Banana', value: 'banana' },
				{ label: 'Cherry', value: 'cherry' },
				{ label: 'Date', value: 'date' }
			]}
		/>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="text-usage">Text & Number Inputs</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Input } from 'glow-ui';
</script>

<Input
  type="text"
  label="Name"
  placeholder="Enter your name..."
  icon="User"
  clearable={true}
  required={true}
/>

<Input
  type="number"
  label="Age"
  min={0}
  max={120}
  step={1}
/>`}
		/>

		<Heading level={3} id="checkbox-toggle-usage">Checkbox & Toggle</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  let agreed = $state(false);
  let enabled = $state(false);
</script>

<Input
  type="checkbox"
  checkboxLabel="I agree to terms"
  bind:checked={agreed}
/>

<Input
  type="toggle"
  toggleLabel="Enable notifications"
  bind:checked={enabled}
/>`}
		/>

		<Heading level={3} id="select-usage">Select & Multi-Select</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' }
  ];

  let selected = $state('');
  let multiSelected = $state([]);
</script>

<Input
  type="select"
  label="Choose one"
  {options}
  clearable={true}
  bind:value={selected}
/>

<Input
  type="multiselect"
  label="Choose multiple"
  {options}
  clearable={true}
  bind:value={multiSelected}
/>`}
		/>
	</Group>

	<Group label="Common Props" id="props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'type', type: 'string', default: 'required', description: 'Input type (text, number, textarea, checkbox, toggle, range, color, multiselect, radio, select)' },
				{ prop: 'label', type: 'string', default: '-', description: 'Input label text' },
				{ prop: 'placeholder', type: 'string', default: '-', description: 'Placeholder text' },
				{ prop: 'value', type: 'any', default: '-', description: 'Input value (bindable)' },
				{ prop: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button' },
				{ prop: 'required', type: 'boolean', default: 'false', description: 'Mark as required field' },
				{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disable input' },
				{ prop: 'icon', type: 'IconName', default: '-', description: 'Icon to display (text inputs)' }
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>📝 10 input types covering all common use cases</Text></li>
			<li><Text>🎯 Custom cursor states for interactive inputs</Text></li>
			<li><Text>✅ Built-in validation (required, min/max)</Text></li>
			<li><Text>🔍 Searchable select and multi-select</Text></li>
			<li><Text>🎨 Color picker with OKLAB color space</Text></li>
			<li><Text>🧹 Clearable option for quick reset</Text></li>
			<li><Text>🎭 Icon support for text inputs</Text></li>
			<li><Text>♿ Fully accessible with proper labels and ARIA</Text></li>
		</ul>
	</Group>
