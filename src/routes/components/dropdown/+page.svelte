<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import DropdownMenu from '$lib/menu/DropdownMenu.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import type { DropdownMenuEntry } from '$lib/menu/DropdownMenu.svelte';

	const basicItems: DropdownMenuEntry[] = [
		{ label: 'Edit', icon: 'Pencil', onclick: () => {} },
		{ label: 'Duplicate', icon: 'Copy', onclick: () => {} },
		'divider',
		{ label: 'Archive', icon: 'Archive', onclick: () => {} },
		{ label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
	];

	const shortcutItems: DropdownMenuEntry[] = [
		{ label: 'Undo', icon: 'RotateCcw', shortcut: '⌘Z', onclick: () => {} },
		{ label: 'Redo', icon: 'RotateCw', shortcut: '⌘⇧Z', onclick: () => {} },
		'divider',
		{ label: 'Cut', icon: 'Scissors', shortcut: '⌘X', onclick: () => {} },
		{ label: 'Copy', icon: 'Copy', shortcut: '⌘C', onclick: () => {} },
		{ label: 'Paste', icon: 'Clipboard', shortcut: '⌘V', onclick: () => {} }
	];

	const disabledItems: DropdownMenuEntry[] = [
		{ label: 'Preview', icon: 'Eye', onclick: () => {} },
		{ label: 'Share', icon: 'Share2', disabled: true, onclick: () => {} },
		'divider',
		{ label: 'Export', icon: 'Download', onclick: () => {} }
	];

	let selectedLang = $state('en');
	let langItems: DropdownMenuEntry[] = $derived([
		{ label: 'English', icon: 'Languages', selected: selectedLang === 'en', onclick: () => (selectedLang = 'en') },
		{ label: 'Dutch', icon: 'Languages', selected: selectedLang === 'nl', onclick: () => (selectedLang = 'nl') },
		{ label: 'German', icon: 'Languages', selected: selectedLang === 'de', onclick: () => (selectedLang = 'de') },
		{ label: 'French', icon: 'Languages', selected: selectedLang === 'fr', onclick: () => (selectedLang = 'fr') }
	]);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Dropdown Menu | Glow UI</title></svelte:head>

<Heading level={1}>Dropdown Menu</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Contextual menus for actions, triggered by any element.
	</Text>

	<Group label="Basic" id="basic">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A simple dropdown with icons, dividers, and danger items.
		</Text>
		<DropdownMenu items={basicItems}>
			{#snippet trigger()}
				<Button variant="secondary" icon="MoreVertical">Actions</Button>
			{/snippet}
		</DropdownMenu>
	</Group>

	<Group label="With Shortcuts" id="shortcuts">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Menu items can display keyboard shortcuts.
		</Text>
		<DropdownMenu items={shortcutItems}>
			{#snippet trigger()}
				<Button variant="secondary" icon="Menu">Edit</Button>
			{/snippet}
		</DropdownMenu>
	</Group>

	<Group label="Disabled Items" id="disabled">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Individual items can be disabled. Keyboard navigation skips them.
		</Text>
		<DropdownMenu items={disabledItems}>
			{#snippet trigger()}
				<Button variant="secondary">Options</Button>
			{/snippet}
		</DropdownMenu>
	</Group>

	<Group label="Selection" id="selection">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Use the selected property to indicate the active item with a check mark.
		</Text>
		<DropdownMenu items={langItems}>
			{#snippet trigger()}
				<Button variant="secondary" icon="Languages">{selectedLang.toUpperCase()}</Button>
			{/snippet}
		</DropdownMenu>
	</Group>

	<Group label="Right Aligned" id="right">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Use align="right" to anchor the menu to the right edge.
		</Text>
		<div style="display: flex; justify-content: flex-end;">
			<DropdownMenu items={basicItems} align="right">
				{#snippet trigger()}
					<Button variant="tertiary" icon="MoreVertical" />
				{/snippet}
			</DropdownMenu>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { DropdownMenu, Button } from 'glow-ui';

  const items = [
    { label: 'Edit', icon: 'Pencil', onclick: () => handleEdit() },
    { label: 'Duplicate', icon: 'Copy', onclick: () => handleDuplicate() },
    'divider',
    { label: 'Delete', icon: 'Trash2', danger: true, onclick: () => handleDelete() }
  ];
</script>

<DropdownMenu {items}>
  {#snippet trigger()}
    <Button variant="secondary">Actions</Button>
  {/snippet}
</DropdownMenu>`}
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
				{ prop: 'items', type: 'DropdownMenuEntry[]', default: '-', description: 'Array of menu items or "divider" strings' },
				{ prop: 'trigger', type: 'Snippet', default: '-', description: 'Trigger element (rendered via snippet)' },
				{ prop: 'align', type: "'left' | 'right' | 'stretch'", default: "'left'", description: 'Menu alignment relative to trigger' },
				{ prop: 'offset', type: 'number', default: '4', description: 'Gap between trigger and menu in px' },
				{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disable the dropdown' },
				{ prop: 'open', type: 'boolean', default: 'false', description: 'Bindable open state' }
			]}
		/>
	</Group>
