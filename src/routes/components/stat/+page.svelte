<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Stat from '$lib/stat/Stat.svelte';
	import Sparkline from '$lib/charts/Sparkline.svelte';
	import AnimatedNumber from '$lib/animated-number/AnimatedNumber.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	const series = [12, 15, 14, 18, 22, 20, 26, 31, 29, 34, 38, 41];

	// The live cards below are the only way to see what this component actually
	// does — a screenshot of an animation is just a number.
	let requests = $state(1284);
	let tempo = $state(96);

	const KEYS = ['D\u266d major', 'A minor', 'F major', 'B\u266d minor'];
	let keyIndex = $state(0);

	$effect(() => {
		const id = setInterval(() => {
			requests += Math.floor(Math.random() * 40) + 5;
			// Walks across 100 on purpose: that is the width step `pad` exists for.
			tempo = tempo >= 104 ? 92 : tempo + Math.floor(Math.random() * 4) + 1;
			keyIndex = (keyIndex + 1) % KEYS.length;
		}, 1600);
		return () => clearInterval(id);
	});
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Stat | Glow UI</title></svelte:head>

<Heading level={1}>Stat</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A single figure and what it means — a metric, its unit, how it moved. The tile a dashboard is
	built from, and the thing to reach for when the data is one number and a chart would be ceremony.
</Text>

<Card title="Basic" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A value and its unit. Without a label the tile is a compact capsule, for a toolbar or a status
		strip.
	</Text>
	<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
		<Stat value={128} unit="BPM" />
		<Stat value="D♭" unit="87%" />
		<Stat value="1.4" unit="GB" />
	</div>
</Card>

<Card title="Labelled" id="labelled">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The label names the figure in sentence case, with no trailing colon.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Active sessions" value="1,284" />
		<Stat label="Storage used" value="4.2" unit="TB" icon="HardDrive" />
		<Stat label="Uptime" value="99.98" unit="%" icon="Activity" />
	</div>
</Card>

<Card title="Delta" id="delta">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A signed change against a named period. The colour follows the direction crossed with
		<Code>goodDirection</Code>, so a falling error rate reads as good news and a falling revenue
		does not — and an arrow carries the same direction for anyone the colour doesn't reach.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Revenue" value="$48.2K" delta={12} deltaLabel="vs last month" />
		<Stat
			label="Error rate"
			value="0.42"
			unit="%"
			delta={-31}
			deltaLabel="vs last week"
			goodDirection="down"
		/>
		<Stat
			label="Churn"
			value="2.8"
			unit="%"
			delta={4}
			deltaLabel="vs last month"
			goodDirection="down"
		/>
		<Stat label="Headcount" value={142} delta={3} deltaLabel="this quarter" goodDirection="none" />
		<Stat label="Open tickets" value={37} delta={0} deltaLabel="vs yesterday" />
	</div>
</Card>

<Card title="Live trend" id="live-trend">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>trend</Code> also takes <Code>true</Code>, and then the tile keeps its own history — every
		numeric value it is handed is recorded and plotted, newest sample pulsing. It starts empty and
		fills in, because it can only plot what it has seen; pass the snippet form where the history
		predates the tile.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Requests" value={requests} unit="req" trend />
		<Stat label="Tempo" value={tempo} unit="BPM" pad={3} trend trendLength={12} />
	</div>
</Card>

<Card title="With a trend" id="trend">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>trend</Code> snippet takes a <Code>Sparkline</Code> — where the number got to, under the
		number itself. <Code>tone="trend"</Code> colours the line by whether it ends above or below where
		it started, which assumes up is good; where it isn't, pass the tone explicitly so the line and the
		delta don't contradict each other.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Signups" value={41} delta={18} deltaLabel="vs last week">
			{#snippet trend()}
				<Sparkline data={series} width={96} height={24} tone="trend" dot />
			{/snippet}
		</Stat>
		<Stat
			label="Latency"
			value={128}
			unit="ms"
			delta={-9}
			goodDirection="down"
			deltaLabel="vs last hour"
		>
			{#snippet trend()}
				<Sparkline data={[...series].reverse()} width={96} height={24} tone="success" dot />
			{/snippet}
		</Stat>
	</div>
</Card>

<Card title="Live values" id="live">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A numeric <Code>value</Code> animates its changes by default — these four are driven by an interval,
		and the last rolls digit wheels instead of re-counting. Mounting never animates, only a change does,
		so a tile that never moves costs nothing. Pass <Code>animate={false}</Code> to opt out, or a <Code
			>string</Code
		> value crossfades to its new text instead of counting to it.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Requests" value={requests} unit="req" icon="Activity" />
		<Stat label="Tempo" value={tempo} unit="BPM" />
		<Stat label="Tempo, padded" value={tempo} unit="BPM" pad={3} />
		<Stat label="Odometer" value={tempo} unit="BPM" mode="odometer" pad={3} />
		<Stat label="Key" value={KEYS[keyIndex]} icon="Music" />
	</div>
</Card>

<Card title="Padding the width" id="pad">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		An animated number is only as wide as its digits, so a counter crossing a power of ten steps its
		own width and shoves whatever sits beside it. <Code>pad</Code> declares the digit count up front and
		dims the zeros holding it open — the number still reads as itself, the box stops moving, and on the
		odometer the leading wheel rolls from a dim <Code>0</Code> to a live
		<Code>1</Code>.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Unpadded" value={7} unit="ms" />
		<Stat label="Pad 2" value={7} unit="ms" pad={2} />
		<Stat label="Pad 4" value={7} unit="ms" pad={4} />
	</div>
</Card>

<Card title="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>sm</Code> fits a toolbar or a table cell; <Code>md</Code> is the dashboard tier;
		<Code>lg</Code> is the one figure a view leads with — use it once per screen.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat size="sm" label="Small" value="1,284" unit="req" />
		<Stat size="md" label="Medium" value="1,284" unit="req" />
		<Stat size="lg" label="Large" value="1,284" unit="req" delta={7} deltaLabel="vs last hour" />
	</div>
</Card>

<Card title="Plain" id="plain">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>variant="plain"</Code> drops the frame, for a row of stats inside a card that is already a box.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 2.5rem; flex-wrap: wrap;">
		<Stat variant="plain" label="Requests" value="2.4M" delta={6} />
		<Stat variant="plain" label="Errors" value="1,204" delta={-14} goodDirection="down" />
		<Stat variant="plain" label="p95" value={212} unit="ms" delta={3} goodDirection="down" />
	</div>
</Card>

<Card title="Custom value" id="custom-value">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Children replace <Code>value</Code> for anything a string can't carry — here an
		<Code>AnimatedNumber</Code>, with <Code>tabular</Code> on so the digits don't reflow their neighbours
		as they roll.
	</Text>
	<div style="display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
		<Stat label="Tempo" unit="BPM" tabular>
			<AnimatedNumber value={128} mode="odometer" />
		</Stat>
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Stat, Sparkline } from 'glow';
<\/script>

<!-- Value and unit -->
<Stat value={128} unit="BPM" />

<!-- Labelled, with a delta -->
<Stat label="Revenue" value="$48.2K" delta={12} deltaLabel="vs last month" />

<!-- Down is the good direction -->
<Stat label="Error rate" value="0.42" unit="%" delta={-31} goodDirection="down" />

<!-- With a trend -->
<Stat label="Signups" value={41} delta={18}>
  {#snippet trend()}
    <Sparkline data={series} width={96} height={24} tone="trend" dot />
  {/snippet}
</Stat>

<!-- Numbers animate their changes by default; pad fixes the width -->
<Stat label="Tempo" value={bpm} unit="BPM" pad={3} />

<!-- Custom value content -->
<Stat label="Tempo" unit="BPM" tabular>
  <AnimatedNumber value={bpm} mode="odometer" />
</Stat>`}
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
			{
				prop: 'label',
				type: 'string',
				default: '-',
				description: 'Caption above the value. Sentence case, no trailing colon'
			},
			{
				prop: 'value',
				type: 'string | number',
				default: '-',
				description: 'The figure itself; children override it'
			},
			{
				prop: 'children',
				type: 'Snippet',
				default: '-',
				description: 'Custom value content, for anything a string cannot carry'
			},
			{
				prop: 'unit',
				type: 'string',
				default: '-',
				description: 'Trailing unit, set small and uppercase'
			},
			{ prop: 'icon', type: 'IconProp', default: '-', description: 'Lucide icon before the value' },
			{
				prop: 'animate',
				type: 'boolean',
				default: 'true',
				description: 'Animate changes to a numeric value; mounting never animates'
			},
			{
				prop: 'format',
				type: 'Intl.NumberFormat | ((n: number) => string)',
				default: 'pinned decimals',
				description: 'Formats an animated numeric value'
			},
			{
				prop: 'mode',
				type: "'tween' | 'odometer'",
				default: "'tween'",
				description: 'How an animated value moves: re-formatted each frame, or digit wheels'
			},
			{
				prop: 'pad',
				type: 'number',
				default: '-',
				description: 'Minimum integer digits, zero-padded and dimmed, so the width never steps'
			},
			{
				prop: 'delta',
				type: 'number',
				default: '-',
				description: 'Signed change; 0 renders flat rather than as good news'
			},
			{
				prop: 'deltaLabel',
				type: 'string',
				default: '-',
				description: 'What the delta is measured against'
			},
			{
				prop: 'goodDirection',
				type: "'up' | 'down' | 'none'",
				default: "'up'",
				description: 'Which direction earns the success colour'
			},
			{
				prop: 'formatDelta',
				type: '(delta: number) => string',
				default: 'signed %',
				description: 'Formats the delta'
			},
			{
				prop: 'trend',
				type: 'Snippet | true',
				default: '-',
				description: 'true plots the values this tile has seen; a snippet draws your own'
			},
			{
				prop: 'trendLength',
				type: 'number',
				default: '24',
				description: 'Samples a trend={true} sparkline keeps'
			},
			{
				prop: 'tabular',
				type: 'boolean',
				default: 'false',
				description: 'Fixed-width digits, for aligned columns or a live-updating value'
			},
			{
				prop: 'size',
				type: "'sm' | 'md' | 'lg'",
				default: "'md'",
				description: 'Toolbar, dashboard, or hero tier'
			},
			{
				prop: 'variant',
				type: "'surface' | 'plain'",
				default: "'surface'",
				description: 'Bordered capsule, or no frame'
			},
			{ prop: 'class', type: 'string', default: '-', description: 'Extra class on the root' },
			{ prop: 'style', type: 'string', default: '-', description: 'Inline style on the root' }
		]}
	/>
</Card>
