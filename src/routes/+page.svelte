<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Card from "$lib/card/Card.svelte";
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import GradientMesh from '$lib/gradient/GradientMesh.svelte';
	import Flex from "$lib/layout/Flex.svelte";
	import Grid from '$lib/layout/Grid.svelte';

	type Feature = {
		icon: 'Sparkles' | 'Palette' | 'Zap' | 'Accessibility' | 'Wrench' | 'Target';
		title: string;
		description: string;
		accent: string;
	};

	// Card.accentColor expects a hex string; it appends alpha hex (1a / 4d)
	// internally. The previous values were `rgba(...)` literals which made
	// the resulting CSS invalid and skipped the accent treatment entirely.
	const features: Feature[] = [
		{ icon: 'Sparkles',      title: 'Custom Cursor',     description: "Context-aware cursor that morphs based on what you're hovering — buttons, text, checkboxes, and more.", accent: '#8B6DED' },
		{ icon: 'Palette',       title: 'Beautiful Design',  description: 'Modern, clean design with smooth animations, gradients, and thoughtful interactions.',                accent: '#22c55e' },
		{ icon: 'Zap',           title: 'High Performance',  description: 'Virtual scrolling for large datasets, optimized animations, and efficient rendering.',                accent: '#3b82f6' },
		{ icon: 'Accessibility', title: 'Accessible',        description: 'Built with WCAG 2.1 guidelines in mind. Keyboard navigation, screen reader support, semantic HTML.',  accent: '#f97316' },
		{ icon: 'Wrench',        title: 'TypeScript',        description: 'Fully typed for great editor autocomplete and refactor confidence across your app.',                  accent: '#ec4899' },
		{ icon: 'Target',        title: 'Svelte 5',          description: 'Built for Svelte 5 with runes, snippets, and modern reactive patterns.',                              accent: '#a855f7' }
	];
</script>

<svelte:head><title>Home | Glow UI</title></svelte:head>

<div class="hero">
		<GradientMesh
			colors={['#8B6DED', '#FF006E', '#06FFA5', '#FFD60A']}
			intensity={0.6}
			speed={1.2}
		>
			<div class="hero-inner">
				<Card class="hero-card" padding="lg">
					<Flex gap="md" align="center">
						<Heading level={1}>Glow UI</Heading>
						<Text size="lg" variant="secondary">
							A modern, accessible UI component library for Svelte 5 with custom cursor effects,
							gradient animations, and beautiful components.
						</Text>
						<Flex direction="horizontal" gap="sm" justify="center" wrap>
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
						</Flex>
					</Flex>
				</Card>
			</div>
		</GradientMesh>
	</div>

	<Card title="Features">
		<Grid min="250px" gap="lg">
			{#each features as feature}
				<Card
					title={feature.title}
					description={feature.description}
					icon={feature.icon}
					accentColor={feature.accent}
				/>
			{/each}
		</Grid>
	</Card>

	<Card title="Quick Start">
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
	</Card>

	<Card title="Component Categories">
		<Grid min="280px" gap="md">
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
		</Grid>

		<div class="all-components-cta">
			<Button
				label="View All Components"
				variant="primary"
				onclick={() => (window.location.href = '/components')}
			/>
		</div>
	</Card>

<style lang="scss">
	.hero {
		position: relative;
		height: 400px;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 4rem;
	}

	.hero-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
	}

	// Frosted-glass treatment on the hero card. Scoped to this page only.
	:global(.hero-card) {
		background: rgba(30, 31, 41, 0.8) !important;
		backdrop-filter: blur(10px);
		border-color: rgba(255, 255, 255, 0.1);
		max-width: 600px;
		text-align: center;
	}

	.all-components-cta {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}
</style>
