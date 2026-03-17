<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import Group from '$lib/group/Group.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import GradientMesh from '$lib/gradient/GradientMesh.svelte';
	import Card from '$lib/card/Card.svelte';
</script>

<svelte:head><title>Home | Glow UI</title></svelte:head>

<div style="position: relative; margin-bottom: 4rem;">
		<div
			style="position: relative; height: 400px; border-radius: 12px; overflow: hidden; margin-bottom: 2rem;"
		>
			<GradientMesh
				colors={['#8B6DED', '#FF006E', '#06FFA5', '#FFD60A']}
				intensity={0.6}
				speed={1.2}
			>
				<div
					style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem;"
				>
					<div
						style="background: rgba(30, 31, 41, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 3rem; max-width: 600px; text-align: center;"
					>
						<Heading level={1} style="margin-bottom: 1rem;">Glow UI</Heading>
						<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
							A modern, accessible UI component library for Svelte 5 with custom cursor effects,
							gradient animations, and beautiful components.
						</Text>
						<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
							<Button
								label="Browse Components"
								variant="primary"
								onclick={() => (window.location.href = '/components')}
							/>
							<Button
								label="View on GitHub"
								variant="secondary"
								icon="Github"
								onclick={() => window.open('https://github.com/Somfic/glow', '_blank')}
							/>
						</div>
					</div>
				</div>
			</GradientMesh>
		</div>
	</div>

	<Group label="Features">
		<div
			style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem;"
		>
			<Card icon="Sparkles" accentColor="rgba(139, 109, 237">
				<Heading level={3}>Custom Cursor</Heading>
				<Text variant="secondary" size="sm">
					Context-aware cursor that morphs based on what you're hovering - buttons, text,
					checkboxes, and more.
				</Text>
			</Card>

			<Card icon="Palette" accentColor="rgba(34, 197, 94">
				<Heading level={3}>Beautiful Design</Heading>
				<Text variant="secondary" size="sm">
					Modern, clean design with smooth animations, gradients, and thoughtful interactions.
				</Text>
			</Card>

			<Card icon="Zap" accentColor="rgba(59, 130, 246">
				<Heading level={3}>High Performance</Heading>
				<Text variant="secondary" size="sm">
					Virtual scrolling for large datasets, optimized animations, and efficient rendering.
				</Text>
			</Card>

			<Card icon="Accessibility" accentColor="rgba(249, 115, 22">
				<Heading level={3}>Accessible</Heading>
				<Text variant="secondary" size="sm">
					Built with WCAG 2.1 guidelines in mind. Keyboard navigation, screen reader support, and
					semantic HTML.
				</Text>
			</Card>

			<Card icon="Wrench" accentColor="rgba(236, 72, 153">
				<Heading level={3}>TypeScript</Heading>
				<Text variant="secondary" size="sm">
					Fully typed with TypeScript for better developer experience and autocomplete.
				</Text>
			</Card>

			<Card icon="Target" accentColor="rgba(168, 85, 247">
				<Heading level={3}>Svelte 5</Heading>
				<Text variant="secondary" size="sm">
					Built for Svelte 5 with runes, snippets, and modern reactive patterns.
				</Text>
			</Card>
		</div>
	</Group>

	<Group label="Quick Start">
		<Text variant="secondary" style="margin-bottom: 1rem;">
			Get started with Glow UI in your Svelte project.
		</Text>

		<Heading level={3}>Installation</Heading>
		<CodeBlock
			language="bash"
			code={`npm install glow-ui
# or
bun add glow-ui`}
		/>

		<Heading level={3} style="margin-top: 2rem;">Usage</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Button, Input, Table } from 'glow-ui';

  let name = $state('');
</script>

<Input
  type="text"
  label="Name"
  bind:value={name}
  placeholder="Enter your name"
/>

<Button label="Submit" variant="primary" />`}
		/>
	</Group>

	<Group label="Component Categories">
		<div
			style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;"
		>
			<Card
				href="/components"
				title="Form & Input"
				description="Buttons, text inputs, selects, checkboxes, and more"
			/>

			<Card
				href="/components"
				title="Data Display"
				description="Tables, lists, cards with sorting and virtual scrolling"
			/>

			<Card
				href="/components"
				title="Navigation"
				description="Tabs, table of contents, breadcrumbs"
			/>

			<Card
				href="/components"
				title="Feedback"
				description="Modals, toasts, tooltips, banners"
			/>
		</div>

		<div style="text-align: center; margin-top: 2rem;">
			<Button
				label="View All Components"
				variant="primary"
				onclick={() => (window.location.href = '/components')}
			/>
		</div>
	</Group>
