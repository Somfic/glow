<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Table from '$lib/data/Table.svelte';
	import Card from '$lib/card/Card.svelte';
	import Glow from '$lib/glow/Glow.svelte';
	import Media from '$lib/media/Media.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
	import ScrollArea from '$lib/scroll-area/ScrollArea.svelte';
	import Section from '$lib/typography/Section.svelte';
	import ThemeProvider from '$lib/style/ThemeProvider.svelte';

	import type { TableColumn } from '$lib/data/types.js';

	type Playlist = {
		title: string;
		creator: string;
		count?: string;
		active?: boolean;
	};

	type Track = {
		n: number | 'playing';
		title: string;
		artist: string;
		album: string;
		added: string;
		duration: string;
		isVideo?: boolean;
		isExplicit?: boolean;
	};

	const playlists: Playlist[] = [
		{
			title: 'Nummers die je leuk vindt',
			creator: 'Playlist · 4.755 num...',
			count: '4755',
			active: true
		},
		{ title: 'tutto passa', creator: 'Playlist · lucas :)' },
		{ title: '2026', creator: 'Playlist · lucas :)' },
		{ title: 'yet another playlist', creator: 'Playlist · lucas :)' },
		{ title: 'merlot and dragons', creator: 'Playlist · lucas :)' },
		{ title: ':)', creator: 'Playlist · lucas :)' },
		{ title: 'indie rock', creator: 'Playlist · lucas :)' },
		{ title: 'vodka and unicorns', creator: 'Playlist · lucas :)' },
		{ title: '<3', creator: 'Playlist · lucas :)' }
	];

	const tracks: Track[] = [
		{
			n: 'playing',
			title: 'Barbie Girl',
			artist: 'Aqua',
			album: 'Aquarium',
			added: '3 uur geleden',
			duration: '3:17',
			isVideo: true
		},
		{
			n: 2,
			title: 'So What',
			artist: 'P!nk',
			album: 'Funhouse: The Tour Edition',
			added: '3 uur geleden',
			duration: '3:35',
			isVideo: true,
			isExplicit: true
		},
		{
			n: 3,
			title: 'Letter To My 13 Year Old Self',
			artist: 'Laufey',
			album: 'Bewitched',
			added: '2 dagen geleden',
			duration: '4:22'
		},
		{
			n: 4,
			title: 'Why You Wanna Fight?',
			artist: 'Bruno Mars',
			album: 'The Romantic',
			added: '2 dagen geleden',
			duration: '4:14'
		},
		{
			n: 5,
			title: 'Cooler Than Me - Single Mix',
			artist: 'Mike Posner, Gigamesh',
			album: '31 Minutes to Takeoff',
			added: '2 dagen geleden',
			duration: '3:33'
		},
		{
			n: 6,
			title: 'This Love',
			artist: 'Maroon 5',
			album: 'Songs About Jane: 10th Annivers...',
			added: '2 dagen geleden',
			duration: '3:26',
			isVideo: true
		},
		{
			n: 7,
			title: 'Apologize',
			artist: 'OneRepublic, Timbaland',
			album: 'Shock Value',
			added: '5 dagen geleden',
			duration: '3:04'
		},
		{
			n: 8,
			title: 'Take On Me',
			artist: 'a-ha',
			album: 'Hunting High and Low',
			added: '1 week geleden',
			duration: '3:46'
		}
	];

	const trackColumns: TableColumn<Track>[] = [
		{ key: 'n', label: '#', width: '50px', align: 'right', render: numberCell },
		{ key: 'title', label: 'Titel', render: titleCell },
		{ key: 'album', label: 'Album', render: albumCell },
		{ key: 'added', label: 'Datum toegevoegd', render: mutedCell },
		{ key: 'duration', label: 'Duur', align: 'right', render: mutedCell }
	];

	let search = $state('');
	let activeTab = $state<'playlists' | 'artiesten' | 'albums'>('playlists');
	let isPlaying = $state(true);
	let progress = $state(78); // 1:18 of 3:18
	let volume = $state(60);
</script>

<svelte:head><title>Spotify (Glow) · Glow example</title></svelte:head>

<!-- Square cover art at a caller-chosen size. `<Media>` draws the artwork (and
     its deterministic gradient placeholder); this only says how big. -->
{#snippet art(alt: string, size: string)}
	<div class="art" style:--art-size={size}><Media {alt} /></div>
{/snippet}

{#snippet profileLeading()}
	<Avatar name="my profile" size="lg" />
{/snippet}

{#snippet profileTrailing()}
	<Icon name="ChevronUp" size={14} />
{/snippet}

<ThemeProvider theme="dark" tokens={{ '--glow-primary': '#1db954' }}>
	<div class="spotify-app">
		<header class="topbar">
			<Flex direction="horizontal" gap="sm" align="center">
				<Pill icon={{ name: 'Music', fill: true }} label="Spotify" size="md" />
			</Flex>

			<Flex direction="horizontal" gap="sm" class="topbar-search">
				<Button icon="House" tooltip="Home" />
				<Input
					type="text"
					icon="Search"
					placeholder="Wat wil je afspelen?"
					value={search}
					onChange={(v) => (search = v)}
					shortcut="/"
				/>
				<Button icon="LayoutGrid" tooltip="Bladeren" />
			</Flex>

			<Flex direction="horizontal" gap="sm" justify="end" align="center">
				<Button icon="Download" label="De app installeren" variant="ghost" />
				<Button icon="Bell" tooltip="Inbox" />
				<Button icon="Users" tooltip="Vrienden" />
				<Avatar name="Somfic" size="md" />
			</Flex>
		</header>

		{#snippet libraryActions()}
			<Button icon="Plus" tooltip="Nieuwe playlist" />
			<Button icon="Maximize2" tooltip="Uitvouwen" />
		{/snippet}

		<Card padding="sm" class="pane library">
			<Flex gap="sm" class="pane-col">
				<Section title="Bibliotheek" icon="Library" actions={libraryActions} />

				<Flex direction="horizontal" gap="xs">
					<Pill
						label="Playlists"
						selected={activeTab === 'playlists'}
						onclick={() => (activeTab = 'playlists')}
					/>
					<Pill
						label="Artiesten"
						selected={activeTab === 'artiesten'}
						onclick={() => (activeTab = 'artiesten')}
					/>
					<Pill
						label="Albums"
						selected={activeTab === 'albums'}
						onclick={() => (activeTab = 'albums')}
					/>
				</Flex>

				<Flex direction="horizontal" align="center">
					<Button icon="Search" tooltip="Zoeken in bibliotheek" />
					<Spacer />
					<Button icon="List" label="Maker" variant="ghost" />
				</Flex>

				<ScrollArea label="Bibliotheek" class="pane-scroll">
					<Flex gap="none">
						<ListItem
							title="my profile"
							subtitle="41 playlists"
							subtitleIcon="Pin"
							onclick={() => {}}
							leading={profileLeading}
							trailing={profileTrailing}
						/>

						{#each playlists as p}
							{#snippet itemLeading()}
								{@render art(p.title, '48px')}
							{/snippet}
							{#snippet itemTrailing()}
								<Icon name="Volume2" size={16} />
							{/snippet}
							<ListItem
								title={p.title}
								subtitle={p.creator}
								subtitleIcon="Pin"
								active={p.active}
								onclick={() => {}}
								leading={itemLeading}
								trailing={p.active ? itemTrailing : undefined}
							/>
						{/each}
					</Flex>
				</ScrollArea>
			</Flex>
		</Card>

		<Card padding="none" class="pane main">
			<ScrollArea label="Playlist" class="pane-scroll">
				<Glow
					colors={['#1d1238', '#3b1d8f', '#6c4be3', '#8b6ded']}
					bgColor="#1d1238"
					rotation={62}
					zoom={11}
					speed={0.4}
				>
					<Flex direction="horizontal" gap="lg" align="end" class="hero-row">
						{@render art('Nummers die je leuk vindt', '220px')}
						<Flex gap="sm">
							<Text size="sm" weight="semibold" as="span">Playlist</Text>
							<Heading level={1}>Nummers die je leuk vindt</Heading>
							<Flex direction="horizontal" gap="sm" align="center">
								<Avatar name="lucas" size="sm" />
								<Text size="sm" weight="semibold" as="span">lucas :)</Text>
								<Text size="sm" variant="secondary" as="span">· 4.755 nummers</Text>
							</Flex>
						</Flex>
					</Flex>
				</Glow>

				<Flex gap="md" class="main-body">
					<Flex direction="horizontal" gap="sm" align="center">
						<Button
							icon={{ name: isPlaying ? 'Pause' : 'Play', fill: true }}
							shape="circle"
							size="lg"
							variant="primary"
							onclick={() => {
								isPlaying = !isPlaying;
							}}
						/>
						<Button icon="Shuffle" tooltip="Willekeurig" />
						<Button icon="Download" tooltip="Downloaden" />
						<Spacer />
						<Button icon="List" label="Lijst" variant="ghost" />
					</Flex>

					<Table
						data={tracks}
						columns={trackColumns}
						variant="simple"
						bordered={false}
						hoverable={true}
					/>
				</Flex>
			</ScrollArea>
		</Card>

		{#snippet npClose()}
			<Button icon="X" tooltip="Sluiten" />
		{/snippet}

		{#snippet videoToggle()}
			<Button icon="Play" label="Overschakelen naar video" variant="secondary" size="sm" />
		{/snippet}

		<Card padding="sm" class="pane now-playing">
			<ScrollArea label="Nu afgespeeld" class="pane-scroll">
				<Flex gap="md">
					<Section title="Nummers die je leuk vindt" level={4} actions={npClose} />

					<Card
						media={{ alt: 'Barbie Girl', aspectRatio: '1' }}
						mediaLayout="overlay"
						persistentSlots
						bottomLeft={videoToggle}
					/>

					<Flex direction="horizontal" align="center">
						<Flex gap="none">
							<Text weight="bold">Barbie Girl</Text>
							<Text size="sm" variant="secondary">Aqua</Text>
						</Flex>
						<Spacer />
						<Button icon="CircleCheck" variant="ghost" tooltip="In je bibliotheek" />
					</Flex>

					<Section title="Vergelijkbare muziekvideo's" level={4}>
						<Grid cols={2} gap="sm">
							<Card
								padding="sm"
								title="How R U Doin?"
								subtitle="Aqua"
								media={{ alt: 'How R U Doin?', aspectRatio: '16/9' }}
							/>
							<Card
								padding="sm"
								title="My Mamma Said"
								subtitle="Aqua"
								media={{ alt: 'My Mamma Said', aspectRatio: '16/9' }}
							/>
						</Grid>
					</Section>

					<Section title="Over de artiest" level={4}>
						<Card
							media={{ alt: 'Aqua', aspectRatio: '16/9' }}
							mediaLayout="overlay"
							title="Aqua"
							persistentSlots
						/>
					</Section>
				</Flex>
			</ScrollArea>
		</Card>

		<footer class="player">
			<Flex direction="horizontal" gap="md" align="center">
				{@render art('Barbie Girl', '56px')}
				<Flex gap="none">
					<Text size="sm" weight="semibold" as="span">Barbie Girl</Text>
					<Flex direction="horizontal" gap="xs" align="center">
						<Icon name="Pin" size={11} />
						<Text size="xs" variant="secondary" as="span">Muziekvideo · Aqua</Text>
					</Flex>
				</Flex>
				<Button icon="CircleCheck" variant="ghost" tooltip="In je bibliotheek" />
			</Flex>

			<Flex gap="xs" class="player-center">
				<Flex direction="horizontal" gap="sm" justify="center" align="center">
					<Button icon="Shuffle" tooltip="Willekeurig" />
					<Button icon="SkipBack" tooltip="Vorige" />
					<Button
						icon={{ name: isPlaying ? 'Pause' : 'Play', fill: true }}
						shape="circle"
						variant="primary"
						onclick={() => {
							isPlaying = !isPlaying;
						}}
					/>
					<Button icon="SkipForward" tooltip="Volgende" />
					<Button icon="Repeat" tooltip="Herhalen" />
				</Flex>
				<Flex direction="horizontal" gap="sm" align="center">
					<Text size="xs" variant="secondary" as="span">1:18</Text>
					<Input
						type="range"
						min={0}
						max={198}
						value={progress}
						showValue={false}
						onChange={(v) => (progress = v)}
					/>
					<Text size="xs" variant="secondary" as="span">3:18</Text>
				</Flex>
			</Flex>

			<Flex direction="horizontal" gap="sm" justify="end" align="center">
				<Button icon="Mic" tooltip="Songtekst" />
				<Button icon="ListVideo" tooltip="Wachtrij" />
				<Button icon="Speaker" tooltip="Apparaat" />
				<Button icon="Volume2" tooltip="Volume" />
				<div class="volume">
					<Input
						type="range"
						min={0}
						max={100}
						value={volume}
						showValue={false}
						onChange={(v) => (volume = v)}
					/>
				</div>
				<Button icon="Maximize2" tooltip="Volledig scherm" />
			</Flex>
		</footer>
	</div>
</ThemeProvider>

{#snippet numberCell(value: any)}
	{#if value === 'playing'}
		<Icon name="AudioLines" size={16} color="var(--glow-primary)" />
	{:else}
		<Text size="sm" variant="secondary" as="span">{value}</Text>
	{/if}
{/snippet}

{#snippet titleCell(_value: any, row: Track)}
	<Flex direction="horizontal" gap="sm" align="center">
		{@render art(row.title, '40px')}
		<Flex gap="none">
			<Text size="sm" weight="semibold" as="span">{row.title}</Text>
			<Flex direction="horizontal" gap="xs" align="center" wrap>
				{#if row.isExplicit}
					<Pill label="E" />
				{/if}
				{#if row.isVideo}
					<Icon name="Video" size={12} />
					<Text size="xs" variant="secondary" as="span">Muziekvideo · {row.artist}</Text>
				{:else}
					<Text size="xs" variant="secondary" as="span">{row.artist}</Text>
				{/if}
			</Flex>
		</Flex>
	</Flex>
{/snippet}

{#snippet albumCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

{#snippet mutedCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

<style lang="scss">
	// Everything that is *not* a Glow component on this page: the five-area
	// application shell, and one square-cover rule. The panes are `<Card>`s and
	// the panels inside them are Sections, Lists and Tables, so none of their
	// surfaces, borders or hover states are restated here.
	.spotify-app {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		grid-template-columns: 320px 1fr 360px;
		grid-template-rows: 64px 1fr 88px;
		grid-template-areas:
			'topbar topbar topbar'
			'library main now'
			'player player player';
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--glow-bg-base);
		box-sizing: border-box;
		overflow: hidden;
	}

	.topbar {
		grid-area: topbar;
		display: grid;
		grid-template-columns: 1fr minmax(0, 540px) 1fr;
		align-items: center;
		gap: 1rem;
	}

	.player {
		grid-area: player;
		display: grid;
		grid-template-columns: 1fr minmax(0, 480px) 1fr;
		align-items: center;
		gap: 1rem;
	}

	.volume {
		max-width: 120px;
	}

	.art {
		width: var(--art-size);
		height: var(--art-size);
		flex: 0 0 auto;
		border-radius: 4px;
		overflow: hidden;
	}

	// The three panes are Cards: they only need to be placed, and told to give
	// their scroller the leftover height instead of growing the grid row.
	:global(.pane) {
		min-height: 0;
	}

	:global(.pane > .card-body) {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	:global(.pane-col),
	:global(.pane-scroll) {
		flex: 1 1 auto;
		min-height: 0;
	}

	:global(.library) {
		grid-area: library;
	}
	:global(.main) {
		grid-area: main;
	}
	:global(.now-playing) {
		grid-area: now;
	}

	:global(.hero-row) {
		padding: 1.5rem 1.5rem 2rem;
	}

	:global(.main-body) {
		padding: 1.5rem;
	}
</style>
