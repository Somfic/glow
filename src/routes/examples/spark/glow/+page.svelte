<script lang="ts">
	import Text from '$lib/typography/Text.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Field from '$lib/settings/Field.svelte';
	import SettingsSection from '$lib/settings/SettingsSection.svelte';
	import Input from '$lib/input/Input.svelte';
	import Tabs from '$lib/tabs/Tabs.svelte';
	import Card from '$lib/card/Card.svelte';
	import Stat from '$lib/stat/Stat.svelte';
	import Progress from '$lib/progress/Progress.svelte';
	import EmptyState from '$lib/empty-state/EmptyState.svelte';
	import Section from '$lib/typography/Section.svelte';
	import ThemeProvider from '$lib/style/ThemeProvider.svelte';
	import { theme } from '$lib/style/theme.svelte.js';
	import type { ComboboxOption } from '$lib/input/types.js';

	type Tone = 'good' | 'warn' | 'bad';

	type SparkStat = {
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

	// Tone is a colour decision the theme already owns, so both readings of it
	// go through tokens: `Progress` has a `tone` prop, and `Stat` paints its
	// value from `--glow-text-primary` — retargeting that token is the whole
	// styling budget for a toned figure.
	const progressTone = { good: 'success', warn: 'warning', bad: 'danger' } as const;
	const toneStyle = (tone?: Tone) =>
		tone ? `--glow-text-primary: var(--glow-color-${progressTone[tone]})` : undefined;

	let mappings = $state('auto');
	let infoPoints = $state(true);
	let activeTab = $state('memory');

	const mappingOptions: ComboboxOption[] = [
		{ value: 'auto', label: 'Auto Detect', icon: 'Wand', description: 'Pick best available' },
		{ value: 'mojang', label: 'Mojang' },
		{ value: 'yarn', label: 'Yarn' }
	];

	const topStats: SparkStat[] = [
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
				{ value: '211', tone: 'bad', suffix: 'max' }
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

	const gcStats: SparkStat[] = [
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
				{ value: '168', suffix: 'total' },
				{ value: '23.3ms', tone: 'good', suffix: 'avg time' },
				{ value: '10.6s', tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Concurrent GC, during)',
			entries: [
				{ value: '10', suffix: 'total' },
				{ value: '8.9ms', tone: 'good', suffix: 'avg time' },
				{ value: '2m59s', tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Old, during)',
			entries: [
				{ value: '0', suffix: 'total' },
				{ value: '0ms', suffix: 'avg time' },
				{ value: '0ms', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Young, all)',
			entries: [
				{ value: '553', suffix: 'total' },
				{ value: '23.6ms', tone: 'good', suffix: 'avg time' },
				{ value: '3.2s', tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Concurrent GC, all)',
			entries: [
				{ value: '120', suffix: 'total' },
				{ value: '4.01ms', tone: 'good', suffix: 'avg time' },
				{ value: '15.1s', tone: 'good', suffix: 'avg freq' }
			]
		},
		{
			title: 'GC',
			subtitle: '(G1 Old, all)',
			entries: [
				{ value: '0', suffix: 'total' },
				{ value: '0ms', suffix: 'avg time' },
				{ value: '0ms', suffix: 'avg freq' }
			]
		}
	];

	const memoryAreas: MemoryArea[] = [
		{ title: 'Heap', used: '3.2 GB', committed: '10 GB', ratio: 0.32, tone: 'good' },
		{ title: 'Non Heap', used: '395.2 MB', committed: '432.8 MB', ratio: 0.91, tone: 'bad' },
		{
			title: 'Heap - G1 Eden Space',
			used: '608 MB',
			committed: '6.1 GB',
			ratio: 0.1,
			tone: 'good'
		},
		{
			title: 'Heap - G1 Old Gen',
			used: '2.4 GB',
			committed: '3.7 GB',
			max: '10 GB',
			ratio: 0.65,
			tone: 'good'
		},
		{
			title: 'Heap - G1 Eden Space (at last GC)',
			used: '0 bytes',
			committed: '6.1 GB',
			ratio: 0,
			tone: 'good'
		},
		{
			title: 'Heap - G1 Old Gen (at last GC)',
			used: '2.4 GB',
			committed: '3.7 GB',
			max: '10 GB',
			ratio: 0.65,
			tone: 'good'
		},
		{
			title: 'Heap - G1 Survivor Space',
			used: '186.6 MB',
			committed: '192 MB',
			ratio: 0.97,
			tone: 'bad'
		},
		{
			title: 'Heap - G1 Survivor Space (at last GC)',
			used: '186.6 MB',
			committed: '192 MB',
			ratio: 0.97,
			tone: 'bad'
		}
	];
</script>

{#snippet statGrid(stats: SparkStat[])}
	<Grid min="200px" gap="sm">
		{#each stats as stat}
			<Card padding="sm">
				<Flex gap="xs" align="center">
					<Flex direction="horizontal" gap="xs" align="baseline">
						<Text size="sm" weight="bold" as="span">{stat.title}</Text>
						{#if stat.subtitle}
							<Text size="xs" variant="secondary" as="span">{stat.subtitle}</Text>
						{/if}
					</Flex>
					<Flex direction="horizontal" gap="sm" justify="center" align="baseline" wrap>
						{#each stat.entries as e}
							<Stat
								size="sm"
								variant="plain"
								value={e.value}
								label={e.suffix}
								animate={false}
								tabular
								style={toneStyle(e.tone)}
							/>
						{/each}
					</Flex>
					{#if stat.footnote}
						<Text size="xs" variant="secondary" as="span">{stat.footnote}</Text>
					{/if}
				</Flex>
			</Card>
		{/each}
	</Grid>
{/snippet}

{#snippet platformTab()}
	<EmptyState
		icon="Server"
		title="Platform"
		description="Server software, version and runtime details would render here."
	/>
{/snippet}

{#snippet memoryTab()}
	<Flex gap="lg">
		<Section title="Memory Areas" level={2}>
			<Grid min="280px" gap="sm">
				{#each memoryAreas as area}
					<Card title={area.title} padding="sm">
						<Flex gap="xs">
							<Progress
								value={area.ratio * 100}
								tone={progressTone[area.tone]}
								size="sm"
								showValue
								label="Used"
							/>
							<Flex direction="horizontal" gap="sm" wrap>
								<Text size="xs" variant="secondary" as="span">Used: {area.used}</Text>
								<Text size="xs" variant="secondary" as="span">Committed: {area.committed}</Text>
								{#if area.max}
									<Text size="xs" variant="secondary" as="span">Max: {area.max}</Text>
								{/if}
							</Flex>
						</Flex>
					</Card>
				{/each}
			</Grid>
		</Section>

		<Section title="All View" level={2} subtitle="The entire profile as an expandable tree.">
			<EmptyState
				icon="FolderTree"
				title="Nothing profiled yet"
				description="Start a sampler to populate the tree."
			/>
		</Section>
	</Flex>
{/snippet}

{#snippet emptyTab()}
	<EmptyState icon="Inbox" title="No data for this view" />
{/snippet}

<svelte:head><title>Spark profiler (Glow) · Glow UI</title></svelte:head>

<ThemeProvider tokens={{ '--glow-primary': '#facc15' }}>
	<div class="spark-app">
		<Flex gap="md">
			<Flex direction="horizontal" gap="sm" align="center">
				<Pill icon={{ name: 'Zap', fill: true }} label="spark" size="md" />
				<Spacer />
				<Button
					icon={theme.isDark ? 'Moon' : 'Sun'}
					tooltip="Toggle theme"
					onclick={() => {
						theme.toggle();
					}}
				/>
			</Flex>

			<Card padding="sm">
				<Flex direction="horizontal" gap="sm" align="center" wrap>
					<Avatar name="Somfic" size="sm" />
					<Text size="sm" weight="semibold" as="span">Somfic</Text>
					<Text size="sm" variant="secondary" as="span">@ 10:37PM 5/2/2026, interval 4ms</Text>
					<Spacer />
					<Button icon="Gauge" tooltip="Performance" />
					<Button icon="Info" tooltip="About" />
					<Button icon="SlidersHorizontal" tooltip="Filters" />
					<Pill label="all" icon="Eye" selected />
					<Pill label="flat" icon="Eye" />
					<Button icon="Share" tooltip="Share" />
					<Button icon="Search" tooltip="Search" shortcut="/" />
					<Button icon="CircleDashed" tooltip="Status" />
				</Flex>
			</Card>

			<SettingsSection title="Viewer" icon="ListFilter" variant="card">
				<Field
					label="Mappings"
					leading="Wand"
					hint="Which deobfuscation mappings the viewer uses when displaying profiler frames."
				>
					<Input
						type="select"
						options={mappingOptions}
						value={mappings}
						onChange={(v) => (mappings = v)}
					/>
				</Field>
				<Field
					label="Info Points"
					leading="Info"
					hint="Whether info points should be shown."
					align="center"
				>
					<Input type="toggle" checked={infoPoints} onChange={(v) => (infoPoints = v)} />
				</Field>
			</SettingsSection>

			{@render statGrid(topStats)}
			{@render statGrid(gcStats)}

			<Tabs
				bind:activeTab
				tabs={[
					{ id: 'platform', label: 'Platform', content: platformTab },
					{ id: 'memory', label: 'Memory', content: memoryTab },
					{ id: 'network', label: 'Network', content: emptyTab },
					{ id: 'jvm-flags', label: 'JVM Flags', content: emptyTab },
					{ id: 'configurations', label: 'Configurations', content: emptyTab },
					{ id: 'world', label: 'World', content: emptyTab },
					{ id: 'game-rules', label: 'Game Rules', content: emptyTab },
					{ id: 'plugins-mods', label: 'Plugins/Mods', content: emptyTab }
				]}
			/>
		</Flex>
	</div>
</ThemeProvider>

<style lang="scss">
	// All that is left of this page's own CSS: the bare layout pins the
	// viewport, so the dashboard has to be its own scroller, and spark's
	// identity is a monospace one.
	.spark-app {
		height: 100%;
		overflow-y: auto;
		padding: 1rem 1.5rem 2rem;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}
</style>
