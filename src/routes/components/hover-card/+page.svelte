<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import HoverCard from '$lib/hover-card/HoverCard.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Icon from '$lib/icon/Icon.svelte';

	// The "Anatomy" example is pinned open so the card is visible without a
	// pointer — which is also how it lands in the docs screenshots.
	let pinned = $state(true);

	// Slow on purpose — a 200ms fake fetch would resolve before you had seen the
	// skeleton it is meant to demonstrate.
	let loadingOpen = $state(false);
	let profile = $state<{ followers: number; repos: number } | undefined>(undefined);

	async function slowLoad() {
		profile = undefined;
		await new Promise((r) => setTimeout(r, 4000));
		profile = { followers: 1204, repos: 37 };
	}

	let fetched = $state<string | undefined>(undefined);
	async function fetchBio() {
		await new Promise((r) => setTimeout(r, 900));
		fetched = 'Maintains three libraries and reviews far too many pull requests.';
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

{#snippet person(name: string, role: string, bio: string)}
	<Flex gap="sm">
		<Flex direction="horizontal" gap="sm" align="center">
			<Avatar {name} size="lg" />
			<Flex gap="none">
				<Text weight="semibold">{name}</Text>
				<Text size="sm" variant="secondary">{role}</Text>
			</Flex>
		</Flex>
		<Text size="sm" variant="secondary">{bio}</Text>
	</Flex>
{/snippet}

<svelte:head><title>Hover Card | Glow UI</title></svelte:head>

<Heading level={1}>Hover Card</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	The rich hover preview — the profile card behind a username, the article peek behind a link. It sits
	between <Link href="/components/tooltip">Tooltip</Link> (a line of text, fast, non-interactive) and
	<Link href="/components/popover">Popover</Link> (arbitrary content, opened by a click), and it is
	built on the latter: anchoring, flipping, clamping and portalling are Popover's, the intent timing is
	this component's.
</Text>

<Card title="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Two snippets, <Code>trigger</Code> and <Code>children</Code>. Rest the pointer on the name for half
		a second. The trigger stays inline, so it can sit inside a sentence without breaking the line.
	</Text>
	<Text>
		The change was reviewed by
		<HoverCard>
			{#snippet trigger()}
				<Link href="/components/hover-card">Ada Lovelace</Link>
			{/snippet}
			{@render person(
				'Ada Lovelace',
				'Core maintainer',
				'Wrote the first algorithm intended for a machine, and still gets tagged on every numerics PR.'
			)}
		</HoverCard>
		before it landed.
	</Text>
</Card>

<Card title="Anatomy" id="anatomy">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>open</Code> is bindable, so a card can be pinned open — useful for styling it, and for the
		screenshots on this page. Everything inside is a plain snippet: links, buttons and images all work.
		Popover's outside-click still applies, so clicking anywhere else dismisses it.
	</Text>
	<Flex gap="md">
		<Flex direction="horizontal" gap="sm" align="center">
			<Button variant="secondary" label="Pin open" onclick={() => (pinned = true)} />
			<Text size="sm" variant="secondary">open = {pinned}</Text>
		</Flex>
		<div class="stage">
			<HoverCard bind:open={pinned} width={320}>
				{#snippet trigger()}
					<Flex direction="horizontal" gap="sm" align="center">
						<Avatar name="Grace Hopper" size="sm" />
						<Link href="/components/hover-card">grace</Link>
					</Flex>
				{/snippet}
				<Flex gap="sm">
					<Flex direction="horizontal" gap="sm" align="center">
						<Avatar name="Grace Hopper" size="lg" />
						<Flex gap="none">
							<Text weight="semibold">Grace Hopper</Text>
							<Text size="sm" variant="secondary">grace · Compilers</Text>
						</Flex>
					</Flex>
					<Text size="sm" variant="secondary">
						Believes it is easier to ask forgiveness than permission, which explains the changelog.
					</Text>
					<Flex direction="horizontal" gap="md" align="center">
						<Flex direction="horizontal" gap="xs" align="center">
							<Icon name="Users" size={14} />
							<Text size="sm" variant="secondary">1.2k followers</Text>
						</Flex>
						<Flex direction="horizontal" gap="xs" align="center">
							<Icon name="Book" size={14} />
							<Text size="sm" variant="secondary">37 repos</Text>
						</Flex>
					</Flex>
				</Flex>
			</HoverCard>
		</div>
	</Flex>
</Card>

<Card title="Intent timing" id="timing">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The two delays are deliberately different numbers. Opening waits
		<Code>openDelay</Code> (500ms) so a pointer crossing the trigger on its way somewhere else doesn't
		fire a card; closing waits only <Code>closeDelay</Code> (200ms), because a card that lingers reads
		as stuck. Sweep the pointer across all three to feel it — the symmetric one is wrong in both
		directions at once.
	</Text>
	<Flex direction="horizontal" gap="lg" wrap>
		{#each [{ o: 500, c: 200, l: 'Default — 500 / 200' }, { o: 0, c: 0, l: 'Eager — 0 / 0' }, { o: 500, c: 500, l: 'Symmetric — 500 / 500' }] as t (t.l)}
			<HoverCard openDelay={t.o} closeDelay={t.c}>
				{#snippet trigger()}
					<Link href="/components/hover-card">{t.l}</Link>
				{/snippet}
				<Text size="sm">Opens after {t.o}ms, closes {t.c}ms after the pointer leaves.</Text>
			</HoverCard>
		{/each}
	</Flex>
</Card>

<Card title="Crossing the gap" id="gap">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Between trigger and card is <Code>offset</Code> px of dead space, and the pointer has to cross it.
		A bare <Code>pointerleave</Code> would close the card halfway across. The close delay covers a quick
		crossing, but not a pointer that pauses in the gap — so the gap also gets a real hit area: an
		invisible band, as wide as the two boxes and only as tall as the space between them, portalled
		alongside the card and alive only while it is. Try the 48px one: the card survives a slow, wandering
		trip, and still closes the moment you leave sideways.
	</Text>
	<Flex direction="horizontal" gap="lg" wrap>
		{#each [8, 24, 48] as offset (offset)}
			<HoverCard {offset}>
				{#snippet trigger()}
					<Link href="/components/hover-card">offset={offset}</Link>
				{/snippet}
				<Text size="sm">{offset}px of gap, bridged.</Text>
			</HoverCard>
		{/each}
	</Flex>
</Card>

<Card title="Async content" id="async">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>onOpen</Code> runs when hover intent is confirmed — after the open delay, never on the way
		past — so a page of previews doesn't fire a request per pointer-crossing. While its promise is in
		flight the card renders <Link href="/components/skeleton">Skeleton</Link> placeholders; the first
		success is cached unless you pass <Code>refetch</Code>. A rejection renders the
		<Code>error</Code> snippet.
	</Text>
	<Flex gap="md">
		<Flex direction="horizontal" gap="sm" align="center" wrap>
			<Button variant="secondary" label="Show loading state" onclick={() => (loadingOpen = true)} />
			<Text size="sm" variant="secondary">
				This demo's fetch takes four seconds, and <Code>refetch</Code> makes it run again on every
				open.
			</Text>
		</Flex>
		<div class="stage short">
			<HoverCard bind:open={loadingOpen} onOpen={slowLoad} refetch width={300}>
				{#snippet trigger()}
					<Link href="/components/hover-card">Loading state</Link>
				{/snippet}
				<Flex gap="sm">
					<Text weight="semibold">Alan Turing</Text>
					<Text size="sm" variant="secondary">
						{profile?.followers.toLocaleString()} followers · {profile?.repos} repos
					</Text>
				</Flex>
			</HoverCard>
		</div>
		<Text size="sm" variant="secondary">
			A realistic one, fetched on first hover only:
			<HoverCard onOpen={fetchBio}>
				{#snippet trigger()}
					<Link href="/components/hover-card">Hedy Lamarr</Link>
				{/snippet}
				<Flex gap="sm">
					<Text weight="semibold">Hedy Lamarr</Text>
					<Text size="sm" variant="secondary">{fetched}</Text>
				</Flex>
			</HoverCard>
		</Text>
	</Flex>
</Card>

<Card title="Keyboard and touch" id="keyboard">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Hover is not available to everyone. Keyboard focus on the trigger opens the card immediately (there
		is no "passing through" to guard against), <Code>Tab</Code> again moves into the card rather than
		past it, and <Code>Escape</Code> closes it and hands focus back. There is no focus trap: a preview
		is not a dialog. A touch tap opens the card and swallows that one tap, so tapping a link previews it
		and tapping again follows it — pass <Code>{'touch="off"'}</Code> to leave touch alone entirely.
		Tab to the link below and try it.
	</Text>
	<Text>
		Focus the
		<HoverCard>
			{#snippet trigger()}
				<Link href="/components/hover-card">next link</Link>
			{/snippet}
			<Flex gap="sm">
				<Text size="sm">Opened by focus, so it is announced as the trigger's description.</Text>
				<Link href="/components/popover">A focusable link inside the card</Link>
			</Flex>
		</HoverCard>
		with the keyboard.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { HoverCard, Avatar, Link } from 'glow';

  let user = $state<User | undefined>(undefined);

  async function loadUser() {
    user = await (await fetch('/api/users/ada')).json();
  }
</script>

<HoverCard onOpen={loadUser} width={320}>
  {#snippet trigger()}
    <Link href="/u/ada">@ada</Link>
  {/snippet}

  <div class="profile">
    <Avatar name={user.name} src={user.avatar} size="lg" />
    <strong>{user.name}</strong>
    <p>{user.bio}</p>
  </div>
</HoverCard>`}
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
			{ prop: 'trigger', type: 'Snippet', default: '—', description: 'Required. What the card hangs off. Stays inline.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Required. The card content, portalled to <body>.' },
			{ prop: 'loading', type: 'Snippet', default: 'Skeleton', description: 'Rendered while onOpen is in flight.' },
			{ prop: 'error', type: 'Snippet<[unknown]>', default: 'a short message', description: 'Rendered when onOpen rejects. Receives the rejection.' },
			{ prop: 'open', type: 'boolean', default: 'false', description: 'Bindable open state.' },
			{ prop: 'openDelay', type: 'number', default: '500', description: 'Hover intent: how long the pointer rests before opening.' },
			{ prop: 'closeDelay', type: 'number', default: '200', description: 'Grace period after the pointer leaves.' },
			{ prop: 'offset', type: 'number', default: '8', description: 'Gap between trigger and card. The bridge covers exactly this.' },
			{ prop: 'align', type: "'left' | 'right' | 'stretch'", default: 'left', description: "Which edge anchors to the trigger — Popover's alignment." },
			{ prop: 'width', type: 'number | string', default: '300', description: 'Card width. Number → px.' },
			{ prop: 'onOpen', type: '() => unknown | Promise<unknown>', default: '—', description: 'Loader, run once intent is confirmed. Never on the way past.' },
			{ prop: 'refetch', type: 'boolean', default: 'false', description: 'Re-run onOpen on every open instead of caching the first success.' },
			{ prop: 'touch', type: "'preview' | 'off'", default: 'preview', description: "'preview' opens on tap and swallows that tap; 'off' ignores touch." },
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Never opens.' },
			{ prop: 'class', type: 'string', default: "''", description: 'Extra class on the anchor wrapper.' }
		]}
	/>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/tooltip">Tooltip</Link> — one line of text, opens fast, never
			interactive. Reach for it first; a hover card is for content worth pointing at.
		</Text>
		<Text size="sm">
			<Link href="/components/popover">Popover</Link> — the anchoring primitive underneath, opened by
			a click.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	// The pinned examples open downwards; without room reserved, the portalled
	// card would hang over whatever follows the example instead of inside it.
	.stage {
		min-height: 240px;
	}

	.stage.short {
		min-height: 170px;
	}
</style>
