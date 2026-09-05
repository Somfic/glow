<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import EmptyState from '$lib/empty-state/EmptyState.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import VirtualList from '$lib/data/VirtualList.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	let projects = $state<{ name: string; owner: string }[]>([]);

	function seed() {
		projects = [
			{ name: 'Aurora', owner: 'Ada Lovelace' },
			{ name: 'Bellhop', owner: 'Grace Hopper' }
		];
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Empty State | Glow UI</title></svelte:head>

<Heading level={1}>Empty State</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	The placeholder a list shows when there is nothing in it. Glow had five hand-rolled copies of this
	block — in <Link href="/components/table">Table</Link>,
	<Link href="/components/virtual-list">Virtual List</Link>, the
	<Link href="/components/notification-center">Notification Center</Link>, and both command
	surfaces — each with its own padding, its own muted grey and its own idea of how big a nothing
	should be. This is that block, once.
</Text>

<Card title="Anatomy" id="anatomy">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Four parts, all but the title optional: a mark, a title, a description, and an action. The
		title says what isn't there; the description says why, or what to do; the action does it.
	</Text>
	<EmptyState
		icon="FolderOpen"
		title="No projects yet"
		description="Projects group your work and control who can see it."
		actionLabel="New project"
		onAction={() => {}}
	/>
</Card>

<Card title="Prompt, don't report" id="action">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		An empty state is the one moment you can be sure the user is looking at a region and has
		nothing else to do in it. Spending that on the word <em>None</em> wastes it. So
		<Code>action</Code> is a first-class snippet rather than a footnote — the single-button case
		has an <Code>actionLabel</Code> shorthand, and the snippet takes over when you need two.
	</Text>
	<Flex direction="horizontal" gap="lg" align="stretch">
		<EmptyState
			icon="Inbox"
			title="Nothing to review"
			description="Reports land here when a teammate submits one."
			style="flex: 1 1 15rem;"
		/>
		<EmptyState
			icon="Users"
			title="No members"
			actionLabel="Invite people"
			onAction={() => {}}
			style="flex: 1 1 15rem;"
		/>
		<EmptyState
			icon="Upload"
			title="This folder is empty"
			description="Drop files here, or start from a template."
			style="flex: 1 1 15rem;"
		>
			{#snippet action()}
				<Button variant="primary" icon="Plus" label="Upload files" onclick={() => {}} />
				<Button variant="secondary" label="Browse templates" onclick={() => {}} />
			{/snippet}
		</EmptyState>
	</Flex>
</Card>

<Card title="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>compact</Code> is one line of chrome, for a table cell or a dropdown where the container
		already has padding. <Code>default</Code> is the panel tier — a 200px floor, matching what
		<Code>VirtualList</Code> already used. <Code>roomy</Code> is the full-page tier.
	</Text>
	<Flex direction="horizontal" gap="lg" align="start">
		<div class="frame">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>compact</Code></Text>
			<EmptyState size="compact" icon="SearchX" title="No matching commands" />
		</div>
		<div class="frame">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>default</Code></Text>
			<EmptyState icon="List" title="No items to display" description="Adjust your filters to widen the search." />
		</div>
		<div class="frame">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;"><Code>roomy</Code></Text>
			<EmptyState
				size="roomy"
				icon="Image"
				title="Your library is empty"
				description="Everything you upload shows up here, newest first. Nothing has been added to this workspace yet."
				actionLabel="Upload your first image"
				onAction={() => {}}
			/>
		</div>
	</Flex>
</Card>

<Card title="Custom illustration" id="illustration">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>illustration</Code> replaces the icon with anything — an SVG, a spot drawing, an animated
		glyph. This is the Notification Center's pulsing triplet, kept verbatim so the component can
		absorb it without the panel losing its character.
	</Text>
	<EmptyState title="Inbox zero. Enjoy it." description="Anything new will appear right here.">
		{#snippet illustration()}
			<span class="pulse-mark" aria-hidden="true">
				<span></span><span></span><span></span>
			</span>
		{/snippet}
	</EmptyState>
</Card>

<Card title="Inside a table" id="in-table">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Table</Code> already takes an <Code>emptyState</Code> snippet, so this drops straight in —
		and the empty table stops being a dead end. Add a row and it swaps back.
	</Text>
	<Flex direction="horizontal" gap="sm" style="margin-bottom: 1rem;">
		<Button variant="secondary" label="Add rows" onclick={seed} disabled={projects.length > 0} />
		<Button variant="ghost" label="Clear" onclick={() => (projects = [])} disabled={projects.length === 0} />
	</Flex>
	<Table
		columns={[
			{ key: 'name', label: 'Project' },
			{ key: 'owner', label: 'Owner' }
		]}
		data={projects}
	>
		{#snippet emptyState()}
			<EmptyState
				size="compact"
				icon="FolderOpen"
				title="No projects yet"
				actionLabel="New project"
				onAction={seed}
			/>
		{/snippet}
	</Table>
</Card>

<Card title="Inside a virtual list" id="in-list">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Same snippet name, same component, one size up — <Code>VirtualList</Code> gives its empty state
		a 200px floor, which is exactly what <Code>default</Code> is.
	</Text>
	<div class="frame" style="height: 240px;">
		<VirtualList items={[]} itemHeight={40} renderItem={row}>
			{#snippet emptyState()}
				<EmptyState
					icon="SearchX"
					title="No results"
					description="No records match this filter."
					actionLabel="Clear filters"
					onAction={() => {}}
				/>
			{/snippet}
		</VirtualList>
	</div>
</Card>

{#snippet row(item)}
	<Text size="sm">{item}</Text>
{/snippet}

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { EmptyState, Button, Table } from 'glow';
<\/script>

<!-- The common case: one icon, one line, one button -->
<EmptyState
  icon="FolderOpen"
  title="No projects yet"
  description="Projects group your work and control who can see it."
  actionLabel="New project"
  onAction={createProject}
/>

<!-- Two actions, or anything that isn't a button -->
<EmptyState icon="Upload" title="This folder is empty">
  {#snippet action()}
    <Button variant="primary" icon="Plus" label="Upload files" onclick={upload} />
    <Button variant="secondary" label="Browse templates" onclick={browse} />
  {/snippet}
</EmptyState>

<!-- Wired into a data component -->
<Table {columns} data={rows}>
  {#snippet emptyState()}
    <EmptyState size="compact" icon="FolderOpen" title="No projects yet" />
  {/snippet}
</Table>`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		The root carries <Code>role="status"</Code>, so an empty state that appears after a search, a
		filter or a delete is announced politely instead of leaving a screen reader on a page that went
		quiet. Set <Code>{'live={false}'}</Code> for one that is present on first paint — there is
		nothing to announce, and the region is already in the reading order. The icon is
		<Code>aria-hidden</Code>, because the title already says what it means. The title renders as a
		<Code>{'<p>'}</Code>, not a heading: the same component renders inside a table cell, a dropdown
		and a page body, and no one heading level is right in all three — give the surrounding
		<Code>{'<section>'}</Code> the heading if you need it in the outline.
	</Text>
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
			{ prop: 'title', type: 'string', default: '— (required)', description: 'The headline. What is not there.' },
			{ prop: 'description', type: 'string', default: '—', description: 'One line under the title: why it is empty, or what to do about it.' },
			{ prop: 'icon', type: 'IconProp', default: '—', description: 'Icon drawn above the title. Ignored when illustration is given.' },
			{ prop: 'illustration', type: 'Snippet', default: '—', description: 'Custom mark in place of the icon.' },
			{ prop: 'action', type: 'Snippet', default: '—', description: 'The action area. Takes precedence over actionLabel.' },
			{ prop: 'actionLabel', type: 'string', default: '—', description: 'Shorthand for a single primary button.' },
			{ prop: 'onAction', type: '() => void', default: '—', description: 'Click handler for actionLabel.' },
			{ prop: 'size', type: "'compact' | 'default' | 'roomy'", default: 'default', description: 'Cell/dropdown, panel, or full page.' },
			{ prop: 'live', type: 'boolean', default: 'true', description: 'Announce via role="status" when it appears. Turn off for one present on load.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the root.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the root.' }
		]}
	/>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.frame {
		flex: 1 1 0;
		min-width: 220px;
		border: $border;
		border-radius: $radius;
		padding: $space-sm;
		background: var(--glow-bg-surface-element);
	}

	// The Notification Center's own empty mark, reproduced here to show what
	// `illustration` is for rather than to ship a second copy of it.
	.pulse-mark {
		display: inline-flex;
		gap: 6px;
		opacity: 0.6;

		span {
			display: inline-block;
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: color-mix(in oklab, var(--glow-fg) 35%, transparent);
			animation: pulse-mark calc(var(--glow-dur-glacial) * 3.2) var(--glow-ease-in-out) infinite;

			&:nth-child(2) {
				animation-delay: calc(var(--glow-dur-glacial) * 0.4);
			}

			&:nth-child(3) {
				animation-delay: calc(var(--glow-dur-glacial) * 0.8);
			}
		}
	}

	// The duration tokens collapse to 1ms under reduced motion, which would turn
	// this loop into a strobe rather than stopping it. So the preference is
	// honoured the only way a loop can be: the animation is dropped and the
	// mark holds a static mid-pulse look instead.
	@media (prefers-reduced-motion: reduce) {
		.pulse-mark span {
			animation: none;
			opacity: 0.7;
		}
	}

	@keyframes pulse-mark {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
</style>
