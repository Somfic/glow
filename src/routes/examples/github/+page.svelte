<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Button from '$lib/button/Button.svelte';
	import Card from '$lib/card/Card.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Tabs from '$lib/tabs/Tabs.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Code from '$lib/code/Code.svelte';
	import Flex from "$lib/layout/Flex.svelte";
	import Spacer from '$lib/layout/Spacer.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import Table from '$lib/data/Table.svelte';
	import Data from '$lib/data/Data.svelte';
	import type { TableColumn, DataItem } from '$lib/data/types.js';

	type FileEntry = {
		name: string;
		type: 'dir' | 'file';
		message: string;
		updated: string;
	};

	const files: FileEntry[] = [
		{ name: '.github/workflows', type: 'dir', message: 'i gave up', updated: '4 months ago' },
		{ name: 'README.md', type: 'file', message: 'Update README', updated: '3 hours ago' },
		{ name: 'comment.png', type: 'file', message: 'screenshot for sponsor profile', updated: '5 months ago' },
		{ name: 'readme.py', type: 'file', message: 'update generator with total commits', updated: '2 weeks ago' }
	];

	let search = $state('');
	let goto = $state('');

	const fileColumns: TableColumn<FileEntry>[] = [
		{ key: 'name', label: 'Name', render: nameCell },
		{ key: 'message', label: 'Last commit message', render: messageCell },
		{ key: 'updated', label: 'Last commit', align: 'right', render: updatedCell }
	];

	const aboutItems: DataItem[] = [
		{ label: 'Readme', icon: 'BookOpen', href: '#readme' },
		{ label: 'Activity', icon: 'Activity', href: '#activity' },
		{ label: '1 star', icon: 'Star' },
		{ label: '1 watching', icon: 'Eye' },
		{ label: '0 forks', icon: 'GitFork' },
		{ label: '1 year old', icon: 'Calendar' }
	];
</script>

<svelte:head><title>Somfic / Golf0ned · GitHub example</title></svelte:head>

<Flex gap="md">
	<!-- Top app bar -->
	<Flex direction="horizontal" gap="sm" class="topbar">
		<Button icon="Menu" tooltip="Menu" />
		<Button icon="Github" tooltip="Home" />
		<Button icon="Ellipsis" tooltip="More" />
		<Text variant="secondary" as="span">/</Text>
		<Text weight="semibold" as="span">Golf0ned</Text>
		<Spacer />
		<div class="search">
			<Input
				type="text"
				placeholder="Type   to search"
				value={search}
				onChange={(v) => (search = v)}
				prefix={searchPrefix}
				shortcut="/"
			/>
		</div>
		<Flex direction="horizontal" gap="xs">
			<Button icon="Terminal" tooltip="Open in terminal" />
			<Button icon="MessageCircle" tooltip="Copilot" />
			<Button icon="Cloud" tooltip="Cloud" />
			<Button icon="Plus" tooltip="Create new" />
			<Button icon="GitPullRequest" tooltip="Pull requests" />
			<Button icon="Inbox" tooltip="Inbox" />
			<Button icon="Bell" tooltip="Notifications" />
			<Avatar name="Somfic Dev" size="sm" />
		</Flex>
	</Flex>

	{#snippet searchPrefix()}
		<Icon name="Search" />
	{/snippet}

<!-- Repo nav tabs -->
	<div class="tabs-wrap">
		<Tabs
			tabs={[
				{ id: 'code', label: 'Code', icon: 'Code', content: codeTab },
				{ id: 'issues', label: 'Issues', icon: 'CircleDot', count: 12, content: placeholderTab },
				{ id: 'pulls', label: 'Pull requests', icon: 'GitPullRequest', count: 4, content: placeholderTab },
				{ id: 'agents', label: 'Agents', icon: 'Bot', content: placeholderTab },
				{ id: 'actions', label: 'Actions', icon: 'Play', content: placeholderTab },
				{ id: 'projects', label: 'Projects', icon: 'LayoutGrid', content: placeholderTab },
				{ id: 'security', label: 'Security and quality', icon: 'ShieldCheck', content: placeholderTab },
				{ id: 'insights', label: 'Insights', icon: 'TrendingUp', content: placeholderTab }
			]}
		/>
	</div>
</Flex>

{#snippet codeTab()}
	<div class="code-grid">
		<Flex gap="md" class="main-col">
			<!-- Repo header -->
			<Flex direction="horizontal" gap="sm">
				<div class="repo-avatar">🦆</div>
				<Heading level={2} class="repo-name">Golf0ned</Heading>
				<Pill label="Public" variant="outlined" />
				<Spacer />
				<Button label="Watch" icon="Eye" variant="secondary" count={1} />
				<Button label="Fork" icon="GitFork" variant="secondary" count={0} />
				<Button label="Star" icon="Star" variant="primary" count={1} />
			</Flex>

			<!-- Branch row -->
			<Flex direction="horizontal" gap="sm">
				<Button label="main" icon="GitBranch" variant="secondary" />
				<Flex direction="horizontal" gap="xs">
					<Icon name="GitBranch" size={14} />
					<Text size="sm" variant="secondary" as="span">1 Branch</Text>
				</Flex>
				<Flex direction="horizontal" gap="xs">
					<Icon name="Tag" size={14} />
					<Text size="sm" variant="secondary" as="span">0 Tags</Text>
				</Flex>
				<Spacer />
				<div class="goto">
					<Input
						type="text"
						icon="Search"
						placeholder="Go to file"
						value={goto}
						onChange={(v) => (goto = v)}
					/>
				</div>
				<Button icon="Plus" variant="secondary" />
				<Button label="Code" icon="Code" variant="primary" />
			</Flex>

			<!-- File list -->
			<Card padding="none" header={lastCommit}>
				<Table data={files} columns={fileColumns} variant="simple" showHeader={false} bordered={false} />
			</Card>

			<!-- README -->
			<Card>
				<Flex gap="sm">
					<div class="readme-tab">
						<Flex direction="horizontal" gap="xs">
							<Icon name="BookOpen" />
							<Text weight="semibold" as="span">README</Text>
						</Flex>
					</div>
					<Heading level={3}>
						<em>Last updated: 2026-04-29 13:25:37.818760</em>
					</Heading>
				</Flex>
			</Card>
		</Flex>

		<Flex gap="lg" class="sidebar">
			<Flex gap="sm">
				<Heading level={3} class="sidebar-title">About</Heading>
				<Text variant="secondary" size="sm">
					<em>No description, website, or topics provided.</em>
				</Text>
				<Data properties={aboutItems} padded={false} />
				<Link href="#report" variant="muted" style="font-size: 0.85rem; margin-top: 0.5rem;">Report repository</Link>
			</Flex>

			<Flex gap="sm">
				<Heading level={3} class="sidebar-title">Releases</Heading>
				<Text size="sm" variant="secondary">No releases published</Text>
			</Flex>

			<Flex gap="sm">
				<Heading level={3} class="sidebar-title">Packages</Heading>
				<Text size="sm" variant="secondary">No packages published</Text>
			</Flex>

			<Flex gap="sm">
				<Heading level={3} class="sidebar-title">Languages</Heading>
				<div class="lang-bar">
					<div style="background: #3572A5; flex: 78;"></div>
					<div style="background: #89e051; flex: 22;"></div>
				</div>
				<Flex gap="xs">
					<Flex direction="horizontal" gap="xs">
						<span class="dot" style="background: #3572A5;"></span>
						<Text size="sm" as="span">Python <strong>78%</strong></Text>
					</Flex>
					<Flex direction="horizontal" gap="xs">
						<span class="dot" style="background: #89e051;"></span>
						<Text size="sm" as="span">Shell <strong>22%</strong></Text>
					</Flex>
				</Flex>
			</Flex>
		</Flex>
	</div>
{/snippet}

{#snippet nameCell(_value: any, row: FileEntry)}
	<Flex direction="horizontal" gap="sm">
		<Icon name={row.type === 'dir' ? 'Folder' : 'File'} />
		<Link href={`#${row.name}`} variant="subtle">{row.name}</Link>
	</Flex>
{/snippet}

{#snippet messageCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

{#snippet updatedCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

{#snippet lastCommit()}
	<Flex direction="horizontal" gap="sm">
		<Avatar name="GA" size="sm" />
		<Text size="sm" as="span"><strong>github-actions[bot]</strong></Text>
		<Text size="sm" variant="secondary" as="span">Update README</Text>
		<Spacer />
		<Code>5c8c750</Code>
		<Text size="sm" variant="secondary" as="span">· 3 hours ago</Text>
		<Flex direction="horizontal" gap="xs">
			<Icon name="History" size={14} />
			<Text size="sm" variant="secondary" as="span">506 Commits</Text>
		</Flex>
	</Flex>
{/snippet}

{#snippet placeholderTab()}
	<Card>
		<Text variant="secondary">Tab content placeholder</Text>
	</Card>
{/snippet}

<style lang="scss">
	// Widen the page content area for this route only. The :global rule only
	// applies while this component is mounted.
	:global(.page.sidebar-mode .content) {
		max-width: 1500px !important;
		padding-left: 2rem !important;
		padding-right: 2rem !important;
	}

	:global(.topbar) {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.search {
		min-width: 320px;
		flex: 0 1 380px;
	}

.tabs-wrap {
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.code-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 296px;
		gap: 2rem;
		align-items: start;
		margin-top: 1.25rem;
	}

	:global(.main-col) {
		min-width: 0;
	}

	.repo-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4ade80, #facc15);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		flex: 0 0 auto;
	}

	:global(.repo-name) {
		margin: 0;
		line-height: 1;
	}

	.goto {
		min-width: 220px;
		flex: 0 1 240px;
	}

.readme-tab {
		display: inline-flex;
		border-bottom: 2px solid #f97316;
		padding-bottom: 0.4rem;
		width: fit-content;
	}

	:global(.sidebar-title) {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.lang-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
		flex: 0 0 auto;
	}
</style>
