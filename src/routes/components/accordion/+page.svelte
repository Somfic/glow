<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Accordion from '$lib/accordion/Accordion.svelte';
	import AccordionItem from '$lib/accordion/AccordionItem.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';

	// Controlled example — the buttons and the accordion write the same state.
	let openSection = $state('shipping');

	// Multiple mode holds an array; this one starts with two panels open.
	let openTopics = $state(['install', 'tokens']);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Accordion | Glow UI</title></svelte:head>

<Heading level={1}>Accordion</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Collapsible sections with one open at a time, or any number. Each header is a real
	<Code>button</Code> inside a heading, each panel a labelled <Code>region</Code>, and the panel
	height animates on the shared motion tokens.
</Text>

<Card title="Single" id="single">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default. Opening one panel closes the last — and clicking the open header closes it, unless
		you pass <Code>{'collapsible={false}'}</Code>.
	</Text>
	<Accordion defaultValue="what">
		<AccordionItem value="what" title="What is glow?">
			A Svelte 5 component library built on runes, themed entirely through
			<Code>--glow-*</Code> tokens so an app can restyle it without forking it.
		</AccordionItem>
		<AccordionItem value="install" title="How do I install it?">
			<Code>bun add glow</Code> — then import the components you need from the root barrel, or from
			<Code>glow/forms</Code>, <Code>glow/layout</Code> and <Code>glow/data-display</Code> if you
			would rather keep the import surface narrow.
		</AccordionItem>
		<AccordionItem value="themes" title="Does it do light mode?">
			Every component is checked in both. Colours resolve from the theme tokens rather than being
			written into the component, so light mode is the same code with a different palette.
		</AccordionItem>
	</Accordion>
</Card>

<Card title="Multiple" id="multiple">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>type="multiple"</Code> lets panels open independently. The bound value is a
		<Code>string[]</Code> instead of a <Code>string</Code>.
	</Text>
	<Accordion type="multiple" bind:value={openTopics}>
		<AccordionItem value="install" title="Installation" icon="Download">
			Add the package, then import what you need. Nothing is registered globally.
		</AccordionItem>
		<AccordionItem value="tokens" title="Design tokens" icon="Palette">
			Colours, spacing, radii and motion all come from CSS custom properties on the root, which is
			what makes the whole library retheme at once.
		</AccordionItem>
		<AccordionItem value="motion" title="Motion" icon="Zap">
			Durations come from <Code>--glow-dur-*</Code>, which collapse to 1ms under
			<Code>prefers-reduced-motion</Code>. A hardcoded duration would opt out of that silently.
		</AccordionItem>
	</Accordion>
	<Text variant="secondary" size="sm" style="margin-top: 0.75rem;">
		Open: <Code>{JSON.stringify(openTopics)}</Code>
	</Text>
</Card>

<Card title="Subtitles and badges" id="subtitles">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>subtitle</Code> adds a muted second line and <Code>badge</Code> a count on the right — both
		inside the button, so they read out with the header.
	</Text>
	<Accordion defaultValue="orders">
		<AccordionItem
			value="orders"
			title="Orders"
			subtitle="Everything placed in the last 30 days"
			icon="Package"
			badge={12}
		>
			Twelve orders, four of which are still awaiting a carrier scan.
		</AccordionItem>
		<AccordionItem
			value="returns"
			title="Returns"
			subtitle="Items on their way back to the warehouse"
			icon="Undo2"
			badge={3}
		>
			Three returns in transit.
		</AccordionItem>
		<AccordionItem value="archive" title="Archive" subtitle="Closed and settled" icon="Archive" disabled>
			Nothing here — the item is disabled, so this never opens.
		</AccordionItem>
	</Accordion>
</Card>

<Card title="Variants" id="variants">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>separated</Code> gives each item its own frame; <Code>plain</Code> drops the frame and the
		horizontal padding, for when the surrounding container already provides both.
	</Text>
	<Accordion variant="separated" defaultValue="a" style="margin-bottom: 1.5rem;">
		<AccordionItem value="a" title="Separated" icon="Rows2">
			Each item is its own block, with a gap between them.
		</AccordionItem>
		<AccordionItem value="b" title="Second block" icon="Rows2">
			Useful when the items are peers rather than one list.
		</AccordionItem>
	</Accordion>
	<Accordion variant="plain" defaultValue="c">
		<AccordionItem value="c" title="Plain" icon="Minus">
			No frame, flush to the container's own padding.
		</AccordionItem>
		<AccordionItem value="d" title="Another row" icon="Minus">
			Rows are still separated by a rule.
		</AccordionItem>
	</Accordion>
</Card>

<Card title="Controlled" id="controlled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Bind <Code>value</Code> and the state is yours — anything else on the page can open a panel.
		Leave it unbound and the Accordion keeps its own, seeded by <Code>defaultValue</Code>.
	</Text>
	<Flex gap="sm" style="margin-bottom: 1rem;">
		<Button
			label="Shipping"
			variant={openSection === 'shipping' ? 'primary' : 'secondary'}
			onclick={() => (openSection = 'shipping')}
		/>
		<Button
			label="Payment"
			variant={openSection === 'payment' ? 'primary' : 'secondary'}
			onclick={() => (openSection = 'payment')}
		/>
		<Button label="Close all" variant="secondary" onclick={() => (openSection = '')} />
	</Flex>
	<Accordion bind:value={openSection}>
		<AccordionItem value="shipping" title="Shipping" icon="Truck">
			Free above €50, two to four working days.
		</AccordionItem>
		<AccordionItem value="payment" title="Payment" icon="CreditCard">
			Card, iDEAL and bank transfer. Charged on dispatch.
		</AccordionItem>
	</Accordion>
</Card>

<Card title="Keyboard" id="keyboard">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Headers form one navigable set: <Kbd>↓</Kbd> and <Kbd>↑</Kbd> move between them and wrap,
		<Kbd>Home</Kbd> and <Kbd>End</Kbd> jump to the ends, <Kbd>Enter</Kbd> or <Kbd>Space</Kbd> toggles.
		Arrow keys inside an open panel are left alone, so a field in there still behaves normally.
		Disabled headers are skipped.
	</Text>
	<Accordion type="multiple" defaultValue={['b']}>
		<AccordionItem value="a" title="First" />
		<AccordionItem value="b" title="Second">
			Focus a header and try the arrow keys.
		</AccordionItem>
		<AccordionItem value="c" title="Third (disabled)" disabled />
		<AccordionItem value="d" title="Fourth" />
	</Accordion>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Accordion, AccordionItem } from 'glow';

  let open = $state(['install']);
<\/script>

<Accordion type="multiple" bind:value={open}>
  <AccordionItem value="install" title="Installation" icon="Download">
    bun add glow
  </AccordionItem>
  <AccordionItem value="tokens" title="Design tokens" badge={9}>
    Everything themes from --glow-* custom properties.
  </AccordionItem>
</Accordion>`}
	/>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		In <Code>single</Code> mode <Code>value</Code> is a <Code>string</Code> and the empty string
		means nothing is open. In <Code>multiple</Code> mode it is a <Code>string[]</Code>.
		<Code>value</Code> omitted entirely means uncontrolled.
	</Text>
</Card>

<Card title="Accordion props" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'type', type: "'single' | 'multiple'", default: "'single'", description: 'Whether opening a panel closes the previous one.' },
			{ prop: 'value', type: 'string | string[]', default: '—', description: 'Bindable. Open item(s). Omit for uncontrolled.' },
			{ prop: 'defaultValue', type: 'string | string[]', default: '—', description: 'Initial open item(s) when uncontrolled.' },
			{ prop: 'collapsible', type: 'boolean', default: 'true', description: 'single only. False keeps one panel always open.' },
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disables every header in the group.' },
			{ prop: 'variant', type: "'bordered' | 'separated' | 'plain'", default: "'bordered'", description: 'Framed stack, framed per item, or no frame.' },
			{ prop: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading each trigger is wrapped in. Set it to whatever keeps the page outline correct.' },
			{ prop: 'onValueChange', type: '(value) => void', default: '—', description: 'Fires after a toggle with the new open value(s).' }
		]}
	/>
</Card>

<Card title="AccordionItem props" id="item-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'value', type: 'string', default: 'generated', description: 'Identity within the group. Give it one if you control the open state.' },
			{ prop: 'title', type: 'string', default: '—', description: 'Header text.' },
			{ prop: 'subtitle', type: 'string', default: '—', description: 'Muted second line under the title.' },
			{ prop: 'icon', type: 'IconProp', default: '—', description: 'Icon before the title.' },
			{ prop: 'badge', type: 'string | number', default: '—', description: 'Count or short label before the chevron.' },
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Header is not clickable and is skipped by arrow-key navigation.' },
			{ prop: 'header', type: 'Snippet', default: '—', description: 'Replaces the whole title cluster inside the trigger button.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Panel content.' }
		]}
	/>
</Card>
