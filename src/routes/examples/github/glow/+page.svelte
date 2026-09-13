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
	import Flex from '$lib/layout/Flex.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import Progress from '$lib/progress/Progress.svelte';
	import Section from '$lib/typography/Section.svelte';
	import EmptyState from '$lib/empty-state/EmptyState.svelte';
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
		{
			name: 'comment.png',
			type: 'file',
			message: 'screenshot for sponsor profile',
			updated: '5 months ago'
		},
		{
			name: 'readme.py',
			type: 'file',
			message: 'update generator with total commits',
			updated: '2 weeks ago'
		}
	];

	let search = $state('');
	let goto = $state('');

	const fileColumns: TableColumn<FileEntry>[] = [
		{ key: 'name', label: 'Name', render: nameCell },
		{ key: 'message', label: 'Last commit message', render: mutedCell },
		{ key: 'updated', label: 'Last commit', align: 'right', render: mutedCell }
	];

	const aboutItems: DataItem[] = [
		{ label: 'Readme', icon: 'BookOpen', href: '#readme' },
		{ label: 'Activity', icon: 'Activity', href: '#activity' },
		{ label: '1 star', icon: 'Star' },
		{ label: '1 watching', icon: 'Eye' },
		{ label: '0 forks', icon: 'GitFork' },
		{ label: '1 year old', icon: 'Calendar' }
	];

	// Language split. Each one is a Progress bar rather than a hand-built
	// stacked bar — the percentages are the data, and the bar already knows how
	// to draw and announce one.
	const languages = [
		{ name: 'Python', share: 78, color: '#3572A5' },
		{ name: 'Shell', share: 22, color: '#89e051' }
	];
</script>

<svelte:head><title>Somfic / Golf0ned (Glow) · GitHub example</title></svelte:head>

<Flex gap="sm">
	<Flex direction="horizontal" gap="sm" align="center">
		<Button icon="Menu" tooltip="Menu" />
		<Button icon="Github" tooltip="Home" />
		<Button icon="Ellipsis" tooltip="More" />
		<Text variant="secondary" as="span">/</Text>
		<Text weight="semibold" as="span">Golf0ned</Text>
		<Spacer />
		<Flex direction="horizontal" gap="xs" class="search">
			<Input
				type="text"
				icon="Search"
				placeholder="Type / to search"
				value={search}
				onChange={(v) => (search = v)}
				shortcut="/"
			/>
		</Flex>
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

	<Divider spacing="none" />

	<Tabs
		tabs={[
			{ id: 'code', label: 'Code', icon: 'Code', content: codeTab },
			{ id: 'issues', label: 'Issues', icon: 'CircleDot', badge: 12, content: placeholderTab },
			{
				id: 'pulls',
				label: 'Pull requests',
				icon: 'GitPullRequest',
				badge: 4,
				content: placeholderTab
			},
			{ id: 'agents', label: 'Agents', icon: 'Bot', content: placeholderTab },
			{ id: 'actions', label: 'Actions', icon: 'Play', content: placeholderTab },
			{ id: 'projects', label: 'Projects', icon: 'LayoutGrid', content: placeholderTab },
			{
				id: 'security',
				label: 'Security and quality',
				icon: 'ShieldCheck',
				content: placeholderTab
			},
			{ id: 'insights', label: 'Insights', icon: 'TrendingUp', content: placeholderTab }
		]}
	/>
</Flex>

{#snippet codeTab()}
	<div class="code-grid">
		<Flex gap="md" class="main-col">
			<Flex direction="horizontal" gap="sm" align="center">
				<Avatar name="Golf 0ned" size="md" />
				<Heading level={2}>Golf0ned</Heading>
				<Pill label="Public" variant="outlined" />
				<Spacer />
				<Button label="Watch" icon="Eye" variant="secondary" count={1} />
				<Button label="Fork" icon="GitFork" variant="secondary" count={0} />
				<Button label="Star" icon="Star" variant="primary" count={1} />
			</Flex>

			<Flex direction="horizontal" gap="sm" align="center">
				<Button label="main" icon="GitBranch" variant="secondary" />
				<Pill icon="GitBranch" label="1 Branch" variant="outlined" />
				<Pill icon="Tag" label="0 Tags" variant="outlined" />
				<Spacer />
				<Flex direction="horizontal" class="goto">
					<Input
						type="text"
						icon="Search"
						placeholder="Go to file"
						value={goto}
						onChange={(v) => (goto = v)}
					/>
				</Flex>
				<Button icon="Plus" variant="secondary" />
				<Button label="Code" icon="Code" variant="primary" />
			</Flex>

			<Card padding="none" header={lastCommit}>
				<Table
					data={files}
					columns={fileColumns}
					variant="simple"
					showHeader={false}
					bordered={false}
				/>
			</Card>

			<Card title="README" icon="BookOpen">
				<Text variant="secondary"><em>Last updated: 2026-04-29 13:25:37.818760</em></Text>
			</Card>
		</Flex>

		<Flex gap="lg" class="side-col">
			<Section title="About" level={3}>
				<Flex gap="sm">
					<Text variant="secondary" size="sm">
						<em>No description, website, or topics provided.</em>
					</Text>
					<Data properties={aboutItems} padded={false} />
					<Link href="#report" variant="muted">Report repository</Link>
				</Flex>
			</Section>

			<Section title="Releases" level={3}>
				<EmptyState size="compact" icon="Tag" title="No releases published" />
			</Section>

			<Section title="Packages" level={3}>
				<EmptyState size="compact" icon="Package" title="No packages published" />
			</Section>

			<Section title="Languages" level={3}>
				<Flex gap="sm">
					{#each languages as lang}
						<Progress
							value={lang.share}
							size="sm"
							label={lang.name}
							showValue
							style="--glow-primary: {lang.color}"
						/>
					{/each}
				</Flex>
			</Section>
		</Flex>
	</div>
{/snippet}

{#snippet nameCell(_value: any, row: FileEntry)}
	<Flex direction="horizontal" gap="sm" align="center">
		<Icon name={row.type === 'dir' ? 'Folder' : 'File'} />
		<Link href={`#${row.name}`} variant="subtle">{row.name}</Link>
	</Flex>
{/snippet}

{#snippet mutedCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

{#snippet lastCommit()}
	<Flex direction="horizontal" gap="sm" align="center" wrap>
		<Avatar name="GA" size="sm" />
		<Text size="sm" weight="semibold" as="span">github-actions[bot]</Text>
		<Text size="sm" variant="secondary" as="span">Update README</Text>
		<Spacer />
		<Code>5c8c750</Code>
		<Text size="sm" variant="secondary" as="span">· 3 hours ago</Text>
		<Pill icon="History" label="506 Commits" variant="outlined" />
	</Flex>
{/snippet}

{#snippet placeholderTab()}
	<EmptyState
		icon="Construction"
		title="Nothing here yet"
		description="This tab is a placeholder in the example."
	/>
{/snippet}

<style lang="scss">
	// Only the two-column reading layout and the two search-field widths remain:
	// every panel on this page is a Card, Section, Table, Data or EmptyState.
	:global(.page.sidebar-mode .content) {
		max-width: 1500px !important;
		padding-left: 2rem !important;
		padding-right: 2rem !important;
	}

	.code-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 296px;
		gap: 2rem;
		align-items: start;
		margin-top: 1.25rem;
	}

	:global(.main-col),
	:global(.side-col) {
		min-width: 0;
	}

	:global(.search) {
		flex: 0 1 380px;
		min-width: 320px;
	}

	:global(.goto) {
		flex: 0 1 240px;
		min-width: 220px;
	}
</style>
