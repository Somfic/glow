<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Stack from '$lib/layout/Stack.svelte';
	import Row from '$lib/layout/Row.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import Section from '$lib/typography/Section.svelte';
	import Table from '$lib/data/Table.svelte';
	import type { TableColumn } from '$lib/data/types.js';
	import type { IconName } from '$lib/icon/types.js';

	type NavItem = { label: string; icon?: IconName; active?: boolean };

	const topItems: NavItem[] = [
		{ label: 'Inbox', icon: 'Inbox' },
		{ label: 'My issues', icon: 'CircleDot' }
	];

	const workspaceItems: NavItem[] = [
		{ label: 'Projects', icon: 'Box' },
		{ label: 'Views', icon: 'Layers' },
		{ label: 'More', icon: 'Ellipsis' }
	];

	const teamItems: NavItem[] = [
		{ label: 'Issues', icon: 'CircleDot', active: true },
		{ label: 'Projects', icon: 'Box' },
		{ label: 'Views', icon: 'Layers' }
	];

	const tryItems: NavItem[] = [
		{ label: 'Cycles', icon: 'CircleDashed' },
		{ label: 'Connect Cursor', icon: 'Box' },
		{ label: 'Connect Codex', icon: 'Box' }
	];

	type Issue = {
		id: string;
		title: string;
		project?: string;
		status: 'todo' | 'backlog' | 'in-progress' | 'done';
		labels?: { label: string; color: string }[];
		assignee?: string;
		date: string;
		subtasks?: string;
	};

	const todoIssues: Issue[] = [
		{ id: 'SOM-1', title: 'Get familiar with Linear', status: 'todo', date: 'Apr 29' },
		{ id: 'SOM-2', title: 'Set up your teams', status: 'todo', date: 'Apr 29' },
		{ id: 'SOM-3', title: 'Connect your tools', status: 'todo', date: 'Apr 29' },
		{ id: 'SOM-4', title: 'Import your data', status: 'todo', date: 'Apr 29' }
	];

	const backlogIssues: Issue[] = [
		{ id: 'SOM-472', title: 'top-level functions', project: '1.0 syntax', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], date: 'Feb 2025' },
		{ id: 'SOM-484', title: 'optional underscores for numeric literals', project: '1.0 syntax', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], date: 'Feb 2025' },
		{ id: 'SOM-341', title: 'LegalState error', status: 'backlog', labels: [{ label: 'Bug', color: '#ef4444' }, { label: 'Migrated', color: '#3b82f6' }], assignee: 'Lucas', date: 'Jan 2025' },
		{ id: 'SOM-417', title: 'absolute brick', project: 'advanced arithmetic bricks', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], assignee: 'Lucas', date: 'Sep 2025' },
		{ id: 'SOM-505', title: 'CLOS-style structs', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], date: 'Nov 25' },
		{ id: 'SOM-351', title: 'Error: Could not find VoiceAttack installation directory', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], date: 'May 2025' },
		{ id: 'SOM-425', title: 'replace in string brick', project: 'basic string bricks', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], assignee: 'Lucas', date: 'Sep 2025' },
		{ id: 'SOM-408', title: 'basic string bricks', status: 'backlog', labels: [{ label: 'Migrated', color: '#3b82f6' }], assignee: 'Lucas', date: 'Sep 2025', subtasks: '0/5' }
	];

	let activeFilter = $state<'all' | 'active' | 'backlog'>('all');

	const issueColumns: TableColumn<Issue>[] = [
		{ key: 'id', label: 'ID', width: '90px', render: idCell },
		{ key: 'title', label: 'Title', render: titleCell },
		{ key: 'labels', label: 'Labels', align: 'right', render: labelsCell, width: '180px' },
		{ key: 'assignee', label: 'Assignee', align: 'right', width: '40px', render: assigneeCell },
		{ key: 'date', label: 'Date', align: 'right', width: '80px', render: dateCell }
	];
</script>

{#snippet idCell(_v: any, row: Issue)}
	<Text size="sm" variant="secondary" as="span" class="cell-id">{row.id}</Text>
{/snippet}

{#snippet titleCell(_v: any, row: Issue)}
	<Row gap="sm">
		<Icon name={row.status === 'todo' ? 'Circle' : 'CircleDashed'} size={14} />
		<span class="cell-title">{row.title}{#if row.project}<span class="cell-project"> › {row.project}</span>{/if}</span>
		{#if row.subtasks}
			<span class="subtasks"><Icon name="CircleDashed" size={12} /> {row.subtasks}</span>
		{/if}
	</Row>
{/snippet}

{#snippet labelsCell(_v: any, row: Issue)}
	{#if row.labels}
		<Row gap="xs" justify="end">
			{#each row.labels as l}
				<Pill label={l.label} color={l.color} />
			{/each}
		</Row>
	{/if}
{/snippet}

{#snippet assigneeCell(_v: any, row: Issue)}
	<Avatar name={row.assignee ?? '?'} size="sm" />
{/snippet}

{#snippet dateCell(_v: any, row: Issue)}
	<Text size="sm" variant="secondary" as="span">{row.date}</Text>
{/snippet}

<svelte:head><title>Linear · Issues</title></svelte:head>

<div class="linear-app">
	<!-- Left sidebar -->
	<aside class="lsidebar">
		<div class="ws-switcher">
			<Row gap="sm">
				<Avatar name="somfic" size="sm" />
				<Row gap="xs">
					<Text weight="semibold" as="span">somfic</Text>
					<Icon name="ChevronDown" size={14} />
				</Row>
				<Spacer />
				<Button icon="Search" tooltip="Search" />
				<Button icon="SquarePen" tooltip="New issue" />
			</Row>
		</div>

		<Stack gap="none" class="nav-list">
			{#each topItems as item}
				{#snippet itemLeading()}
					{#if item.icon}<Icon name={item.icon} size={16} />{/if}
				{/snippet}
				<ListItem title={item.label} onclick={() => {}} leading={itemLeading} />
			{/each}
		</Stack>

		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Workspace</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Stack gap="none">
				{#each workspaceItems as item}
					{#snippet wsLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={wsLeading} />
				{/each}
			</Stack>
		</div>

		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Your teams</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			{#snippet teamLeading()}
				<div class="team-icon">🐛</div>
			{/snippet}
			{#snippet teamTrailing()}
				<Icon name="ChevronDown" size={14} />
			{/snippet}
			<ListItem
				title="Somfic"
				onclick={() => {}}
				leading={teamLeading}
				trailing={teamTrailing}
			/>
			<Stack gap="none" class="indent">
				{#each teamItems as item}
					{#snippet teamItemLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem
						title={item.label}
						onclick={() => {}}
						leading={teamItemLeading}
						active={item.active}
					/>
				{/each}
			</Stack>
		</div>

		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Try</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Stack gap="none">
				{#each tryItems as item}
					{#snippet tryLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={tryLeading} />
				{/each}
			</Stack>
		</div>

		<Spacer />
		<Row class="lsidebar-footer">
			<Button icon="CircleHelp" tooltip="Help" />
		</Row>
	</aside>

	<!-- Main pane -->
	<main class="main">
		<header class="topbar">
			<Row gap="sm">
				<div class="team-icon-sm">🐛</div>
				<Heading level={3} class="page-title">Issues</Heading>
				<Button icon="Star" tooltip="Favorite" />
			</Row>
			<Spacer />
			<Button icon="Bell" tooltip="Notifications" />
		</header>

		<div class="filterbar">
			<Row gap="xs">
				<Pill label="All issues" selected={activeFilter === 'all'} onclick={() => (activeFilter = 'all')} />
				<Pill label="Active" selected={activeFilter === 'active'} onclick={() => (activeFilter = 'active')} />
				<Pill label="Backlog" selected={activeFilter === 'backlog'} onclick={() => (activeFilter = 'backlog')} />
				<Button icon="Layers" tooltip="Group by" />
			</Row>
			<Spacer />
			<Row gap="xs">
				<Button icon="ListFilter" tooltip="Filter" />
				<Button icon="SlidersHorizontal" tooltip="Display options" />
				<Button icon="PanelRight" tooltip="Toggle properties" />
			</Row>
		</div>

		<div class="issues-list">
			{#snippet todoActions()}
				<Button icon="Plus" tooltip="Add issue" />
			{/snippet}
			<Section
				title="Todo"
				icon="Circle"
				level={4}
				count={todoIssues.length}
				collapsible
				actions={todoActions}
				class="group-section"
			>
				<Table data={todoIssues} columns={issueColumns} variant="simple" bordered={false} showHeader={false} />
			</Section>

			{#snippet backlogActions()}
				<Button icon="Plus" tooltip="Add issue" />
			{/snippet}
			<Section
				title="Backlog"
				icon="CircleDashed"
				level={4}
				count={backlogIssues.length}
				collapsible
				actions={backlogActions}
				class="group-section"
			>
				<Table data={backlogIssues} columns={issueColumns} variant="simple" bordered={false} showHeader={false} />
			</Section>
		</div>

		<footer class="statusbar">
			<Spacer />
			<Row gap="sm">
				<Button icon="Triangle" label="Ask Linear" variant="ghost" />
				<Button icon="History" tooltip="History" />
			</Row>
		</footer>
	</main>
</div>

<style lang="scss">
	// Lock viewport.
	:global(html),
	:global(body) {
		height: 100%;
		overflow: hidden;
	}
	:global(.sidebar) {
		display: none !important;
	}
	:global(.page) {
		height: 100%;
		min-height: 0 !important;
		overflow: hidden;
		margin: 0 !important;
	}
	:global(.page .content) {
		max-width: 100% !important;
		padding: 0 !important;
		margin: 0 !important;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}
	:global(.page .content > article) {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.linear-app {
		display: grid;
		grid-template-columns: 240px 1fr;
		height: 100%;
		background: #0c0d10;
		color: #d6d8dd;
		font-size: 14px;
		overflow: hidden;
	}

	.lsidebar {
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(255, 255, 255, 0.06);
		padding: 8px;
		overflow-y: auto;
		gap: 4px;
	}

	.ws-switcher {
		padding: 4px 8px 8px;
	}

	:global(.nav-list) {
		gap: 0 !important;
	}

	.nav-group {
		margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.group-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
	}

	:global(.indent) {
		padding-left: 18px !important;
	}

	.team-icon {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
	}

	:global(.lsidebar-footer) {
		padding: 8px;
	}

	.main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 20px;
		height: 48px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.team-icon-sm {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
	}

	:global(.page-title) {
		font-size: 1rem !important;
		font-weight: 600 !important;
	}

	.filterbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.issues-list {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}

	:global(.group-section > .section-header) {
		padding: 8px 20px;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	:global(.cell-id) {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
	}

	:global(.cell-title) {
		font-size: 0.875rem;
		color: #e2e4e9;
	}

	:global(.cell-project) {
		color: #777a85;
	}

	.subtasks {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 999px;
		font-size: 0.75rem;
		color: #999;
	}

	.statusbar {
		display: flex;
		align-items: center;
		padding: 6px 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		min-height: 36px;
	}
</style>
