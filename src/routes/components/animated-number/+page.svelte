<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import AnimatedNumber from '$lib/animated-number/AnimatedNumber.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	const currency = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
	const percent = new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});

	let basic = $state(1204);
	let roll = $state(48219);
	let price = $state(1284.5);

	let revenue = $state(48213.75);
	let sessions = $state(12480);
	let conversion = $state(0.0342);

	function shuffle() {
		basic = Math.round(200 + Math.random() * 9800);
	}

	function tick() {
		roll += Math.round(1 + Math.random() * 400);
	}

	function reprice() {
		price = Math.round((600 + Math.random() * 1800) * 100) / 100;
	}

	function refresh() {
		revenue = Math.round((10000 + Math.random() * 90000) * 100) / 100;
		sessions = Math.round(2000 + Math.random() * 40000);
		conversion = Math.round(Math.random() * 900) / 10000;
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Animated Number | Glow UI</title></svelte:head>

<Heading level={1}>Animated Number</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A number that moves to its new value instead of cutting to it — the metric on a dashboard, the
	total on a cart, the price on a ticker. It is a display, not a control: for work with a known size
	reach for <Link href="/components/progress">Progress</Link>, and for a figure that never changes use
	plain text.
</Text>

<Card title="Tween" id="tween">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default mode. The whole number is re-formatted every frame as the value eases across, so it
		reads as one figure counting. Press the button repeatedly: a new value retargets from wherever
		the count currently is rather than snapping back to the start.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		<Heading level={2} style="margin: 0;">
			<AnimatedNumber value={basic} locale="en-US" />
		</Heading>
		<Button variant="secondary" label="New value" onclick={shuffle} />
	</Flex>
</Card>

<Card title="Odometer" id="odometer">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>mode="odometer"</Code> gives every digit its own wheel. Each wheel travels its own short
		distance rather than the whole numeric gap, so a jump of 400 rolls the units digit once, not
		forty times — a literal odometer would strobe. A carry rolls in the direction the number is
		moving, so 9 → 0 on a rising count goes forwards through the wrap.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		<Heading level={2} style="margin: 0;">
			<AnimatedNumber value={roll} mode="odometer" locale="en-US" />
		</Heading>
		<Button variant="secondary" label="Advance" onclick={tick} />
	</Flex>
</Card>

<Card title="Formatting" id="formatting">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>format</Code> takes an <Code>Intl.NumberFormat</Code> — currency, percent, compact — or a
		plain <Code>(value) =&gt; string</Code>. Without one, the default formatter pins its fraction
		digits to the ones the target value has, so a whole number counts whole and <Code>4.5</Code>
		keeps exactly one decimal all the way.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center" style="flex-wrap: wrap;">
		<Heading level={3} style="margin: 0;">
			<AnimatedNumber value={price} format={currency} mode="odometer" />
		</Heading>
		<Heading level={3} style="margin: 0;">
			<AnimatedNumber value={sessions} format={compact} />
		</Heading>
		<Heading level={3} style="margin: 0;">
			<AnimatedNumber value={conversion} format={percent} />
		</Heading>
		<Heading level={3} style="margin: 0;">
			<AnimatedNumber value={price} format={(v) => `${Math.round(v)} req/s`} />
		</Heading>
		<Button variant="secondary" label="Reprice" onclick={reprice} />
	</Flex>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		Odometer needs <Code>formatToParts</Code> to know which digit sits in which place, so it only
		works with an <Code>Intl.NumberFormat</Code>. Give it a function instead and it falls back to
		<Code>tween</Code> rather than rolling the wrong digits. The default formatter follows the
		runtime's locale; the examples on this page pass <Code>locale="en-US"</Code> so they read the
		same wherever you open them.
	</Text>
</Card>

<Card title="On a dashboard" id="dashboard">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Three tiles, one refresh. The digits are <Code>tabular-nums</Code> and each number reserves the
		width of the widest of the two values it sits between, so nothing beside them shifts while they
		count — the tiles hold still even when a figure gains a thousands separator.
	</Text>
	<div class="tiles">
		<div class="tile">
			<Text size="sm" variant="secondary">Revenue</Text>
			<div class="figure">
				<AnimatedNumber value={revenue} format={currency} mode="odometer" />
			</div>
		</div>
		<div class="tile">
			<Text size="sm" variant="secondary">Sessions</Text>
			<div class="figure"><AnimatedNumber value={sessions} locale="en-US" /></div>
		</div>
		<div class="tile">
			<Text size="sm" variant="secondary">Conversion</Text>
			<div class="figure"><AnimatedNumber value={conversion} format={percent} /></div>
		</div>
	</div>
	<Button variant="secondary" label="Refresh" onclick={refresh} style="margin-top: 1rem;" />
</Card>

<Card title="Alignment" id="alignment">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The reserved box is wider than the number whenever the previous value was longer.
		<Code>align</Code> says where the number sits in it — <Code>end</Code> is what you want in a
		right-aligned table column, where the last digit has to stay in its column.
	</Text>
	<div class="rows">
		{#each [12, 4820, 137, 98216] as n (n)}
			<div class="row">
				<Text size="sm" variant="secondary">Row {n % 7}</Text>
				<AnimatedNumber value={n} align="end" locale="en-US" class="cell" />
			</div>
		{/each}
	</div>
</Card>

<Card title="Motion and reduced motion" id="motion">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>duration</Code> defaults to 800ms — longer than any <Code>--glow-dur-*</Code>, which top
		out at 500ms for a page-level reveal, because a count has to stay readable while it runs.
		<Code>easing</Code> takes any function from <Code>svelte/easing</Code>; the default is
		<Code>cubicOut</Code>, the curve <Code>--glow-ease-out</Code> describes.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center" style="flex-wrap: wrap;">
		<AnimatedNumber value={basic} duration={300} locale="en-US" />
		<AnimatedNumber value={basic} duration={800} locale="en-US" />
		<AnimatedNumber value={basic} duration={2000} locale="en-US" />
		<Button variant="secondary" label="Run" onclick={shuffle} />
	</Flex>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		Under <Code>prefers-reduced-motion: reduce</Code> the number snaps straight to its value. It
		does not run fast: this animation is decoration and the number is the content, so a
		motion-sensitive reader simply gets the number. The animation is driven from JS, so it can't
		ride the token collapse that the CSS-driven parts of the library use — the component reads the
		media query itself, and follows it if it changes mid-session.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { AnimatedNumber } from 'glow';

  let total = $state(0);

  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
<\/script>

<!-- counts to whatever you set it to, from wherever it currently is -->
<AnimatedNumber value={total} />

<!-- digit wheels; needs an Intl.NumberFormat to know the places -->
<AnimatedNumber value={total} mode="odometer" format={usd} />

<!-- a function format is fine, but pins the mode to tween -->
<AnimatedNumber value={total} format={(v) => \`\${Math.round(v)} req/s\`} />

<!-- right-aligned in a table column, and announced once it settles -->
<AnimatedNumber value={total} align="end" live />`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		The animated digits are <Code>aria-hidden</Code>. The value is exposed once, as visually hidden
		text that changes when <Code>value</Code> does — not once per frame — so a screen reader reads
		"1,204", never a stream of every number in between. <Code>live</Code> adds
		<Code>aria-live="polite"</Code> to that text for the case where the change is news; leave it off
		for a figure that ticks on its own, which would otherwise interrupt continuously. The component
		is not focusable and takes no input, so there is nothing to operate by keyboard. Reduced motion
		is honoured by snapping, and colour is inherited from whatever the number sits in, so it carries
		its container's contrast.
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
			{ prop: 'value', type: 'number', default: '—', description: 'The number to show. Required.' },
			{ prop: 'duration', type: 'number', default: '800', description: 'Milliseconds for a full run. Ignored under reduced motion.' },
			{ prop: 'easing', type: '(t: number) => number', default: 'cubicOut', description: 'Any easing from svelte/easing.' },
			{ prop: 'format', type: 'Intl.NumberFormat | (value) => string', default: 'Intl.NumberFormat matching the target’s decimals', description: 'How the number is written. Odometer needs the Intl form.' },
			{ prop: 'mode', type: "'tween' | 'odometer'", default: 'tween', description: 'Re-format each frame, or roll each digit on its own wheel.' },
			{ prop: 'locale', type: 'string', default: '—', description: 'Locale for the default formatter.' },
			{ prop: 'align', type: "'start' | 'center' | 'end'", default: 'start', description: 'Where the number sits inside its reserved box.' },
			{ prop: 'live', type: 'boolean', default: 'false', description: 'Announce the settled value with aria-live="polite".' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: $space-md;
	}

	.tile {
		padding: $space-md;
		border: $border;
		border-radius: $radius;
		background: var(--glow-bg-surface-element);
	}

	.figure {
		margin-top: $space-xs;
		font-size: $h4;
		font-weight: $weight-semibold;
		font-family: $font-family-header;
	}

	.rows {
		display: grid;
		gap: $space-xs;
		max-width: 320px;
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: $space-md;
		padding: $space-xs $space-sm;
		border-radius: $radius-lg;
		background: var(--glow-state-hover);
	}

	.row :global(.cell) {
		font-weight: $weight-semibold;
	}
</style>
