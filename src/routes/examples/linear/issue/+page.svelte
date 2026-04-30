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
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Banner from '$lib/banner/Banner.svelte';
	import Markdown from '$lib/typography/Markdown.svelte';
	import type { IconName } from '$lib/icon/types.js';

	type NavItem = { label: string; icon?: IconName; active?: boolean };

	const topItems: NavItem[] = [
		{ label: 'Inbox', icon: 'Inbox' },
		{ label: 'My issues', icon: 'CircleDot' }
	];

	const workspaceGroups: { label: string; items: NavItem[] }[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Projects', icon: 'Box' },
				{ label: 'Views', icon: 'Layers' },
				{ label: 'More', icon: 'Ellipsis' }
			]
		},
		{
			label: 'Your teams',
			items: []
		},
		{
			label: 'Try',
			items: [
				{ label: 'Cycles', icon: 'CircleDashed' },
				{ label: 'Connect Cursor', icon: 'Box' },
				{ label: 'Connect Codex', icon: 'Box' }
			]
		}
	];

	const teamItems: NavItem[] = [
		{ label: 'Issues', icon: 'CircleDot' },
		{ label: 'Projects', icon: 'Box' },
		{ label: 'Views', icon: 'Layers' }
	];

	const issueBody = `Hello,

You have added new LegalStates to EliteAPI library last month.

But EliteVA seems to has autoupdates based on releases of EliteAPI. You didn't create release of EliteAPI with new changes, so EliteVA doesn't see new releases → doesn't update. All you need it is create new release for EliteAPI, that should trigger EliteVA for updates and add new version of EliteAPI. Here is the screen of EliteVA.csproj file with all versions, EliteAPI has 'old' version without recent changes.`;

	const code = `[EliteAPI]
# This file is used to configure the EliteAPI. Changes will take effect after restarting VoiceAttack.
# Remove the semicolon to change a setting

# Whether or not to automatically update the plugin when a new version is available.
#  true (default) will automatically update the plugin
#  false will disable automatic updates
AutoUpdate = true

# The amount of time in milliseconds to wait between each checking for new event data.
#  500 (default) is the recommended value.
#  Setting this to an arbitrarily low value may cause increased CPU usage, while setting it to a high value may cause delays in events.
UpdateDelay = 500

# Path to the Elite Dangerous journals folder. This is used to get event data.
#  Leave this blank to use the default path.
; JournalsPath = "C:\\\\Users\\\\Commander\\\\Saved Games\\\\Frontier Developments\\\\Elite Dangerous"

# Path to the Elite Dangerous options folder. This is used to get keybindings and other settings.
#  Leave this blank to use the default path.
; OptionsPath = "C:\\\\Users\\\\Commander\\\\AppData\\\\Local\\\\Frontier Developments\\\\Elite Dangerous\\\\Options"`;
</script>

<svelte:head><title>Linear · Glow example</title></svelte:head>

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

		<!-- Workspace group -->
		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Workspace</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Stack gap="none">
				{#each workspaceGroups[0].items as item}
					{#snippet wsLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={wsLeading} />
				{/each}
			</Stack>
		</div>

		<!-- Teams group -->
		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Your teams</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			{#snippet teamLeading()}
				<div class="team-icon">🐛</div>
			{/snippet}
			<ListItem title="Somfic" onclick={() => {}} leading={teamLeading} />
			<Stack gap="none" class="indent">
				{#each teamItems as item}
					{#snippet teamItemLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={teamItemLeading} />
				{/each}
			</Stack>
		</div>

		<!-- Try group -->
		<div class="nav-group">
			<button class="group-toggle">
				<Text size="xs" variant="secondary" weight="semibold" as="span">Try</Text>
				<Icon name="ChevronDown" size={12} />
			</button>
			<Stack gap="none">
				{#each workspaceGroups[2].items as item}
					{#snippet tryLeading()}
						{#if item.icon}<Icon name={item.icon} size={16} />{/if}
					{/snippet}
					<ListItem title={item.label} onclick={() => {}} leading={tryLeading} />
				{/each}
			</Stack>
		</div>

		<Spacer />
		<Row class="lsidebar-footer">
			<Button icon="CircleQuestionMark" tooltip="Help" />
		</Row>
	</aside>

	<!-- Main pane -->
	<main class="main">
		<header class="topbar">
			<Row gap="sm" class="breadcrumb">
				<div class="team-icon-sm">🐛</div>
				<Text weight="semibold" as="span">Somfic</Text>
				<Text variant="secondary" as="span">›</Text>
				<Text as="span">SOM-341 LegalState error</Text>
				<Button icon="Star" tooltip="Favorite" />
				<Button icon="Ellipsis" tooltip="More" />
			</Row>
			<Spacer />
			<Row gap="sm">
				<Text size="sm" variant="secondary" as="span">7 / 61</Text>
				<Button icon="ArrowDown" tooltip="Next issue" />
				<Button icon="ArrowUp" tooltip="Previous issue" />
			</Row>
		</header>

		<div class="content">
			<Row gap="sm" class="content-toolbar" justify="end">
				<Button icon="Link" tooltip="Copy link" />
				<Button icon="Copy" tooltip="Copy" />
				<Button icon="GitBranch" tooltip="Branch" />
				<Button icon="ChevronDown" tooltip="More options" />
			</Row>

			{#snippet syncActions()}
				<Button icon="ExternalLink" tooltip="Open in GitHub" />
				<Button icon="Ellipsis" tooltip="More" />
			{/snippet}
			<Banner icon="Github" actions={syncActions}>
				<a href="#sync" class="sync-link">Issue synced</a> with GitHub #40
			</Banner>

			<article class="issue-body">
				<Heading level={1} class="issue-title">LegalState error</Heading>
				<Markdown source={issueBody} />
				<CodeBlock language="ini" {code} />
			</article>
		</div>

		<footer class="statusbar">
			<Spacer />
			<Row gap="sm">
				<Button icon="Triangle" label="Ask Linear" variant="ghost" />
				<Button icon="History" tooltip="History" />
			</Row>
		</footer>
	</main>

	<!-- Properties sidebar -->
	<aside class="rsidebar">
		<Row gap="sm" class="rsidebar-toolbar" justify="end">
			<Button icon="Link" tooltip="Copy link" />
			<Button icon="Boxes" tooltip="Sub-issues" />
			<Button icon="GitBranch" tooltip="Branch" />
			<Button icon="ListFilter" tooltip="Filter" />
			<Button icon="ChevronDown" tooltip="More" />
		</Row>

		<Stack gap="md" class="rsidebar-content">
			<Section title="Properties" level={4} collapsible>
				<Stack gap="xs" class="prop-list">
					<button class="prop-row">
						<Icon name="CircleDashed" size={14} />
						<Text size="sm" as="span">Backlog</Text>
					</button>
					<button class="prop-row">
						<Icon name="Minus" size={14} />
						<Text size="sm" variant="secondary" as="span">Set priority</Text>
					</button>
					<button class="prop-row">
						<Avatar name="Lucas" size="sm" />
						<Text size="sm" as="span">Lucas</Text>
					</button>
				</Stack>
			</Section>

			<Section title="Labels" level={4} collapsible>
				<Row gap="xs" wrap>
					<Pill label="Bug" color="#ef4444" />
					<Pill label="Migrated" color="#3b82f6" />
					<Button icon="Plus" variant="dashed" tooltip="Add label" />
				</Row>
			</Section>

			<Section title="Project" level={4} collapsible>
				<button class="prop-row">
					<Icon name="Box" size={14} />
					<Text size="sm" variant="secondary" as="span">Add to project</Text>
				</button>
			</Section>
		</Stack>
	</aside>
</div>

<style lang="scss">
	.linear-app {
		display: grid;
		grid-template-columns: 240px 1fr 320px;
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
		text-align: left;
		cursor: pointer;
		text-transform: none;

		&:hover {
			color: rgba(255, 255, 255, 0.9);
		}
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
		padding: 0 16px;
		height: 48px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.team-icon-sm {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
	}

	:global(.breadcrumb) {
		min-width: 0;
	}

	.content {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding: 24px 32px 80px;
		max-width: 920px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	:global(.content-toolbar) {
		margin-bottom: 24px;
	}

	.sync-link {
		color: inherit;
		font-weight: 600;
		text-decoration: none;
	}

	.issue-body {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	:global(.issue-title) {
		font-size: 1.75rem !important;
		font-weight: 700 !important;
		line-height: 1.2 !important;
		margin: 0 !important;
	}

	:global(.paragraph) {
		line-height: 1.7;
		color: #c8cbd2;
	}

	.statusbar {
		display: flex;
		align-items: center;
		padding: 6px 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		min-height: 36px;
	}

	.rsidebar {
		display: flex;
		flex-direction: column;
		border-left: 1px solid rgba(255, 255, 255, 0.06);
		min-width: 0;
		overflow: hidden;
	}

	:global(.rsidebar-toolbar) {
		padding: 8px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	:global(.rsidebar-content) {
		padding: 16px;
		overflow-y: auto;
		flex: 1 1 auto;
	}

	:global(.prop-list) {
		gap: 2px !important;
	}

	.prop-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: inherit;
		text-align: left;
		cursor: pointer;
		font: inherit;

		&:hover {
			background: rgba(255, 255, 255, 0.05);
		}
	}

</style>
