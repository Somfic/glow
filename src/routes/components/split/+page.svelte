<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Split from '$lib/split/Split.svelte';
	import Icon from '$lib/icon/Icon.svelte';

	let lastSizes = $state<Record<string, number>>({});
</script>

<svelte:head><title>Split | Glow UI</title></svelte:head>

<Heading level={1}>Split</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A keyboard- and pointer-driven resizable pane container. Drag the handle, double-click
	to collapse, focus + arrow keys for nudges. Supports horizontal and vertical splits and
	can be nested for any rectangular layout.
</Text>

<Card title="Two-pane horizontal">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		Drag the divider. Hold <Code>Shift</Code> while pressing arrow keys for bigger nudges.
		Double-click the handle to collapse the sidebar to its <Code>minSize</Code>.
	</Text>
	<div style="height: 320px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(238,238,238,0.08);">
		<Split
			direction="horizontal"
			panes={[
				{
					id: 'sidebar',
					defaultSize: 24,
					minSize: 12,
					maxSize: 50,
					collapsible: true,
					content: sidebar
				},
				{
					id: 'main',
					defaultSize: 76,
					minSize: 30,
					content: main
				}
			]}
			onResize={(s) => (lastSizes = s)}
		/>
	</div>
	{#if Object.keys(lastSizes).length > 0}
		<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
			Live sizes: <Code>{Object.entries(lastSizes).map(([k, v]) => `${k}: ${v.toFixed(1)}%`).join(' · ')}</Code>
		</Text>
	{/if}
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Nested — sidebar with stacked main">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		The right pane is itself a vertical Split. Each handle has its own keyboard focus.
	</Text>
	<div style="height: 380px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(238,238,238,0.08);">
		<Split
			direction="horizontal"
			panes={[
				{ id: 'left', defaultSize: 22, minSize: 12, content: nestedLeft },
				{ id: 'right', defaultSize: 78, content: nestedRight }
			]}
		/>
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Three-pane horizontal — IDE layout">
	<div style="height: 360px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(238,238,238,0.08);">
		<Split
			direction="horizontal"
			panes={[
				{ id: 'files', defaultSize: 18, minSize: 10, content: filesPane },
				{ id: 'editor', defaultSize: 56, minSize: 25, content: editorPane },
				{ id: 'inspector', defaultSize: 26, minSize: 12, content: inspectorPane }
			]}
		/>
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="API">
	<CodeBlock
		language="svelte"
		code={`<Split
    direction="horizontal"
    panes={[
        { id: 'sidebar', defaultSize: 24, minSize: 12, content: sidebar },
        { id: 'main', defaultSize: 76, content: main }
    ]}
    onResize={(sizes) => persist(sizes)}
/>`}
	/>
</Card>

{#snippet sidebar()}
	<div class="demo-pane sidebar">
		<div class="demo-section">
			<span class="demo-label">Workspace</span>
			<div class="demo-row"><Icon name="House" size={14} /> Home</div>
			<div class="demo-row"><Icon name="Inbox" size={14} /> Inbox</div>
			<div class="demo-row"><Icon name="Settings" size={14} /> Settings</div>
		</div>
		<div class="demo-section">
			<span class="demo-label">Projects</span>
			<div class="demo-row"><Icon name="Sparkles" size={14} /> Glow UI</div>
			<div class="demo-row"><Icon name="Zap" size={14} /> Spark</div>
			<div class="demo-row"><Icon name="Hammer" size={14} /> Forge</div>
		</div>
	</div>
{/snippet}

{#snippet main()}
	<div class="demo-pane">
		<div class="demo-pane-header">README.md</div>
		<div class="demo-pane-body">
			<p>Drag the divider to resize the sidebar. Each pane is a flex item with a percentage <code>flex-basis</code>; the handle redistributes between the two adjacent panes, clamped to each pane's min/max.</p>
			<p>The component is keyboard-accessible: tab to the handle (it has <code>role="separator"</code>), then arrow keys for fine moves, <code>Shift</code> + arrow for bigger steps.</p>
		</div>
	</div>
{/snippet}

{#snippet nestedLeft()}
	<div class="demo-pane sidebar">
		<div class="demo-section">
			<span class="demo-label">Files</span>
			<div class="demo-row"><Icon name="FileText" size={14} /> README.md</div>
			<div class="demo-row"><Icon name="Braces" size={14} /> package.json</div>
			<div class="demo-row"><Icon name="Component" size={14} /> Split.svelte</div>
		</div>
	</div>
{/snippet}

{#snippet nestedRight()}
	<Split
		direction="vertical"
		panes={[
			{ id: 'editor', defaultSize: 70, minSize: 25, content: nestedEditor },
			{ id: 'terminal', defaultSize: 30, minSize: 12, content: nestedTerminal }
		]}
	/>
{/snippet}

{#snippet nestedEditor()}
	<div class="demo-pane">
		<div class="demo-pane-header">Editor · Split.svelte</div>
		<div class="demo-pane-body" style="font-family: ui-monospace, monospace; font-size: 0.8rem;">
			<pre style="margin: 0; white-space: pre-wrap;">function applyDelta(handleIdx, deltaPct) {'{'}
  const a = panes[handleIdx];
  const b = panes[handleIdx + 1];
  let aNext = clamp(a, sizes[a.id] + deltaPct);
  let bNext = sizes[b.id] - (aNext - sizes[a.id]);
  ...
{'}'}</pre>
		</div>
	</div>
{/snippet}

{#snippet nestedTerminal()}
	<div class="demo-pane terminal">
		<div class="demo-pane-header">Terminal</div>
		<div class="demo-pane-body" style="font-family: ui-monospace, monospace; font-size: 0.8rem;">
			<div>$ npm run dev</div>
			<div style="opacity: 0.6;">VITE v7.3.2 ready in 547 ms</div>
			<div style="opacity: 0.6;">➜ Local: http://localhost:5174/</div>
			<div>$ <span style="display: inline-block; width: 6px; height: 0.9rem; background: currentColor; vertical-align: middle; animation: blink 1s steps(1) infinite;"></span></div>
		</div>
	</div>
{/snippet}

{#snippet filesPane()}
	<div class="demo-pane sidebar">
		<div class="demo-section">
			<span class="demo-label">src</span>
			<div class="demo-row" style="padding-left: 0.75rem;"><Icon name="Folder" size={14} /> lib</div>
			<div class="demo-row" style="padding-left: 1.5rem;"><Icon name="Component" size={14} /> Split.svelte</div>
			<div class="demo-row" style="padding-left: 1.5rem;"><Icon name="Component" size={14} /> Card.svelte</div>
			<div class="demo-row" style="padding-left: 0.75rem;"><Icon name="Folder" size={14} /> routes</div>
		</div>
	</div>
{/snippet}

{#snippet editorPane()}
	<div class="demo-pane">
		<div class="demo-pane-header">Split.svelte</div>
		<div class="demo-pane-body" style="font-family: ui-monospace, monospace; font-size: 0.8rem;">
			<pre style="margin: 0;">&lt;Split
  direction="horizontal"
  panes={'{['}
    {'{'} id: 'a', defaultSize: 30 {'}'},
    {'{'} id: 'b', defaultSize: 70 {'}'}
  {']}'}
/&gt;</pre>
		</div>
	</div>
{/snippet}

{#snippet inspectorPane()}
	<div class="demo-pane">
		<div class="demo-pane-header">Inspector</div>
		<div class="demo-pane-body">
			<div class="demo-prop"><span>Width</span> <code>auto</code></div>
			<div class="demo-prop"><span>Height</span> <code>320</code></div>
			<div class="demo-prop"><span>Padding</span> <code>1rem</code></div>
			<div class="demo-prop"><span>Radius</span> <code>10</code></div>
			<div class="demo-prop"><span>Shadow</span> <code>md</code></div>
		</div>
	</div>
{/snippet}

<style>
	.demo-pane {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--glow-bg-surface-element);
	}
	.demo-pane.sidebar {
		background: var(--glow-bg-surface);
	}
	.demo-pane.terminal {
		background: #0d0d0d;
	}
	.demo-pane-header {
		padding: 0.6rem 0.85rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(238, 238, 238, 0.55);
		border-bottom: 1px solid rgba(238, 238, 238, 0.06);
	}
	.demo-pane-body {
		padding: 0.85rem;
		overflow: auto;
		flex: 1 1 auto;
		min-height: 0;
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.demo-pane-body p {
		margin: 0 0 0.6rem;
	}
	.demo-section {
		padding: 0.85rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.demo-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(238, 238, 238, 0.5);
		padding: 0 0.6rem 0.35rem;
	}
	.demo-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: rgba(238, 238, 238, 0.85);
		cursor: default;
	}
	.demo-row:hover {
		background: rgba(238, 238, 238, 0.05);
	}
	.demo-prop {
		display: flex;
		justify-content: space-between;
		padding: 0.45rem 0;
		border-bottom: 1px solid rgba(238, 238, 238, 0.05);
		font-size: 0.85rem;
	}
	.demo-prop span {
		color: rgba(238, 238, 238, 0.6);
	}
	.demo-prop code {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		color: var(--glow-primary);
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
