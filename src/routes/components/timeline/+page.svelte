<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Button from '$lib/button/Button.svelte';
	import Timeline, { type TimelineItem } from '$lib/timeline/Timeline.svelte';

	const release: TimelineItem[] = [
		{ title: 'Opened pull request', description: '#412 — Rework the shader palette', icon: 'GitPullRequest', variant: 'info', timeLabel: '09:14' },
		{ title: 'Review requested', description: 'From somfic and two others', icon: 'Eye', timeLabel: '09:41' },
		{ title: 'Checks failed', description: 'build (ubuntu-latest) exited with 1', icon: 'CircleAlert', variant: 'danger', timeLabel: '10:02' },
		{ title: 'Checks passed', description: 'All 14 checks green', icon: 'CircleCheck', variant: 'success', timeLabel: '11:20' },
		{ title: 'Merged into main', description: 'Squashed 6 commits', icon: 'GitMerge', variant: 'primary', timeLabel: '11:24' }
	];

	const deploys: TimelineItem[] = [
		{ title: 'v2.4.0 published to npm', icon: 'Package', variant: 'success', timestamp: '2026-03-04T09:12:00Z' },
		{ title: 'Tagged v2.4.0', icon: 'Tag', timestamp: '2026-03-04T09:08:00Z' },
		{ title: 'Release notes drafted', icon: 'FileText', timestamp: '2026-03-03T17:45:00Z' },
		{ title: 'Version bumped', icon: 'ArrowUp', timestamp: '2026-03-03T17:41:00Z' }
	];

	const activity: TimelineItem[] = [
		{ avatar: { name: 'Grace Hopper' }, title: 'Grace Hopper', variant: 'primary', timeLabel: '2h ago', body: comment },
		{ avatar: { name: 'Alan Turing' }, title: 'Alan Turing', timeLabel: '4h ago', body: approval },
		{ avatar: { name: 'Ada Lovelace' }, title: 'Ada Lovelace', timeLabel: 'yesterday', body: comment }
	];

	const steps: TimelineItem[] = [
		{ title: 'Order placed', icon: 'ShoppingCart', variant: 'success', timeLabel: 'Mon 08:30' },
		{ title: 'Packed', icon: 'Package', variant: 'success', timeLabel: 'Mon 14:10' },
		{ title: 'In transit', icon: 'Truck', variant: 'warning', timeLabel: 'Tue 06:55' },
		{ title: 'Out for delivery', icon: 'MapPin', timeLabel: 'Expected Wed' },
		{ title: 'Delivered', icon: 'Check', timeLabel: '—' }
	];

	// Deliberately long titles: the marker has to hold the first line, not drift
	// to the middle of a wrapped block.
	const wrapping: TimelineItem[] = [
		{ title: 'Reverted the palette change after it turned every warning pill the same colour as the background', description: 'Reopened #412', icon: 'Undo2', variant: 'warning', timeLabel: '14:02' },
		{ title: 'Short one', icon: 'Check', variant: 'success', timeLabel: '14:20' },
		{ avatar: { name: 'Grace Hopper' }, title: 'Grace Hopper picked this up again and left a long note about the marker geometry', description: 'On #412', timeLabel: '15:11' },
		{ title: 'A bare dot lines up on the same centre as a full-size marker does', timeLabel: '15:40' }
	];

	const plain: TimelineItem[] = [
		{ title: 'Signed up', timeLabel: 'Jan 3' },
		{ title: 'Verified email', timeLabel: 'Jan 3' },
		{ title: 'Invited two teammates', timeLabel: 'Jan 11' },
		{ title: 'Upgraded to Pro', variant: 'primary', timeLabel: 'Feb 22' }
	];
</script>

{#snippet comment(item: TimelineItem)}
	<Flex gap="xs">
		<Flex direction="horizontal" gap="sm" align="center">
			<Text size="sm" weight="semibold" as="span">{item.title}</Text>
			<Pill label="commented" variant="outlined" />
		</Flex>
		<Text size="sm" variant="secondary">
			The rail has to stop at the last marker, not run past it — that overshoot is the
			thing everyone notices and nobody can name.
		</Text>
	</Flex>
{/snippet}

{#snippet approval(item: TimelineItem)}
	<Flex gap="xs">
		<Flex direction="horizontal" gap="sm" align="center">
			<Text size="sm" weight="semibold" as="span">{item.title}</Text>
			<Pill label="approved" icon="Check" color="var(--glow-color-success)" />
		</Flex>
		<Flex direction="horizontal" gap="xs">
			<Button label="View diff" variant="secondary" />
		</Flex>
	</Flex>
{/snippet}

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Timeline | Glow UI</title></svelte:head>

<Heading level={1}>Timeline</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	An ordered list of things that happened: a marker per entry, a body, and a timestamp column that
	stays put. Items are plain data, and any entry can swap its body for a snippet when a line of text
	isn't enough.
</Text>

<Card title="Events" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default entry is a <Code>title</Code>, a <Code>description</Code> and an
		<Code>icon</Code>. Note where the rail starts and where it ends — above the first marker and
		below the last there is nothing, because the line is drawn per entry rather than behind the
		whole list.
	</Text>
	<Timeline items={release} label="Pull request activity" />
</Card>

<Card title="Status colours" id="variants">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>variant</Code> tints the marker from the semantic tokens —
		<Code>primary</Code>, <Code>success</Code>, <Code>warning</Code>, <Code>danger</Code>,
		<Code>info</Code>, and <Code>default</Code> for a neutral one. Markers without an icon render as
		a small dot in the same colour.
	</Text>
	<Flex direction="horizontal" gap="xl" align="start">
		<Timeline items={steps} label="Shipment progress" />
		<Timeline items={plain} label="Account history" />
	</Flex>
</Card>

<Card title="Avatars and custom bodies" id="avatars">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <Code>avatar</Code> instead of <Code>icon</Code> for a people feed, and give an item a
		<Code>body</Code> snippet when the entry needs pills, buttons, or anything else the default two
		lines can't hold. The snippet receives the item.
	</Text>
	<Timeline items={activity} label="Thread activity" />
</Card>

<Card title="Alignment" id="alignment">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Every marker — icon, avatar, or bare dot — is centred on the first line of the entry, not on the
		middle of the block, so a title that wraps still hangs off its own first line.
	</Text>
	<div class="narrow">
		<Timeline items={wrapping} label="Alignment example" />
	</div>
</Card>

<Card title="Real timestamps" id="timestamps">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A <Code>timestamp</Code> renders as <Code>{'<time datetime>'}</Code> with a short locale label,
		so it is machine-readable. Use <Code>timeLabel</Code> for relative text like "2 hours ago", which
		gets a plain span — a <Code>{'<time>'}</Code> with no valid instant is worse than none. The
		column is <Code>tabular-nums</Code>, so the digits line up rather than shuffling row to row.
	</Text>
	<Timeline items={deploys} label="Release history" />
</Card>

<Card title="Compact density" id="density">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>density="compact"</Code> tightens the rhythm to match the
		<Code>[data-density='compact']</Code> scale in <Code>global.scss</Code>. It is also inherited:
		a timeline inside any element carrying that attribute goes compact without the prop.
	</Text>
	<Flex direction="horizontal" gap="xl" align="start">
		<Flex gap="sm">
			<Text size="sm" weight="semibold">Comfortable</Text>
			<Timeline items={release} label="Comfortable example" />
		</Flex>
		<Flex gap="sm">
			<Text size="sm" weight="semibold">Compact</Text>
			<Timeline items={release} density="compact" label="Compact example" />
		</Flex>
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Timeline, type TimelineItem } from 'glow';

  const items: TimelineItem[] = [
    { title: 'Opened pull request', icon: 'GitPullRequest', variant: 'info', timestamp: '2026-03-04T09:14:00Z' },
    { title: 'Checks passed', icon: 'CircleCheck', variant: 'success', timestamp: '2026-03-04T11:20:00Z' },
    { title: 'Merged into main', icon: 'GitMerge', variant: 'primary', timestamp: '2026-03-04T11:24:00Z' }
  ];
<\/script>

<Timeline {items} label="Pull request activity" />

<!-- A snippet body, per item or as the fallback for all of them -->
<Timeline items={comments} label="Thread">
  {#snippet children(item)}
    <Text weight="semibold">{item.title}</Text>
    <Markdown source={item.description} />
  {/snippet}
</Timeline>`}
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
			{ prop: 'items', type: 'TimelineItem[]', default: '—', description: 'The entries, oldest-first or newest-first — the component does not sort.' },
			{ prop: 'density', type: "'comfortable' | 'compact'", default: 'comfortable', description: "Also inherited from an ancestor's data-density." },
			{ prop: 'children', type: 'Snippet<[TimelineItem]>', default: '—', description: 'Fallback body for items without their own.' },
			{ prop: 'marker', type: 'Snippet<[TimelineItem]>', default: '—', description: 'Replaces the marker column for every item.' },
			{ prop: 'label', type: 'string', default: '—', description: 'aria-label on the <ol>.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the list.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the list.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">TimelineItem</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Field', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'id', type: 'string', description: 'Key for the each block; falls back to the index.' },
			{ prop: 'title', type: 'string', description: 'Headline of the entry.' },
			{ prop: 'description', type: 'string', description: 'Secondary line under the title.' },
			{ prop: 'timestamp', type: 'Date | string | number', description: 'A real instant. Renders as <time datetime>.' },
			{ prop: 'timeLabel', type: 'string', description: 'Display text for the time column; required for relative labels.' },
			{ prop: 'icon', type: 'IconProp', description: 'Marker glyph, in a tinted circle.' },
			{ prop: 'avatar', type: '{ name, src? }', description: 'Marker portrait. Takes precedence over icon.' },
			{ prop: 'variant', type: 'TimelineVariant', description: "default | primary | success | warning | danger | info." },
			{ prop: 'body', type: 'Snippet<[TimelineItem]>', description: 'Replaces title/description for this entry.' }
		]}
	/>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/list">List Item</Link> — for a list of things rather than a list of
			events.
		</Text>
		<Text size="sm">
			<Link href="/components/data">Data</Link> — key/value pairs for the detail panel next to a
			feed.
		</Text>
		<Text size="sm">
			<Link href="/components/notification-center">Notification Center</Link> — the same shape, but
			live and dismissable.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	// Forces the titles to wrap, which is the point of the alignment example.
	.narrow {
		max-width: 34rem;
	}
</style>
