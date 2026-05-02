<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Flex from "$lib/layout/Flex.svelte";
	import Spacer from '$lib/layout/Spacer.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import Section from '$lib/typography/Section.svelte';
	import Table from '$lib/data/Table.svelte';
	import ContextMenu from '$lib/menu/ContextMenu.svelte';
	import type { TableColumn } from '$lib/data/types.js';
	import type { PopoverMenuEntry } from '$lib/menu/PopoverMenu.svelte';
	import type { IconName } from '$lib/icon/types.js';
	import { toast } from '$lib/toast/toast.svelte.js';

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

	// Right-click context menu — Linear-style "everything you can do to an issue"
	// menu. Headless ContextMenu opened programmatically from row right-clicks.
	let ctxOpen = $state(false);
	let ctxX = $state(0);
	let ctxY = $state(0);
	let ctxIssue = $state<Issue | null>(null);

	function notify(action: string) {
		const id = ctxIssue?.id ?? '?';
		toast.info(`${action} → ${id}`);
	}

	const statusOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Backlog', icon: 'CircleDashed', onclick: () => notify('Status: Backlog') },
		{ kind: 'item', label: 'Todo', icon: 'Circle', onclick: () => notify('Status: Todo') },
		{ kind: 'item', label: 'In progress', icon: 'CircleDot', onclick: () => notify('Status: In progress') },
		{ kind: 'item', label: 'Done', icon: 'CircleCheck', onclick: () => notify('Status: Done') },
		{ kind: 'item', label: 'Cancelled', icon: 'CircleX', onclick: () => notify('Status: Cancelled') }
	];

	const assigneeOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Lucas', icon: 'User', onclick: () => notify('Assigned to Lucas') },
		{ kind: 'item', label: 'Alex', icon: 'User', onclick: () => notify('Assigned to Alex') },
		{ kind: 'item', label: 'Maya', icon: 'User', onclick: () => notify('Assigned to Maya') },
		'divider',
		{ kind: 'item', label: 'No assignee', icon: 'UserX', onclick: () => notify('Unassigned') }
	];

	const priorityOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Urgent', icon: 'TriangleAlert', onclick: () => notify('Priority: Urgent') },
		{ kind: 'item', label: 'High', icon: 'SignalHigh', onclick: () => notify('Priority: High') },
		{ kind: 'item', label: 'Medium', icon: 'SignalMedium', onclick: () => notify('Priority: Medium') },
		{ kind: 'item', label: 'Low', icon: 'SignalLow', onclick: () => notify('Priority: Low') },
		{ kind: 'item', label: 'No priority', icon: 'Minus', onclick: () => notify('No priority') }
	];

	const teamOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Somfic', onclick: () => notify('Team: Somfic') },
		{ kind: 'item', label: 'Engineering', onclick: () => notify('Team: Engineering') },
		{ kind: 'item', label: 'Design', onclick: () => notify('Team: Design') }
	];

	const resourcesOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Add link…', icon: 'Link', onclick: () => notify('Add link') },
		{ kind: 'item', label: 'Attach file…', icon: 'Paperclip', onclick: () => notify('Attach file') },
		{ kind: 'item', label: 'Reference issue…', icon: 'CircleDot', onclick: () => notify('Reference issue') }
	];

	const morePropertiesOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Labels', icon: 'Tag', onclick: () => notify('Labels') },
		{ kind: 'item', label: 'Project', icon: 'Box', onclick: () => notify('Project') },
		{ kind: 'item', label: 'Cycle', icon: 'CircleDashed', onclick: () => notify('Cycle') },
		{ kind: 'item', label: 'Due date', icon: 'Calendar', onclick: () => notify('Due date') },
		{ kind: 'item', label: 'Estimate', icon: 'Clock', onclick: () => notify('Estimate') }
	];

	const createRelatedOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Sub-issue', icon: 'CornerDownRight', onclick: () => notify('Create sub-issue') },
		{ kind: 'item', label: 'Related issue', icon: 'GitBranch', onclick: () => notify('Create related') },
		{ kind: 'item', label: 'Duplicate', icon: 'Copy', onclick: () => notify('Duplicate') }
	];

	const markAsOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Blocked', icon: 'OctagonAlert', onclick: () => notify('Marked blocked') },
		{ kind: 'item', label: 'Blocking', icon: 'Octagon', onclick: () => notify('Marked blocking') },
		{ kind: 'item', label: 'Duplicate of…', icon: 'Copy', onclick: () => notify('Marked duplicate') }
	];

	const removeOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Remove from project', onclick: () => notify('Removed from project') },
		{ kind: 'item', label: 'Remove from cycle', onclick: () => notify('Removed from cycle') },
		{ kind: 'item', label: 'Clear labels', onclick: () => notify('Cleared labels') }
	];

	const copyOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'ID', shortcut: '⌘C', onclick: () => notify('Copied ID') },
		{ kind: 'item', label: 'Title', onclick: () => notify('Copied title') },
		{ kind: 'item', label: 'URL', onclick: () => notify('Copied URL') },
		{ kind: 'item', label: 'Branch name', onclick: () => notify('Copied branch') },
		{ kind: 'item', label: 'Markdown', onclick: () => notify('Copied markdown') }
	];

	const convertToOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Project', icon: 'Box', onclick: () => notify('Converted to project') },
		{ kind: 'item', label: 'Initiative', icon: 'Target', onclick: () => notify('Converted to initiative') }
	];

	const openInOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'GitHub', onclick: () => notify('Open in GitHub') },
		{ kind: 'item', label: 'Slack', onclick: () => notify('Open in Slack') },
		{ kind: 'item', label: 'Browser', onclick: () => notify('Open in browser') }
	];

	const favoriteOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Add to favorites', icon: 'Star', onclick: () => notify('Favorited') },
		{ kind: 'item', label: 'Pin to top', icon: 'Pin', onclick: () => notify('Pinned') }
	];

	const remindMeOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'In 1 hour', onclick: () => notify('Reminder: 1h') },
		{ kind: 'item', label: 'Tomorrow', onclick: () => notify('Reminder: tomorrow') },
		{ kind: 'item', label: 'Next week', onclick: () => notify('Reminder: next week') },
		{ kind: 'item', label: 'Custom…', onclick: () => notify('Reminder: custom') }
	];

	const findSuggestionsOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Similar issues', icon: 'Sparkles', onclick: () => notify('Similar issues') },
		{ kind: 'item', label: 'Possible owners', icon: 'Users', onclick: () => notify('Possible owners') }
	];

	const deleteOptions: PopoverMenuEntry[] = [
		{ kind: 'item', label: 'Delete forever', icon: 'Trash2', danger: true, onclick: () => notify('Deleted') },
		{ kind: 'item', label: 'Move to trash', icon: 'Archive', onclick: () => notify('Trashed') }
	];

	const issueMenu: PopoverMenuEntry[] = [
		{ kind: 'submenu', label: 'Status', icon: 'CircleDashed', shortcut: 'S', items: statusOptions },
		{ kind: 'submenu', label: 'Assignee', icon: 'CircleUser', shortcut: 'A', items: assigneeOptions },
		{ kind: 'submenu', label: 'Priority', icon: 'ChartBar', shortcut: 'P', items: priorityOptions },
		{ kind: 'submenu', label: 'Team', icon: 'Users', shortcut: '⌘ ↑ M', items: teamOptions },
		{ kind: 'submenu', label: 'Resources', icon: 'Link', items: resourcesOptions },
		{ kind: 'submenu', label: 'More properties', icon: 'Ellipsis', items: morePropertiesOptions },
		'divider',
		{ kind: 'submenu', label: 'Create related', icon: 'CopyPlus', items: createRelatedOptions },
		{ kind: 'submenu', label: 'Mark as', icon: 'Flag', items: markAsOptions },
		{ kind: 'submenu', label: 'Remove', icon: 'FlagOff', items: removeOptions },
		'divider',
		{ kind: 'submenu', label: 'Copy', icon: 'Clipboard', items: copyOptions },
		{ kind: 'submenu', label: 'Convert to', icon: 'RefreshCw', items: convertToOptions },
		{ kind: 'submenu', label: 'Open in', icon: 'ArrowUpRight', items: openInOptions },
		'divider',
		{ kind: 'submenu', label: 'Favorite', icon: 'Star', shortcut: '⌥ F', items: favoriteOptions },
		{ kind: 'submenu', label: 'Remind me', icon: 'Clock', shortcut: '↑ H', items: remindMeOptions },
		'divider',
		{ kind: 'submenu', label: 'Find suggestions', icon: 'Sparkles', shortcut: 'S', items: findSuggestionsOptions },
		'divider',
		{ kind: 'submenu', label: 'Delete', icon: 'Trash2', shortcut: 'S', items: deleteOptions }
	];

	function openIssueMenu(issue: Issue, _index: number, e: MouseEvent) {
		ctxIssue = issue;
		ctxX = e.clientX;
		ctxY = e.clientY;
		ctxOpen = true;
	}

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
	<Flex direction="horizontal" gap="sm">
		<Icon name={row.status === 'todo' ? 'Circle' : 'CircleDashed'} size={14} />
		<span class="cell-title">{row.title}{#if row.project}<span class="cell-project"> › {row.project}</span>{/if}</span>
		{#if row.subtasks}
			<span class="subtasks"><Icon name="CircleDashed" size={12} /> {row.subtasks}</span>
		{/if}
	</Flex>
{/snippet}

{#snippet labelsCell(_v: any, row: Issue)}
	{#if row.labels}
		<Flex direction="horizontal" gap="xs" justify="end">
			{#each row.labels as l}
				<Pill label={l.label} color={l.color} />
			{/each}
		</Flex>
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
			<Flex direction="horizontal" gap="sm">
				<Avatar name="somfic" size="sm" />
				<Flex direction="horizontal" gap="xs">
					<Text weight="semibold" as="span">somfic</Text>
					<Icon name="ChevronDown" size={14} />
				</Flex>
				<Spacer />
				<Button icon="Search" tooltip="Search" />
				<Button icon="SquarePen" tooltip="New issue" />
			</Flex>
		</div>

		<Flex gap="none" class="nav-list">
			{#each topItems as item}
				{#snippet itemLeading()}
					{#if item.icon}<Icon name={item.icon} size={16} />{/if}
				{/snippet}
				<ListItem title={item.label} onclick={() => {}} leading={itemLeading} />
			{/each}
		</Flex>

		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Workspace</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Flex gap="none">
				{#each workspaceItems as item}
					{#snippet wsLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={wsLeading} />
				{/each}
			</Flex>
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
			<Flex gap="none" class="indent">
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
			</Flex>
		</div>

		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Try</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Flex gap="none">
				{#each tryItems as item}
					{#snippet tryLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={tryLeading} />
				{/each}
			</Flex>
		</div>

		<Spacer />
		<Flex direction="horizontal" class="lsidebar-footer">
			<Button icon="CircleQuestionMark" tooltip="Help" />
		</Flex>
	</aside>

	<!-- Main pane -->
	<main class="main">
		<header class="topbar">
			<Flex direction="horizontal" gap="sm">
				<div class="team-icon-sm">🐛</div>
				<Heading level={3} class="page-title">Issues</Heading>
				<Button icon="Star" tooltip="Favorite" />
			</Flex>
			<Spacer />
			<Button icon="Bell" tooltip="Notifications" />
		</header>

		<div class="filterbar">
			<Flex direction="horizontal" gap="xs">
				<Pill label="All issues" selected={activeFilter === 'all'} onclick={() => (activeFilter = 'all')} />
				<Pill label="Active" selected={activeFilter === 'active'} onclick={() => (activeFilter = 'active')} />
				<Pill label="Backlog" selected={activeFilter === 'backlog'} onclick={() => (activeFilter = 'backlog')} />
				<Button icon="Layers" tooltip="Group by" />
			</Flex>
			<Spacer />
			<Flex direction="horizontal" gap="xs">
				<Button icon="ListFilter" tooltip="Filter" />
				<Button icon="SlidersHorizontal" tooltip="Display options" />
				<Button icon="PanelRight" tooltip="Toggle properties" />
			</Flex>
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
				<Table data={todoIssues} columns={issueColumns} variant="simple" bordered={false} showHeader={false} onRowContextMenu={openIssueMenu} />
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
				<Table data={backlogIssues} columns={issueColumns} variant="simple" bordered={false} showHeader={false} onRowContextMenu={openIssueMenu} />
			</Section>
		</div>

		<footer class="statusbar">
			<Spacer />
			<Flex direction="horizontal" gap="sm">
				<Button icon="Triangle" label="Ask Linear" variant="ghost" />
				<Button icon="History" tooltip="History" />
			</Flex>
		</footer>
	</main>
</div>

<ContextMenu items={issueMenu} bind:open={ctxOpen} bind:x={ctxX} bind:y={ctxY} />

<style lang="scss">
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
