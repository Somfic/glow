<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Calendar, {
		type CalendarDay,
		type CalendarValue,
		type DateRange
	} from '$lib/calendar/Calendar.svelte';
	import Input from '$lib/input/Input.svelte';
	import Link from '$lib/typography/Link.svelte';

	// A fixed month everywhere below, so the docs (and the screenshots taken of
	// them) show the same calendar regardless of when they're opened.
	const demoMonth = '2026-03';

	let single = $state<CalendarValue>('2026-03-12');
	let multiple = $state<CalendarValue>(['2026-03-04', '2026-03-05', '2026-03-17']);
	let range = $state<CalendarValue>({ start: '2026-03-09', end: '2026-03-20' });
	let bounded = $state<CalendarValue>('2026-03-18');
	let decorated = $state<CalendarValue>('2026-03-11');
	// The field's value never goes null — an empty single date is '' — so these are
	// typed without it, which is what `<Input type="date">` accepts.
	let picked = $state<string | string[] | DateRange>('2026-03-12');
	let pickedRange = $state<string | string[] | DateRange>({ start: '2026-03-09', end: '2026-03-14' });
	let pickedMany = $state<string | string[] | DateRange>([]);

	// Weekends are unavailable in the "bounds" demo.
	const noWeekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

	// Pretend event data for the decoration demo.
	const events: Record<string, number> = {
		'2026-03-05': 1,
		'2026-03-11': 3,
		'2026-03-12': 2,
		'2026-03-19': 1,
		'2026-03-26': 2
	};

</script>

{#snippet code(value: string)}
	<Code>{value}</Code>
{/snippet}

{#snippet dots(day: CalendarDay)}
	{#if events[day.iso]}
		<span class="dots">
			{#each { length: events[day.iso] }, i (i)}
				<span class="dot"></span>
			{/each}
		</span>
	{/if}
{/snippet}

<svelte:head><title>Calendar | Glow UI</title></svelte:head>

<Heading level={1}>Calendar</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A themeable month grid: one day, a set of days, or a range. Use it inline, as below — and when
	you want it as a form control, it is what <Link href="/components/inputs#date-input"
		><Code>Input type="date"</Code></Link
	> opens, so there is one grid in the library rather than one per field.
</Text>

<Card title="Single date" id="single">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default mode. <Code>value</Code> is an ISO <Code>YYYY-MM-DD</Code> string, bindable. The
		grid is one tab stop: arrow keys move the selection, not the tab order.
	</Text>
	<Calendar bind:value={single} month={demoMonth} />
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Selected: <Code>{single ?? 'null'}</Code>
	</Text>
</Card>

<Card title="Multiple dates" id="multiple">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>mode="multiple"</Code> collects a sorted array. Clicking a selected day removes it.
	</Text>
	<Calendar mode="multiple" bind:value={multiple} month={demoMonth} />
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Selected: <Code>{JSON.stringify(multiple)}</Code>
	</Text>
</Card>

<Card title="Range" id="range">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>mode="range"</Code> holds <Code>{'{ start, end }'}</Code>. The first click opens the
		range and writes <Code>{'{ start, end: null }'}</Code> straight through, so a caller can see
		that a selection is half-made; hovering — or arrow-keying — previews the span at half strength
		with a dashed edge until the second click commits it. Picking a second day <em>before</em> the
		start swaps the two rather than throwing the click away, and
		<Kbd>Esc</Kbd> abandons a half-made range.
	</Text>
	<Calendar mode="range" bind:value={range} month={demoMonth} />
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Selected: <Code
			>{(range as DateRange).start ?? 'null'} → {(range as DateRange).end ?? 'null'}</Code
		>
	</Text>
</Card>

<Card title="Bounds and unavailable days" id="bounds">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>min</Code> / <Code>max</Code> fence the selectable span and disable the navigation that
		would leave it. <Code>isDateDisabled</Code> is a predicate over every rendered day — here it
		blocks weekends. Disabled days keep their place in the grid and stay arrow-reachable
		(<Code>aria-disabled</Code>, not <Code>disabled</Code>) so keyboard navigation never hits a
		hole.
	</Text>
	<Calendar
		bind:value={bounded}
		month={demoMonth}
		min="2026-03-03"
		max="2026-03-27"
		isDateDisabled={noWeekends}
	/>
</Card>

<Card title="Week start and locale" id="locale">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Month and weekday names come from <Code>Intl.DateTimeFormat</Code>, so a
		<Code>locale</Code> is all it takes to translate the whole header.
		<Code>weekStart</Code> is separate on purpose — it is a regional convention, not a language
		one, and no browser API reports it reliably. Monday (1) is the default;
		<Code>{'weekStart={0}'}</Code> for en-US. <Code>showWeekNumbers</Code> adds the ISO-8601 week
		column.
	</Text>
	<Flex direction="horizontal" gap="lg" wrap>
		<Calendar month={demoMonth} locale="en-US" weekStart={0} value="2026-03-12" />
		<Calendar month={demoMonth} locale="nl-NL" weekStart={1} showWeekNumbers value="2026-03-12" />
	</Flex>
</Card>

<Card title="Day decoration" id="decoration">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>decoration</Code> snippet renders under the day number and receives the cell's whole
		state — dot a day that has events, price a night, badge a deadline.
	</Text>
	<Calendar bind:value={decorated} month={demoMonth} decoration={dots} />
</Card>

<Card title="As a form control" id="form-control">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>{'<Input type="date">'}</Code> is this calendar in a <Code>Popover</Code>. It takes the
		same <Code>mode</Code>, <Code>min</Code>/<Code>max</Code>, <Code>isDateDisabled</Code>,
		<Code>weekStart</Code>, <Code>locale</Code> and <Code>decoration</Code> props. Focus moves into
		the grid when it opens and back to the field when it closes; it closes on a complete answer —
		one day, or both ends of a range — and never in <Code>multiple</Code> mode, where there is no
		way to know the user is finished.
	</Text>
	<Flex direction="horizontal" gap="md" wrap>
		<div class="control"><Input type="date" value={picked} onChange={(v) => (picked = v)} clearable /></div>
		<div class="control wide">
			<Input
				type="date"
				mode="range"
				value={pickedRange}
				onChange={(v) => (pickedRange = v)}
				placeholder="Select range"
				clearable
			/>
		</div>
		<div class="control">
			<Input
				type="date"
				mode="multiple"
				value={pickedMany}
				onChange={(v) => (pickedMany = v)}
				placeholder="Select days"
				clearable
			/>
		</div>
	</Flex>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Full props for the field live on the <Link href="/components/inputs#date-input">Input</Link> page.
	</Text>
</Card>

<Card title="Keyboard" id="keyboard">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The grid is a <Code>role="grid"</Code> with a roving tabindex: one tab stop for 42 days, which
		is what the WAI-ARIA grid pattern asks for and what keeps a calendar out of the way of the
		rest of a form.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'keys', label: 'Keys' },
			{ key: 'does', label: 'Moves' }
		]}
		data={[
			{ keys: '← →', does: 'Previous / next day' },
			{ keys: '↑ ↓', does: 'Same weekday, previous / next week' },
			{ keys: 'Home / End', does: 'First / last day of the focused week' },
			{ keys: 'PageUp / PageDown', does: 'Previous / next month' },
			{ keys: 'Shift + PageUp / PageDown', does: 'Previous / next year' },
			{ keys: 'Enter / Space', does: 'Select the focused day' },
			{ keys: 'Esc', does: 'Abandon a half-made range' }
		]}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Arrowing off the edge of the month follows into the next one, and the range preview tracks the
		keyboard as well as the pointer — otherwise a keyboard user picks the second endpoint blind.
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Calendar, Input, type DateRange } from 'glow';

  let day = $state<string | null>(null);
  let stay = $state<DateRange>({ start: null, end: null });

  const bookedOut = (d: Date) => d.getDay() === 0;
<\/script>

<!-- Inline, single date -->
<Calendar bind:value={day} min="2026-01-01" max="2026-12-31" />

<!-- As a form control, a range, en-US weeks -->
<Input
  type="date"
  mode="range"
  bind:value={stay}
  weekStart={0}
  locale="en-US"
  isDateDisabled={bookedOut}
  clearable
/>

<!-- A dot on any day that has events -->
<Calendar bind:value={day}>
  {#snippet decoration(cell)}
    {#if events[cell.iso]}<span class="dot"></span>{/if}
  {/snippet}
</Calendar>`}
	/>
</Card>

<Card title="Props" id="props">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Calendar</Code>. <Code>{'<Input type="date">'}</Code> forwards all of these except
		<Code>month</Code>, <Code>fixedWeeks</Code> and <Code>yearNav</Code>, and adds the field's own
		<Code>placeholder</Code>, <Code>disabled</Code>, <Code>clearable</Code> and
		<Code>format</Code>.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: code },
			{ key: 'type', label: 'Type', render: code },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'mode', type: "'single' | 'multiple' | 'range'", default: 'single', description: 'What a selection is.' },
			{ prop: 'value', type: 'string | string[] | DateRange | null', default: 'null', description: 'Bindable selection; shape follows mode. ISO YYYY-MM-DD throughout.' },
			{ prop: 'month', type: 'string', default: 'selection, else today', description: 'Bindable displayed month, YYYY-MM.' },
			{ prop: 'min', type: 'string', default: '—', description: 'Earliest selectable day.' },
			{ prop: 'max', type: 'string', default: '—', description: 'Latest selectable day.' },
			{ prop: 'isDateDisabled', type: '(date: Date) => boolean', default: '—', description: 'Per-day predicate; true makes the day unselectable.' },
			{ prop: 'weekStart', type: '0 | 1 | … | 6', default: '1', description: 'First column of the grid. 0 = Sunday.' },
			{ prop: 'locale', type: 'string', default: 'browser', description: 'BCP-47 tag for month and weekday names.' },
			{ prop: 'showWeekNumbers', type: 'boolean', default: 'false', description: 'Leading ISO-8601 week number column.' },
			{ prop: 'fixedWeeks', type: 'boolean', default: 'true', description: 'Always six rows, so the grid never changes height between months.' },
			{ prop: 'yearNav', type: 'boolean', default: 'true', description: 'Show the year buttons beside the month ones.' },
			{ prop: 'decoration', type: 'Snippet<[CalendarDay]>', default: '—', description: "Extra content under a day's number." },
			{ prop: 'onChange', type: '(value) => void', default: '—', description: 'Fires on every change, including the half-made range step.' },
			{ prop: 'onMonthChange', type: '(month: string) => void', default: '—', description: 'Fires when the displayed month changes.' },
			{ prop: 'class', type: 'string', default: "''", description: 'Extra class on the wrapper.' }
		]}
	/>
</Card>

<style lang="scss">
	.control {
		width: 240px;
	}

	// A formatted range is two dates and a dash; at the single-date width it
	// ellipsises away the half the user is currently choosing.
	.control.wide {
		width: 320px;
	}

	.dots {
		display: flex;
		gap: 2px;
		height: 4px;
		align-items: center;
	}

	.dot {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: var(--glow-primary);
	}

	// Inside a selected day the number goes to the accent's contrast colour; the
	// dots have to follow it or they vanish into the fill.
	:global(.day.selected) .dot {
		background: currentColor;
	}
</style>
