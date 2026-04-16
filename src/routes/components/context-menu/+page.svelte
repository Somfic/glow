<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import ContextMenu from '$lib/menu/ContextMenu.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Card from '$lib/card/Card.svelte';
	import type { PopoverMenuEntry, PopoverMenuCommonItem } from '$lib/menu/PopoverMenu.svelte';

	const basicItems: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Cut',   icon: 'Scissors',  shortcut: '⌘X', onclick: () => {} },
		{ kind: 'item', label: 'Copy',  icon: 'Copy',      shortcut: '⌘C', onclick: () => {} },
		{ kind: 'item', label: 'Paste', icon: 'Clipboard', shortcut: '⌘V', onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Select All', icon: 'SquareCheck', shortcut: '⌘A', onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
	];

	const commonItems: PopoverMenuCommonItem[] = [
		{ label: 'Cut',   icon: 'Scissors',  onclick: () => {} },
		{ label: 'Copy',  icon: 'Copy',      onclick: () => {} },
		{ label: 'Paste', icon: 'Clipboard', onclick: () => {} }
	];

	const fileItems: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Open',      icon: 'FolderOpen', onclick: () => {} },
		{ kind: 'item', label: 'Rename',    icon: 'Pencil',     onclick: () => {} },
		{ kind: 'item', label: 'Duplicate', icon: 'Copy',       onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Move to Trash', icon: 'Trash2', danger: true, onclick: () => {} }
	];
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Context Menu | Glow UI</title></svelte:head>

<Heading level={1}>Context Menu</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Right-click menus using the same PopoverMenuEntry shape as PopoverMenu. Currently
	only renders <Code>kind: 'item'</Code> and <Code>'divider'</Code> entries — for
	toggles and submenus use <Code>PopoverMenu</Code>.
</Text>

<Group label="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Right-click anywhere in the box below.
	</Text>
	<ContextMenu items={basicItems}>
		<Card>
			<Text variant="secondary" size="sm">Right-click me</Text>
		</Card>
	</ContextMenu>
</Group>

<Group label="With Common Actions" id="common">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A horizontal icon row at the top for frequent actions.
	</Text>
	<ContextMenu items={fileItems} common={commonItems}>
		<Card>
			<Text variant="secondary" size="sm">Right-click for file actions</Text>
		</Card>
	</ContextMenu>
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { ContextMenu } from 'glow';
  import type { PopoverMenuEntry } from 'glow';

  const items: PopoverMenuEntry[] = [
    { kind: 'item', label: 'Cut',  icon: 'Scissors', shortcut: '⌘X', onclick: () => {} },
    { kind: 'item', label: 'Copy', icon: 'Copy',     shortcut: '⌘C', onclick: () => {} },
    'divider',
    { kind: 'item', label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
  ];
</script>

<ContextMenu {items}>
  <div>Right-click this area</div>
</ContextMenu>`}
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
			{ prop: 'items',    type: 'PopoverMenuEntry[]',      default: '-',     description: 'Menu items (only item-kind and divider rendered)' },
			{ prop: 'common',   type: 'PopoverMenuCommonItem[]', default: '-',     description: 'Horizontal icon-only actions at the top' },
			{ prop: 'children', type: 'Snippet',              default: '-',     description: 'Content area that triggers the context menu' },
			{ prop: 'disabled', type: 'boolean',              default: 'false', description: 'Disable the context menu' }
		]}
	/>
</Group>
