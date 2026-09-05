<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Progress from '$lib/progress/Progress.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	let uploaded = $state(38);
	let running = $state(false);

	function runUpload() {
		if (running) return;
		running = true;
		uploaded = 0;
		const tick = setInterval(() => {
			uploaded = Math.min(100, uploaded + 4);
			if (uploaded >= 100) {
				clearInterval(tick);
				running = false;
			}
		}, 120);
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Progress | Glow UI</title></svelte:head>

<Heading level={1}>Progress</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A read-only meter for work whose size you know. Reach for a
	<Link href="/components/spinner">Spinner</Link> when you don't know how much is left, and for
	<Link href="/components/inputs">RangeInput</Link> when the number is the user's to change —
	Progress reports, it never accepts input.
</Text>

<Card title="Linear" id="linear">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default. Fills its container, so it sits happily above a list or at the foot of a card.
		<Code>value</Code> is measured against <Code>max</Code>, which defaults to 100.
	</Text>
	<Flex gap="md">
		<Progress value={12} />
		<Progress value={48} />
		<Progress value={91} />
	</Flex>
</Card>

<Card title="Circular" id="circular">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The same component with <Code>variant="circular"</Code> — for tight spots where a full-width bar
		has nowhere to go, like a table cell or a toolbar. The readout is on by default here, because a
		ring is hard to read to the percent — except at <Code>sm</Code>, where it wouldn't fit inside
		the ring.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		<Progress variant="circular" value={12} />
		<Progress variant="circular" value={48} />
		<Progress variant="circular" value={91} />
		<Progress variant="circular" value={64} label="Indexing" />
	</Flex>
</Card>

<Card title="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>sm</Code>, <Code>md</Code>, <Code>lg</Code> — 4/8/12px of track, 32/48/64px of ring. The
		ring's stroke thins as it grows so the three read as one family rather than three weights.
	</Text>
	<Flex gap="md">
		<Progress size="sm" value={62} />
		<Progress size="md" value={62} />
		<Progress size="lg" value={62} />
	</Flex>
	<Flex direction="horizontal" gap="lg" align="center" style="margin-top: 1.5rem;">
		<Progress variant="circular" size="sm" value={62} />
		<Progress variant="circular" size="md" value={62} />
		<Progress variant="circular" size="lg" value={62} />
	</Flex>
</Card>

<Card title="Tones" id="tones">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>tone</Code> maps onto the semantic colour tokens: use it to say the job finished, is
		degrading, or is about to hit a limit. Colour is never the only signal — pair it with the label.
	</Text>
	<Flex gap="md">
		<Progress value={100} tone="success" label="Backup complete" showValue />
		<Progress value={82} tone="warning" label="Storage used" showValue />
		<Progress value={96} tone="danger" label="Quota" showValue />
	</Flex>
	<Flex direction="horizontal" gap="lg" align="center" style="margin-top: 1.5rem;">
		<Progress variant="circular" value={100} tone="success" />
		<Progress variant="circular" value={82} tone="warning" />
		<Progress variant="circular" value={96} tone="danger" />
	</Flex>
</Card>

<Card title="Indeterminate" id="indeterminate">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Leave <Code>value</Code> off — or pass <Code>indeterminate</Code> — when the work has started but
		its size isn't known yet. The bar loops, and <Code>aria-valuenow</Code> is omitted rather than
		faked at zero. Under <Code>prefers-reduced-motion</Code> the loop is replaced by a dimmed static
		fill instead of running at the collapsed token duration.
	</Text>
	<Flex gap="md">
		<Progress label="Connecting" />
		<Progress size="sm" tone="warning" />
	</Flex>
	<Flex direction="horizontal" gap="lg" align="center" style="margin-top: 1.5rem;">
		<Progress variant="circular" indeterminate />
		<Progress variant="circular" size="lg" indeterminate label="Scanning" />
	</Flex>
</Card>

<Card title="Labels and readouts" id="labels">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>label</Code> names the bar for both sighted and assistive users. <Code>showValue</Code>
		adds the numeric readout, and <Code>format</Code> replaces it — the formatted string also becomes
		<Code>aria-valuetext</Code>, so "3 of 8 files" is what gets announced rather than "3".
	</Text>
	<Flex gap="md">
		<Progress value={57} label="Rendering" showValue />
		<Progress
			value={3}
			max={8}
			label="Uploading files"
			format={(v, m) => `${v} of ${m} files`}
			showValue
		/>
		<Progress
			value={1400}
			max={2048}
			tone="warning"
			label="Disk"
			format={(v, m) => `${v} MB / ${m} MB`}
			showValue
		/>
	</Flex>
</Card>

<Card title="Counting up" id="live">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The readout is <Code>tabular-nums</Code>, so the digits hold their columns instead of jittering
		as they tick. The fill eases between values on <Code>--glow-dur-base</Code>.
	</Text>
	<Button
		variant="secondary"
		label={running ? 'Uploading…' : 'Start upload'}
		disabled={running}
		onclick={runUpload}
		style="margin-bottom: 1rem;"
	/>
	<Flex direction="horizontal" gap="lg" align="center">
		<div style="flex: 1;">
			<Progress
				value={uploaded}
				label="build.tar.gz"
				showValue
				tone={uploaded === 100 ? 'success' : 'primary'}
			/>
		</div>
		<Progress
			variant="circular"
			size="lg"
			value={uploaded}
			tone={uploaded === 100 ? 'success' : 'primary'}
		/>
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Progress } from 'glow';

  let done = $state(0);
<\/script>

<!-- determinate -->
<Progress value={done} label="Uploading" showValue />

<!-- a scale that isn't a percentage: format also becomes aria-valuetext -->
<Progress value={3} max={8} format={(v, m) => \`\${v} of \${m} files\`} showValue />

<!-- indeterminate: no value, no aria-valuenow -->
<Progress label="Connecting" />

<!-- circular, for tight spots -->
<Progress variant="circular" size="sm" value={done} tone="success" />`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		The track carries <Code>role="progressbar"</Code> with <Code>aria-valuemin</Code>,
		<Code>aria-valuemax</Code> and <Code>aria-valuenow</Code>. Indeterminate omits
		<Code>aria-valuenow</Code> entirely — that is what tells a screen reader the amount is unknown,
		and a placeholder zero would instead announce "0 percent" forever.
		<Code>aria-valuetext</Code> is added wherever a bare number would be meaningless: whenever
		<Code>format</Code> is given, and whenever the range isn't 0–100. A <Code>label</Code> is wired
		up with <Code>aria-labelledby</Code>, so the visible text and the accessible name can't drift
		apart; without one, give the element an <Code>aria-label</Code> of your own via
		<Code>class</Code>/wrapper markup. The bar is not focusable — it takes no input, so there is
		nothing to operate.
	</Text>
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
			{ prop: 'value', type: 'number', default: '—', description: 'Work done. Omitted → indeterminate.' },
			{ prop: 'min', type: 'number', default: '0', description: 'Bottom of the scale.' },
			{ prop: 'max', type: 'number', default: '100', description: 'Top of the scale.' },
			{ prop: 'indeterminate', type: 'boolean', default: 'false', description: 'Force the loop even when a value is given.' },
			{ prop: 'variant', type: "'linear' | 'circular'", default: 'linear', description: 'Full-width bar, or a ring.' },
			{ prop: 'size', type: "'sm' | 'md' | 'lg'", default: 'md', description: '4/8/12px track, 32/48/64px ring.' },
			{ prop: 'tone', type: "'primary' | 'success' | 'warning' | 'danger'", default: 'primary', description: 'Semantic colour, from the --glow-color-* tokens.' },
			{ prop: 'label', type: 'string', default: '—', description: 'Visible label, and the accessible name.' },
			{ prop: 'showValue', type: 'boolean', default: 'true for circular (not sm)', description: 'Show the numeric readout.' },
			{ prop: 'format', type: '(value, max) => string', default: '—', description: 'Custom readout; also becomes aria-valuetext.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>
</Card>
