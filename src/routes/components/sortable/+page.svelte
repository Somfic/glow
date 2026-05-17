<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import { sortable } from '$lib/sortable/sortable.js';

	let tasks = $state([
		{ id: 't1', name: 'Draft the proposal', icon: 'FileText' as const },
		{ id: 't2', name: 'Review with the team', icon: 'Users' as const },
		{ id: 't3', name: 'Incorporate feedback', icon: 'MessageSquare' as const },
		{ id: 't4', name: 'Ship the release', icon: 'Rocket' as const },
		{ id: 't5', name: 'Announce in changelog', icon: 'Megaphone' as const }
	]);
	let lastMove = $state<string | null>(null);

	let tags = $state([
		{ id: 'a', label: 'Design' },
		{ id: 'b', label: 'Engineering' },
		{ id: 'c', label: 'Research' },
		{ id: 'd', label: 'Marketing' }
	]);

	let members = $state([
		{ id: 'm1', name: 'Ada Lovelace', role: 'Lead' },
		{ id: 'm2', name: 'Alan Turing', role: 'Engineer' },
		{ id: 'm3', name: 'Grace Hopper', role: 'Engineer' },
		{ id: 'm4', name: 'Katherine Johnson', role: 'Analyst' }
	]);
</script>

<svelte:head><title>Sortable | Glow UI</title></svelte:head>

<Heading level={1}>Sortable</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A pointer-driven drag-to-reorder action. Apply <Code>use:sortable</Code> to any container you already
	render and it lets the user reorder its children. On drop it mutates your reactive <Code
		>items</Code
	> array in place, so a keyed
	<Code>{'{#each}'}</Code> just re-renders into the new order — no callback wiring needed. Reordered items
	settle with a FLIP animation. Supports vertical and horizontal lists.
</Text>

<Card title="Vertical list reorder">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		Press and drag a row up or down. A plain click still works — a drag only begins after the
		pointer moves a few pixels.
	</Text>
	<div
		class="sort-list"
		use:sortable={{
			items: tasks,
			direction: 'vertical',
			onReorder: (from, to) => (lastMove = `moved index ${from} → ${to}`)
		}}
	>
		{#each tasks as task (task.id)}
			<div class="sort-row">
				<ListItem title={task.name}>
					{#snippet leading()}
						<Icon name="GripVertical" size={16} />
					{/snippet}
					{#snippet trailing()}
						<Icon name={task.icon} size={15} />
					{/snippet}
				</ListItem>
			</div>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Order: <Code>{tasks.map((t) => t.name).join(' → ')}</Code>
	</Text>
	{#if lastMove}
		<Text size="sm" variant="secondary" style="margin-top: 0.35rem;">
			Last <Code>onReorder</Code>: <Code>{lastMove}</Code>
		</Text>
	{/if}
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Horizontal list reorder">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		Same action, <Code>direction: 'horizontal'</Code> — drag the tags left and right.
	</Text>
	<div class="sort-tags" use:sortable={{ items: tags, direction: 'horizontal' }}>
		{#each tags as tag (tag.id)}
			<span class="sort-tag">{tag.label}</span>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Order: <Code>{tags.map((t) => t.label).join(', ')}</Code>
	</Text>
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Drag handle only">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		Pass a CSS selector as <Code>handle</Code> to restrict where a drag can start. Here only the grip
		<Code>⠿</Code> icon is draggable — the rest of the row stays free for clicks and text selection.
	</Text>
	<div
		class="sort-list"
		use:sortable={{ items: members, direction: 'vertical', handle: '.drag-handle' }}
	>
		{#each members as member (member.id)}
			<div class="sort-row sort-row--handle">
				<ListItem title={member.name} subtitle={member.role}>
					{#snippet leading()}
						<span class="drag-handle" title="Drag to reorder">
							<Icon name="GripVertical" size={16} />
						</span>
					{/snippet}
				</ListItem>
			</div>
		{/each}
	</div>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Order: <Code>{members.map((m) => m.name).join(' → ')}</Code>
	</Text>
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="API">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { sortable } from '@somfic/glow';

  let items = $state([
    { id: 'a', name: 'First' },
    { id: 'b', name: 'Second' },
    { id: 'c', name: 'Third' }
  ]);
<\/script>

<div
  use:sortable={{
    items,                       // reactive $state array (mutated in place)
    direction: 'vertical',       // 'vertical' (default) | 'horizontal'
    handle: '.drag-handle',      // optional: only this selector starts a drag
    disabled: false,             // optional read-only mode
    onReorder: (from, to) => {}  // optional: persistence / analytics
  }}
>
  {#each items as item (item.id)}
    <ListItem title={item.name} />
  {/each}
</div>`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Items keep their place when the press doesn't move (click-through preserved), and elements
		matched by <Code>input, textarea, select, [contenteditable]</Code>
		or marked <Code>data-no-drag</Code> won't start a drag — so form rows stay usable. Honors <Code
			>prefers-reduced-motion</Code
		>.
	</Text>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.sort-list {
		display: flex;
		flex-direction: column;
		gap: $space-xs;
	}
	.sort-row {
		border-radius: $radius;
		background: var(--glow-bg-surface-element);
		border: $border;
		cursor: grab;
		transition: background-color $dur-fast ease;

		&:hover {
			background-color: $tertiary-hover;
		}
	}
	.sort-row--handle {
		cursor: default;

		&:hover {
			background-color: var(--glow-bg-surface-element);
		}
	}
	.drag-handle {
		display: inline-flex;
		align-items: center;
		cursor: grab;
		color: var(--glow-text-muted);
		border-radius: $radius;
		padding: $space-xs;
		transition:
			color $dur-fast ease,
			background-color $dur-fast ease;
	}
	.drag-handle:hover {
		color: var(--glow-fg);
		background-color: $tertiary-hover;
	}
	.sort-tags {
		display: flex;
		flex-direction: row;
		gap: $space-sm;
		flex-wrap: wrap;
	}
	.sort-tag {
		display: inline-flex;
		align-items: center;
		padding: $space-xs $space-md;
		border-radius: 999px;
		font-size: $text-sm;
		background: var(--glow-bg-surface-element);
		border: $border;
		cursor: grab;
		user-select: none;
		transition: background-color $dur-fast ease;

		&:hover {
			background-color: $tertiary-hover;
		}
	}
</style>
