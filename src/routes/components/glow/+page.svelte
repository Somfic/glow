<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Glow from '$lib/glow/Glow.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import { PATTERN_NAMES, PATTERN_DESCRIPTIONS } from '$lib/glow/patterns.js';

	const palettes = {
		default: ['#700000', '#008cff', '#75daff', '#ff0026', '#ff3626'],
		violet: ['#1a0033', '#7c3aed', '#ec4899', '#f97316', '#fde047'],
		teal: ['#001b2e', '#006d77', '#83c5be', '#00d2ff'],
		ember: ['#1a0500', '#7c2d12', '#ea580c', '#fbbf24', '#fff7ed']
	} as const;
	type PaletteName = keyof typeof palettes;

	let palette: PaletteName = $state('default');
	let morph = $state(0);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Glow | Glow UI</title></svelte:head>

<Heading level={1}>Glow</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Soft, flowing sheets of light rendered with a WebGL2 fragment shader. Ported from
	<a href="https://github.com/mattrothenberg/fold-gradient" target="_blank" rel="noreferrer"
		>fold-gradient</a
	>. Perfect for hero sections and ambient backgrounds.
</Text>

<Card title="Interactive Demo" id="glow-demo">
	<div style="position: relative; height: 420px; border-radius: 12px; overflow: hidden;">
		<Glow rotation={52} zoom={9}>
			<div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem;">
				<div
					style="background: rgba(10, 12, 20, 0.55); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 2rem; max-width: 520px;"
				>
					<Heading level={3} id="glow-hero">Sheets of light</Heading>
					<Text>
						A single-pass shader using domain-warped fBm, derivative-based lighting, ACES
						tonemapping and ordered dithering — no npm shader dependency required.
					</Text>
				</div>
			</div>
		</Glow>
	</div>
</Card>

<Card title="Patterns" id="patterns">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>pattern</Code> prop swaps the shader. Every pattern reads the same
		<Code>colors</Code> prop, so a palette change re-colours all of them.
	</Text>

	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Every pattern also has a <Code>morph</Code> axis: 0 is its resting form, 1 is a distinctly
		different but related one. Combine it with <Code>transition</Code> to ease between the two and
		signal a state change, whatever pattern is in use.
	</Text>

	<div class="controls">
		<div class="pal">
			{#each Object.keys(palettes) as name}
				<button
					type="button"
					class:on={palette === name}
					onclick={() => (palette = name as PaletteName)}
				>
					{name}
				</button>
			{/each}
		</div>
		<label class="morph">
			<span>morph {morph.toFixed(2)}</span>
			<input type="range" min="0" max="1" step="0.01" bind:value={morph} />
		</label>
	</div>

	<div class="patterns">
		{#each PATTERN_NAMES as name}
			<figure>
				<div class="tile">
					<Glow pattern={name} colors={[...palettes[palette]]} {morph} />
				</div>
				<figcaption>
					<Code>{name}</Code>
					<span>{PATTERN_DESCRIPTIONS[name]}</span>
				</figcaption>
			</figure>
		{/each}
	</div>
</Card>

<Card title="Ribbon variations" id="variations">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Different colour ramps and the <Code>ribbon</Code> parameter for discrete strip blending.
	</Text>
	<div style="display: grid; gap: 1rem;">
		<div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden;">
			<Glow colors={['#1a0033', '#7c3aed', '#ec4899', '#f97316', '#fde047']} rotation={30} zoom={7} />
		</div>
		<div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden;">
			<Glow
				colors={['#001b2e', '#006d77', '#83c5be', '#00d2ff']}
				bgColor="#04121a"
				ribbon={0.85}
				ribbonWidth={1.3}
				rotation={68}
				zoom={11}
			/>
		</div>
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { Glow } from 'glow-ui';
</script>

<Glow
  pattern="aurora"
  colors={['#700000', '#008cff', '#75daff', '#ff0026', '#ff3626']}
  rotation={52}
  zoom={9}
>
  <YourContent />
</Glow>`}
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
			{ prop: 'pattern', type: 'PatternName', default: "'fold'", description: 'Which shader to draw — see Patterns above' },
			{ prop: 'colors', type: 'string[]', default: "['#700000', …]", description: 'Up to 5 hex colour stops, darkest → hottest' },
			{ prop: 'bgColor', type: 'string', default: "'#121212'", description: 'Gap colour between the folded sheets' },
			{ prop: 'shadowColor', type: 'string', default: "'#0a1c2a'", description: 'Shadow edge tint' },
			{ prop: 'softness', type: 'number', default: '1', description: 'Edge blur, 0–2' },
			{ prop: 'saturation', type: 'number', default: '1', description: '0 = mono, 1 = natural, up to 2' },
			{ prop: 'rotation', type: 'number', default: '52', description: 'Drape angle in degrees' },
			{ prop: 'zoom', type: 'number', default: '9', description: 'Sheet size, 4–18' },
			{ prop: 'morph', type: 'number', default: '0', description: 'Morphs any pattern into a related second form, 0–1 — animate with transition' },
			{ prop: 'ribbon', type: 'number', default: '0', description: 'Discrete strip blending, 0–1 (fold only; adds to morph)' },
			{ prop: 'ribbonWidth', type: 'number', default: '1', description: 'Strip width multiplier (fold only)' },
			{ prop: 'noise', type: 'number', default: '0', description: 'Ordered dithering strength, 0–1' },
			{ prop: 'speed', type: 'number', default: '1', description: 'Animation speed (0 = frozen)' },
			{ prop: 'maxPixelCount', type: 'number', default: '1440000', description: 'Render resolution cap' }
		]}
	/>
</Card>

<Card title="Accessibility" id="accessibility">
	<Text>
		Glow respects the <code>prefers-reduced-motion</code> media query — when reduced motion is
		enabled the shader renders a single frozen frame instead of animating.
	</Text>
</Card>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.5rem;
		margin-bottom: 1rem;
	}
	.pal {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.morph {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.78rem;
		opacity: 0.75;
	}
	.morph span {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.morph input {
		width: 150px;
	}
	.pal button {
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		padding: 0.35rem 0.7rem;
		font: inherit;
		font-size: 0.78rem;
		text-transform: capitalize;
		cursor: pointer;
	}
	.pal button:hover { border-color: rgba(255, 255, 255, 0.28); }
	.pal button.on { border-color: currentColor; }

	.patterns {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}
	.patterns figure { margin: 0; }
	.tile {
		position: relative;
		aspect-ratio: 16 / 9;
		border-radius: 10px;
		overflow: hidden;
		background: #05070b;
	}
	.patterns figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-top: 0.5rem;
	}
	.patterns figcaption span {
		font-size: 0.75rem;
		line-height: 1.4;
		opacity: 0.62;
	}
</style>
