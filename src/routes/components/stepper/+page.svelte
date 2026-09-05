<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Button from '$lib/button/Button.svelte';
	import Stepper, { type Step } from '$lib/stepper/Stepper.svelte';

	const checkout: Step[] = [
		{ label: 'Cart' },
		{ label: 'Shipping' },
		{ label: 'Payment' },
		{ label: 'Review' }
	];

	const onboarding: Step[] = [
		{ label: 'Create account', description: 'Email and a password' },
		{ label: 'Verify email', description: 'We sent a six-digit code' },
		{ label: 'Invite your team', description: 'Optional — you can do this later' },
		{ label: 'Pick a plan', description: 'Free while you are evaluating' }
	];

	// Every state at once, so the card shows all four without any interaction.
	const states: Step[] = [
		{ label: 'Details', state: 'complete' },
		{ label: 'Payment', description: 'Card declined', state: 'error' },
		{ label: 'Confirm', state: 'current' },
		{ label: 'Done', state: 'upcoming' }
	];

	const icons: Step[] = [
		{ label: 'Upload', description: '12 files', icon: 'CloudUpload', state: 'complete' },
		{ label: 'Transcode', description: '1080p and 720p', icon: 'Film', state: 'current' },
		{ label: 'Publish', description: 'To the CDN', icon: 'Globe', state: 'upcoming' }
	];

	// Deliberately long: the marker has to hold the first line of the label, not
	// drift to the middle of a wrapped block.
	const wrapping: Step[] = [
		{
			label: 'Confirm the shipping address we found on your account, or enter a new one',
			description:
				'A description long enough to run onto a second line as well, because that is where the marker usually slips.'
		},
		{ label: 'Short one' },
		{
			label: 'Choose a delivery window that suits you, including the weekend slots',
			description: 'Two lines here too, for the same reason as above.'
		}
	];

	let wizard = $state(1);
	let jump = $state(1);
	const flow: Step[] = [
		{ label: 'Account' },
		{ label: 'Profile' },
		{ label: 'Billing' },
		{ label: 'Finish' }
	];
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Stepper | Glow UI</title></svelte:head>

<Heading level={1}>Stepper</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Where you are in a multi-step flow, and how much of it is behind you. A checkout, an onboarding
	wizard, a long form split into sections — each step carries a state, and one of those states is
	the failure a wizard has to be able to show.
</Text>

<Card title="Horizontal" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default. <Code>current</Code> is an index: everything before it is complete, everything after
		it is upcoming, and the connector fills in behind you. A step with no <Code>icon</Code> shows its
		number, and a checkmark once it is done.
	</Text>
	<Stepper steps={checkout} current={2} label="Checkout progress" />
</Card>

<Card title="Vertical" id="vertical">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>orientation="vertical"</Code> is what a long form wants — the descriptions have room, and
		the rail reads as a spine down the side of the page rather than a strip across the top of it.
	</Text>
	<div class="narrow">
		<Stepper steps={onboarding} current={1} orientation="vertical" label="Onboarding progress" />
	</div>
</Card>

<Card title="States" id="states">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Complete, error, current, upcoming. Only <Code>error</Code> has to be set by hand — pass
		<Code>{"state: 'error'"}</Code> on the step that failed validation and it turns danger-coloured
		with a cross, while the rest of the stepper keeps deriving from <Code>current</Code>.
	</Text>
	<Flex gap="xl">
		<Stepper steps={states} label="Every step state" />
		<div class="narrow">
			<Stepper steps={states} orientation="vertical" label="Every step state, vertical" />
		</div>
	</Flex>
</Card>

<Card title="Icons" id="icons">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		An <Code>icon</Code> replaces the number, and keeps its place once the step completes — a
		pipeline reads better as its own glyphs than as a row of checkmarks.
	</Text>
	<Stepper steps={icons} label="Pipeline progress" />
</Card>

<Card title="Navigation" id="navigation">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>navigation</Code> decides what is clickable: <Code>'none'</Code> (the default) renders no
		buttons at all, <Code>'complete'</Code> lets you go back to a step you have finished, and
		<Code>'all'</Code> lets you jump anywhere. Only the clickable steps are tab stops, so a read-only
		stepper does not put dead focus targets in the tab order.
	</Text>
	<Flex gap="lg">
		<Stepper
			bind:current={wizard}
			steps={flow}
			navigation="complete"
			label="Setup progress"
			onnavigate={(i) => console.log('went back to step', i)}
		/>
		<Flex direction="horizontal" gap="sm">
			<Button
				label="Back"
				variant="secondary"
				disabled={wizard === 0}
				onclick={() => {
					wizard = Math.max(0, wizard - 1);
				}}
			/>
			<Button
				label="Next"
				disabled={wizard === flow.length - 1}
				onclick={() => {
					wizard = Math.min(flow.length - 1, wizard + 1);
				}}
			/>
		</Flex>
	</Flex>

	<Text variant="secondary" size="sm" style="margin: 1.5rem 0 1rem;">
		<Code>navigation="all"</Code> makes every step a button, including the ones ahead of you — for a
		flow with nothing to validate between steps, like a settings wizard you can fill in any order.
	</Text>
	<Stepper bind:current={jump} steps={flow} navigation="all" label="Jump to any step" />
</Card>

<Card title="Alignment" id="alignment">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The marker is centred on the <em>first line</em> of its label, not on the middle of the block, so
		a label that wraps to two lines — with a two-line description under it — still hangs off its own
		first line. The connector runs on that same centre line, and stops short of the next marker
		rather than running under it.
	</Text>
	<Flex gap="xl">
		<div class="narrow">
			<Stepper steps={wrapping} current={1} orientation="vertical" label="Wrapping labels, vertical" />
		</div>
		<div class="medium">
			<Stepper steps={wrapping} current={1} label="Wrapping labels, horizontal" />
		</div>
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Stepper, type Step } from 'glow';

  let current = $state(1);

  const steps: Step[] = [
    { label: 'Cart' },
    { label: 'Shipping', description: 'Where it goes' },
    { label: 'Payment', description: 'Card declined', state: 'error' },
    { label: 'Review' }
  ];
<\/script>

<Stepper {steps} bind:current label="Checkout progress" />

<!-- Vertical, and clicking a finished step goes back to it -->
<Stepper
  {steps}
  bind:current
  orientation="vertical"
  navigation="complete"
  onnavigate={(i) => load(i)}
  label="Checkout progress"
/>`}
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
			{ prop: 'steps', type: 'Step[]', default: '—', description: 'The steps, in order.' },
			{ prop: 'current', type: 'number', default: '0', description: 'Index of the current step. Bindable — clicking a step writes to it.' },
			{ prop: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal', description: 'Vertical is what a long form wants.' },
			{ prop: 'navigation', type: "'none' | 'complete' | 'all'", default: 'none', description: 'Which steps are buttons. none renders no buttons at all.' },
			{ prop: 'onnavigate', type: '(index, step) => void', default: '—', description: 'Fires only for a click, not for a current written from outside.' },
			{ prop: 'content', type: 'Snippet<[Step, StepState, number]>', default: '—', description: 'Replaces the label/description column.' },
			{ prop: 'label', type: 'string', default: '—', description: 'aria-label on the <ol>.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the list.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the list.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">Step</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Field', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'id', type: 'string', description: 'Key for the each block; falls back to the index.' },
			{ prop: 'label', type: 'string', description: 'The step name. Required.' },
			{ prop: 'description', type: 'string', description: 'Secondary line under the label.' },
			{ prop: 'icon', type: 'IconProp', description: 'Marker glyph, in place of the number.' },
			{ prop: 'state', type: 'StepState', description: "Pins the state: upcoming | current | complete | error." },
			{ prop: 'disabled', type: 'boolean', description: 'Never navigable, whatever navigation says.' }
		]}
	/>
</Card>

<Card title="Accessibility" id="accessibility">
	<Text size="sm" variant="secondary">
		The stepper is an <Code>{'<ol>'}</Code> of <Code>{'<li>'}</Code> — a list of steps in order,
		which is what it is — and the current one carries <Code>aria-current="step"</Code>. Each step
		reads its state after its label, so "Payment, Error" comes out of the list rather than out of a
		colour. Markers are <Code>aria-hidden</Code>: the number restates the list position and the
		checkmark restates the state. Navigable steps are real buttons with a visible focus ring; the
		rest are not focusable at all.
	</Text>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/progress">Progress</Link> — for a proportion rather than a sequence of
			named steps.
		</Text>
		<Text size="sm">
			<Link href="/components/timeline">Timeline</Link> — the same spine, but for things that already
			happened.
		</Text>
		<Text size="sm">
			<Link href="/components/tabs">Tabs</Link> — when the sections have no order and no completion.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	// Forces the labels to wrap, which is the point of the alignment example.
	.narrow {
		max-width: 22rem;
		width: 100%;
	}

	// Wide enough for three steps in a row, narrow enough that each label wraps.
	.medium {
		max-width: 46rem;
		width: 100%;
	}
</style>
