<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from "$lib/card/Card.svelte";
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

	<Card title="Text Input" id="text-input">
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
	</Card>

	<Card title="Loading Input" id="loading-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Text input with loading state, replaces the icon with a spinner
		</Text>
		<Input
			type="text"
			label="Search"
			placeholder="Searching..."
			icon="Search"
			loading={true}
			clearable={true}
		/>
	</Card>

	<Card title="Number Input" id="number-input">
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
	</Card>

	<Card title="Textarea Input" id="textarea-input">
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
	</Card>

	<Card title="Checkbox Input" id="checkbox-input">
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
	</Card>

	<Card title="Toggle Input" id="toggle-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Toggle switch with custom cursor states showing position
		</Text>
		<Input type="toggle" label="Toggle Input" toggleLabel="Enable notifications" />
		<div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
			<Input type="toggle" toggleLabel="Off - hover to see toggle left" />
			<Input type="toggle" checked={true} toggleLabel="On - hover to see toggle right" />
		</div>
	</Card>

	<Card title="Range Input" id="range-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Slider input with optional value display
		</Text>
		<Input type="range" label="Range Input" min={0} max={100} step={5} showValue={true} />
	</Card>

	<Card title="Color Input" id="color-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Color picker using OKLAB color space for perceptually uniform colors
		</Text>
		<Input type="color" label="Color Input (OKLAB)" value="#3b82f6" />
	</Card>

	<Card title="Date Input" id="date-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Calendar popover with month navigation, optional <code>min</code>/<code>max</code> bounds, and <code>clearable</code>.
		</Text>
		<Input type="date" label="Date Input" placeholder="Pick a date" clearable />
	</Card>

	<Card title="Time Input" id="time-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Hour/minute scroll picker. Configurable <code>step</code> granularity and 12 / 24-hour display.
		</Text>
		<Input type="time" label="Time Input" placeholder="Pick a time" step={5} clearable />
	</Card>

	<Card title="Multi-Select Input" id="multiselect-input">
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
	</Card>

	<Card title="Radio Input" id="radio-input">
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
	</Card>

	<Card title="Select Input" id="select-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Searchable dropdown select with filtering. Options accept icons and descriptions
			(rendered as a muted second line) so you don't need PopoverMenu for richer choices.
		</Text>
		<Input
			type="select"
			label="Select Input"
			placeholder="Search and select..."
			clearable={true}
			options={[
				{ label: 'Apple',  value: 'apple',  icon: 'Apple',  description: 'A red or green pomaceous fruit' },
				{ label: 'Banana', value: 'banana', icon: 'Banana', description: 'Yellow tropical fruit, high in potassium' },
				{ label: 'Cherry', value: 'cherry', icon: 'Cherry', description: 'Small stone fruit, often red' },
				{ label: 'Grape',  value: 'grape',  icon: 'Grape',  description: 'Berries that grow in clusters on a vine' }
			]}
		/>
	</Card>

	<Card title="Select with groups" id="select-grouped">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Mix <Code>{`{ kind: 'group', label, options }`}</Code> entries into the options
			array to render uppercase eyebrow headers between sections.
		</Text>
		<Input
			type="select"
			label="Pick a model"
			placeholder="Pick a model..."
			clearable={true}
			options={[
				{
					kind: 'group',
					label: 'Reasoning',
					options: [
						{ label: 'Qwen 3 (4B, thinking)', value: 'qwen3-4b-thinking', description: 'Abliterated, fast' },
						{ label: 'DeepSeek R1 (8B)',       value: 'deepseek-r1-8b',    description: 'Strong reasoning, slower' }
					]
				},
				{
					kind: 'group',
					label: 'Instruct',
					options: [
						{ label: 'Llama 3.1 (8B)',  value: 'llama3.1-8b',  description: 'No reasoning, very fast' },
						{ label: 'Mistral Nemo 12B', value: 'mistral-nemo-12b', description: 'Solid all-rounder' }
					]
				}
			]}
		/>
	</Card>

	<Card title="Non-searchable select" id="select-non-searchable">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Set <Code>{`searchable={false}`}</Code> for short fixed lists where the
			type-to-find affordance just gets in the way.
		</Text>
		<Input
			type="select"
			label="Seed mode"
			placeholder="Pick a mode"
			searchable={false}
			options={[
				{ label: 'Random', value: 'random', icon: 'Shuffle', description: 'New seed each generation' },
				{ label: 'Fixed',  value: 'fixed',  icon: 'Lock',    description: 'Reproducible result' }
			]}
		/>
	</Card>

	<Card title="Usage" id="usage">
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
	</Card>

	<Card title="Common Props" id="props">
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
	</Card>

	<Card title="Features" id="features">
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
	</Card>
