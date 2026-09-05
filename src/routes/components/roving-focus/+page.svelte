<script lang="ts">
	import { tick } from 'svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Button from '$lib/button/Button.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import { rovingFocus } from '$lib/roving-focus/rovingFocus.js';

	const tools = [
		{ icon: 'Bold', label: 'Bold' },
		{ icon: 'Italic', label: 'Italic' },
		{ icon: 'Underline', label: 'Underline' },
		{ icon: 'TextAlignStart', label: 'Align left' },
		{ icon: 'TextAlignCenter', label: 'Align centre' },
		{ icon: 'Link', label: 'Link' }
	] as const;

	let toolbarAt = $state('Bold');

	const stops = ['Overview', 'Activity', 'Members', 'Settings'];

	const perms = [
		{ label: 'Read', off: false },
		{ label: 'Comment', off: false },
		{ label: 'Write', off: true },
		{ label: 'Administer', off: true },
		{ label: 'Transfer', off: false }
	];

	const fruit = [
		'Apricot',
		'Blackberry',
		'Blueberry',
		'Cherry',
		'Cranberry',
		'Damson',
		'Elderberry',
		'Fig'
	];

	let rows = $state(['Alpha', 'Bravo', 'Charlie', 'Delta']);
	let added = 0;
	let tabindexes = $state('');
	let dynamicList = $state<HTMLElement>();

	/** Read the invariant straight off the DOM — the point of the example is
	 *  that exactly one item stays at 0 no matter what the list does. */
	async function readTabindexes() {
		await tick();
		tabindexes = [...(dynamicList?.querySelectorAll('[data-roving-item]') ?? [])]
			.map((el) => el.getAttribute('tabindex'))
			.join(', ');
	}

	$effect(() => {
		rows.length;
		readTabindexes();
	});

	function addRow() {
		rows.splice(1, 0, `New ${++added}`);
	}

	function removeRow(i: number) {
		rows.splice(i, 1);
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Roving Focus | Glow UI</title></svelte:head>

<Heading level={1}>Roving Focus</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	<Code>use:rovingFocus</Code> turns a group of controls into a single tab stop that the arrow keys move
	around inside — the roving-tabindex pattern ARIA asks for in a toolbar, a menu, a tree or a tab list.
	Put the action on the container and <Code>data-roving-item</Code> on the items; it keeps exactly one
	item at <Code>tabindex="0"</Code> and the rest at <Code>-1</Code>, including while the list is being
	added to, filtered or reordered underneath it.
</Text>

<Card title="A toolbar" id="toolbar">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Kbd>Tab</Kbd> reaches the toolbar once, then <Kbd>←</Kbd> <Kbd>→</Kbd> move between the buttons
		and <Kbd>Home</Kbd> / <Kbd>End</Kbd> jump to the ends. Tab again and you leave the whole group,
		not just this button — and tabbing back returns to the button you left on.
	</Text>
	<div
		class="rf-toolbar"
		role="toolbar"
		aria-label="Text formatting"
		use:rovingFocus={{ orientation: 'horizontal', onMove: (el) => (toolbarAt = el.title) }}
	>
		{#each tools as tool}
			<button class="rf-tool" data-roving-item title={tool.label} aria-label={tool.label}>
				<Icon name={tool.icon} size={16} />
			</button>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Tab stop: <Code>{toolbarAt}</Code>
	</Text>
</Card>

<Card title="Orientation and wrapping" id="orientation">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>orientation</Code> picks which arrows act — <Code>'horizontal'</Code>,
		<Code>'vertical'</Code>, or <Code>'both'</Code> (the default). <Code>wrap</Code> decides what
		happens at the end: the left list rolls around to the first item, the right one stops dead.
	</Text>
	<Flex direction="horizontal" gap="lg" wrap>
		<div class="rf-column">
			<Text size="sm" variant="secondary"><Code>wrap: true</Code></Text>
			<div class="rf-list" use:rovingFocus={{ orientation: 'vertical', wrap: true }}>
				{#each stops as stop}
					<button class="rf-row" data-roving-item>{stop}</button>
				{/each}
			</div>
		</div>
		<div class="rf-column">
			<Text size="sm" variant="secondary"><Code>wrap: false</Code></Text>
			<div class="rf-list" use:rovingFocus={{ orientation: 'vertical', wrap: false }}>
				{#each stops as stop}
					<button class="rf-row" data-roving-item>{stop}</button>
				{/each}
			</div>
		</div>
	</Flex>
</Card>

<Card title="Disabled items are skipped" id="disabled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		An item carrying <Code>disabled</Code>, <Code>aria-disabled="true"</Code> or
		<Code>hidden</Code> never takes the tab stop and the arrows step straight over it — so a group
		whose first item happens to be disabled still has a reachable tab stop.
	</Text>
	<div class="rf-list rf-list--wide" use:rovingFocus={{ orientation: 'vertical' }}>
		{#each perms as perm}
			<button class="rf-row" data-roving-item disabled={perm.off}>
				{perm.label}
				{#if perm.off}<span class="rf-note">unavailable on this plan</span>{/if}
			</button>
		{/each}
	</div>
</Card>

<Card title="Typeahead" id="typeahead">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		With <Code>typeahead: true</Code>, typing jumps to the first item whose label starts with what
		you typed — <Code>bl</Code> for Blackberry. Pressing one letter repeatedly cycles through the
		items starting with it, the way a native listbox does. The buffer clears after half a second.
	</Text>
	<div class="rf-list rf-list--wide" use:rovingFocus={{ orientation: 'vertical', typeahead: true }}>
		{#each fruit as name}
			<button class="rf-row" data-roving-item>{name}</button>
		{/each}
	</div>
</Card>

<Card title="Items that change underneath you" id="dynamic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The hard case. Focus a row, then add or delete rows: a new item never becomes a second
		<Code>tabindex="0"</Code>, and deleting the focused row hands focus to whatever now sits at its
		index rather than dumping it on <Code>&lt;body&gt;</Code>. A
		<Code>MutationObserver</Code> on the container is what makes that work without the consumer reporting
		anything.
	</Text>
	<Flex direction="horizontal" gap="sm" style="margin-bottom: 0.75rem;" wrap>
		<Button variant="secondary" label="Add a row" onclick={addRow} />
		<Button
			variant="secondary"
			label="Remove the second row"
			onclick={() => removeRow(1)}
			disabled={rows.length < 2}
		/>
	</Flex>
	<div
		class="rf-list rf-list--wide"
		bind:this={dynamicList}
		use:rovingFocus={{ orientation: 'vertical', onMove: readTabindexes }}
	>
		{#each rows as row (row)}
			<button class="rf-row" data-roving-item>{row}</button>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Live <Code>tabindex</Code>: <Code>{tabindexes}</Code>
	</Text>
</Card>

<Card title="Right-to-left" id="rtl">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Horizontal movement follows the writing direction, not the DOM: inside
		<Code>dir="rtl"</Code>, <Kbd>←</Kbd> advances and <Kbd>→</Kbd> goes back, so the focus ring always
		travels the way the arrow points.
	</Text>
	<div class="rf-toolbar" dir="rtl" role="toolbar" aria-label="اتجاه" use:rovingFocus={{ orientation: 'horizontal' }}>
		{#each ['واحد', 'اثنان', 'ثلاثة', 'أربعة'] as label}
			<button class="rf-row" data-roving-item>{label}</button>
		{/each}
	</div>
</Card>

<Card title="Nested groups" id="nested">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A vertical group inside a horizontal one. While focus is outside it, the inner group holds no tab
		stop of its own — the whole nest is one — and the outer group reaches it through the container,
		which is an item like any other. <Kbd>↓</Kbd> on the container steps inside; from there
		<Kbd>↑</Kbd> <Kbd>↓</Kbd> stay in the panel and never also walk the toolbar behind it, because
		the <em>nearest</em> group owns a keypress outright.
	</Text>
	<div
		class="rf-toolbar"
		role="toolbar"
		aria-label="Nested"
		use:rovingFocus={{ orientation: 'horizontal' }}
	>
		<button class="rf-row" data-roving-item>Before</button>
		<div
			class="rf-list rf-nested"
			role="group"
			aria-label="Filters"
			data-roving-item
			use:rovingFocus={{ orientation: 'vertical' }}
		>
			{#each ['Open', 'Merged', 'Closed'] as label}
				<button class="rf-row" data-roving-item>{label}</button>
			{/each}
		</div>
		<button class="rf-row" data-roving-item>After</button>
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { rovingFocus } from 'glow';
<\/script>

<div role="toolbar" use:rovingFocus={{ orientation: 'horizontal' }}>
  {#each tools as tool}
    <button data-roving-item>{tool.label}</button>
  {/each}
</div>`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		The action is deliberately the shape it is: the invariant it guarantees — one
		<Code>tabindex="0"</Code> per group — lives in the DOM, so the action owns the DOM rather than handing
		a <Code>tabindex</Code> back for you to spread onto every item and get right on every re-render.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<!-- a menu: vertical, typeahead, no wrap, and a custom item selector -->
<ul use:rovingFocus={{
  orientation: 'vertical',
  wrap: false,
  typeahead: true,
  item: '.menu-item',
  onMove: (el, i) => (activeIndex = i)
}}>
  {#each entries as entry}
    <li class="menu-item" role="menuitem" data-roving-label={entry.label}>
      {entry.label}
    </li>
  {/each}
</ul>`}
	/>
</Card>

<Card title="Options" id="options">
	<Table
		variant="simple"
		columns={[
			{ key: 'option', label: 'Option', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{
				option: 'orientation',
				type: "'horizontal' | 'vertical' | 'both'",
				default: "'both'",
				description: 'Which arrow keys move the tab stop.'
			},
			{
				option: 'wrap',
				type: 'boolean',
				default: 'true',
				description: 'Arrowing past the last item lands on the first.'
			},
			{
				option: 'item',
				type: 'string',
				default: "'[data-roving-item]'",
				description: 'Selector for the items. Nested groups keep their own.'
			},
			{
				option: 'typeahead',
				type: 'boolean',
				default: 'false',
				description: 'Type a prefix to jump; data-roving-label overrides the text.'
			},
			{
				option: 'initial',
				type: "number | 'first' | 'last'",
				default: "'first'",
				description: 'Where the tab stop sits before anything is focused.'
			},
			{
				option: 'disabled',
				type: 'boolean',
				default: 'false',
				description: 'Suspend the group and give every item its own tabindex back.'
			},
			{
				option: 'onMove',
				type: '(item: HTMLElement, index: number) => void',
				default: '—',
				description: 'Fired whenever the tab stop moves.'
			}
		]}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Items are marked with <Code>data-roving-item</Code>; an item that is <Code>disabled</Code>,
		<Code>aria-disabled="true"</Code> or <Code>hidden</Code> is skipped. On
		<Code>destroy</Code> every item gets the <Code>tabindex</Code> it had before back.
	</Text>
</Card>

<style>
	.rf-toolbar {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		background: var(--glow-surface-2);
		width: fit-content;
		max-width: 100%;
		flex-wrap: wrap;
	}

	.rf-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.375rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		background: var(--glow-surface-2);
		width: 12rem;
	}

	.rf-list--wide {
		width: 18rem;
	}

	.rf-column {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.rf-nested {
		width: auto;
		background: var(--glow-surface-3);
	}

	.rf-nested:focus-visible {
		outline: 2px solid var(--glow-primary);
		outline-offset: 1px;
	}

	.rf-tool,
	.rf-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid transparent;
		border-radius: 7px;
		background: transparent;
		color: var(--glow-text-primary);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background var(--glow-dur-fast) var(--glow-ease-out);
	}

	.rf-tool {
		padding: 0.4rem;
	}

	.rf-row {
		padding: 0.4rem 0.6rem;
		text-align: start;
		justify-content: space-between;
	}

	.rf-tool:hover:not(:disabled),
	.rf-row:hover:not(:disabled) {
		background: var(--glow-state-hover);
	}

	/* The focus ring is the whole point of this page: it has to be obvious which
	   item currently holds the group's single tab stop. */
	.rf-tool:focus-visible,
	.rf-row:focus-visible {
		outline: 2px solid var(--glow-primary);
		outline-offset: 1px;
		background: var(--glow-primary-soft);
	}

	.rf-tool:disabled,
	.rf-row:disabled {
		color: var(--glow-fg-disabled);
		cursor: not-allowed;
	}

	.rf-note {
		color: var(--glow-text-muted);
		font-size: 0.75rem;
	}
</style>
