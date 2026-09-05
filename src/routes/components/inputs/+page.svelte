<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
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


	<Card title="Password Input" id="password-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Masked input with a reveal toggle. Set <Code>autocomplete</Code> so password managers behave —
			<Code>current-password</Code> on sign-in, <Code>new-password</Code> on sign-up.
		</Text>
		<Input
			type="password"
			label="Password"
			placeholder="••••••••"
			autocomplete="current-password"
			required={true}
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
			The <Link href="/components/calendar">Calendar</Link> grid in a popover: one tab stop, arrow
			keys, <code>min</code>/<code>max</code> bounds, an <code>isDateDisabled</code> predicate,
			<code>weekStart</code>, <code>locale</code>, and <code>clearable</code>. Focus moves into the
			grid when it opens and returns to the field when it closes.
		</Text>
		<div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
			<div style="width: 240px;">
				<Input type="date" label="Date" placeholder="Pick a date" clearable />
			</div>
			<div style="width: 320px;">
				<Input
					type="date"
					mode="range"
					label="Range"
					placeholder="Pick a range"
					value={{ start: null, end: null }}
					clearable
				/>
			</div>
			<div style="width: 240px;">
				<Input
					type="date"
					mode="multiple"
					label="Multiple"
					placeholder="Pick days"
					value={[]}
					clearable
				/>
			</div>
		</div>
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

	<Card title="Radio Input with Icons" id="radio-input-icons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Options accept an <code>icon</code>. By default the icon sits beside the label; pass
			<code>iconOnly</code> for a compact segmented control where each label becomes the
			option's tooltip and accessible name.
		</Text>
		<Input
			type="radio"
			label="Alignment"
			value="left"
			options={[
				{ label: 'Left', value: 'left', icon: 'TextAlignStart' },
				{ label: 'Center', value: 'center', icon: 'TextAlignCenter' },
				{ label: 'Right', value: 'right', icon: 'TextAlignEnd' }
			]}
		/>
		<Input
			type="radio"
			label="Transcoding (icon only)"
			value="none"
			iconOnly={true}
			style="margin-top: 1rem;"
			options={[
				{ label: 'None', value: 'none', icon: 'Ban' },
				{ label: 'Audio', value: 'audio', icon: 'AudioLines' },
				{ label: 'Audio + video', value: 'both', icon: 'Film' }
			]}
		/>
	</Card>

	<Card title="Radio Input Sizes" id="radio-input-sizes">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			<Code>size</Code> is <Code>sm</Code>, <Code>md</Code> (the default) or <Code>lg</Code>. Only
			the font size changes — the height, padding and icons are in <Code>em</Code>, so they follow.
		</Text>
		<div class="radio-stack">
			<Input
				type="radio"
				label="Range, small"
				size="sm"
				value="week"
				options={[
					{ label: 'Day', value: 'day' },
					{ label: 'Week', value: 'week' },
					{ label: 'Month', value: 'month' },
					{ label: 'All time', value: 'all' }
				]}
			/>
			<Input
				type="radio"
				label="Range, medium"
				value="week"
				options={[
					{ label: 'Day', value: 'day' },
					{ label: 'Week', value: 'week' },
					{ label: 'Month', value: 'month' },
					{ label: 'All time', value: 'all' }
				]}
			/>
			<Input
				type="radio"
				label="Range, large"
				size="lg"
				value="week"
				options={[
					{ label: 'Day', value: 'day' },
					{ label: 'Week', value: 'week' },
					{ label: 'Month', value: 'month' },
					{ label: 'All time', value: 'all' }
				]}
			/>
		</div>
	</Card>

	<Card title="Radio Input Full Width" id="radio-input-full-width">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			<Code>fullWidth</Code> stretches the control and gives every option an equal share. The
			indicator re-measures on resize, so it stays on its option as the container changes width.
		</Text>
		<Input
			type="radio"
			label="Period"
			fullWidth={true}
			value="month"
			options={[
				{ label: 'Day', value: 'day' },
				{ label: 'Week', value: 'week' },
				{ label: 'Month', value: 'month' }
			]}
		/>
	</Card>

	<Card title="Radio Input Disabled" id="radio-input-disabled">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A single option, or the whole group. A disabled option is skipped by the arrow keys rather
			than focused and refused, and a disabled group drops the accent fill — the brightest thing
			on the page should not be a control nobody can use.
		</Text>
		<div class="radio-stack">
			<Input
				type="radio"
				label="Billing period"
				value="monthly"
				options={[
					{ label: 'Monthly', value: 'monthly' },
					{ label: 'Yearly', value: 'yearly' },
					{ label: 'Lifetime', value: 'lifetime', disabled: true }
				]}
			/>
			<Input
				type="radio"
				label="Range (disabled)"
				disabled={true}
				value="week"
				options={[
					{ label: 'Day', value: 'day' },
					{ label: 'Week', value: 'week' },
					{ label: 'Month', value: 'month' },
					{ label: 'All time', value: 'all' }
				]}
			/>
		</div>
	</Card>

	<Card title="Radio Input Keyboard" id="radio-input-keyboard">
		<Text variant="secondary" size="sm">
			The group is a <Code>radiogroup</Code> of <Code>radio</Code> buttons and a single tab stop —
			the selected option holds it, the rest are <Code>tabindex="-1"</Code>. <Code>←</Code> and
			<Code>→</Code> move the selection with the focus, wrapping and skipping disabled options;
			<Code>Home</Code> and <Code>End</Code> jump to the ends. Up and down are deliberately left
			alone: the group is horizontal, and it is rendered inside
			<Link href="/components/popover-menu">PopoverMenu</Link>, which uses those keys for the menu
			itself.
		</Text>
		<Text variant="secondary" size="sm" style="margin-top: 0.75rem;">
			With <Code>clearable</Code> nothing may be selected at all. From that state
			<Code>→</Code> takes the option that already has focus and <Code>←</Code> the last, so one
			keypress always lands somewhere; arrowing onto the selected option never clears it, since
			only a click means clear.
		</Text>
		<div class="radio-stack" style="margin-top: 1rem;">
			<Input
				type="radio"
				label="Clearable — click the selected option to clear it"
				clearable={true}
				options={[
					{ label: 'Low', value: 'low' },
					{ label: 'Medium', value: 'medium' },
					{ label: 'High', value: 'high' }
				]}
			/>
		</div>
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

	<Card title="Rating Input" id="rating-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Star rating with a configurable <Code>max</Code>. Arrow keys adjust by one
			<Code>step</Code>, <Code>Home</Code> clears back to unrated and <Code>End</Code> jumps to
			the maximum.
		</Text>
		<Input type="rating" label="Rating Input" value={3} showValue={true} />
		<Input type="rating" label="Ten point scale" max={10} value={7} showValue={true} />
	</Card>

	<Card title="Half-star ratings" id="rating-half">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Pass <Code>{`step={0.5}`}</Code> and each icon splits in two — the half the pointer is
			over is the value it commits. The control is a <Code>role="slider"</Code> rather than a
			radio group precisely because 2.5 is not a choice a radio group can name.
		</Text>
		<Input type="rating" label="Half steps" step={0.5} value={3.5} showValue={true} />
	</Card>

	<Card title="Rating icons and states" id="rating-states">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Any <Code>icon</Code> works in place of the star. <Code>readonly</Code> renders a score
			without accepting input — for someone else's rating — while <Code>disabled</Code> dims
			the whole control.
		</Text>
		<Input type="rating" label="Heat" icon="Flame" value={4} size={22} />
		<Input type="rating" label="Read-only" icon="Heart" value={4} readonly showValue={true} />
		<Input type="rating" label="Disabled" value={2} disabled />
	</Card>

	<Card title="PIN Input" id="pin-input">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A segmented one-time-code field for 2FA and email verification. Pasting
			<Code>123-456</Code> fills all six cells — separators are stripped to the allowed
			character set first. <Code>onComplete</Code> fires the moment the last cell fills.
		</Text>
		<Input type="pin" label="Verification code" value="4821" />
	</Card>

	<Card title="PIN length, masking and character set" id="pin-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			<Code>length</Code> sets the cell count, <Code>mask</Code> renders filled cells as dots
			for a PIN rather than a code, and <Code>{`codeType="alphanumeric"`}</Code> widens the
			accepted set from digits to letters and digits.
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<Input type="pin" label="Four digit PIN" length={4} mask={true} value="1234" />
			<Input type="pin" label="Alphanumeric code" codeType="alphanumeric" value="A7F2Q1" />
		</div>
	</Card>

	<Card title="PIN states" id="pin-states">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			An <Code>error</Code> paints the cells in the danger colour and sets
			<Code>aria-invalid</Code>. <Code>readonly</Code> shows a code without accepting edits;
			<Code>disabled</Code> dims the whole row.
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<Input type="pin" label="Wrong code" value="908231" error="That code has expired." />
			<Input type="pin" label="Read-only" value="551204" readonly={true} />
			<Input type="pin" label="Disabled" value="4400" length={4} disabled={true} />
		</div>
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

		<Heading level={3} id="rating-usage">Rating</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  let score = $state(0);
</script>

<Input
  type="rating"
  label="How was it?"
  max={5}
  step={0.5}
  icon="Star"
  showValue={true}
  bind:value={score}
/>`}
		/>

		<Heading level={3} id="pin-usage">PIN / one-time code</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  let code = $state('');
</script>

<Input
  type="pin"
  label="Verification code"
  name="otp"
  length={6}
  codeType="numeric"
  bind:value={code}
  onComplete={(c) => verify(c)}
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
				{ prop: 'type', type: 'string', default: 'required', description: 'Input type (text, number, textarea, checkbox, toggle, range, rating, pin, color, multiselect, radio, select)' },
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
			<li><Text>📝 15 input types covering all common use cases</Text></li>
			<li><Text>🎯 Custom cursor states for interactive inputs</Text></li>
			<li><Text>✅ Built-in validation (required, min/max)</Text></li>
			<li><Text>🔍 Searchable select and multi-select</Text></li>
			<li><Text>🎨 Color picker with OKLAB color space</Text></li>
			<li><Text>⭐ Rating input with half-step support</Text></li>
			<li><Text>🔢 PIN / one-time-code input with paste and SMS autofill</Text></li>
			<li><Text>🧹 Clearable option for quick reset</Text></li>
			<li><Text>🎭 Icon support for text inputs</Text></li>
			<li><Text>♿ Fully accessible with proper labels and ARIA</Text></li>
		</ul>
	</Card>

<style>
	/* The radio examples stack, and each control is inline-flex — without
	   align-items the disabled/sizes rows would stretch to the card width. */
	.radio-stack {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}
</style>
