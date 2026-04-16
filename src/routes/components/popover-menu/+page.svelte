<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import PopoverMenu from '$lib/menu/PopoverMenu.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Input from '$lib/input/Input.svelte';
	import type {
		PopoverMenuEntry,
		PopoverMenuCommonItem
	} from '$lib/menu/PopoverMenu.svelte';
	import type { ComboboxEntry } from '$lib/input/types.js';

	const commonItems: PopoverMenuCommonItem[] = [
		{ label: 'Cut', icon: 'Scissors', onclick: () => {} },
		{ label: 'Copy', icon: 'Copy', onclick: () => {} },
		{ label: 'Paste', icon: 'Clipboard', onclick: () => {} },
		{ label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
	];

	const basicItems: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Edit', icon: 'Pencil', onclick: () => {} },
		{ kind: 'item', label: 'Duplicate', icon: 'Copy', onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Archive', icon: 'Archive', onclick: () => {} },
		{ kind: 'item', label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
	];

	const shortcutItems: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Undo', icon: 'RotateCcw', shortcut: '⌘Z', onclick: () => {} },
		{ kind: 'item', label: 'Redo', icon: 'RotateCw', shortcut: '⌘⇧Z', onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Cut', icon: 'Scissors', shortcut: '⌘X', onclick: () => {} },
		{ kind: 'item', label: 'Copy', icon: 'Copy', shortcut: '⌘C', onclick: () => {} },
		{ kind: 'item', label: 'Paste', icon: 'Clipboard', shortcut: '⌘V', onclick: () => {} }
	];

	const disabledItems: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Preview', icon: 'Eye', onclick: () => {} },
		{ kind: 'item', label: 'Share', icon: 'Share2', disabled: true, onclick: () => {} },
		'divider',
		{ kind: 'item', label: 'Export', icon: 'Download', onclick: () => {} }
	];

	let selectedLang = $state('en');
	let langItems: PopoverMenuEntry[] = $derived([
		{ kind: 'item', label: 'English', icon: 'Languages', selected: selectedLang === 'en', onclick: () => (selectedLang = 'en') },
		{ kind: 'item', label: 'Dutch',   icon: 'Languages', selected: selectedLang === 'nl', onclick: () => (selectedLang = 'nl') },
		{ kind: 'item', label: 'German',  icon: 'Languages', selected: selectedLang === 'de', onclick: () => (selectedLang = 'de') },
		{ kind: 'item', label: 'French',  icon: 'Languages', selected: selectedLang === 'fr', onclick: () => (selectedLang = 'fr') }
	]);

	// === Value-picker mode (the "Select replacement" pattern) ===
	let pickedFruit = $state('apple');
	const fruitOptions: ComboboxEntry[] = [
		{ value: 'apple',  label: 'Apple',  icon: 'Apple',  description: 'Red or green pomaceous fruit' },
		{ value: 'banana', label: 'Banana', icon: 'Banana', description: 'Tropical, high in potassium' },
		{ value: 'cherry', label: 'Cherry', icon: 'Cherry', description: 'Small stone fruit' },
		{ value: 'grape',  label: 'Grape',  icon: 'Grape',  description: 'Berries on a vine' }
	];

	// === Searchable + grouped value-picker ===
	let pickedModel = $state('qwen3-4b');
	const modelOptionsGrouped: ComboboxEntry[] = [
		{
			kind: 'group',
			label: 'Reasoning',
			options: [
				{ value: 'qwen3-4b',     label: 'Qwen 3 (4B, thinking)', description: 'Abliterated, fast' },
				{ value: 'deepseek-r1',  label: 'DeepSeek R1 (8B)',      description: 'Strong reasoning, slower' }
			]
		},
		{
			kind: 'group',
			label: 'Instruct',
			options: [
				{ value: 'llama-3.1',    label: 'Llama 3.1 (8B)',  description: 'No reasoning, very fast' },
				{ value: 'mistral-nemo', label: 'Mistral Nemo 12B', description: 'Solid all-rounder' }
			]
		}
	];

	// === Rich Claude.ai-style picker (options + extras snippet) ===
	let claudeModel = $state('opus-4.7');
	let adaptive = $state(true);
	const claudeOptions: ComboboxEntry[] = [
		{ value: 'opus-4.7',   label: 'Opus 4.7',   description: 'Most capable for ambitious work' },
		{ value: 'sonnet-4.6', label: 'Sonnet 4.6', description: 'Most efficient for everyday tasks' },
		{ value: 'haiku-4.5',  label: 'Haiku 4.5',  description: 'Fastest for quick answers' }
	];
	let claudeExtras: PopoverMenuEntry[] = $derived([
		{
			kind: 'toggle',
			label: 'Adaptive thinking',
			description: 'Thinks only when needed',
			checked: adaptive,
			onChange: (v) => (adaptive = v)
		},
		{
			kind: 'submenu',
			label: 'More models',
			// `options` auto-wires into the parent's bind:value
			options: [
				{ value: 'opus-4.6',   label: 'Opus 4.6' },
				{ value: 'opus-3',     label: 'Opus 3' },
				{ value: 'sonnet-4.5', label: 'Sonnet 4.5' }
			]
		}
	]);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Popover Menu | Glow UI</title></svelte:head>

<Heading level={1}>Popover Menu</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Contextual menus with rich item kinds: items, toggles, submenus, and custom snippets.
</Text>

<Group label="When to use what" id="when-to-use">
	<Text variant="secondary" size="sm">
		Glow has several ways to pick a value or trigger an action. Quick map:
	</Text>
	<ul class="when-to-use">
		<li><strong>Select</strong> (<Code>{`Input type="select"`}</Code>) — pick one value from a list. Use the <Code>searchable</Code> prop for short fixed lists; supports group headers via <Code>{`{ kind: 'group', label, options }`}</Code>.</li>
		<li><strong>MultiSelect</strong> (<Code>{`Input type="multiselect"`}</Code>) — pick many values from a list.</li>
		<li><strong>Radio</strong> (<Code>{`Input type="radio"`}</Code>) — short list (≤6) where every option is visible inline.</li>
		<li><strong>ButtonGroup</strong> as toggle — 2–4 options where you want chunky inline buttons (e.g. seed mode).</li>
		<li><strong>PopoverMenu</strong> (this component) — popover with arbitrary items: actions, toggles, submenus, custom snippets. Reach for this when you need richer content than a Select can express, or when items are actions rather than values.</li>
	</ul>
</Group>

<Group label="Value picker (the Select replacement)" id="value-picker">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <Code>options</Code> + <Code>bind:value</Code> and PopoverMenu acts as a fully-featured
		Select: input-style trigger, descriptions, icons, selected-checkmark, the works.
		<Code>{`<Input type="select">`}</Code> uses this internally.
	</Text>
	<PopoverMenu
		options={fruitOptions}
		bind:value={pickedFruit}
		placeholder="Pick a fruit"
	/>
</Group>

<Group label="Searchable + grouped" id="searchable">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Add <Code>searchable</Code> for type-to-find, and mix
		<Code>{`{ kind: 'group', label, options }`}</Code> entries to render section headers.
	</Text>
	<PopoverMenu
		options={modelOptionsGrouped}
		bind:value={pickedModel}
		placeholder="Pick a model"
		searchable
	/>
</Group>

<Group label="Value picker + extras (Claude.ai pattern)" id="rich">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Combine <Code>options</Code> with an <Code>extras</Code> snippet (or extra
		<Code>items</Code>) when the menu needs more than just a flat value list — inline
		toggles, submenus, custom snippets. The trigger still looks like a Select.
	</Text>
	<PopoverMenu
		options={claudeOptions}
		bind:value={claudeModel}
		items={claudeExtras}
		placeholder="Pick a model"
	/>
</Group>

<Group label="Custom trigger" id="custom-trigger">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Provide a <Code>trigger</Code> snippet to override the built-in trigger entirely
		— use when the menu is acting as an action menu (e.g. a kebab button) rather
		than a value picker.
	</Text>
	<PopoverMenu options={fruitOptions} bind:value={pickedFruit}>
		{#snippet trigger()}
			<Button variant="secondary" icon="MoreVertical">{pickedFruit}</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="Common Actions" id="common">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A horizontal row of icon-only buttons at the top for frequent actions.
	</Text>
	<PopoverMenu common={commonItems} items={basicItems}>
		{#snippet trigger()}
			<Button variant="secondary" icon="MoreVertical">Actions</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A simple dropdown with icons, dividers, and danger items.
	</Text>
	<PopoverMenu items={basicItems}>
		{#snippet trigger()}
			<Button variant="secondary" icon="MoreVertical">Actions</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="With Shortcuts" id="shortcuts">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Menu items can display keyboard shortcuts.
	</Text>
	<PopoverMenu items={shortcutItems}>
		{#snippet trigger()}
			<Button variant="secondary" icon="Menu">Edit</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="Disabled Items" id="disabled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Individual items can be disabled.
	</Text>
	<PopoverMenu items={disabledItems}>
		{#snippet trigger()}
			<Button variant="secondary">Options</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="Selection" id="selection">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Use the selected property to indicate the active item with a check mark.
	</Text>
	<PopoverMenu items={langItems}>
		{#snippet trigger()}
			<Button variant="secondary" icon="Languages">{selectedLang.toUpperCase()}</Button>
		{/snippet}
	</PopoverMenu>
</Group>

<Group label="Right Aligned" id="right">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Use align="right" to anchor the menu to the right edge.
	</Text>
	<div style="display: flex; justify-content: flex-end;">
		<PopoverMenu items={basicItems} align="right">
			{#snippet trigger()}
				<Button variant="tertiary" icon="MoreVertical" />
			{/snippet}
		</PopoverMenu>
	</div>
</Group>

<Group label="Entry kinds" id="kinds">
	<CodeBlock
		language="ts"
		code={`type PopoverMenuEntry =
  | { kind: 'item';     label; description?; icon?; shortcut?; selected?; disabled?; danger?; onclick }
  | { kind: 'toggle';   label; description?; checked; disabled?; onChange }
  | { kind: 'submenu';  label; description?; icon?; items: PopoverMenuEntry[] }
  | { kind: 'custom';   render: Snippet }
  | 'divider';`}
	/>
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { PopoverMenu, Button } from 'glow';
  import type { PopoverMenuEntry } from 'glow';

  let dark = $state(true);

  const items: PopoverMenuEntry[] = [
    { kind: 'item', label: 'Edit',  icon: 'Pencil', onclick: () => {} },
    { kind: 'item', label: 'Duplicate', icon: 'Copy', onclick: () => {} },
    'divider',
    { kind: 'toggle', label: 'Dark mode', checked: dark, onChange: (v) => dark = v },
    { kind: 'submenu', label: 'Move to', items: [
      { kind: 'item', label: 'Inbox',   onclick: () => {} },
      { kind: 'item', label: 'Archive', onclick: () => {} },
    ]},
    'divider',
    { kind: 'item', label: 'Delete', icon: 'Trash2', danger: true, onclick: () => {} }
  ];
</script>

<PopoverMenu {items}>
  {#snippet trigger()}
    <Button variant="secondary">Actions</Button>
  {/snippet}
</PopoverMenu>`}
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
			{ prop: 'items',       type: 'PopoverMenuEntry[]',       default: '-',       description: 'Menu entries (item, toggle, submenu, custom, or "divider")' },
			{ prop: 'common',      type: 'PopoverMenuCommonItem[]',  default: '-',       description: 'Optional icon-only action row above the main menu' },
			{ prop: 'trigger',     type: 'Snippet',                  default: 'built-in', description: 'Custom trigger element. Omit to get an input-style trigger using value/placeholder/icon.' },
			{ prop: 'value',       type: 'string',                   default: '-',       description: 'Built-in trigger: shown label when set' },
			{ prop: 'placeholder', type: 'string',                   default: '-',       description: 'Built-in trigger: muted text shown when no value' },
			{ prop: 'icon',        type: 'IconProp',                 default: '-',       description: 'Built-in trigger: leading icon' },
			{ prop: 'fullWidth',   type: 'boolean',                  default: 'true',    description: 'Built-in trigger: fill available width' },
			{ prop: 'align',       type: "'left' | 'right' | 'stretch'", default: "'left'", description: 'Menu alignment relative to trigger' },
			{ prop: 'offset',      type: 'number',                   default: '4',       description: 'Gap between trigger and menu in px' },
			{ prop: 'disabled',    type: 'boolean',                  default: 'false',   description: 'Disable the menu' },
			{ prop: 'open',        type: 'boolean',                  default: 'false',   description: 'Bindable open state' }
		]}
	/>
</Group>

<style>
	.when-to-use {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
		line-height: 1.7;
		color: rgba(238, 238, 238, 0.7);

		li + li { margin-top: 0.25rem; }
	}

	.trigger-demo {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, auto);
		gap: 1.5rem;
		align-items: start;
	}
</style>
