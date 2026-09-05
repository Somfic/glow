<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Button from '$lib/button/Button.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import TreeView from '$lib/tree-view/TreeView.svelte';
	import type { TreeNode } from '$lib/tree-view/types.js';

	const files: TreeNode[] = [
		{
			id: 'src',
			label: 'src',
			children: [
				{
					id: 'lib',
					label: 'lib',
					children: [
						{
							id: 'tree-view',
							label: 'tree-view',
							children: [
								{ id: 'TreeView.svelte', label: 'TreeView.svelte', icon: 'FileCode' },
								{ id: 'TreeItem.svelte', label: 'TreeItem.svelte', icon: 'FileCode' },
								{ id: 'types.ts', label: 'types.ts', icon: 'FileCode' }
							]
						},
						{
							id: 'style',
							label: 'style',
							children: [
								{ id: 'theme.scss', label: 'theme.scss' },
								{ id: 'global.scss', label: 'global.scss' }
							]
						},
						{ id: 'index.ts', label: 'index.ts', icon: 'FileCode' }
					]
				},
				{
					id: 'routes',
					label: 'routes',
					children: [
						{ id: 'layout', label: '+layout.svelte' },
						{ id: 'page', label: '+page.svelte' }
					]
				}
			]
		},
		{
			id: 'static',
			label: 'static',
			children: [
				{ id: 'favicon', label: 'favicon.png', icon: 'FileImage' },
				{ id: 'og', label: 'og-image.png', icon: 'FileImage' }
			]
		},
		{ id: 'package.json', label: 'package.json', icon: 'FileBraces' },
		{ id: 'node_modules', label: 'node_modules', disabled: true, expandable: true }
	];

	// The same component over data that has nothing to do with files: extra
	// fields ride along on the node and the snippets read them back.
	interface Region extends TreeNode {
		population?: string;
		kind: 'continent' | 'country' | 'city';
		children?: Region[];
	}

	const regions: Region[] = [
		{
			id: 'eu',
			label: 'Europe',
			kind: 'continent',
			population: '744M',
			children: [
				{
					id: 'nl',
					label: 'Netherlands',
					kind: 'country',
					population: '17.9M',
					children: [
						{ id: 'ams', label: 'Amsterdam', kind: 'city', population: '921k' },
						{ id: 'rtm', label: 'Rotterdam', kind: 'city', population: '655k' },
						{ id: 'utr', label: 'Utrecht', kind: 'city', population: '361k' }
					]
				},
				{
					id: 'pt',
					label: 'Portugal',
					kind: 'country',
					population: '10.3M',
					children: [{ id: 'lis', label: 'Lisbon', kind: 'city', population: '545k' }]
				}
			]
		},
		{
			id: 'sa',
			label: 'South America',
			kind: 'continent',
			population: '434M',
			children: [
				{
					id: 'br',
					label: 'Brazil',
					kind: 'country',
					population: '203M',
					children: [{ id: 'sp', label: 'São Paulo', kind: 'city', population: '11.4M' }]
				}
			]
		}
	];

	const regionIcon = { continent: 'Globe', country: 'Flag', city: 'Building2' } as const;

	// Controlled expansion: the buttons and the tree read and write the same array.
	let openIds = $state<string[]>(['src', 'lib']);
	const everyFolder = (list: TreeNode[]): string[] =>
		list.flatMap((n) => (n.children?.length ? [n.id, ...everyFolder(n.children)] : []));

	function expandAll() {
		openIds = everyFolder(files);
	}

	function collapseAll() {
		openIds = [];
	}

	function justSrc() {
		openIds = ['src'];
	}

	let picked = $state<string[]>(['types.ts']);
	let multi = $state<string[]>(['TreeView.svelte', 'TreeItem.svelte']);
	let opened = $state<string | undefined>(undefined);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Tree View | Glow UI</title></svelte:head>

<Heading level={1}>Tree View</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A recursive, expandable tree over plain data. It implements the full ARIA tree pattern — one tab
	stop for the whole thing, arrow keys that move through the <em>visible</em> nodes rather than
	along siblings, and <Code>role="tree"</Code> / <Code>treeitem</Code> / <Code>group</Code> with
	live <Code>aria-expanded</Code>, <Code>aria-selected</Code> and <Code>aria-level</Code>. A
	collapsed subtree is not rendered at all, so a tree with ten thousand nodes in it costs whatever
	is currently open.
</Text>

<Card title="File tree" id="files">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The canonical case. Nodes are <Code>{'{ id, label, children? }'}</Code>; anything without
		children is a leaf and gets the file glyph. Click a row to select it, click the chevron to
		expand without selecting, and double-click a leaf to activate it. The
		<Code>node_modules</Code> row is <Code>disabled</Code> — still reachable and readable, but not
		selectable.
	</Text>
	<div class="pane">
		<TreeView
			nodes={files}
			label="Project files"
			defaultExpanded={['src', 'lib', 'tree-view']}
			bind:selected={picked}
			onActivate={(node) => (opened = node.label)}
		/>
	</div>
	<Flex direction="horizontal" gap="sm" align="center" style="margin-top: 1rem;">
		<Text size="sm" variant="secondary">Selected:</Text>
		<Pill label={picked[0] ?? 'nothing'} variant="outlined" />
		{#if opened}
			<Text size="sm" variant="secondary">Activated: <Code>{opened}</Code></Text>
		{/if}
	</Flex>
</Card>

<Card title="Any data, not just files" id="generic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Nothing about the component is file-shaped. Widen <Code>TreeNode</Code> with your own fields —
		here a <Code>kind</Code> and a <Code>population</Code> — and read them back in the
		<Code>icon</Code> and <Code>trailing</Code> snippets, which both receive the node along with its
		level and expanded/selected state.
	</Text>
	<div class="pane">
		<TreeView nodes={regions} label="Regions" defaultExpanded={['eu', 'nl']} indent={22}>
			{#snippet icon({ node })}
				<Icon name={regionIcon[(node as Region).kind]} size={14} />
			{/snippet}
			{#snippet trailing({ node })}
				{(node as Region).population}
			{/snippet}
		</TreeView>
	</div>
</Card>

<Card title="Controlled expansion" id="controlled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>expanded</Code> is bindable, so expansion can be driven from outside — an expand-all
		button, a route, a search that reveals its matches. Leave it unset and the tree keeps the state
		itself, seeded by <Code>defaultExpanded</Code>.
	</Text>
	<Flex direction="horizontal" gap="sm" style="margin-bottom: 1rem;">
		<Button label="Expand all" variant="secondary" onclick={expandAll} />
		<Button label="Collapse all" variant="secondary" onclick={collapseAll} />
		<Button label="Just src" variant="secondary" onclick={justSrc} />
	</Flex>
	<div class="pane">
		<TreeView nodes={files} label="Controlled file tree" bind:expanded={openIds} selection="none" />
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Open: <Code>{JSON.stringify(openIds)}</Code>
	</Text>
</Card>

<Card title="Selection" id="selection">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>selection</Code> is <Code>single</Code> (the default), <Code>multiple</Code> — ctrl/cmd
		click or <Kbd>Space</Kbd> to add one, shift-click for a run across the visible nodes — or
		<Code>none</Code> for a tree that is only ever navigated. <Code>selected</Code> is an array in
		every mode, so flipping the prop does not change the type you bound.
	</Text>
	<Flex direction="horizontal" gap="xl" align="start" wrap>
		<Flex gap="sm">
			<Text size="sm" weight="semibold">Multiple</Text>
			<div class="pane">
				<TreeView
					nodes={files}
					label="Multi-select file tree"
					selection="multiple"
					defaultExpanded={['src', 'lib', 'tree-view']}
					bind:selected={multi}
				/>
			</div>
			<Text size="sm" variant="secondary">{multi.length} selected</Text>
		</Flex>
		<Flex gap="sm">
			<Text size="sm" weight="semibold">Guides off, wider indent</Text>
			<div class="pane">
				<TreeView
					nodes={files}
					label="Plain file tree"
					guides={false}
					indent={28}
					defaultExpanded={['src', 'lib', 'tree-view']}
				/>
			</div>
		</Flex>
	</Flex>
</Card>

<Card title="Indentation guides" id="guides">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The vertical lines are what make a deep tree readable, and they are only useful if they land
		exactly on the chevron of the level they belong to. They are drawn as a repeating gradient
		whose period <em>is</em> <Code>indent</Code>, with the line at its half-way point — which is
		where the twisty column centres its chevron. The two agree by construction rather than by a
		tuned offset, at any <Code>indent</Code>, and there is an assertion on it in
		<Code>tools/scripts/tree-view.test.mjs</Code>.
	</Text>
	<div class="pane">
		<TreeView
			nodes={files}
			label="Deep tree"
			selection="none"
			defaultExpanded={['src', 'lib', 'tree-view', 'style', 'routes', 'static']}
		/>
	</div>
</Card>

<Card title="Keyboard" id="keyboard">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The tree is one tab stop: <Kbd>Tab</Kbd> enters it at the active node and the next
		<Kbd>Tab</Kbd> leaves it entirely. Everything else happens with the arrows. Note that
		<Kbd>↓</Kbd> walks the visible nodes, so it steps out of a folder onto whatever comes after it
		— not to the next sibling.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'key', label: 'Key', render: codeCell },
			{ key: 'does', label: 'Does' }
		]}
		data={[
			{ key: '↓ / ↑', does: 'Next / previous visible node, across parent boundaries.' },
			{ key: '→', does: 'Expands a closed node; on an open one, moves to its first child.' },
			{ key: '←', does: 'Collapses an open node; on a closed one, moves to its parent.' },
			{ key: 'Home / End', does: 'First / last visible node.' },
			{ key: 'Enter', does: 'Selects, and fires onActivate.' },
			{ key: 'Space', does: 'Selects — toggles the node in multiple mode.' },
			{ key: '*', does: "Expands every sibling of the focused node." },
			{ key: 'a–z', does: 'Typeahead: jumps to the next visible node starting with what you type.' }
		]}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Right-then-left is a round trip: <Kbd>→</Kbd> off an open folder lands on its first child, and
		<Kbd>←</Kbd> puts you back on the folder.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { TreeView, type TreeNode } from 'glow';

  const nodes: TreeNode[] = [
    {
      id: 'src',
      label: 'src',
      children: [
        { id: 'index.ts', label: 'index.ts', icon: 'FileCode' },
        { id: 'app.css', label: 'app.css' }
      ]
    },
    { id: 'package.json', label: 'package.json', icon: 'FileBraces' }
  ];

  let selected = $state<string[]>([]);
  let expanded = $state<string[]>(['src']);
<\/script>

<TreeView
  {nodes}
  label="Project files"
  bind:selected
  bind:expanded
  onActivate={(node) => openFile(node.id)}
/>

<!-- Your own glyph and a right-hand slot; both get the node back -->
<TreeView nodes={regions} selection="multiple">
  {#snippet icon({ node, expanded })}
    <Icon name={node.children ? (expanded ? 'FolderOpen' : 'Folder') : 'MapPin'} size={14} />
  {/snippet}
  {#snippet trailing({ node })}
    <Pill label={node.data.count} />
  {/snippet}
<\/TreeView>`}
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
			{ prop: 'nodes', type: 'TreeNode[]', default: '—', description: 'The roots. Every node needs a unique id.' },
			{ prop: 'expanded', type: 'string[]', default: '—', description: 'Bindable. Ids of the open nodes; unset means the tree owns the state.' },
			{ prop: 'defaultExpanded', type: 'string[]', default: '[]', description: 'Seeds the uncontrolled case. Read once.' },
			{ prop: 'selected', type: 'string[]', default: '—', description: 'Bindable. An array in every selection mode.' },
			{ prop: 'defaultSelected', type: 'string[]', default: '[]', description: 'Seeds the uncontrolled case.' },
			{ prop: 'selection', type: "'single' | 'multiple' | 'none'", default: 'single', description: 'multiple adds ctrl/cmd-click, shift-range and Space.' },
			{ prop: 'label', type: 'string', default: '—', description: 'aria-label on the role="tree" element.' },
			{ prop: 'indent', type: 'number', default: '20', description: 'Pixels per level, and the width of the twisty column.' },
			{ prop: 'guides', type: 'boolean', default: 'true', description: 'The vertical ancestor lines.' },
			{ prop: 'typeahead', type: 'boolean', default: 'true', description: 'Letter keys jump to a matching visible node.' },
			{ prop: 'onExpandedChange', type: '(ids: string[]) => void', default: '—', description: 'Fires after expansion changes.' },
			{ prop: 'onSelectionChange', type: '(ids, node) => void', default: '—', description: 'The new selection, and the node that caused it.' },
			{ prop: 'onActivate', type: '(node: TreeNode) => void', default: '—', description: 'Enter, or a double-click — "open this one".' },
			{ prop: 'icon', type: 'Snippet<[TreeItemContext]>', default: '—', description: 'Replaces the glyph. Default is folder-open / folder / file.' },
			{ prop: 'children', type: 'Snippet<[TreeItemContext]>', default: '—', description: "Replaces the row's label text." },
			{ prop: 'trailing', type: 'Snippet<[TreeItemContext]>', default: '—', description: 'Right-aligned slot on every row.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the tree.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the tree.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">TreeNode</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Field', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'id', type: 'string', description: 'Unique in the tree. Expansion and selection are reported as these.' },
			{ prop: 'label', type: 'string', description: 'Row text, and what typeahead matches.' },
			{ prop: 'children', type: 'TreeNode[]', description: 'Omit for a leaf. A collapsed subtree is never rendered.' },
			{ prop: 'icon', type: 'IconProp', description: 'Overrides the default glyph for this node.' },
			{ prop: 'disabled', type: 'boolean', description: 'Focusable and readable, but not selectable or expandable.' },
			{ prop: 'expandable', type: 'boolean', description: 'Forces a twisty on a node whose children have not loaded yet.' },
			{ prop: 'data', type: 'unknown', description: 'Anything the row needs; the interface is structural, so extra fields survive too.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">TreeItemContext</Text>
	<Text size="sm" variant="secondary">
		What every snippet receives: <Code>node</Code>, <Code>level</Code> (1-based, and the value of
		<Code>aria-level</Code>), <Code>expanded</Code>, <Code>selected</Code>, and
		<Code>hasChildren</Code>.
	</Text>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/accordion">Accordion</Link> — one level of expand/collapse, with
			panels rather than rows.
		</Text>
		<Text size="sm">
			<Link href="/components/sidebar">Sidebar</Link> — navigation groups, when the hierarchy is
			fixed and two deep.
		</Text>
		<Text size="sm">
			<Link href="/components/virtual-list">Virtual List</Link> — for a flat list long enough that
			even the visible rows are too many.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	// A framed pane, because a tree in the wild always lives in one — and it is
	// what makes the indent guides legible against the page background.
	.pane {
		border: 1px solid var(--glow-border-color);
		border-radius: 12px;
		background: var(--glow-bg-surface-element);
		padding: 0.5rem;
		min-width: 16rem;
		max-width: 26rem;
	}
</style>
