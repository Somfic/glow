<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Button from '$lib/button/Button.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Split from '$lib/split/Split.svelte';
	import Drawer from '$lib/drawer/Drawer.svelte';
	import ScrollArea, { type ScrollAreaScrollbar } from '$lib/scroll-area/ScrollArea.svelte';

	const lines = [
		'Deploy started — build 4821',
		'Resolving dependencies',
		'Compiling 214 modules',
		'Type-checking src/lib',
		'Bundling client chunks',
		'Bundling server chunks',
		'Prerendering 46 routes',
		'Optimising images',
		'Writing build/ to disk',
		'Uploading artifacts',
		'Invalidating CDN cache',
		'Health check: 200 OK',
		'Deploy finished in 41s'
	];

	const columns = [
		'Region',
		'Instances',
		'CPU',
		'Memory',
		'Requests',
		'p50',
		'p95',
		'p99',
		'Errors',
		'Egress',
		'Cache hit',
		'Cold starts',
		'Queue depth',
		'Last deploy'
	];
	const rows = [
		['eu-west-1', '12', '38%', '2.1 GB', '18.4k', '24 ms', '91 ms', '210 ms', '0.02%', '840 GB', '94.1%', '3', '0', '2h ago'],
		['us-east-1', '20', '51%', '3.4 GB', '31.7k', '19 ms', '78 ms', '164 ms', '0.01%', '1.6 TB', '96.3%', '1', '2', '2h ago'],
		['ap-south-1', '6', '22%', '1.2 GB', '7.9k', '33 ms', '140 ms', '390 ms', '0.05%', '310 GB', '88.7%', '7', '0', '3d ago'],
		['sa-east-1', '4', '17%', '0.8 GB', '3.1k', '41 ms', '182 ms', '512 ms', '0.09%', '120 GB', '81.2%', '11', '4', '3d ago']
	];

	const scrollbarModes: ScrollAreaScrollbar[] = ['auto', 'always', 'hover', 'none'];

	// The point of the ResizeObserver on the *content* box: this list grows while
	// the viewport's own size never changes, and the bottom fade has to notice.
	let grown = $state(3);
	let drawer = $state<Drawer | null>(null);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Scroll Area | Glow UI</title></svelte:head>

<Heading level={1}>Scroll Area</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A scroll container with the same scrollbar on every platform, and gradient masks on the edges
	that still have content past them. The masks are live: they track the scroll position, the
	container's size, <em>and</em> the size of the content inside it. Scrolling itself is the
	browser's — this styles the real scrollbar rather than replacing it.
</Text>

<Card title="Vertical" id="vertical">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default. Scroll it: the top fade appears the moment there is anything above, and the
		bottom one goes away when you reach the end.
	</Text>
	<div class="frame">
		<ScrollArea maxHeight="220px" label="Deploy log">
			<ol class="log">
				{#each lines as line, i}
					<li><span class="num">{String(i + 1).padStart(2, '0')}</span>{line}</li>
				{/each}
			</ol>
		</ScrollArea>
	</div>
</Card>

<Card title="Horizontal" id="horizontal">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>orientation="horizontal"</Code> clips the vertical axis and fades left and right
		instead. Useful for a wide table that shouldn't force the page to scroll sideways.
	</Text>
	<div class="frame">
		<ScrollArea orientation="horizontal" label="Region metrics">
			<table class="metrics">
				<thead>
					<tr>{#each columns as c}<th>{c}</th>{/each}</tr>
				</thead>
				<tbody>
					{#each rows as row}
						<tr>{#each row as cell}<td>{cell}</td>{/each}</tr>
					{/each}
				</tbody>
			</table>
		</ScrollArea>
	</div>
</Card>

<Card title="Both axes" id="both">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>orientation="both"</Code> scrolls and fades on all four edges independently. Each fade
		is on only while there is content past that particular edge.
	</Text>
	<div class="frame">
		<ScrollArea orientation="both" maxHeight="220px" label="Wide log">
			<div class="wide-canvas">
				{#each lines as line, i}
					<div class="wide-row">
						<span class="num">{String(i + 1).padStart(2, '0')}</span>
						{line} — worker-{i % 4} · pid {4100 + i * 7} · {(i * 0.37 + 0.4).toFixed(2)}s elapsed
						· checksum {(i * 918273).toString(16)} · node runner-{i % 3}.eu-west-1.internal · attempt
						1/3 · queued {(i * 0.11).toFixed(2)}s · rss {(120 + i * 13).toFixed(0)} MB
					</div>
				{/each}
			</div>
		</ScrollArea>
	</div>
</Card>

<Card title="Fades follow the content, not just the scroll" id="live">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Add rows without touching the scrollbar. The viewport never changes size, so a
		<Code>ResizeObserver</Code> on the container alone would miss this — the one on the content box
		is what turns the bottom fade on.
	</Text>
	<div class="frame">
		<ScrollArea maxHeight="180px" label="Growing list">
			<ol class="log">
				{#each lines.slice(0, grown) as line, i}
					<li><span class="num">{String(i + 1).padStart(2, '0')}</span>{line}</li>
				{/each}
			</ol>
		</ScrollArea>
	</div>
	<div class="controls">
		<Button
			variant="secondary"
			onclick={() => {
				grown = Math.min(lines.length, grown + 3);
			}}
			disabled={grown >= lines.length}>Add rows</Button
		>
		<Button variant="ghost" onclick={() => {
				grown = 3;
			}} disabled={grown === 3}>Reset</Button>
	</div>
</Card>

<Card title="Scrollbars" id="scrollbars">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Four treatments of the real scrollbar. <Code>always</Code> also reserves its gutter, so content
		does not shift sideways the moment it starts overflowing.
	</Text>
	<div class="row">
		{#each scrollbarModes as mode}
			<div class="col">
				<span class="caption"><Code>{mode}</Code></span>
				<div class="frame">
					<ScrollArea scrollbar={mode} maxHeight="150px" fade={false} label="{mode} scrollbar">
						<ol class="log">
							{#each lines as line, i}
								<li><span class="num">{String(i + 1).padStart(2, '0')}</span>{line}</li>
							{/each}
						</ol>
					</ScrollArea>
				</div>
			</div>
		{/each}
	</div>
</Card>

<Card title="Fade depth" id="fade-size">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>fadeSize</Code> is any CSS length, and <Code>fade={false}</Code> turns the masks off
		entirely. The gradient's colour comes from <Code>--glow-scroll-fade</Code>, which defaults to the
		surface token — set it when the area sits on something else.
	</Text>
	<div class="row">
		{#each ['0.75rem', '2rem', '4rem'] as size}
			<div class="col">
				<span class="caption"><Code>{size}</Code></span>
				<div class="frame">
					<ScrollArea maxHeight="150px" fadeSize={size} label="Fade {size}">
						<ol class="log">
							{#each lines as line, i}
								<li><span class="num">{String(i + 1).padStart(2, '0')}</span>{line}</li>
							{/each}
						</ol>
					</ScrollArea>
				</div>
			</div>
		{/each}
	</div>
</Card>

<Card title="Inside a Split" id="in-split">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The pane it lives in already clips its overflow, so the area takes
		<Code>height: 100%</Code> from it and scrolls inside the pane rather than growing it. This is
		the shape a sidebar rail wants too.
	</Text>
	<div class="split-frame">
		<Split
			direction="horizontal"
			panes={[
				{ id: 'nav', defaultSize: 32, minSize: 18, content: navPane },
				{ id: 'body', defaultSize: 68, content: bodyPane }
			]}
		/>
	</div>
</Card>

<Card title="Inside a Drawer" id="in-drawer">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A drawer body already scrolls, so an area inside one means two scrollers stacked.
		<Code>overscroll-behavior: contain</Code> is on by default, which stops the wheel handing off to
		the drawer — and to the page behind it — the moment the inner area reaches its end.
	</Text>
	<Button variant="secondary" onclick={() => drawer?.open()}>Open drawer</Button>
</Card>

<Drawer bind:this={drawer} title="Deploy log" subtitle="Scrolled inside the drawer" icon="ScrollText">
	<ScrollArea maxHeight="320px" fadeSize="2.5rem" label="Deploy log">
		<ol class="log">
			{#each [...lines, ...lines] as line, i}
				<li><span class="num">{String(i + 1).padStart(2, '0')}</span>{line}</li>
			{/each}
		</ol>
	</ScrollArea>
</Drawer>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { ScrollArea } from 'glow';
<\/script>

<ScrollArea maxHeight="20rem" label="Deploy log">
  <ol>{#each lines as line}<li>{line}</li>{/each}</ol>
</ScrollArea>

<!-- a wide table, without the page scrolling sideways -->
<ScrollArea orientation="horizontal" label="Region metrics">
  <Table {columns} {data} />
</ScrollArea>

<!-- fill a pane that already has a height -->
<ScrollArea scrollbar="hover" fadeSize="3rem" style="height: 100%;">
  {@render body()}
</ScrollArea>

<!-- retarget the gradient when it isn't sitting on a surface -->
<ScrollArea style="--glow-scroll-fade: var(--glow-bg-base);">
  {@render body()}
</ScrollArea>`}
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
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Required. What scrolls.' },
			{ prop: 'orientation', type: "'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Which axis scrolls. The other one is clipped.' },
			{ prop: 'fade', type: 'boolean', default: 'true', description: 'Gradient masks on the edges that have content past them.' },
			{ prop: 'fadeSize', type: 'string', default: "'2rem'", description: 'Depth of those gradients. Any CSS length.' },
			{ prop: 'scrollbar', type: "'auto' | 'always' | 'hover' | 'none'", default: "'auto'", description: 'Treatment of the native scrollbar. always reserves a stable gutter.' },
			{ prop: 'maxHeight', type: 'string', default: '—', description: 'Shorthand for the common vertical case.' },
			{ prop: 'maxWidth', type: 'string', default: '—', description: 'The horizontal equivalent.' },
			{ prop: 'label', type: 'string', default: '—', description: 'Accessible name for the region while it is scrollable — and therefore a tab stop.' },
			{ prop: 'onedgechange', type: '(edges: ScrollAreaEdges) => void', default: '—', description: 'Fires with { top, bottom, left, right } whenever which edges have more content changes.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper. Where --glow-scroll-fade goes.' }
		]}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		A box that scrolls but cannot be focused is unreachable without a pointer, so the viewport
		takes <Code>tabindex="0"</Code> — but only while it actually overflows. That condition is the
		whole reason the edges are measured rather than assumed: an area whose content happens to fit
		is not a tab stop, and it becomes one the moment the content outgrows it. Pass
		<Code>label</Code> and it is announced as a named <Code>region</Code>; without one it is a
		plain focusable box, which is worse but not silent. Scrolling stays native throughout — arrow
		keys, <Code>Page&nbsp;Up</Code>/<Code>Down</Code>, <Code>Home</Code>/<Code>End</Code>, momentum,
		and scroll anchoring all still work, and <Code>scroll-behavior</Code> is left alone so the
		browser's own reduced-motion handling applies. The fades are
		<Code>aria-hidden</Code> and <Code>pointer-events: none</Code>; they are an affordance, not
		content.
	</Text>
</Card>

{#snippet navPane()}
	<ScrollArea scrollbar="hover" label="Files" style="height: 100%;">
		<ul class="files">
			{#each ['app.ts', 'router.ts', 'store.svelte.ts', 'theme.scss', 'Button.svelte', 'Card.svelte', 'Modal.svelte', 'Sidebar.svelte', 'Split.svelte', 'Table.svelte', 'Toast.svelte', 'index.ts'] as file}
				<li><Icon name="FileCode" size={13} />{file}</li>
			{/each}
		</ul>
	</ScrollArea>
{/snippet}

{#snippet bodyPane()}
	<ScrollArea fadeSize="3rem" label="Notes" style="height: 100%;">
		<div class="notes">
			{#each lines as line, i}
				<p><strong>{String(i + 1).padStart(2, '0')}</strong> {line}</p>
			{/each}
		</div>
	</ScrollArea>
{/snippet}

<style lang="scss">
	.frame {
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		overflow: hidden;
	}

	.split-frame {
		height: 300px;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		overflow: hidden;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.col {
		flex: 1 1 180px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.caption {
		color: var(--glow-text-secondary);
		font-size: 0.8rem;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.log {
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;

		li {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.35rem 0.9rem;
			font-size: 0.85rem;
			color: var(--glow-fg);
		}
	}

	.num {
		color: var(--glow-text-muted);
		font-family: var(--glow-font-mono, monospace);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	.metrics {
		border-collapse: collapse;
		white-space: nowrap;
		font-size: 0.85rem;

		th,
		td {
			padding: 0.45rem 1rem;
			text-align: left;
		}

		th {
			color: var(--glow-text-secondary);
			font-weight: 600;
			border-bottom: 1px solid var(--glow-border-color);
		}

		td {
			color: var(--glow-fg);
		}
	}

	.wide-canvas {
		padding: 0.5rem 0;
		white-space: nowrap;
	}

	.wide-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.35rem 0.9rem;
		font-size: 0.85rem;
		color: var(--glow-fg);
	}

	.files {
		list-style: none;
		margin: 0;
		padding: 0.5rem;

		li {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.3rem 0.5rem;
			border-radius: 6px;
			font-size: 0.82rem;
			color: var(--glow-fg);
		}
	}

	.notes {
		padding: 0.5rem 1rem;

		p {
			margin: 0 0 0.5rem;
			font-size: 0.85rem;
			color: var(--glow-text-secondary);
		}

		strong {
			color: var(--glow-text-muted);
			font-variant-numeric: tabular-nums;
		}
	}
</style>
