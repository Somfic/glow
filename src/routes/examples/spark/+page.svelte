<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from "$lib/layout/Flex.svelte";
	import Grid from '$lib/layout/Grid.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Field from '$lib/settings/Field.svelte';
	import Input from '$lib/input/Input.svelte';
	import Tabs from '$lib/tabs/Tabs.svelte';
	import Card from '$lib/card/Card.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import ThemeProvider from '$lib/style/ThemeProvider.svelte';
	import type { ComboboxOption } from '$lib/input/types.js';

	type Tone = 'good' | 'warn' | 'bad';

	type Stat = {
		title: string;
		subtitle?: string;
		entries: { value: string; tone?: Tone; suffix?: string }[];
		footnote?: string;
	};

	type MemoryArea = {
		title: string;
		used: string;
		committed: string;
		max?: string;
		ratio: number; // 0..1
		tone: Tone;
	};

	let mappings = $state('auto');
	let infoPoints = $state(true);
	let activeTab = $state('memory');

	const mappingOptions: ComboboxOption[] = [
		{ value: 'auto', label: 'Auto Detect', icon: 'Wand', description: 'Pick best available' },
		{ value: 'mojang', label: 'Mojang' },
		{ value: 'yarn', label: 'Yarn' }
	];

	const topStats: Stat[] = [
		{
			title: 'TPS',
			entries: [
				{ value: '20.00', tone: 'good', suffix: '1m' },
				{ value: '20.00', tone: 'good', suffix: '5m' },
				{ value: '19.21', tone: 'warn', suffix: '15m' }
			]
		},
		{
			title: 'MSPT',
			entries: [
				{ value: '0.22', tone: 'good', suffix: 'min' },
				{ value: '5.39', tone: 'good', suffix: 'med' },
				{ value: '11.7', tone: 'warn', suffix: '95%ile' },
				{ value: '211',  tone: 'bad',  suffix: 'max' }
			]
		},
		{
			title: 'CPU',
			subtitle: '(process)',
			entries: [
				{ value: '12.44%', tone: 'good', suffix: '1m' },
				{ value: '33.21%', tone: 'warn', suffix: '15m' }
			]
		},
		{
			title: 'Memory',
			subtitle: '(process)',
			entries: [{ value: '3.2 GB', tone: 'good' }, { value: '/ 10 GB' }],
			footnote: '32.01%'
		},
		{
			title: 'CPU',
			subtitle: '(system)',
			entries: [
				{ value: '36.55%', tone: 'warn', suffix: '1m' },
				{ value: '65.66%', tone: 'warn', suffix: '15m' }
			]
		},
		{
			title: 'Memory',
			subtitle: '(physical)',
			entries: [{ value: '22.8 GB', tone: 'warn' }, { value: '/ 31.3 GB' }],
			footnote: '73%'
		},
		{
			title: 'Memory',
			subtitle: '(swap)',
			entries: [{ value: '4.4 GB', tone: 'good' }, { value: '/ 32 GB' }],
			footnote: '13.71%'
		},
		{
			title: 'Disk',
			entries: [{ value: '1.3 TB', tone: 'warn' }, { value: '/ 1.8 TB' }],
			footnote: '73.83%'
		}
	];

	const gcStats: Stat[] = [
		{
			title: 'Ping',
			entries: [
				{ value: '1', suffix: 'min' },
				{ value: '2', suffix: 'med' },
				{ value: '9', suffix: '95%ile' },
				{ value: '9', suffix: 'max' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Young, during)',
			entries: [
				{ value: '168',     suffix: 'total' },
				{ value: '23.3ms',  tone: 'good', suffix: 'avg time' },
				{ value: '10.6s',   tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Concurrent GC, during)',
			entries: [
				{ value: '10',     suffix: 'total' },
				{ value: '8.9ms',  tone: 'good', suffix: 'avg time' },
				{ value: '2m59s',  tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Old, during)',
			entries: [
				{ value: '0',   suffix: 'total' },
				{ value: '0ms', suffix: 'avg time' },
				{ value: '0ms', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Young, all)',
			entries: [
				{ value: '553',     suffix: 'total' },
				{ value: '23.6ms',  tone: 'good', suffix: 'avg time' },
				{ value: '3.2s',    tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Concurrent GC, all)',
			entries: [
				{ value: '120',    suffix: 'total' },
				{ value: '4.01ms', tone: 'good', suffix: 'avg time' },
				{ value: '15.1s',  tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Old, all)',
			entries: [
				{ value: '0',   suffix: 'total' },
				{ value: '0ms', suffix: 'avg time' },
				{ value: '0ms', suffix: 'avg freq' }
			]
		}
	];

	const memoryAreas: MemoryArea[] = [
		{ title: 'Heap',                              used: '3.2 GB',   committed: '10 GB',    ratio: 0.32, tone: 'good' },
		{ title: 'Non Heap',                          used: '395.2 MB', committed: '432.8 MB', ratio: 0.91, tone: 'bad' },
		{ title: 'Heap - G1 Eden Space',              used: '608 MB',   committed: '6.1 GB',   ratio: 0.10, tone: 'good' },
		{ title: 'Heap - G1 Old Gen',                 used: '2.4 GB',   committed: '3.7 GB',   max: '10 GB', ratio: 0.65, tone: 'good' },
		{ title: 'Heap - G1 Eden Space (at last GC)', used: '0 bytes',  committed: '6.1 GB',   ratio: 0,    tone: 'good' },
		{ title: 'Heap - G1 Old Gen (at last GC)',    used: '2.4 GB',   committed: '3.7 GB',   max: '10 GB', ratio: 0.65, tone: 'good' },
		{ title: 'Heap - G1 Survivor Space',          used: '186.6 MB', committed: '192 MB',   ratio: 0.97, tone: 'bad' },
		{ title: 'Heap - G1 Survivor Space (at last GC)', used: '186.6 MB', committed: '192 MB', ratio: 0.97, tone: 'bad' }
	];

</script>

{#snippet platformTab()}
	<div class="placeholder">
		<Flex gap="sm">
			<Heading level={3}>Platform</Heading>
			<Text variant="secondary">Server software, version, runtime details would render here.</Text>
		</Flex>
	</div>
{/snippet}

{#snippet memoryTab()}
	<Flex gap="lg">
		<Flex gap="sm">
			<Heading level={2}>Memory Areas</Heading>
			<Grid min="280px" gap="sm">
				{#each memoryAreas as area}
					<div class="memory-card" data-tone={area.tone}>
						<Text size="sm" weight="semibold">{area.title}</Text>
						<div class="bar"><div class="fill" style:width="{area.ratio * 100}%"></div></div>
						<Flex gap="xs">
							<Text size="sm" variant="secondary">Used: {area.used}</Text>
							<Text size="sm" variant="secondary">Committed: {area.committed}</Text>
							{#if area.max}
								<Text size="sm" variant="secondary">Max: {area.max}</Text>
							{/if}
						</Flex>
					</div>
				{/each}
			</Grid>
		</Flex>

		<Flex gap="sm">
			<Heading level={2}>All View</Heading>
			<Text variant="secondary">
				This is the default profiler view. It shows the entire profile as an expandable tree.
			</Text>
		</Flex>
	</Flex>
{/snippet}

{#snippet emptyTab()}
	<div class="placeholder">
		<Text variant="secondary">No data for this view.</Text>
	</div>
{/snippet}

<svelte:head><title>Spark profiler · Glow UI</title></svelte:head>

<ThemeProvider tokens={{ '--glow-primary': '#facc15' }}>
	<div class="spark-app">
		<header class="topbar">
			<div class="brand">
				<span class="brand-icon"><Icon name="Zap" size={18} fill /></span>
				<span class="brand-name">spark</span>
			</div>
			<Spacer />
			<button class="theme-btn" aria-label="Toggle theme"><Icon name="Moon" size={18} /></button>
		</header>

		<div class="session-bar">
			<Flex direction="horizontal" gap="sm" align="center">
				<Avatar name="Somfic" size="sm" />
				<Text size="sm">
					<strong>Somfic</strong>
					<span class="muted">@ 10:37PM 5/2/2026, interval 4ms</span>
				</Text>
			</Flex>
			<Spacer />
			<Flex direction="horizontal" gap="xs">
				<Button icon="Gauge" tooltip="Performance" />
				<Button icon="Info"  tooltip="About" />
				<Button icon="SlidersHorizontal" tooltip="Filters" />
				<Pill label="all"  icon="Eye" selected />
				<Pill label="flat" icon="Eye" />
				<Button icon="Share" tooltip="Share" />
				<Button icon="Search" tooltip="Search" shortcut="/" />
			</Flex>
			<Button icon="CircleDashed" tooltip="Status" />
		</div>

		<div class="settings">
			<Flex direction="horizontal" gap="sm" align="center">
				<Icon name="ListFilter" size={14} />
				<Field label="Mappings" hint="Select which deobfuscation mappings the viewer should use when displaying profiler frames." layout="horizontal">
					<Input type="select" options={mappingOptions} value={mappings} onChange={(v) => (mappings = v)} />
				</Field>
			</Flex>
			<Flex direction="horizontal" gap="sm" align="center">
				<Icon name="ListFilter" size={14} />
				<Field label="Info Points" hint="Select whether info points should be shown." layout="horizontal">
					<Input type="toggle" checked={infoPoints} onChange={(v) => (infoPoints = v)} />
				</Field>
			</Flex>
		</div>


		<Grid min="180px" gap="sm">
			{#each topStats as stat}
				<div class="stat-card">
					<div class="stat-head">
						<span class="stat-title">{stat.title}</span>
						{#if stat.subtitle}<span class="stat-sub">{stat.subtitle}</span>{/if}
					</div>
					<div class="stat-values">
						{#each stat.entries as e}
							<div class="stat-entry">
								<span class="stat-value" data-tone={e.tone}>{e.value}</span>
								{#if e.suffix}<span class="stat-suffix">{e.suffix}</span>{/if}
							</div>
						{/each}
					</div>
					{#if stat.footnote}<div class="stat-footnote">{stat.footnote}</div>{/if}
				</div>
			{/each}
		</Grid>

		<Grid min="180px" gap="sm">
			{#each gcStats as stat}
				<div class="stat-card">
					<div class="stat-head">
						<span class="stat-title">{stat.title}</span>
						{#if stat.subtitle}<span class="stat-sub">{stat.subtitle}</span>{/if}
					</div>
					<div class="stat-values">
						{#each stat.entries as e}
							<div class="stat-entry">
								<span class="stat-value" data-tone={e.tone}>{e.value}</span>
								{#if e.suffix}<span class="stat-suffix">{e.suffix}</span>{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</Grid>

		<div class="content">
			<Tabs
				bind:activeTab
				tabs={[
					{ id: 'platform',       label: 'Platform',       content: platformTab },
					{ id: 'memory',         label: 'Memory',         content: memoryTab },
					{ id: 'network',        label: 'Network',        content: emptyTab },
					{ id: 'jvm-flags',      label: 'JVM Flags',      content: emptyTab },
					{ id: 'configurations', label: 'Configurations', content: emptyTab },
					{ id: 'world',          label: 'World',          content: emptyTab },
					{ id: 'game-rules',     label: 'Game Rules',     content: emptyTab },
					{ id: 'plugins-mods',   label: 'Plugins/Mods',   content: emptyTab }
				]}
			/>
		</div>
	</div>
</ThemeProvider>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.spark-app {
		// Bare-layout parents pin the viewport, so the dashboard scrolls
		// internally rather than the document.
		height: 100%;
		overflow-y: auto;
		background: var(--glow-bg-base);
		color: var(--glow-fg);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		padding: 1rem 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 0.5rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.brand-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: var(--glow-primary);
		color: #1a1a1a;
	}

	.brand-name {
		font-size: $text-sm;
		font-weight: $weight-bold;
		letter-spacing: 0.02em;
		padding: 2px 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--glow-border-color);
	}

	.theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: 0;
		color: var(--glow-text-muted);
		cursor: pointer;
		border-radius: 6px;

		&:hover {
			color: var(--glow-fg);
			background: var(--glow-fg-soft);
		}
	}

	.session-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;

		.muted {
			color: var(--glow-text-muted);
		}
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;
		text-align: center;
	}

	.stat-head {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.25rem;
		font-size: $text-sm;
		color: var(--glow-text-secondary);
	}

	.stat-title {
		font-weight: $weight-bold;
	}

	.stat-sub {
		color: var(--glow-text-muted);
		font-size: $text-xs;
	}

	.stat-values {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0 0.75rem;
	}

	.stat-entry {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		min-width: 0;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: $weight-bold;
		color: var(--glow-fg);
		font-variant-numeric: tabular-nums;

		&[data-tone='good'] { color: var(--glow-color-success); }
		&[data-tone='warn'] { color: var(--glow-color-warning); }
		&[data-tone='bad']  { color: var(--glow-color-danger); }
	}

	.stat-suffix {
		font-size: $text-xs;
		color: var(--glow-text-muted);
	}

	.stat-footnote {
		font-size: $text-xs;
		color: var(--glow-text-muted);
	}

	.content {
		flex: 1 1 auto;
	}

	.memory-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;
	}

	.bar {
		position: relative;
		width: 100%;
		height: 6px;
		background: var(--glow-fg-soft);
		border-radius: 3px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 3px;

		.memory-card[data-tone='good'] & { background: var(--glow-color-success); }
		.memory-card[data-tone='warn'] & { background: var(--glow-color-warning); }
		.memory-card[data-tone='bad']  & { background: var(--glow-color-danger); }
	}

	.placeholder {
		padding: 2rem;
		background: var(--glow-bg-surface);
		border: 1px dashed var(--glow-border-color);
		border-radius: $radius;
		text-align: center;
	}
</style>
