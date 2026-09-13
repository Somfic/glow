<script lang="ts">
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Card from '$lib/card/Card.svelte';
	import Media from '$lib/media/Media.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import ScrollArea from '$lib/scroll-area/ScrollArea.svelte';
	import Section from '$lib/typography/Section.svelte';
	import Stat from '$lib/stat/Stat.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import ThemeProvider from '$lib/style/ThemeProvider.svelte';
	type SidebarGame = { title: string };

	type NewsItem = {
		when: string;
		title: string;
		game: string;
	};

	type RecentGame = {
		title: string;
		when: string;
		active?: boolean;
		recentHrs?: number;
		totalHrs?: number;
		downloading?: boolean;
	};

	type LibraryGame = {
		title: string;
		hours: number;
	};

	const sidebarGames: SidebarGame[] = [
		{ title: '270 | Two Seventy US Election' },
		{ title: 'Aimlabs' },
		{ title: 'Alien: Isolation' },
		{ title: 'Amanda the Adventurer' },
		{ title: 'Among Us' },
		{ title: 'Animaze' },
		{ title: 'Anno 117: Pax Romana' },
		{ title: 'Aperture Desk Job' },
		{ title: 'Apex Legends' },
		{ title: 'ARC Raiders' },
		{ title: 'ARK: Survival Evolved' },
		{ title: 'ARK: Survival Of The Fittest' },
		{ title: 'Arma 3' },
		{ title: 'As Dusk Falls' },
		{ title: "Assassin's Creed II" },
		{ title: "Assassin's Creed Brotherhood" },
		{ title: "Assassin's Creed Revelations" },
		{ title: "Assassin's Creed Origins" },
		{ title: 'ASTRONEER' },
		{ title: 'Atomic Heart' },
		{ title: 'Bakery Cafe Simulator: Prologue' },
		{ title: 'Banished' },
		{ title: 'Battlefield™ 1' },
		{ title: 'Battlefield™ 6' },
		{ title: 'Battlefield™ V' },
		{ title: 'BeamNG.drive' },
		{ title: 'Before Your Eyes' },
		{ title: "The Beginner's Guide" },
		{ title: 'Besiege' },
		{ title: 'Black Desert' },
		{ title: 'Black Mesa' },
		{ title: 'Black Myth: Wukong' },
		{ title: 'Blender' },
		{ title: 'BOKURA' },
		{ title: 'Brawlhalla' },
		{ title: 'Burnout™ Paradise Remastered' },
		{ title: 'Captain of Industry' },
		{ title: 'Car Mechanic Simulator 2014' },
		{ title: 'Cities: Skylines' },
		{ title: 'Cities: Skylines II' },
		{ title: 'Content Warning' },
		{ title: 'Control Ultimate Edition' },
		{ title: 'Counter-Strike 2' }
	];

	const news: NewsItem[] = [
		{ when: 'This week', title: 'Midseason Update 10.6', game: 'THE FINALS' },
		{ when: 'This week', title: 'UPGRADE HARD, RAID HARDER', game: 'Rust' },
		{
			when: 'This week',
			title: 'Icarus Week 231 | New Unique Fish & Optimization',
			game: 'Icarus'
		},
		{ when: 'This week', title: 'BATTLEFIELD 6 GAME UPDATE 1.3.1.0', game: 'Battlefield™ 6' },
		{ when: 'This week', title: 'Battlefield REDSEC Ranked Battle Royale', game: 'Battlefield™ 6' },
		{
			when: 'This week',
			title: 'World Update 21: Australia',
			game: 'Microsoft Flight Simulator (2020)'
		},
		{ when: 'This week', title: 'Battlefield 6 | REDSEC Season 3 Roadmap', game: 'Battlefield™ 6' }
	];

	const recent: RecentGame[] = [
		{ title: 'Pacific Drive', when: 'Yesterday', active: true, recentHrs: 6.7, totalHrs: 6.7 },
		{ title: 'Anno 117: Pax Romana', when: 'Yesterday' },
		{ title: 'Software Inc.', when: 'Yesterday' },
		{ title: 'Elite Dangerous', when: 'Yesterday' },
		{ title: 'Foundation', when: 'Yesterday' },
		{ title: 'Kerbal Space Program', when: '1 week ago' },
		{ title: 'Teardown', when: '1 week ago' },
		{ title: 'People Playground', when: '1 week ago' },
		{ title: 'Steam Linux Runtime 4.0', when: '1 week ago', downloading: true },
		{ title: 'Crimson Desert', when: 'April' },
		{ title: 'Crusader Kings III', when: 'April' }
	];

	const allGames: LibraryGame[] = [
		{ title: 'Elite Dangerous', hours: 1884.1 },
		{ title: 'Cities: Skylines', hours: 267.1 },
		{ title: 'Space Engineers', hours: 149.6 },
		{ title: 'Stormworks', hours: 145.1 },
		{ title: 'Kerbal Space Program', hours: 137.1 },
		{ title: 'Software Inc.', hours: 109.4 },
		{ title: 'RimWorld', hours: 99.8 },
		{ title: 'Microsoft Flight Simulator', hours: 97.2 },
		{ title: 'Transport Fever 2', hours: 81 },
		{ title: 'Counter-Strike 2', hours: 74.3 },
		{ title: 'Car Mechanic Simulator 2014', hours: 68.0 },
		{ title: 'THE FINALS', hours: 64.5 },
		{ title: 'Factorio', hours: 58.2 },
		{ title: 'Among Us', hours: 52.7 },
		{ title: 'Lethal Company', hours: 49.1 },
		{ title: 'Euro Truck Simulator 2', hours: 46.8 },
		{ title: 'Tarkov', hours: 41.0 },
		{ title: 'Superliminal', hours: 38.9 }
	];

	const sortOptions = [
		{ value: 'hours', label: 'Hours Played' },
		{ value: 'name', label: 'Name' },
		{ value: 'recent', label: 'Recently Played' },
		{ value: 'metacritic', label: 'Metacritic' }
	];

	let search = $state('');
	let activeGame = $state('Pacific Drive');
	let sort = $state('hours');

	const fmtHours = (h: number) => `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)} hours`;
</script>

<svelte:head><title>Steam (Glow) · Glow example</title></svelte:head>

<!-- A shelf is a horizontally scrolling row. `<ScrollArea>` owns the overflow,
     the edge fades and the scrollbar; the row itself is just a Flex. -->
{#snippet shelf(children: any)}
	<ScrollArea orientation="horizontal" label="Shelf">
		<Flex direction="horizontal" gap="sm" align="start">
			{@render children()}
		</Flex>
	</ScrollArea>
{/snippet}

{#snippet homeActions()}
	<Button icon="LayoutGrid" tooltip="Grid view" />
	<Button icon="Clock" tooltip="Recent" />
	<Button icon="Download" tooltip="Downloads" />
{/snippet}

{#snippet whatsNewActions()}
	<Button icon="Settings" tooltip="What's New settings" />
	<Button icon="ChevronLeft" tooltip="Previous" />
	<Button icon="ChevronRight" tooltip="Next" />
{/snippet}

{#snippet newsRow()}
	{#each news as n}
		<Card
			padding="sm"
			class="tile tile-news"
			media={{ alt: n.title + ' ' + n.game, aspectRatio: '16/9' }}
		>
			<Flex gap="xs" align="start">
				<Text size="xs" variant="secondary" as="span">{n.when}</Text>
				<Text size="sm" weight="semibold">{n.title}</Text>
				<Pill label={n.game} />
			</Flex>
		</Card>
	{/each}
{/snippet}

{#snippet recentActions()}
	<Button icon="ChevronLeft" tooltip="Previous" />
	<Button icon="ChevronRight" tooltip="Next" />
{/snippet}

{#snippet recentRow()}
	{#each recent as r}
		<Flex gap="xs" class={r.active ? 'tile tile-wide' : 'tile'}>
			<Text size="xs" variant="secondary" as="span">{r.when}</Text>
			{#if r.active}
				{#snippet activePlay()}
					<Flex direction="horizontal" gap="md" align="center">
						<Button
							icon={{ name: 'Play', fill: true }}
							shape="circle"
							size="lg"
							variant="primary"
						/>
						<Stat
							size="sm"
							variant="plain"
							label="Time played"
							value="{r.totalHrs} hrs"
							animate={false}
						/>
						<Stat
							size="sm"
							variant="plain"
							label="Last two weeks"
							value="{r.recentHrs} hrs"
							animate={false}
						/>
					</Flex>
				{/snippet}
				<Card
					media={{ alt: r.title, aspectRatio: '460/300' }}
					mediaLayout="overlay"
					persistentSlots
					bottomLeft={activePlay}
				/>
			{:else if r.downloading}
				{#snippet downloadingBadge()}
					<Pill icon="Download" label="Downloading" />
				{/snippet}
				<Card
					media={{ alt: r.title, aspectRatio: '2/3' }}
					mediaLayout="overlay"
					persistentSlots
					bottomRight={downloadingBadge}
				/>
			{:else}
				<Card media={{ alt: r.title, aspectRatio: '2/3' }} mediaLayout="overlay" />
			{/if}
		</Flex>
	{/each}
{/snippet}

{#snippet allActions()}
	<Input
		type="select"
		value={sort}
		searchable={false}
		options={sortOptions}
		onChange={(v) => (sort = v)}
	/>
{/snippet}

<ThemeProvider theme="dark" tokens={{ '--glow-primary': '#66c0f4' }}>
	<div class="steam-app">
		<header class="topbar">
			<Flex direction="horizontal" gap="md" align="center">
				<Pill icon="Gamepad2" label="Steam" size="md" />
				<Flex direction="horizontal" gap="xs">
					<Button label="View" variant="ghost" />
					<Button label="Friends" variant="ghost" />
					<Button label="Games" variant="ghost" />
					<Button label="Help" variant="ghost" />
				</Flex>
			</Flex>

			<Flex direction="horizontal" justify="center">
				<ButtonGroup>
					<Button label="STORE" variant="ghost" />
					<Button label="LIBRARY" variant="ghost" selected />
					<Button label="COMMUNITY" variant="ghost" />
					<Button label="PIZZAMACHINE123" variant="ghost" />
				</ButtonGroup>
			</Flex>

			<Flex direction="horizontal" gap="sm" justify="end" align="center">
				<Button icon="Volume2" tooltip="Voice" />
				<Button icon="Bell" tooltip="Notifications" count={1} />
				<Avatar name="pizzamachine123" size="sm" />
				<Stat size="sm" variant="plain" label="pizzamachine123" value="4.41€" animate={false} />
				<Button icon="Minus" tooltip="Minimize" />
				<Button icon="Square" tooltip="Maximize" />
				<Button icon="X" tooltip="Close" />
			</Flex>
		</header>

		<Card padding="sm" class="pane library">
			<Flex gap="sm" class="pane-col">
				<Section title="Home" level={3} actions={homeActions} />

				<Input
					type="select"
					value={'games'}
					searchable={false}
					options={[
						{ value: 'games', label: 'Games and Software' },
						{ value: 'all', label: 'All' },
						{ value: 'tools', label: 'Tools' }
					]}
				/>

				<Input
					type="text"
					icon="Search"
					placeholder="Search…"
					value={search}
					onChange={(v) => (search = v)}
				/>

				<ScrollArea label="Library" class="pane-scroll">
					<Section title="UNCATEGORIZED" level={4} count={244} collapsible open={true}>
						<Flex gap="none">
							{#each sidebarGames as g}
								{#snippet sidebarLeading()}
									<div class="cover"><Media alt={g.title} /></div>
								{/snippet}
								<ListItem
									title={g.title}
									active={activeGame === g.title}
									onclick={() => (activeGame = g.title)}
									leading={sidebarLeading}
								/>
							{/each}
						</Flex>
					</Section>
				</ScrollArea>
			</Flex>
		</Card>

		<ScrollArea label="Library home" class="main">
			<Flex gap="lg">
				<Section title="What's New" level={2} actions={whatsNewActions}>
					{@render shelf(newsRow)}
				</Section>

				<Flex direction="horizontal" justify="center">
					<Button icon="Plus" label="Add shelf" variant="ghost" />
				</Flex>

				<Section title="Recent Games" level={2} actions={recentActions}>
					{@render shelf(recentRow)}
				</Section>

				<Section title="All Games" level={2} count={238} collapsible actions={allActions}>
					<Grid min="170px" gap="md">
						{#each allGames as g}
							{#snippet hoursPill()}
								<Pill label={fmtHours(g.hours)} />
							{/snippet}
							<Card
								media={{ alt: g.title, aspectRatio: '2/3' }}
								mediaLayout="overlay"
								bottomLeft={hoursPill}
							/>
						{/each}
					</Grid>
				</Section>
			</Flex>
		</ScrollArea>

		<footer class="status">
			<Button icon="Plus" label="Add a Game" variant="ghost" />
			<Flex direction="horizontal" align="center" gap="sm" justify="center">
				<Icon name="Download" size={14} />
				<Text size="xs" variant="secondary" as="span">Downloads — 3 of 3 Items Complete</Text>
			</Flex>
			<Flex direction="horizontal" align="center" gap="sm" justify="end">
				<Text size="xs" variant="secondary" as="span">Friends &amp; Chat</Text>
				<Icon name="Users" size={14} />
			</Flex>
		</footer>
	</div>
</ThemeProvider>

<style lang="scss">
	// What is left once the shelves are ScrollAreas and the tiles are Cards:
	// the three-row application shell, and the fixed widths a shelf tile needs
	// (a flex row cannot infer a poster's width from its aspect ratio).
	.steam-app {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		grid-template-columns: 320px 1fr;
		grid-template-rows: 56px 1fr 40px;
		grid-template-areas:
			'topbar  topbar'
			'library main'
			'status  status';
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--glow-bg-base);
		overflow: hidden;
	}

	.topbar {
		grid-area: topbar;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
	}

	.status {
		grid-area: status;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		align-items: center;
	}

	:global(.library) {
		grid-area: library;
		min-height: 0;
	}

	:global(.library > .card-body) {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	:global(.pane-col),
	:global(.pane-scroll) {
		flex: 1 1 auto;
		min-height: 0;
	}

	:global(.main) {
		grid-area: main;
		min-height: 0;
		padding: 0 1rem;
	}

	:global(.tile) {
		width: 200px;
		flex: 0 0 auto;
	}

	:global(.tile-wide) {
		width: 460px;
	}

	:global(.tile-news) {
		width: 280px;
	}

	.cover {
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
		border-radius: 3px;
		overflow: hidden;
	}
</style>
