<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Section from '$lib/typography/Section.svelte';
	import Markdown from '$lib/typography/Markdown.svelte';
	import Card from "$lib/card/Card.svelte";
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	let advancedOpen = $state(false);

	const markdownSource = `## Release notes

Shipped **three** things this week, one of them _actually_ hard:

- A new \`Markdown\` renderer
- Fenced code blocks with highlighting
- [Links](https://svelte.dev) and inline code

> Blockquotes render too, for when a comment quotes another comment.

\`\`\`ts
const blocks = parseBlocks(source);
\`\`\`

---

That's it.`;
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Typography | Glow UI</title></svelte:head>

<Heading level={1}>Typography</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A comprehensive typography system with headings and text components for consistent,
		accessible, and beautiful content.
	</Text>

	<Card title="Heading Examples" id="heading-examples">
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
	</Card>

	<Card title="Text Sizes" id="text-sizes">
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
	</Card>

	<Card title="Text Variants" id="text-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Three color variants for different levels of importance
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text variant="primary">Primary text - Standard readable text</Text>
			<Text variant="secondary">Secondary text - Less prominent information</Text>
			<Text variant="muted">Muted text - Subtle background information</Text>
		</div>
	</Card>

	<Card title="Text Weights" id="text-weights">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Four weight options for different levels of emphasis
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text weight="normal">Normal weight - Regular text</Text>
			<Text weight="medium">Medium weight - Slightly emphasized</Text>
			<Text weight="semibold">Semibold weight - Emphasized text</Text>
			<Text weight="bold">Bold weight - Strong emphasis</Text>
		</div>
	</Card>

	<Card title="Combining Properties" id="combining-properties">
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
	</Card>

	<Card title="Link" id="link">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Anchors with three prominence variants and three underline modes. <Code>external</Code> adds
			<Code>target="_blank"</Code>, the right <Code>rel</Code> for it, and a trailing
			<Code>ExternalLink</Code> glyph so the reader knows they're leaving.
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text>
				A <Link href="/components/typography">default link</Link>, a
				<Link href="/components/typography" variant="muted">muted link</Link>, and a
				<Link href="/components/typography" variant="subtle">subtle link</Link> inline in a
				sentence.
			</Text>
			<Text>
				Underline <Link href="/components/typography" underline="always">always</Link>,
				<Link href="/components/typography" underline="hover">on hover</Link> (the default), or
				<Link href="/components/typography" underline="never">never</Link>.
			</Text>
			<Text>
				With a leading icon: <Link href="/components/typography" icon="BookOpen">Read the docs</Link>
			</Text>
			<Text>
				External: <Link href="https://svelte.dev" external>svelte.dev</Link>
			</Text>
		</div>
		<CodeBlock
			language="svelte"
			code={`<Link href="/docs">Read the docs</Link>
<Link href="/docs" variant="muted" underline="always">Muted</Link>
<Link href="/docs" icon="BookOpen">With an icon</Link>
<Link href="https://svelte.dev" external>Opens in a new tab</Link>`}
		/>
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'href', type: 'string', default: '-', description: 'Destination. Omit for a click-only affordance.' },
				{ prop: 'variant', type: "'default' | 'muted' | 'subtle'", default: "'default'", description: 'Prominence.' },
				{ prop: 'underline', type: "'always' | 'hover' | 'never'", default: "'hover'", description: 'When the underline shows.' },
				{ prop: 'external', type: 'boolean', default: 'false', description: 'Opens in a new tab with rel="noopener noreferrer" and a trailing glyph.' },
				{ prop: 'icon', type: 'IconProp', default: '-', description: 'Leading icon.' },
				{ prop: 'onclick', type: '(e: MouseEvent) => void', default: '-', description: 'Click handler.' }
			]}
		/>
	</Card>

	<Card title="Kbd" id="kbd">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A keycap for documenting shortcuts. Sized in <Code>em</Code>, so it stays proportional to the
			text it sits in.
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Text>
				Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to open the command palette, or <Kbd>Esc</Kbd> to dismiss it.
			</Text>
			<Text size="sm">
				Small variant, for dense UI: <Kbd size="sm">⇧</Kbd><Kbd size="sm">Tab</Kbd>
			</Text>
		</div>
		<CodeBlock
			language="svelte"
			code={`Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to search.

<!-- Dense contexts -->
<Kbd size="sm">Esc</Kbd>`}
		/>
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[{ prop: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Keycap size.' }]}
		/>
	</Card>

	<Card title="Section" id="section">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A titled content block: heading, optional subtitle, icon, count badge, and a right-aligned
			actions slot. Set <Code>collapsible</Code> and the whole header becomes a toggle.
		</Text>
		<Section title="Members" subtitle="People with access to this workspace" icon="Users" count={3}>
			<Text size="sm" variant="secondary">Section content sits below the header.</Text>
		</Section>

		<div style="margin-top: 1.5rem;">
			<Section title="Advanced" icon="Settings" collapsible bind:open={advancedOpen}>
				<Text size="sm" variant="secondary">
					Collapsed by clicking the header. Bound state: <Code>{advancedOpen ? 'open' : 'closed'}</Code>
				</Text>
			</Section>
		</div>

		<div style="margin-top: 1.5rem;">
			<Section title="With actions" subtitle="The actions snippet renders before the chevron">
				{#snippet actions()}
					<Link href="/components/typography" variant="muted">Manage</Link>
				{/snippet}
				<Text size="sm" variant="secondary">Body.</Text>
			</Section>
		</div>

		<CodeBlock
			language="svelte"
			code={`<script lang="ts">
  import { Section } from 'glow-ui';

  let open = $state(true);
</script>

<Section title="Members" subtitle="Who can access this" icon="Users" count={3}>
  <MemberList />
</Section>

<Section title="Advanced" collapsible bind:open>
  {#snippet actions()}
    <Button variant="ghost" icon="RotateCcw" />
  {/snippet}
  <AdvancedSettings />
</Section>`}
		/>
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'title', type: 'string', default: 'required', description: 'Section heading.' },
				{ prop: 'subtitle', type: 'string', default: '-', description: 'Supporting line under the title.' },
				{ prop: 'icon', type: 'IconProp', default: '-', description: 'Icon before the title.' },
				{ prop: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level used for the title.' },
				{ prop: 'count', type: 'number', default: '-', description: 'Numeric badge next to the title.' },
				{ prop: 'collapsible', type: 'boolean', default: 'false', description: 'Renders a chevron and makes the header a button.' },
				{ prop: 'open', type: 'boolean', default: 'true', description: 'Bindable open state when collapsible.' },
				{ prop: 'actions', type: 'Snippet', default: '-', description: 'Right-aligned slot, rendered before the chevron.' },
				{ prop: 'onToggle', type: '(open: boolean) => void', default: '-', description: 'Fired when the header toggles.' }
			]}
		/>
		<Text size="sm" variant="secondary" style="margin-top: 1rem;">
			Not to be confused with <Code>SettingsSection</Code>, the form-layout container documented on
			the <Link href="/components/settings">Settings</Link> page.
		</Text>
	</Card>

	<Card title="Markdown" id="markdown">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			A small, dependency-free renderer for the subset of Markdown that shows up in user-authored
			content: headings, paragraphs, lists, blockquotes, horizontal rules, inline emphasis, links,
			inline code, and fenced code blocks (which render through
			<Link href="/components/code">CodeBlock</Link>, syntax highlighting included). It is not a
			full CommonMark implementation — no tables, footnotes, or reference links.
		</Text>
		<div class="md-demo">
			<Markdown source={markdownSource} />
		</div>
		<CodeBlock
			language="svelte"
			code={`<script lang="ts">
  import { Markdown } from 'glow-ui';

  let { comment } = $props();
</script>

<Markdown source={comment.body} />`}
		/>
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'source', type: 'string', default: 'required', description: 'Markdown text to render.' },
				{ prop: 'class', type: 'string', default: '-', description: 'Extra class on the wrapper.' },
				{ prop: 'style', type: 'string', default: '-', description: 'Inline style on the wrapper.' }
			]}
		/>
	</Card>

	<Card title="Usage" id="usage">
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
	</Card>

	<Card title="Heading Props" id="heading-props">
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
	</Card>

	<Card title="Text Props" id="text-props">
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
	</Card>

	<Card title="Type Scale" id="type-scale">
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
	</Card>

	<Card title="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>📏 Modular type scale for visual consistency</Text></li>
			<li><Text>🎨 Multiple size, weight, and color variants</Text></li>
			<li><Text>📖 Optimized line heights for readability</Text></li>
			<li><Text>🔗 ID support for anchor links</Text></li>
			<li><Text>♿ Semantic HTML with proper heading hierarchy</Text></li>
			<li><Text>🎯 Flexible composition of properties</Text></li>
			<li><Text>📱 Responsive and mobile-optimized</Text></li>
		</ul>
	</Card>

<style lang="scss">
	.md-demo {
		padding: 1rem 1.25rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		background: var(--glow-bg-surface-element);
		margin-bottom: 1rem;
	}
</style>
