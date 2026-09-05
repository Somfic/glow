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
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import AnimatedList, { type AnimatedListEffect } from '$lib/animated-list/AnimatedList.svelte';

	type Server = { id: string; name: string; region: string; latency: number };

	let servers = $state<Server[]>([
		{ id: 'ams-1', name: 'ams-1', region: 'Amsterdam', latency: 141 },
		{ id: 'fra-2', name: 'fra-2', region: 'Frankfurt', latency: 24 },
		{ id: 'iad-1', name: 'iad-1', region: 'Ashburn', latency: 276 },
		{ id: 'sfo-3', name: 'sfo-3', region: 'San Francisco', latency: 88 },
		{ id: 'syd-1', name: 'syd-1', region: 'Sydney', latency: 12 }
	]);

	function shuffle() {
		// A new array of the *same* objects: the keys survive, so every row is
		// recognised in its new place and slides there instead of being replaced.
		const next = servers.slice();
		for (let i = next.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[next[i], next[j]] = [next[j], next[i]];
		}
		servers = next;
	}

	function byName() {
		servers = servers.toSorted((a, b) => a.name.localeCompare(b.name));
	}

	function byLatency() {
		servers = servers.toSorted((a, b) => a.latency - b.latency);
	}

	type Person = { id: number; name: string; team: 'Design' | 'Engineering' | 'Support' };

	const people: Person[] = [
		{ id: 1, name: 'Ada Lovelace', team: 'Engineering' },
		{ id: 2, name: 'Grace Hopper', team: 'Engineering' },
		{ id: 3, name: 'Alan Turing', team: 'Design' },
		{ id: 4, name: 'Radia Perlman', team: 'Support' },
		{ id: 5, name: 'Barbara Liskov', team: 'Design' }
	];

	const teams = ['All', 'Design', 'Engineering', 'Support'] as const;
	let team = $state<(typeof teams)[number]>('All');
	const visible = $derived(team === 'All' ? people : people.filter((p) => p.team === team));

	type Task = { id: number; label: string };

	let nextTask = $state(4);
	let tasks = $state<Task[]>([
		{ id: 1, label: 'Rework the shader palette' },
		{ id: 2, label: 'Audit focus rings' },
		{ id: 3, label: 'Ship the release notes' }
	]);

	const pool = [
		'Trim the bundle',
		'Rename the density prop',
		'Write the migration note',
		'Fix the sticky header',
		'Chase the flaky test'
	];

	function addTask() {
		tasks = [{ id: nextTask, label: pool[nextTask % pool.length] }, ...tasks];
		nextTask += 1;
	}

	function removeTask(id: number) {
		tasks = tasks.filter((t) => t.id !== id);
	}

	const effects: AnimatedListEffect[] = ['fade', 'slide', 'scale', 'none'];
	let effect = $state<AnimatedListEffect>('fade');
	let effectItems = $state([1, 2, 3, 4]);
	let nextEffectItem = $state(5);

	function cycleEffectItems() {
		// Removes the first row and appends a new one, so a single click shows an
		// exit, an enter and three moves at once.
		effectItems = [...effectItems.slice(1), nextEffectItem];
		nextEffectItem += 1;
	}

	let tags = $state(['svelte', 'runes', 'flip', 'motion']);
	const extraTags = ['a11y', 'tokens', 'ssr', 'scss'];

	function addTag() {
		const next = extraTags.find((t) => !tags.includes(t));
		if (next) tags = [...tags, next];
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Animated List | Glow UI</title></svelte:head>

<Heading level={1}>Animated List</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A list that keeps its rows when the data changes: reorder, filter, add or remove and every row
	slides to where it now belongs instead of blinking into place. Built on Svelte's
	<Code>animate:flip</Code>, with the enter and exit transitions and the reduced-motion handling
	that make it behave.
</Text>

<Card title="Reordering" id="reorder">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Sorting is your job; animating the result is the component's. Each row is identified by
		<Code>key</Code>, so re-sorting the array moves rows that already exist rather than rebuilding
		the list.
	</Text>
	<Flex gap="md">
		<ButtonGroup>
			<Button label="Shuffle" icon="Shuffle" variant="secondary" onclick={shuffle} />
			<Button label="By name" variant="secondary" onclick={byName} />
			<Button label="By latency" variant="secondary" onclick={byLatency} />
		</ButtonGroup>
		<AnimatedList items={servers} key={(s) => s.id} label="Servers by latency">
			{#snippet children(server)}
				<div class="entry">
					<span class="mono">{server.name}</span>
					<span class="muted">{server.region}</span>
					<Pill
						label={`${server.latency} ms`}
						variant="outlined"
						color={server.latency > 120 ? 'var(--glow-color-warning)' : undefined}
					/>
				</div>
			{/snippet}
		</AnimatedList>
	</Flex>
</Card>

<Card title="Filtering" id="filter">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A filter is a removal and a set of moves at once. The rows that leave fade out where they stood
		— Svelte lifts them out of the flow first — while the ones that stay slide up underneath them,
		so nothing snaps. Filtering back to <Code>All</Code> brings the same rows back, in identity as
		well as in text, because the key came from the data.
	</Text>
	<Flex gap="md">
		<ButtonGroup>
			{#each teams as name (name)}
				<Button
					label={name}
					variant="secondary"
					selected={team === name}
					onclick={() => {
						team = name;
					}}
				/>
			{/each}
		</ButtonGroup>
		<AnimatedList items={visible} key={(p) => p.id} effect="slide" label="Team members">
			{#snippet children(person)}
				<div class="entry">
					<Avatar name={person.name} size="sm" />
					<span>{person.name}</span>
					<span class="muted">{person.team}</span>
				</div>
			{/snippet}
			{#snippet empty()}
				<Text size="sm" variant="muted">Nobody on this team yet.</Text>
			{/snippet}
		</AnimatedList>
	</Flex>
</Card>

<Card title="Adding and removing" id="add-remove">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		New rows are prepended, which pushes everything below them down; removing one pulls them back
		up. The <Code>empty</Code> snippet takes over when the last row goes.
	</Text>
	<Flex gap="md">
		<Flex direction="horizontal" gap="sm">
			<Button label="Add task" icon="Plus" variant="secondary" onclick={addTask} />
			<Button
				label="Clear"
				variant="ghost"
				onclick={() => {
					tasks = [];
				}}
			/>
		</Flex>
		<AnimatedList items={tasks} key={(t) => t.id} effect="scale" label="Tasks">
			{#snippet children(task, i)}
				<div class="entry">
					<span class="index">{i + 1}</span>
					<span class="grow">{task.label}</span>
					<Button
						icon="X"
						variant="ghost"
						tooltip="Remove"
						onclick={() => removeTask(task.id)}
					/>
				</div>
			{/snippet}
			{#snippet empty()}
				<Text size="sm" variant="muted">Nothing left to do.</Text>
			{/snippet}
		</AnimatedList>
	</Flex>
</Card>

<Card title="Enter and exit effects" id="effects">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>effect</Code> picks how a row arrives and leaves — <Code>fade</Code>,
		<Code>slide</Code>, <Code>scale</Code>, or <Code>none</Code> for no enter/exit at all. Moves are
		always a slide, because a row that already exists has somewhere specific to go.
	</Text>
	<Flex gap="md">
		<Flex direction="horizontal" gap="sm" align="center">
			<ButtonGroup>
				{#each effects as name (name)}
					<Button
						label={name}
						variant="secondary"
						selected={effect === name}
						onclick={() => {
							effect = name;
						}}
					/>
				{/each}
			</ButtonGroup>
			<Button label="Cycle" icon="RefreshCw" variant="primary" onclick={cycleEffectItems} />
		</Flex>
		<AnimatedList items={effectItems} key={(n) => n} {effect} label="Effect demo">
			{#snippet children(n)}
				<div class="entry">
					<span class="index">{n}</span>
					<span>Row {n}</span>
				</div>
			{/snippet}
		</AnimatedList>
	</Flex>
</Card>

<Card title="Horizontal" id="horizontal">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>direction="horizontal"</Code> lays the rows out in a wrapping line and turns the enter
		and exit travel sideways, which is what a row of tags wants.
	</Text>
	<Flex gap="md" align="start">
		<Button label="Add tag" icon="Plus" variant="secondary" onclick={addTag} />
		<AnimatedList
			items={tags}
			key={(t) => t}
			direction="horizontal"
			effect="scale"
			gap="0.375rem"
			label="Tags"
		>
			{#snippet children(tag)}
				<Pill label={tag} onRemove={() => (tags = tags.filter((t) => t !== tag))} />
			{/snippet}
		</AnimatedList>
	</Flex>
</Card>

<Card title="Keys are the whole trick" id="keys">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>animate:flip</Code> only fires for items that move <em>within the same keyed block</em>.
		Key by position and the row at index 0 is still the row at index 0 after a sort — nothing moved,
		so nothing animates, and the list silently changes its text instead. That is why
		<Code>key</Code> is required and is never handed the index.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<!-- Nothing animates: the key is the position, and positions never move -->
<AnimatedList items={rows} key={(row) => rows.indexOf(row)}>…</AnimatedList>

<!-- Rows slide: the key travels with the row -->
<AnimatedList items={rows} key={(row) => row.id}>…</AnimatedList>`}
	/>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		Replacing the array is fine — <Code>toSorted</Code>, <Code>filter</Code>, a spread — as long as
		the objects in it are the same objects, or at least carry the same keys. What breaks the
		animation is fresh objects with fresh ids on every render, which is a new list as far as the
		component can tell.
	</Text>
</Card>

<Card title="Reduced motion" id="reduced-motion">
	<Text variant="secondary" size="sm">
		<Code>animate:flip</Code> and Svelte's transitions take a number of milliseconds, not a
		<Code>--glow-dur-*</Code> token, so the media query that collapses those tokens cannot reach
		them. This component reads <Code>prefers-reduced-motion</Code> itself, live, and drops every
		duration to zero when it is set: rows appear in their new places with no travel and no fade,
		rather than doing the same movement very fast.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { AnimatedList } from 'glow';

  let rows = $state([
    { id: 'ams-1', name: 'ams-1', latency: 12 },
    { id: 'fra-2', name: 'fra-2', latency: 24 }
  ]);

  const byLatency = () => (rows = rows.toSorted((a, b) => a.latency - b.latency));
<\/script>

<AnimatedList items={rows} key={(row) => row.id} label="Servers">
  {#snippet children(row, i)}
    <span>{i + 1}. {row.name} — {row.latency} ms</span>
  {/snippet}
  {#snippet empty()}
    <span>No servers.</span>
  {/snippet}
</AnimatedList>`}
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
			{ prop: 'items', type: 'T[]', default: '—', description: 'The rows, in the order to draw them. The component never sorts or filters.' },
			{ prop: 'key', type: '(item: T) => string | number', default: '—', description: 'Required. Stable identity per item — never the index, or nothing animates.' },
			{ prop: 'children', type: 'Snippet<[T, number]>', default: '—', description: 'Row body. Receives the item and its current index.' },
			{ prop: 'empty', type: 'Snippet', default: '—', description: 'Rendered in place of the rows while items is empty.' },
			{ prop: 'duration', type: 'number', default: '320', description: 'Milliseconds for a move, an enter and an exit. Zero under prefers-reduced-motion.' },
			{ prop: 'effect', type: "'fade' | 'slide' | 'scale' | 'none'", default: 'fade', description: 'How a row arrives and leaves. Moves are always a slide.' },
			{ prop: 'direction', type: "'vertical' | 'horizontal'", default: 'vertical', description: 'Layout axis, and the axis the slide effect travels along.' },
			{ prop: 'gap', type: 'string', default: '0.5rem', description: 'Space between rows, as any CSS length.' },
			{ prop: 'as', type: "'ul' | 'ol' | 'div'", default: 'ul', description: 'Container element. ul/ol wrap each row in an li; div gets list roles.' },
			{ prop: 'label', type: 'string', default: '—', description: 'aria-label on the list.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the list.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the list.' }
		]}
	/>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/sortable">Sortable</Link> — when the reordering is done by dragging
			rather than by the data changing underneath.
		</Text>
		<Text size="sm">
			<Link href="/components/list">List Item</Link> — the row itself, with leading and trailing
			slots.
		</Text>
		<Text size="sm">
			<Link href="/components/virtual-list">Virtual List</Link> — for lists long enough that only a
			window of them is rendered, where a FLIP has nothing to measure.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	.entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--glow-surface-2);
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		color: var(--glow-text-primary);
		font-size: 0.875rem;
	}

	.grow {
		flex: 1;
	}

	.muted {
		color: var(--glow-text-muted);
		margin-right: auto;
	}

	.mono {
		font-family: var(--glow-font-mono, ui-monospace, monospace);
	}

	// Tabular so the row numbers stay one width as rows shuffle past each other.
	.index {
		min-width: 1.25rem;
		color: var(--glow-text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
