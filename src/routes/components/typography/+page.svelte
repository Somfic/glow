<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Typography"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Typography', href: '/components/typography' }
	]}
>
	<Heading level={1}>Typography</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A comprehensive typography system with headings and text components for consistent,
		accessible, and beautiful content.
	</Text>

	<Group label="Heading Examples" id="heading-examples">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Six levels of headings for document hierarchy
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<Heading level={1}>Heading 1 - Main Title</Heading>
			<Heading level={2}>Heading 2 - Section Title</Heading>
			<Heading level={3}>Heading 3 - Subsection</Heading>
			<Heading level={4}>Heading 4 - Component Title</Heading>
			<Heading level={5}>Heading 5 - Small Heading</Heading>
			<Heading level={6}>Heading 6 - Minor Heading</Heading>
		</div>
	</Group>

	<Group label="Text Sizes" id="text-sizes">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Five size options for different emphasis levels
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text size="xl">Extra large text - For emphasis and introduction</Text>
			<Text size="lg">Large text - For secondary emphasis</Text>
			<Text size="base">Base text - Standard body text for most content</Text>
			<Text size="sm">Small text - For captions and secondary information</Text>
			<Text size="xs">Extra small text - For metadata and fine print</Text>
		</div>
	</Group>

	<Group label="Text Variants" id="text-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Three color variants for different levels of importance
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text variant="primary">Primary text - Standard readable text</Text>
			<Text variant="secondary">Secondary text - Less prominent information</Text>
			<Text variant="muted">Muted text - Subtle background information</Text>
		</div>
	</Group>

	<Group label="Text Weights" id="text-weights">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Four weight options for different levels of emphasis
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text weight="normal">Normal weight - Regular text</Text>
			<Text weight="medium">Medium weight - Slightly emphasized</Text>
			<Text weight="semibold">Semibold weight - Emphasized text</Text>
			<Text weight="bold">Bold weight - Strong emphasis</Text>
		</div>
	</Group>

	<Group label="Combining Properties" id="combining-properties">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Mix sizes, variants, and weights for rich typography
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<Text size="lg" weight="semibold">Introduction Paragraph</Text>
			<Text>
				This is a standard paragraph with normal text. It demonstrates how body text appears in
				the design system with proper line height and spacing. The text should be easily
				readable and comfortable to scan.
			</Text>
			<Text variant="secondary">
				This is secondary text that provides additional context or supporting information. It's
				less prominent but still readable.
			</Text>
			<Text size="sm" variant="muted">
				This is small muted text, perfect for metadata, timestamps, or other supporting
				information that should be present but not prominent.
			</Text>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="headings-usage">Headings</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Heading } from 'glow-ui';
</script>

<Heading level={1}>Main Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection Title</Heading>

<!-- With ID for linking -->
<Heading level={2} id="custom-id">Linkable Section</Heading>`}
		/>

		<Heading level={3} id="text-usage">Text Component</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Text } from 'glow-ui';
</script>

<!-- Size variants -->
<Text size="xl">Extra large text</Text>
<Text size="lg">Large text</Text>
<Text size="base">Base text (default)</Text>
<Text size="sm">Small text</Text>
<Text size="xs">Extra small text</Text>

<!-- Color variants -->
<Text variant="primary">Primary text (default)</Text>
<Text variant="secondary">Secondary text</Text>
<Text variant="muted">Muted text</Text>

<!-- Weight variants -->
<Text weight="normal">Normal weight (default)</Text>
<Text weight="medium">Medium weight</Text>
<Text weight="semibold">Semibold weight</Text>
<Text weight="bold">Bold weight</Text>

<!-- Combined -->
<Text size="lg" variant="secondary" weight="semibold">
  Combined properties
</Text>`}
		/>
	</Group>

	<Group label="Heading Props" id="heading-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: 'required', description: 'Heading level (renders h1-h6)' },
				{ prop: 'id', type: 'string', default: '-', description: 'ID for anchor links' }
			]}
		/>
	</Group>

	<Group label="Text Props" id="text-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'size', type: "'xs' | 'sm' | 'base' | 'lg' | 'xl'", default: "'base'", description: 'Text size' },
				{ prop: 'variant', type: "'primary' | 'secondary' | 'muted'", default: "'primary'", description: 'Color variant' },
				{ prop: 'weight', type: "'normal' | 'medium' | 'semibold' | 'bold'", default: "'normal'", description: 'Font weight' }
			]}
		/>
	</Group>

	<Group label="Type Scale" id="type-scale">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Font sizes follow a modular scale for visual harmony
		</Text>
		<Table
			variant="simple"
			columns={[
				{ key: 'component', label: 'Component' },
				{ key: 'size', label: 'Size' },
				{ key: 'lineHeight', label: 'Line Height' },
				{ key: 'useCase', label: 'Use Case' }
			]}
			data={[
				{ component: 'Heading 1', size: '2.5rem', lineHeight: '1.2', useCase: 'Page titles' },
				{ component: 'Heading 2', size: '2rem', lineHeight: '1.3', useCase: 'Major sections' },
				{ component: 'Heading 3', size: '1.5rem', lineHeight: '1.4', useCase: 'Subsections' },
				{ component: 'Text XL', size: '1.25rem', lineHeight: '1.6', useCase: 'Intro paragraphs' },
				{ component: 'Text LG', size: '1.125rem', lineHeight: '1.6', useCase: 'Emphasis text' },
				{ component: 'Text Base', size: '1rem', lineHeight: '1.6', useCase: 'Body text' },
				{ component: 'Text SM', size: '0.875rem', lineHeight: '1.5', useCase: 'Captions, labels' },
				{ component: 'Text XS', size: '0.75rem', lineHeight: '1.4', useCase: 'Metadata, fine print' }
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>📏 Modular type scale for visual consistency</Text></li>
			<li><Text>🎨 Multiple size, weight, and color variants</Text></li>
			<li><Text>📖 Optimized line heights for readability</Text></li>
			<li><Text>🔗 ID support for anchor links</Text></li>
			<li><Text>♿ Semantic HTML with proper heading hierarchy</Text></li>
			<li><Text>🎯 Flexible composition of properties</Text></li>
			<li><Text>📱 Responsive and mobile-optimized</Text></li>
		</ul>
	</Group>
</Page>
