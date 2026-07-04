<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Glow from '$lib/glow/Glow.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
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
			{ prop: 'colors', type: 'string[]', default: "['#700000', …]", description: 'Up to 5 hex colour stops, darkest → hottest' },
			{ prop: 'bgColor', type: 'string', default: "'#121212'", description: 'Gap colour between the folded sheets' },
			{ prop: 'shadowColor', type: 'string', default: "'#0a1c2a'", description: 'Shadow edge tint' },
			{ prop: 'softness', type: 'number', default: '1', description: 'Edge blur, 0–2' },
			{ prop: 'saturation', type: 'number', default: '1', description: '0 = mono, 1 = natural, up to 2' },
			{ prop: 'rotation', type: 'number', default: '52', description: 'Drape angle in degrees' },
			{ prop: 'zoom', type: 'number', default: '9', description: 'Sheet size, 4–18' },
			{ prop: 'ribbon', type: 'number', default: '0', description: 'Discrete strip blending, 0–1' },
			{ prop: 'ribbonWidth', type: 'number', default: '1', description: 'Strip width multiplier' },
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
