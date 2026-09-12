<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import AnimatedValue from '$lib/animated-value/AnimatedValue.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	const KEYS = ['D♭ major', 'A minor', 'F major', 'B♭ minor'];
	const STATUSES = ['Healthy', 'Degraded', 'Recovering'];

	let count = $state(1284);
	let keyIndex = $state(0);
	let statusIndex = $state(0);
	let mixed = $state<string | number>(42);
	let padded = $state(96);

	$effect(() => {
		const id = setInterval(() => {
			count += Math.floor(Math.random() * 40) + 5;
			keyIndex = (keyIndex + 1) % KEYS.length;
			// Walks across 100 deliberately: that carry is what `pad` is for.
			padded = padded >= 104 ? 92 : padded + Math.floor(Math.random() * 4) + 1;
		}, 1800);
		return () => clearInterval(id);
	});
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Animated Value | Glow UI</title></svelte:head>

<Heading level={1}>Animated Value</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	One value, animated when it changes — whatever it is. A number counts to its new value, a string
	crossfades to it. Neither animates on mount, so a figure that never moves costs nothing and a page
	does not perform on load.
</Text>

<Card title="Both paths" id="both">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The split is on the runtime type of <Code>value</Code>, so a figure that is sometimes a number
		and sometimes a dash needs no branch at the call site. These are driven by an interval.
	</Text>
	<div
		style="display: flex; align-items: baseline; gap: 2.5rem; flex-wrap: wrap; font-size: 1.75rem; font-weight: 700;"
	>
		<AnimatedValue value={count} />
		<AnimatedValue value={KEYS[keyIndex]} />
	</div>
</Card>

<Card title="Why not a typewriter" id="why-not-typewriter">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A string here <em>crossfades</em>; it is not revealed character by character. Revealing is what <Code
			>Typewriter</Code
		> is for, and the two are answers to different events: text
		<em>arriving</em> — a model streaming a reply — versus a value <em>changing</em>. Typing out a
		status that just flipped reads as slower, not clearer, and it re-types every time.
	</Text>
	<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
		<Button
			label="Change status"
			size="sm"
			variant="secondary"
			onclick={() => {
				statusIndex = (statusIndex + 1) % STATUSES.length;
			}}
		/>
		<span style="font-size: 1.5rem; font-weight: 700;">
			<AnimatedValue value={STATUSES[statusIndex]} />
		</span>
	</div>
</Card>

<Card title="Switching type" id="switching">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A value that crosses between the two paths is the case this component exists for — a metric that
		is a number when it has data and <Code>'—'</Code> when it does not.
	</Text>
	<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
		<Button
			label="Toggle"
			size="sm"
			variant="secondary"
			onclick={() => {
				mixed = typeof mixed === 'number' ? '—' : Math.floor(Math.random() * 90) + 10;
			}}
		/>
		<span style="font-size: 1.5rem; font-weight: 700;">
			<AnimatedValue value={mixed} />
		</span>
	</div>
</Card>

<Card title="Number-only props" id="number-props">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>format</Code>, <Code>mode</Code>, <Code>pad</Code>, <Code>locale</Code> and
		<Code>align</Code> pass through to the underlying <Code>AnimatedNumber</Code> — still exported for
		the rare case you know you have a number and want it directly — and do nothing for a string, which
		has no digits to format, pad or roll. Here <Code>pad={3}</Code> holds the width across the carry at
		100, and the dimmed zero lights up to full ink as the count arrives.
	</Text>
	<div
		style="display: flex; align-items: baseline; gap: 2.5rem; flex-wrap: wrap; font-size: 1.75rem; font-weight: 700;"
	>
		<AnimatedValue value={padded} pad={3} />
		<AnimatedValue value={padded} pad={3} mode="odometer" />
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { AnimatedValue } from 'glow';

  let bpm = $state(96);
  let key = $state('D♭ major');
<\/script>

<!-- Counts to the new number -->
<AnimatedValue value={bpm} />

<!-- Crossfades to the new string -->
<AnimatedValue value={key} />

<!-- Number-only options pass through to AnimatedNumber -->
<AnimatedValue value={bpm} pad={3} mode="odometer" />

<!-- Either type, no branch at the call site -->
<AnimatedValue value={hasData ? total : '—'} />`}
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
				prop: 'value',
				type: 'string | number',
				default: '-',
				description: 'Numbers count, strings crossfade'
			},
			{
				prop: 'duration',
				type: 'number',
				default: '800',
				description: 'Milliseconds for a change, shared by both paths'
			},
			{
				prop: 'format',
				type: 'Intl.NumberFormat | ((n: number) => string)',
				default: 'pinned decimals',
				description: 'Numbers only'
			},
			{
				prop: 'mode',
				type: "'tween' | 'odometer'",
				default: "'tween'",
				description: 'Numbers only — re-format each frame, or digit wheels'
			},
			{
				prop: 'pad',
				type: 'number',
				default: '-',
				description: 'Numbers only — minimum integer digits, zero-padded and dimmed'
			},
			{
				prop: 'locale',
				type: 'string',
				default: 'ambient',
				description: 'Numbers only — locale for the default formatter'
			},
			{
				prop: 'align',
				type: "'start' | 'center' | 'end'",
				default: "'start'",
				description: 'Numbers only — where the value sits in its reserved box'
			},
			{
				prop: 'live',
				type: 'boolean',
				default: 'false',
				description: 'Announce the settled value to assistive tech'
			},
			{ prop: 'class', type: 'string', default: '-', description: 'Extra class on the root' },
			{ prop: 'style', type: 'string', default: '-', description: 'Inline style on the root' }
		]}
	/>
</Card>
