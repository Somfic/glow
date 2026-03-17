<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import GradientMesh from '$lib/gradient/GradientMesh.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Gradient Mesh | Glow UI</title></svelte:head>

<Heading level={1}>Gradient Mesh Background</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		An animated gradient mesh background with smooth, organic flowing motion. Perfect for creating
		engaging, dynamic backgrounds.
	</Text>

	<Group label="Interactive Demo" id="gradient-demo">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Watch the gradient blobs flow and pulse in smooth, organic patterns
		</Text>
		<div style="position: relative; height: 400px; border-radius: 12px; overflow: hidden;">
			<GradientMesh
				colors={['#8B6DED', '#FF006E', '#06FFA5', '#FFD60A']}
				intensity={0.6}
				speed={1.2}
			>
				<div
					style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem;"
				>
					<div
						style="background: rgba(30, 31, 41, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 2rem; max-width: 500px;"
					>
						<Heading level={3} id="gradient-mesh-demo">Flowing Gradient Mesh</Heading>
						<Text>
							Watch the gradient blobs flow and pulse in smooth, organic patterns. Each blob
							follows its own orbital path, creating a constantly-evolving ambient background.
						</Text>
						<div style="margin-top: 1rem;">
							<Button label="Beautiful!" variant="primary" />
						</div>
					</div>
				</div>
			</GradientMesh>
		</div>
	</Group>

	<Group label="Color Variations" id="color-variations">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Customize the gradient with different color combinations
		</Text>
		<div style="display: grid; gap: 1rem;">
			<div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden;">
				<GradientMesh colors={['#ff6b6b', '#ee5a6f', '#c44569', '#8b4789']} intensity={0.5}>
					<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
						<Text size="lg" weight="bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);"
							>Warm Sunset</Text
						>
					</div>
				</GradientMesh>
			</div>
			<div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden;">
				<GradientMesh colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']} intensity={0.5}>
					<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
						<Text size="lg" weight="bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);"
							>Cool Purple</Text
						>
					</div>
				</GradientMesh>
			</div>
			<div style="position: relative; height: 200px; border-radius: 12px; overflow: hidden;">
				<GradientMesh colors={['#11998e', '#38ef7d', '#00d2ff', '#3a7bd5']} intensity={0.5}>
					<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
						<Text size="lg" weight="bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);"
							>Ocean Breeze</Text
						>
					</div>
				</GradientMesh>
			</div>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { GradientMesh } from 'glow-ui';
</script>

<GradientMesh
  colors={['#8B6DED', '#FF006E', '#06FFA5', '#FFD60A']}
  intensity={0.6}
  speed={1.2}
>
  <YourContent />
</GradientMesh>`}
		/>
	</Group>

	<Group label="Props" id="props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'colors', type: 'string[]', default: 'required', description: 'Array of hex color codes (minimum 3 colors)' },
				{ prop: 'intensity', type: 'number', default: '0.5', description: 'Blob opacity (0-1)' },
				{ prop: 'speed', type: 'number', default: '1.0', description: 'Animation speed multiplier (0.5-2.0 recommended)' }
			]}
		/>
	</Group>

	<Group label="Customization Examples" id="customization">
		<Heading level={3} id="slow-subtle">Slow & Subtle</Heading>
		<CodeBlock
			language="svelte"
			code={`<GradientMesh
  colors={['#667eea', '#764ba2', '#f093fb']}
  intensity={0.3}
  speed={0.5}
>
  <Content />
</GradientMesh>`}
		/>

		<Heading level={3} id="fast-vibrant">Fast & Vibrant</Heading>
		<CodeBlock
			language="svelte"
			code={`<GradientMesh
  colors={['#ff0080', '#ff8c00', '#40e0d0', '#ba55d3']}
  intensity={0.8}
  speed={1.8}
>
  <Content />
</GradientMesh>`}
		/>

		<Heading level={3} id="monochrome">Monochrome</Heading>
		<CodeBlock
			language="svelte"
			code={`<GradientMesh
  colors={['#667eea', '#667eea', '#667eea', '#667eea']}
  intensity={0.4}
  speed={1.0}
>
  <Content />
</GradientMesh>`}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li>
				<Text>🎨 Customizable colors - pass any array of hex colors</Text>
			</li>
			<li>
				<Text>⚡ Smooth 60fps animation using requestAnimationFrame</Text>
			</li>
			<li>
				<Text>🌊 Organic flowing motion - blobs move in orbital patterns</Text>
			</li>
			<li>
				<Text>💫 Gentle pulsing effect - blobs subtly grow and shrink</Text>
			</li>
			<li>
				<Text>🎚️ Adjustable intensity (0-1) for blob opacity</Text>
			</li>
			<li>
				<Text>🏃 Speed control (0-2) for animation speed</Text>
			</li>
			<li>
				<Text>♿ Respects prefers-reduced-motion for accessibility</Text>
			</li>
			<li>
				<Text>📱 Works on desktop and mobile</Text>
			</li>
			<li>
				<Text>🎭 Perfect for hero sections, backgrounds, and cards</Text>
			</li>
		</ul>
	</Group>

	<Group label="Best Practices" id="best-practices">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li>
				<Text><strong>Colors:</strong> Use 3-5 colors for best visual results</Text>
			</li>
			<li>
				<Text
					><strong>Intensity:</strong> Keep between 0.3-0.7 for subtle backgrounds, 0.6-0.9 for bold
					statements</Text
				>
			</li>
			<li>
				<Text><strong>Speed:</strong> 0.8-1.5 is the sweet spot for most use cases</Text>
			</li>
			<li>
				<Text
					><strong>Content:</strong> Use backdrop-filter: blur() on content for better readability</Text
				>
			</li>
			<li>
				<Text
					><strong>Performance:</strong> Limit to 1-2 instances per page to maintain smooth
					performance</Text
				>
			</li>
		</ul>
	</Group>

	<Group label="Accessibility" id="accessibility">
		<Text>
			The gradient mesh automatically respects the <code>prefers-reduced-motion</code> media query.
			Users who have enabled reduced motion in their system preferences will see a static gradient
			instead of the animated version.
		</Text>
	</Group>
