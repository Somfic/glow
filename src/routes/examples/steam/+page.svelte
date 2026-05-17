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
	import Section from '$lib/typography/Section.svelte';
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
		{ when: 'This week', title: 'Icarus Week 231 | New Unique Fish & Optimization', game: 'Icarus' },
		{ when: 'This week', title: 'BATTLEFIELD 6 GAME UPDATE 1.3.1.0', game: 'Battlefield™ 6' },
		{ when: 'This week', title: 'Battlefield REDSEC Ranked Battle Royale', game: 'Battlefield™ 6' },
		{ when: 'This week', title: 'World Update 21: Australia', game: 'Microsoft Flight Simulator (2020)' },
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

<svelte:head><title>Steam · Glow example</title></svelte:head>

<ThemeProvider tokens={{ '--glow-primary': '#66c0f4' }}>
	<div class="steam-app">
		<!-- Topbar -->
		<header class="topbar">
			<Flex direction="horizontal" gap="md" align="center">
				<Flex direction="horizontal" gap="xs" align="center">
					<Icon name="Gamepad2" size={18} />
					<Text size="sm" weight="semibold" as="span">Steam</Text>
				</Flex>
				<Flex direction="horizontal" gap="sm">
					<Button label="View" variant="ghost" />
					<Button label="Friends" variant="ghost" />
					<Button label="Games" variant="ghost" />
					<Button label="Help" variant="ghost" />
				</Flex>
			</Flex>

			<Flex direction="horizontal" gap="lg" justify="center">
				<Button label="STORE" variant="ghost" />
				<Button label="LIBRARY" variant="ghost" selected />
				<Button label="COMMUNITY" variant="ghost" />
				<Button label="PIZZAMACHINE123" variant="ghost" />
			</Flex>

			<Flex direction="horizontal" gap="sm" justify="end" align="center">
				<Button icon="Volume2" tooltip="Voice" />
				<Button icon="Bell" tooltip="Notifications" count={1} />
				<Avatar name="pizzamachine123" size="sm" />
				<Flex direction="vertical" gap="none">
					<Text size="xs" weight="semibold" as="span">pizzamachine123</Text>
					<Text size="xs" variant="secondary" as="span">4.41€</Text>
				</Flex>
				<Button icon="Minus" tooltip="Minimize" />
				<Button icon="Square" tooltip="Maximize" />
				<Button icon="X" tooltip="Close" />
			</Flex>
		</header>

		<!-- Library sidebar -->
		<aside class="library">
			<Flex gap="sm">
				<Flex direction="horizontal" align="center">
					<Section title="Home" level={3} />
					<Spacer />
					<Button icon="LayoutGrid" tooltip="Grid view" />
					<Button icon="Clock" tooltip="Recent" />
					<Button icon="Download" tooltip="Downloads" />
				</Flex>

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

				<Section
					title="UNCATEGORIZED"
					level={4}
					count={244}
					collapsible
					open={true}
				>
					<Flex gap="none">
						{#each sidebarGames as g}
							{#snippet sidebarLeading()}
								<div class="sidebar-cover"><Media alt={g.title} /></div>
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
			</Flex>
		</aside>

		<!-- Main pane -->
		<main class="main">
			<!-- What's New -->
			<section>
				{#snippet whatsNewActions()}
					<Button icon="Settings" tooltip="What's New settings" />
					<Button icon="ChevronLeft" tooltip="Previous" />
					<Button icon="ChevronRight" tooltip="Next" />
				{/snippet}
				<Section title="What's New" level={2} actions={whatsNewActions} />
				<div class="row">
					{#each news as n}
						<div class="news-card">
							<Card padding="sm" media={{ alt: n.title + ' ' + n.game, aspectRatio: '16/9' }}>
								<Flex gap="xs">
									<Text size="xs" variant="secondary" as="span">{n.when}</Text>
									<Text size="sm" weight="semibold">{n.title}</Text>
									<Pill label={n.game} />
								</Flex>
							</Card>
						</div>
					{/each}
				</div>
			</section>

			<Flex direction="horizontal" justify="center">
				<Button icon="Plus" label="Add shelf" variant="ghost" />
			</Flex>

			<!-- Recent Games -->
			<section>
				{#snippet recentActions()}
					<Button icon="ChevronLeft" tooltip="Previous" />
					<Button icon="ChevronRight" tooltip="Next" />
				{/snippet}
				<Section title="Recent Games" level={2} actions={recentActions} />
				<div class="row">
					{#each recent as r}
						<Flex gap="xs" class={r.active ? 'recent-active' : 'recent'}>
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
										<Flex gap="none">
											<Text size="xs" weight="semibold" as="span">TIME PLAYED</Text>
											<Text size="xs" variant="secondary" as="span">
												Last two weeks: {r.recentHrs} hrs
											</Text>
											<Text size="xs" variant="secondary" as="span">
												Total: {r.totalHrs} hrs
											</Text>
										</Flex>
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
									<Icon name="Download" size={18} color="white" />
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
				</div>
			</section>

			<!-- All Games -->
			<section>
				{#snippet allActions()}
					<Flex direction="horizontal" gap="sm" align="center">
						<Text size="xs" variant="secondary" as="span">SORT BY</Text>
						<Input
							type="select"
							value={sort}
							searchable={false}
							options={sortOptions}
							onChange={(v) => (sort = v)}
						/>
						<Button icon="ChevronUp" tooltip="Collapse" />
					</Flex>
				{/snippet}
				<Section title="All Games" level={2} count={238} actions={allActions} />
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
			</section>
		</main>

		<!-- Status bar -->
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
	// Page-level Steam chrome: a 3-row grid (topbar / library + main / status).
	// Card visuals live entirely inside Glow's Card component now — only the
	// outer page scaffolding and Steam's signature dark gradient stay here.
	.steam-app {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		grid-template-columns: 320px 1fr;
		grid-template-rows: 56px 1fr 32px;
		grid-template-areas:
			'topbar  topbar'
			'library main'
			'status  status';
		background: linear-gradient(180deg, #1b2838 0%, #171a21 100%);
		color: #c7d5e0;
		overflow: hidden;
	}

	.topbar {
		grid-area: topbar;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		padding: 0 12px;
		background: #171a21;
	}

	.library {
		grid-area: library;
		padding: 12px;
		overflow-y: auto;
	}

	.main {
		grid-area: main;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 20px 28px;
	}

	.status {
		grid-area: status;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		align-items: center;
		padding: 0 12px;
		background: #171a21;
	}

	// Horizontal scrolling row used by both "What's New" and "Recent Games"
	// shelves. A real <Carousel> primitive would replace this — see plan.md.
	.row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		overflow-x: auto;
		padding-block: 8px;
	}

	.news-card { flex: 0 0 280px; }

	:global(.recent) { width: 200px; flex: 0 0 auto; }
	:global(.recent-active) { width: 460px; flex: 0 0 auto; }

	.sidebar-cover {
		position: relative;
		width: 18px;
		height: 18px;
		border-radius: 3px;
		overflow: hidden;
		flex: 0 0 auto;
	}
</style>
