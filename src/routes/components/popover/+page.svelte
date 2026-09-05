<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Popover from '$lib/popover/Popover.svelte';
	import Button from '$lib/button/Button.svelte';
	import Input from '$lib/input/Input.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';

	let manualOpen = $state(false);
	let filter = $state('');

	const fruits = ['Apricot', 'Blackberry', 'Cherry', 'Damson', 'Elderberry', 'Fig'];
	const filtered = $derived(
		fruits.filter((f) => f.toLowerCase().includes(filter.trim().toLowerCase()))
	);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Popover | Glow UI</title></svelte:head>

<Heading level={1}>Popover</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	The unstyled positioning primitive: it anchors arbitrary content to a trigger, flips above when
	there's no room below, clamps itself into the viewport, and closes on Escape or an outside click. If
	what you actually want is a menu, use
	<Link href="/components/popover-menu">PopoverMenu</Link> — it's built on this.
</Text>

<Card title="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Two snippets: <Code>trigger</Code> and <Code>children</Code>. Clicking the trigger toggles it;
		clicking outside or pressing <Code>Escape</Code> closes it.
	</Text>
	<Popover>
		{#snippet trigger()}
			<Button variant="secondary" label="Open popover" icon="ChevronDown" />
		{/snippet}
		<div class="panel">
			<Text size="sm">Anything can go in here — this is just a snippet.</Text>
		</div>
	</Popover>
</Card>

<Card title="Alignment" id="align">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>stretch</Code> (default) uses the trigger width as a minimum and grows to fit content —
		right for select-style pickers. <Code>left</Code> and <Code>right</Code> anchor the matching edge
		to the trigger's, letting the panel be any width.
	</Text>
	<Flex direction="horizontal" gap="md" wrap>
		<Popover align="stretch">
			{#snippet trigger()}
				<Button variant="secondary" label="stretch" />
			{/snippet}
			<div class="panel"><Text size="sm">Min-width matches the trigger.</Text></div>
		</Popover>
		<Popover align="left">
			{#snippet trigger()}
				<Button variant="secondary" label="left" />
			{/snippet}
			<div class="panel wide"><Text size="sm">Left edges line up. This panel is wider than its trigger.</Text></div>
		</Popover>
		<Popover align="right">
			{#snippet trigger()}
				<Button variant="secondary" label="right" />
			{/snippet}
			<div class="panel wide"><Text size="sm">Right edges line up — the usual choice for a trigger near the right edge.</Text></div>
		</Popover>
	</Flex>
</Card>

<Card title="Flipping and clamping" id="flip">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Position is recomputed every frame the popover is open, but only re-laid-out when the trigger rect
		or content size actually changes — so it follows its trigger through scrolling, animation, and
		layout shifts. Scroll this page until the trigger nears the bottom of the window and open it: it
		flips above rather than running off-screen. Taller-than-available content scrolls inside the panel.
		A panel near an edge is nudged back into view, but a trigger scrolled <em>entirely</em> out of view
		hides its panel rather than leaving it stranded against the window edge — it comes back, still
		open, when the trigger does.
	</Text>
	<Popover>
		{#snippet trigger()}
			<Button variant="secondary" label="Tall content" icon="ArrowUpDown" />
		{/snippet}
		<div class="panel">
			{#each Array(20) as _, i}
				<Text size="sm">Row {i + 1}</Text>
			{/each}
		</div>
	</Popover>
</Card>

<Card title="Offset" id="offset">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Gap in pixels between the trigger and the panel.
	</Text>
	<Flex direction="horizontal" gap="md">
		{#each [0, 4, 16] as offset}
			<Popover {offset}>
				{#snippet trigger()}
					<Button variant="secondary" label={`offset=${offset}`} />
				{/snippet}
				<div class="panel"><Text size="sm">{offset}px gap</Text></div>
			</Popover>
		{/each}
	</Flex>
</Card>

<Card title="Manual mode" id="manual">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>manual</Code> stops the trigger from toggling on click, so you drive <Code>open</Code>
		yourself — for popovers that should appear on focus, on a keystroke, or only once some condition
		holds. Outside-click and Escape still close it.
	</Text>
	<Flex direction="horizontal" gap="md" align="center">
		<Popover manual bind:open={manualOpen}>
			{#snippet trigger()}
				<Button variant="outlined" label="This trigger does nothing" />
			{/snippet}
			<div class="panel"><Text size="sm">Opened from outside the component.</Text></div>
		</Popover>
		<Button label={manualOpen ? 'Close it' : 'Open it'} onclick={() => (manualOpen = !manualOpen)} />
	</Flex>
</Card>

<Card title="Interactive content" id="interactive">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Because the content is a plain snippet, focusable controls work normally — the popover only closes
		on clicks genuinely outside both the trigger and the panel.
	</Text>
	<Popover align="left">
		{#snippet trigger()}
			<Button variant="secondary" label="Pick a fruit" icon="Search" />
		{/snippet}
		<div class="panel wide">
			<Input type="text" bind:value={filter} placeholder="Filter…" icon="Search" />
			<Divider spacing="sm" />
			<Flex gap="none">
				{#each filtered as fruit (fruit)}
					<button class="row" onclick={() => toast.success(`Picked ${fruit}`)}>{fruit}</button>
				{/each}
				{#if filtered.length === 0}
					<Text size="sm" variant="secondary">No matches</Text>
				{/if}
			</Flex>
		</div>
	</Popover>
</Card>

<Card title="Mobile sheet" id="sheet">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Below 640px the popover stops floating next to its trigger and presents as a full-width bottom
		sheet with a backdrop, so it stays reachable with a thumb. It tracks the viewport live, so
		rotating a device swaps presentation. Narrow this window past 640px to see it. Pass
		<Code>{'sheet={false}'}</Code> to always anchor instead.
	</Text>
	<Flex direction="horizontal" gap="md">
		<Popover>
			{#snippet trigger()}
				<Button variant="secondary" label="Sheet on mobile" />
			{/snippet}
			<div class="panel"><Text size="sm">Default — becomes a bottom sheet under 640px.</Text></div>
		</Popover>
		<Popover sheet={false}>
			{#snippet trigger()}
				<Button variant="secondary" label="Always anchored" />
			{/snippet}
			<div class="panel"><Text size="sm">Stays anchored at every viewport width.</Text></div>
		</Popover>
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Popover, Button } from 'glow';

  let open = $state(false);
<\/script>

<Popover bind:open align="right">
  {#snippet trigger()}
    <Button variant="secondary" label="Account" icon="ChevronDown" />
  {/snippet}

  <div class="menu">
    <a href="/profile">Profile</a>
    <a href="/settings">Settings</a>
    <button onclick={signOut}>Sign out</button>
  </div>
</Popover>`}
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
			{ prop: 'trigger', type: 'Snippet', default: '—', description: 'Required. The element the popover anchors to.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Required. Panel content. Rendered into a portal on <body>.' },
			{ prop: 'open', type: 'boolean', default: 'false', description: 'Bindable open state.' },
			{ prop: 'align', type: "'left' | 'right' | 'stretch'", default: 'stretch', description: 'Which edge anchors to the trigger. stretch uses the trigger width as a min-width.' },
			{ prop: 'offset', type: 'number', default: '4', description: 'Pixel gap between trigger and panel.' },
			{ prop: 'manual', type: 'boolean', default: 'false', description: "Stop the trigger's click from toggling; you control open yourself." },
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Trigger no longer opens the popover.' },
			{ prop: 'sheet', type: 'boolean', default: 'true', description: 'Present as a bottom sheet under 640px. false always anchors.' },
			{ prop: 'class', type: 'string', default: "''", description: 'Extra class on the wrapper.' }
		]}
	/>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/popover-menu">PopoverMenu</Link> — styled menus with items, toggles,
			submenus, and headers.
		</Text>
		<Text size="sm">
			<Link href="/components/context-menu">ContextMenu</Link> — the same menu entries, opened by
			right-click at the pointer.
		</Text>
		<Text size="sm">
			<Link href="/components/command-popover">CommandPopover</Link> — an inline anchored picker for
			slash-commands and autocomplete.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		box-shadow: var(--glow-shadow-lg);
	}

	.panel.wide {
		width: 260px;
	}

	.row {
		padding: 0.4rem 0.5rem;
		border-radius: 6px;
		background: none;
		border: none;
		color: var(--glow-fg);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;

		&:hover {
			background: var(--glow-secondary-hover);
		}
	}
</style>
