<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import Table from '$lib/data/Table.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Sparkline from '$lib/charts/Sparkline.svelte';
	import LineChart from '$lib/charts/LineChart.svelte';

	const requests = [820, 932, 901, 934, 1290, 1330, 1320, 1102, 1180, 1450, 1390, 1520];
	const errors = [42, 38, 51, 44, 30, 26, 33, 61, 58, 24, 21, 18];
	const latency = [180, 174, 190, 168, 155, 162, 149, 158, 143, 138, 141, 132];
	// A second and third series in the same order of magnitude as `requests` —
	// three lines only compare when they share a scale.
	const cached = [610, 700, 660, 720, 980, 1010, 1040, 880, 910, 1180, 1130, 1260];
	const retries = [180, 210, 260, 190, 300, 280, 260, 340, 380, 260, 240, 210];

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const monthLabel = (i: number) => months[i] ?? String(i);

	const rows = [
		{ region: 'Europe', total: '12,480', trend: [12, 14, 13, 17, 16, 19, 22, 24] },
		{ region: 'North America', total: '9,120', trend: [28, 26, 27, 22, 21, 19, 18, 14] },
		{ region: 'Asia Pacific', total: '7,340', trend: [9, 11, 10, 12, 12, 12, 13, 15] },
		{ region: 'South America', total: '2,015', trend: [6, 6, 6, 6, 6, 6, 6, 6] }
	];
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

{#snippet trendCell(value: number[])}
	<Sparkline data={value} tone="trend" dot label="Trend" />
{/snippet}

<svelte:head><title>Charts | Glow UI</title></svelte:head>

<Heading level={1}>Charts</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Two components for showing a trend, where <Link href="/components/table">Table</Link> and
	<Link href="/components/data">Data</Link> only show numbers. <Code>Sparkline</Code> is the inline
	one — no axes, no legend, sized for a table cell. <Code>LineChart</Code> is the full one — axes,
	gridlines, several series, and a hover crosshair. Both are hand-rolled SVG: no charting
	dependency, and every colour comes from a <Code>--glow-*</Code> token.
</Text>

<Card title="Sparkline" id="sparkline">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A line and nothing else. It defaults to 96×24 — inline-block and vertically centred, so it sits
		on a line of text without disturbing it. <Code>area</Code> shades under the line and
		<Code>dot</Code> marks the last sample.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		<Sparkline data={requests} label="Requests" />
		<Sparkline data={requests} area label="Requests" />
		<Sparkline data={requests} area dot label="Requests" />
		<Sparkline data={requests} smooth area dot width={160} height={40} label="Requests" />
	</Flex>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		Sat next to the number it belongs to, which is the shape it is really for:
	</Text>
	<Flex direction="horizontal" gap="xl" align="center" style="margin-top: 0.75rem;">
		<div>
			<Text size="sm" variant="secondary">Requests / min</Text>
			<Flex direction="horizontal" gap="sm" align="center">
				<Text size="xl" style="font-weight: 600;">1,520</Text>
				<Sparkline data={requests} tone="trend" dot label="Requests per minute" />
			</Flex>
		</div>
		<div>
			<Text size="sm" variant="secondary">Errors / min</Text>
			<Flex direction="horizontal" gap="sm" align="center">
				<Text size="xl" style="font-weight: 600;">18</Text>
				<Sparkline data={errors} tone="trend" dot label="Errors per minute" />
			</Flex>
		</div>
	</Flex>
</Card>

<Card title="Tones" id="tones">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>tone</Code> maps onto the semantic colour tokens. <Code>trend</Code> picks between success
		and danger by comparing the last plottable sample with the first, and stays neutral when they
		match — which is why the flat series below is grey rather than green. Colour is a second signal,
		never the only one: the shape of the line already says which way it went.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center" style="flex-wrap: wrap;">
		<Sparkline data={requests} tone="primary" area label="Primary" />
		<Sparkline data={requests} tone="info" area label="Info" />
		<Sparkline data={errors} tone="danger" area label="Danger" />
		<Sparkline data={latency} tone="warning" area label="Warning" />
		<Sparkline data={latency} tone="neutral" area label="Neutral" />
		<Sparkline data={requests} tone="trend" dot label="Trend up" />
		<Sparkline data={errors} tone="trend" dot label="Trend down" />
		<Sparkline data={[6, 6, 6, 6, 6]} tone="trend" dot label="Flat" />
	</Flex>
</Card>

<Card title="In a table" id="in-table">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The case Sparkline exists for. Pass the same <Code>min</Code>/<Code>max</Code> to every row when
		the rows are meant to be compared — left to itself each sparkline fills its own box, so a series
		that moved by 2 looks exactly like one that moved by 2000.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'region', label: 'Region' },
			{ key: 'total', label: 'Sessions', align: 'right' },
			{ key: 'trend', label: 'Last 8 weeks', render: trendCell }
		]}
		data={rows}
	/>
</Card>

<Card title="Line chart" id="line-chart">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Axes, gridlines and a width taken from the container through a
		<Code>ResizeObserver</Code> — resize the window and it reflows. Hover (or focus it and use the
		arrow keys) for the crosshair readout.
	</Text>
	<LineChart
		label="Requests per minute"
		description="Rolling 12-month average"
		series={[{ label: 'Requests', data: requests }]}
		area
		yMin={0}
		formatX={monthLabel}
	/>
</Card>

<Card title="Multiple series" id="multi-series">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Series are told apart three ways at once — hue, stroke dash and marker shape. Hue alone fails
		for a dichromatic reader and fails completely in a greyscale print, so the palette never carries
		the distinction on its own. The colours themselves are
		<Code>--glow-chart-1…6</Code>, each of them an existing theme token.
	</Text>
	<LineChart
		label="Service health"
		description="Requests, cache hits and retries by month"
		series={[
			{ label: 'Requests', data: requests },
			{ label: 'Cache hits', data: cached },
			{ label: 'Retries', data: retries }
		]}
		yMin={0}
		formatX={monthLabel}
	/>
</Card>

<Card title="Smoothing" id="smoothing">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>smooth</Code> swaps the polyline for a monotone cubic (Fritsch–Carlson). It is the one
		interpolation that cannot overshoot: a smoothed series of non-negative numbers never dips below
		zero between two samples, which a Catmull-Rom happily would.
	</Text>
	<Grid cols={2} gap="lg">
		<LineChart
			label="Polyline"
			series={[{ label: 'Errors', data: errors }]}
			area
			yMin={0}
			height={200}
			formatX={monthLabel}
		/>
		<LineChart
			label="Monotone cubic"
			series={[{ label: 'Errors', data: errors }]}
			area
			smooth
			yMin={0}
			height={200}
			formatX={monthLabel}
		/>
	</Grid>
</Card>

<Card title="Awkward data" id="edge-cases">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The cases that break a naive implementation, all rendered rather than described. An empty series
		gets a message instead of an axis; a single point is a dot in the middle of the box, because
		there is no line to draw and no x span to spread it over; an all-equal series is a line through
		the middle rather than a division by zero; <Code>null</Code> is a gap the line breaks across
		instead of interpolating over; and out-of-order <Code>{'{ x, y }'}</Code> points are sorted
		before anything is drawn.
	</Text>
	<Grid cols={2} gap="lg">
		<LineChart label="Empty" series={[{ label: 'Nothing', data: [] }]} height={160} />
		<LineChart label="One sample" series={[{ label: 'Single', data: [42] }]} height={160} />
		<LineChart
			label="All equal"
			series={[{ label: 'Flat', data: [7, 7, 7, 7, 7, 7] }]}
			height={160}
		/>
		<LineChart
			label="Gaps"
			series={[{ label: 'Patchy', data: [12, 18, null, null, 24, 21, null, 30] }]}
			height={160}
		/>
		<LineChart
			label="Unsorted x"
			series={[
				{
					label: 'Shuffled',
					data: [
						{ x: 5, y: 30 },
						{ x: 1, y: 12 },
						{ x: 4, y: 26 },
						{ x: 2, y: 15 },
						{ x: 3, y: 9 }
					]
				}
			]}
			height={160}
		/>
		<div>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">
				Sparkline takes the same punishment:
			</Text>
			<Flex direction="horizontal" gap="lg" align="center" style="flex-wrap: wrap;">
				<Sparkline data={[]} label="Empty" />
				<Sparkline data={[42]} dot label="One sample" />
				<Sparkline data={[7, 7, 7, 7, 7]} label="All equal" />
				<Sparkline data={[3, 9, null, null, 6, 11]} dot label="Gaps" />
			</Flex>
		</div>
	</Grid>
</Card>

<Card title="The data table" id="data-table">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Every LineChart carries a real <Code>&lt;table&gt;</Code> of its own numbers. It is visually
		hidden by default; <Code>table="visible"</Code> shows it, which is also the honest way to
		publish a chart in a report.
	</Text>
	<LineChart
		label="Requests and errors"
		series={[
			{ label: 'Requests', data: requests.slice(0, 6) },
			{ label: 'Errors', data: errors.slice(0, 6) }
		]}
		table="visible"
		height={200}
		yMin={0}
		formatX={monthLabel}
	/>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Sparkline, LineChart } from 'glow';

  const requests = [820, 932, 901, 934, 1290, 1330];
<\/script>

<!-- inline, in a table cell or beside a metric -->
<Sparkline data={requests} tone="trend" dot label="Requests" />

<!-- comparable rows: pin the domain so every cell shares a scale -->
<Sparkline data={requests} min={0} max={2000} label="Requests" />

<!-- the full chart: responsive width, crosshair, hidden data table -->
<LineChart
  label="Service health"
  description="Requests and errors by month"
  series={[
    { label: 'Requests', data: requests },
    { label: 'Errors', data: [42, 38, 51, 44, 30, 26] }
  ]}
  yMin={0}
  formatX={(i) => months[i]}
/>

<!-- gaps and explicit x values -->
<LineChart
  label="Patchy"
  series={[{ label: 'Signal', data: [{ x: 3, y: 9 }, { x: 1, y: 4 }, { x: 2, y: null }] }]}
/>`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		An SVG is invisible to a screen reader by default, and the two components answer that
		differently on purpose.
	</Text>
	<Text variant="secondary" size="sm" style="margin-top: 0.75rem;">
		<strong>Sparkline</strong> takes a <Code>label</Code> and becomes a single
		<Code>role="img"</Code> whose name summarises the series — direction, first, last, low, high.
		It is a decoration on a number that is already on the page, so a per-point readout would be
		twelve announcements to say what "up from 820 to 1,520" says once. Without a
		<Code>label</Code> it is <Code>aria-hidden</Code> instead of announcing itself as an unnamed
		image.
	</Text>
	<Text variant="secondary" size="sm" style="margin-top: 0.75rem;">
		<strong>LineChart</strong> is the primary content, so it gets the full treatment: a
		<Code>role="img"</Code> named by the visible caption and described by a generated summary, plus
		a real <Code>&lt;table&gt;</Code> of the values — visually hidden by default. A table beats
		<Code>aria-label</Code>-per-point because a screen reader can navigate it by row and column,
		compare two series at one x, and read it at the user's pace; a hundred labelled points are a
		hundred stops in a list with no structure. The plot is focusable and the arrow keys, Home and
		End walk the crosshair, with the readout announced through a polite live region that sits
		outside the <Code>role="img"</Code> subtree — inside it, assistive tech would ignore it.
	</Text>
</Card>

<Card title="Sparkline props" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'data', type: '(number | null | {x,y})[]', default: '—', description: 'The series. Bare numbers are indexed; null is a gap.' },
			{ prop: 'width', type: "number | 'fill'", default: '96', description: "Pixels, or 'fill' to take the container's width." },
			{ prop: 'height', type: 'number', default: '24', description: 'Pixel height.' },
			{ prop: 'tone', type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'trend'", default: 'primary', description: "Semantic colour; 'trend' colours by last vs first." },
			{ prop: 'area', type: 'boolean', default: 'false', description: 'Shade under the line.' },
			{ prop: 'dot', type: 'boolean', default: 'false', description: 'Mark the last plottable sample.' },
			{ prop: 'smooth', type: 'boolean', default: 'false', description: 'Monotone cubic instead of a polyline.' },
			{ prop: 'strokeWidth', type: 'number', default: '1.5', description: 'Line weight.' },
			{ prop: 'min', type: 'number', default: 'data min', description: 'Pin the bottom of the y domain.' },
			{ prop: 'max', type: 'number', default: 'data max', description: 'Pin the top of the y domain.' },
			{ prop: 'label', type: 'string', default: '—', description: 'Accessible name; without it the chart is aria-hidden.' },
			{ prop: 'format', type: '(value: number) => string', default: 'built-in', description: 'Formats the numbers in the accessible name.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>
</Card>

<Card title="LineChart props" id="props-linechart">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'series', type: '{ label, data, color? }[]', default: '—', description: 'One entry per line.' },
			{ prop: 'label', type: 'string', default: '—', description: 'Accessible name, and the visible caption.' },
			{ prop: 'description', type: 'string', default: '—', description: 'Sub-caption, and part of the accessible description.' },
			{ prop: 'width', type: 'number', default: 'container', description: 'Fixed width; omit for the ResizeObserver.' },
			{ prop: 'height', type: 'number', default: '260', description: 'Plot height in pixels, chrome included.' },
			{ prop: 'smooth', type: 'boolean', default: 'false', description: 'Monotone cubic interpolation.' },
			{ prop: 'area', type: 'boolean', default: 'false', description: 'Shade under each line.' },
			{ prop: 'points', type: "boolean | 'auto'", default: 'auto', description: "Markers; 'auto' draws them when they won't crowd." },
			{ prop: 'grid / xAxis / yAxis / legend / showTitle', type: 'boolean', default: 'true', description: 'Turn a piece of chrome off.' },
			{ prop: 'yMin', type: 'number', default: 'data', description: 'Pin the baseline — pass 0 for counts.' },
			{ prop: 'yMax', type: 'number', default: 'data', description: 'Pin the top of the y domain.' },
			{ prop: 'xTicks', type: 'number', default: '6', description: 'Roughly how many x labels.' },
			{ prop: 'yTicks', type: 'number', default: '5', description: 'Roughly how many y gridlines.' },
			{ prop: 'formatX', type: '(x: number) => string', default: 'built-in', description: 'Axis and tooltip x labels.' },
			{ prop: 'formatY', type: '(y: number) => string', default: 'built-in', description: 'Axis, tooltip and table values.' },
			{ prop: 'table', type: "'hidden' | 'visible' | 'none'", default: 'hidden', description: 'The data-table alternative.' },
			{ prop: 'emptyMessage', type: 'string', default: "'No data'", description: 'Shown when nothing is plottable.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the figure.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the figure.' }
		]}
	/>
</Card>
