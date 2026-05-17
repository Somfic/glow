<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Flex from "$lib/layout/Flex.svelte";
	import Spacer from '$lib/layout/Spacer.svelte';
	import Table from '$lib/data/Table.svelte';
	import Card from '$lib/card/Card.svelte';
	import GradientMesh from '$lib/gradient/GradientMesh.svelte';
	import Media from '$lib/media/Media.svelte';
	import ListItem from '$lib/list/ListItem.svelte';
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
		{ title: 'Nummers die je leuk vindt', creator: 'Playlist · 4.755 num...', count: '4755', active: true },
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
		{ n: 'playing', title: 'Barbie Girl', artist: 'Aqua', album: 'Aquarium', added: '3 uur geleden', duration: '3:17', isVideo: true },
		{ n: 2, title: 'So What', artist: 'P!nk', album: 'Funhouse: The Tour Edition', added: '3 uur geleden', duration: '3:35', isVideo: true, isExplicit: true },
		{ n: 3, title: 'Letter To My 13 Year Old Self', artist: 'Laufey', album: 'Bewitched', added: '2 dagen geleden', duration: '4:22' },
		{ n: 4, title: 'Why You Wanna Fight?', artist: 'Bruno Mars', album: 'The Romantic', added: '2 dagen geleden', duration: '4:14' },
		{ n: 5, title: 'Cooler Than Me - Single Mix', artist: 'Mike Posner, Gigamesh', album: '31 Minutes to Takeoff', added: '2 dagen geleden', duration: '3:33' },
		{ n: 6, title: 'This Love', artist: 'Maroon 5', album: 'Songs About Jane: 10th Annivers...', added: '2 dagen geleden', duration: '3:26', isVideo: true },
		{ n: 7, title: 'Apologize', artist: 'OneRepublic, Timbaland', album: 'Shock Value', added: '5 dagen geleden', duration: '3:04' },
		{ n: 8, title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', added: '1 week geleden', duration: '3:46' }
	];

const trackColumns: TableColumn<Track>[] = [
		{ key: 'n', label: '#', width: '50px', align: 'right', render: numberCell },
		{ key: 'title', label: 'Titel', render: titleCell },
		{ key: 'album', label: 'Album', render: albumCell },
		{ key: 'added', label: 'Datum toegevoegd', render: addedCell },
		{ key: 'duration', label: '⏱', width: '100px', align: 'right', render: durationCell }
	];

	let search = $state('');
	let activeTab = $state<'playlists' | 'artiesten' | 'albums'>('playlists');
	let isPlaying = $state(true);
	let progress = $state(78); // 1:18 of 3:18
	let volume = $state(60);
</script>

<svelte:head><title>Spotify · Glow example</title></svelte:head>

<ThemeProvider tokens={{ '--glow-primary': '#1db954' }}>
<div class="spotify-app">
	<!-- Top bar -->
	<header class="topbar">
		<div class="topbar-left">
			<div class="logo">
				<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.6-1.1a.75.75 0 1 1-.4-1.4c4.6-1.1 8.5-.6 11.7 1.3a.75.75 0 0 1 .3 1Zm1.5-3.3a.94.94 0 0 1-1.3.3c-3.2-2-8.1-2.5-11.9-1.4a.94.94 0 1 1-.5-1.8c4.3-1.3 9.7-.7 13.4 1.6a.94.94 0 0 1 .3 1.3Zm.1-3.4c-3.8-2.3-10.2-2.5-13.9-1.4a1.13 1.13 0 1 1-.6-2.2c4.2-1.3 11.2-1 15.6 1.6a1.13 1.13 0 1 1-1.1 2Z"/></svg>
			</div>
		</div>

		<Flex direction="horizontal" gap="sm" class="topbar-search">
			<Button icon="House" tooltip="Home" />
			<div class="search-input">
				<Input
					type="text"
					icon="Search"
					placeholder="Wat wil je afspelen?"
					value={search}
					onChange={(v) => (search = v)}
					shortcut="/"
				/>
			</div>
			<Button icon="LayoutGrid" tooltip="Bladeren" />
		</Flex>

		<Flex direction="horizontal" gap="sm" class="topbar-right">
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

	<!-- Library sidebar -->
	<aside class="library">
		<Flex gap="md">
			<Section title="Bibliotheek" icon="Library" actions={libraryActions} />

			<Flex direction="horizontal" gap="xs">
				<Pill label="Playlists" selected={activeTab === 'playlists'} onclick={() => (activeTab = 'playlists')} />
				<Pill label="Artiesten" selected={activeTab === 'artiesten'} onclick={() => (activeTab = 'artiesten')} />
				<Pill label="Albums" selected={activeTab === 'albums'} onclick={() => (activeTab = 'albums')} />
			</Flex>

			<Flex direction="horizontal">
				<Button icon="Search" tooltip="Zoeken in bibliotheek" />
				<Spacer />
				<Flex direction="horizontal" gap="xs">
					<Text size="sm" variant="secondary" as="span">Maker</Text>
					<Icon name="List" size={14} />
				</Flex>
			</Flex>
		</Flex>

		<!-- Profile group expander -->
		{#snippet profileLeading()}
			<div class="profile-icon"><Icon name="Folder" /></div>
		{/snippet}
		{#snippet profileTrailing()}
			<Icon name="ChevronUp" size={14} />
		{/snippet}
		<Flex gap="none" class="library-list">
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
					<div class="cover">
						<Media alt={p.title} />
						{#if p.active}
							<div class="cover-overlay"><Icon name="Heart" size={20} fill color="white" /></div>
						{/if}
					</div>
				{/snippet}
				{#snippet itemTrailing()}
					<Icon name="Volume2" size={16} color="#1db954" />
				{/snippet}
				<ListItem
					title={p.title}
					subtitle={p.creator}
					subtitleIcon="Pin"
					active={p.active}
					onclick={() => {}}
					class={p.active ? 'playing-row' : ''}
					leading={itemLeading}
					trailing={p.active ? itemTrailing : undefined}
				/>
			{/each}
		</Flex>
	</aside>

	<!-- Main pane -->
	<main class="main">
		<div class="hero">
			<GradientMesh colors={['#8b6ded', '#6c4be3', '#3b1d8f', '#1d1238']} intensity={0.4} speed={0.4}>
				<Flex direction="horizontal" gap="lg" align="end" class="hero-row">
					<div class="hero-cover">
						<Media alt="Nummers die je leuk vindt" />
						<div class="hero-cover-icon"><Icon name="Heart" size="120" color="white" fill /></div>
					</div>
					<Flex gap="sm">
						<Text size="sm" weight="semibold" as="span">Playlist</Text>
						<Heading level={1} class="hero-title">Nummers die je leuk vindt</Heading>
						<Flex direction="horizontal" gap="sm">
							<Avatar name="lucas" size="sm" />
							<Text size="sm" weight="semibold" as="span">lucas :)</Text>
							<Text size="sm" variant="secondary" as="span">· 4.755 nummers</Text>
						</Flex>
					</Flex>
				</Flex>
			</GradientMesh>
		</div>

		<div class="track-controls">
			<Flex direction="horizontal" gap="sm">
				<Button
					icon={{ name: isPlaying ? 'Pause' : 'Play', fill: true }}
					shape="circle"
					size="lg"
					variant="primary"
					class="play-big"
					onclick={() => { isPlaying = !isPlaying; }}
				/>
				<Button icon="Shuffle" tooltip="Willekeurig" />
				<Button icon="Download" tooltip="Downloaden" />
				<Spacer />
				<Flex direction="horizontal" gap="xs">
					<Text size="sm" variant="secondary" as="span">Lijst</Text>
					<Icon name="List" />
				</Flex>
			</Flex>
		</div>

		<div class="tracks">
			<Table data={tracks} columns={trackColumns} variant="simple" bordered={false} hoverable={true} />
		</div>
	</main>

	{#snippet npClose()}
		<Button icon="X" tooltip="Sluiten" />
	{/snippet}

	<!-- Now playing sidebar -->
	<aside class="now-playing">
		<Flex gap="md">
			<Section title="Nummers die je leuk vindt" actions={npClose} />
			<div class="np-cover">
				<div class="np-cover-img"></div>
				<button class="video-toggle">
					<Icon name="Play" size={14} />
					<Text size="sm" weight="semibold" as="span">Overschakelen naar video</Text>
				</button>
			</div>
			<Flex direction="horizontal">
				<Flex gap="none">
					<Text weight="bold">Barbie Girl</Text>
					<Text size="sm" variant="secondary">Aqua</Text>
				</Flex>
				<Spacer />
				<Icon name="CircleCheck" color="#1db954" fill size={20} />
			</Flex>

			<Flex gap="sm">
				<Section title="Vergelijkbare muziekvideo's" />
				<Flex direction="horizontal" gap="sm">
					<Card padding="none" class="video-card">
						<div class="video-thumb"><Media alt="How R U Doin?" /></div>
						<div class="video-meta">
							<Text size="sm" weight="semibold">How R U Doin?</Text>
							<Text size="xs" variant="secondary">Aqua</Text>
						</div>
					</Card>
					<Card padding="none" class="video-card">
						<div class="video-thumb"><Media alt="My Mamma Said" /></div>
						<div class="video-meta">
							<Text size="sm" weight="semibold">My Mamma Said</Text>
							<Text size="xs" variant="secondary">Aqua</Text>
						</div>
					</Card>
				</Flex>
			</Flex>

			<Flex gap="sm">
				<Section title="Over de artiest" />
				<div class="artist-card"><Media alt="Aqua" /></div>
			</Flex>
		</Flex>
	</aside>

	<!-- Bottom player -->
	<footer class="player">
		<Flex direction="horizontal" gap="md" class="player-left">
			<div class="now-cover"><Media alt="Barbie Girl" /></div>
			<Flex gap="none">
				<Text size="sm" weight="semibold" as="span">Barbie Girl</Text>
				<Flex direction="horizontal" gap="xs">
					<Icon name="Pin" size={11} />
					<Text size="xs" variant="secondary" as="span">Muziekvideo · Aqua</Text>
				</Flex>
			</Flex>
			<Icon name="CircleCheck" color="#1db954" fill size={20} />
		</Flex>

		<Flex gap="xs" class="player-center">
			<Flex direction="horizontal" gap="sm" justify="center">
				<Button icon="Shuffle" tooltip="Willekeurig" />
				<Button icon="SkipBack" tooltip="Vorige" />
				<Button
					icon={{ name: isPlaying ? 'Pause' : 'Play', fill: true }}
					shape="circle"
					variant="primary"
					class="play-small"
					onclick={() => { isPlaying = !isPlaying; }}
				/>
				<Button icon="SkipForward" tooltip="Volgende" />
				<Button icon="Repeat" tooltip="Herhalen" />
			</Flex>
			<Flex direction="horizontal" gap="sm">
				<Text size="xs" variant="secondary" as="span">1:18</Text>
				<div class="seek">
					<Input
						type="range"
						min={0}
						max={198}
						value={progress}
						showValue={false}
						onChange={(v) => (progress = v)}
					/>
				</div>
				<Text size="xs" variant="secondary" as="span">3:18</Text>
			</Flex>
		</Flex>

		<Flex direction="horizontal" gap="sm" class="player-right" justify="end">
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
		<Icon name="AudioLines" size={16} color="#1db954" />
	{:else}
		<Text size="sm" variant="secondary" as="span">{value}</Text>
	{/if}
{/snippet}

{#snippet titleCell(_value: any, row: Track, idx: number)}
	<Flex direction="horizontal" gap="sm">
		<div class="track-art"><Media alt={row.title} /></div>
		<Flex gap="none">
			<Text size="sm" weight="semibold" as="span" class={row.n === 'playing' ? 'now-playing' : ''}>{row.title}</Text>
			<Flex direction="horizontal" gap="xs">
				{#if row.isExplicit}
					<span class="explicit">E</span>
				{/if}
				{#if row.isVideo}
					<Flex direction="horizontal" gap="xs">
						<Icon name="Video" size={12} />
						<Text size="xs" variant="secondary" as="span">Muziekvideo · {row.artist}</Text>
					</Flex>
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

{#snippet addedCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

{#snippet durationCell(value: any)}
	<Text size="sm" variant="secondary" as="span">{value}</Text>
{/snippet}

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

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
		gap: 8px;
		padding: 8px;
		background: #000;
		color: white;
		font-size: 14px;
		box-sizing: border-box;
		overflow: hidden;
	}

	.topbar {
		grid-area: topbar;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		padding: 0 12px;
	}

	.topbar-left {
		justify-self: start;
	}

	.logo {
		color: white;
		display: flex;
		align-items: center;
	}

	:global(.topbar-search) {
		min-width: 480px;
		max-width: 540px;
	}

	.search-input {
		flex: 1;
	}

	:global(.topbar-right) {
		justify-self: end;
	}

	.library {
		grid-area: library;
		background: #121212;
		border-radius: 8px;
		padding: 12px;
		overflow-y: auto;
	}

	:global(.library-list) {
		gap: 2px !important;
		margin-top: 8px;
	}

	// Active playlist row paints its title in Spotify-green.
	:global(.playing-row .title) {
		color: #1db954;
	}

	.profile-icon {
		width: 48px;
		height: 48px;
		border-radius: 6px;
		background: #2a2a2a;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.7);
	}

	.cover {
		position: relative;
		width: 48px;
		height: 48px;
		border-radius: 6px;
		overflow: hidden;
		flex: 0 0 auto;
	}

	.cover-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;
	}

	:global(.now-playing) {
		color: #1db954 !important;
	}

	.main {
		grid-area: main;
		background: #121212;
		border-radius: 8px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.hero {
		padding: 0;
		min-height: 320px;
		position: relative;
	}

	:global(.hero-row) {
		padding: 24px 24px 32px;
	}

	.hero-cover {
		position: relative;
		width: 220px;
		height: 220px;
		border-radius: 4px;
		overflow: hidden;
		flex: 0 0 auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.hero-cover-icon {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;
	}

	:global(.hero-title) {
		font-size: 5rem !important;
		line-height: 1 !important;
		font-weight: $weight-bold !important;
		letter-spacing: -0.04em;
	}

	.track-controls {
		padding: 24px;
	}

	:global(.play-big) {
		background: #1db954 !important;
		border-color: #1db954 !important;
		color: black !important;

		&:hover {
			background: #1ed760 !important;
			border-color: #1ed760 !important;
		}
	}

	.tracks {
		padding: 0 24px 24px;
	}

	.track-art {
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: 4px;
		overflow: hidden;
		flex: 0 0 auto;
	}

	.explicit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		background: rgba(255, 255, 255, 0.5);
		color: black;
		font-size: 10px;
		font-weight: $weight-bold;
		border-radius: 2px;
	}

	.now-playing {
		grid-area: now;
		background: #121212;
		border-radius: 8px;
		padding: 16px;
		overflow-y: auto;
	}

	:global(.np-title) {
		font-size: 1rem !important;
	}

	:global(.np-section) {
		font-size: 1rem !important;
	}

	.np-cover {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
	}

	.np-cover-img {
		width: 100%;
		height: 100%;
		background:
			radial-gradient(circle at 30% 50%, #db2777 0%, transparent 50%),
			radial-gradient(circle at 70% 30%, #f59e0b 0%, transparent 50%),
			linear-gradient(135deg, #1e3a8a, #4c1d95);
	}

	.video-toggle {
		position: absolute;
		bottom: 12px;
		left: 12px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 999px;
		cursor: pointer;

		&:hover {
			background: rgba(0, 0, 0, 0.85);
		}
	}

	:global(.video-card) {
		flex: 1;
		min-width: 0;
		background: #1a1a1a !important;
		border: none !important;
	}

	.video-thumb {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: 4px 4px 0 0;
		overflow: hidden;
	}

	.video-meta {
		padding: 8px 10px;
	}

	.artist-card {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: 8px;
		overflow: hidden;
	}

	.player {
		grid-area: player;
		background: #000;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		padding: 0 16px;
	}

	:global(.player-left) {
		justify-self: start;
		max-width: 340px;
	}

	.now-cover {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 4px;
		overflow: hidden;
		flex: 0 0 auto;
	}

	:global(.player-center) {
		min-width: 480px;
	}

	:global(.play-small) {
		background: white !important;
		border-color: white !important;
		color: black !important;

		&:hover {
			background: white !important;
			border-color: white !important;
		}
	}

	.seek,
	.volume {
		flex: 1;
		min-width: 80px;

		:global(.range-input) {
			padding: 0;
		}
	}

	.volume {
		max-width: 120px;
	}

	:global(.player-right) {
		justify-self: end;
		max-width: 340px;
	}
</style>
