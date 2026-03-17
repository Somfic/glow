<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import TableOfContents from '$lib/navigation/TableOfContents.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Table of Contents | Glow UI</title></svelte:head>

<div style="display: flex; gap: 2rem;">
		<div style="flex: 1; min-width: 0;">
			<Heading level={1}>Table of Contents</Heading>
			<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
				A sticky table of contents component that automatically detects headings and highlights
				the active section. Perfect for documentation pages and long-form content.
			</Text>

			<Group label="Introduction" id="introduction">
				<Text>
					The Table of Contents component provides automatic navigation for your page. It scans
					the page for headings, builds a hierarchical navigation structure, and highlights the
					current section as you scroll.
				</Text>
				<Text style="margin-top: 0.75rem;">
					Look to the right side of this page to see the component in action! It automatically
					detected all the headings on this page and created a navigation menu.
				</Text>
			</Group>

			<Group label="Automatic Detection" id="automatic-detection">
				<Text>
					By default, the component automatically detects all headings in the page. You can
					control which heading levels to include and customize the behavior.
				</Text>

				<Heading level={3} id="how-it-works">How It Works</Heading>
				<Text>
					The component uses a MutationObserver to watch for changes in the DOM and
					IntersectionObserver to track which heading is currently visible in the viewport.
				</Text>

				<Heading level={3} id="sticky-positioning">Sticky Positioning</Heading>
				<Text>
					The table of contents stays fixed in position as you scroll, making it always
					accessible. On smaller screens (below 1200px), it automatically hides to save space.
				</Text>
			</Group>

			<Group label="Usage" id="usage">
				<Heading level={3} id="auto-detect-usage">Automatic Detection (Recommended)</Heading>
				<CodeBlock
					language="svelte"
					code={`<script>
  import { TableOfContents } from 'glow-ui';
</script>

<div style="display: flex; gap: 2rem;">
  <main style="flex: 1;">
    <!-- Your content with headings -->
    <h1 id="intro">Introduction</h1>
    <h2 id="getting-started">Getting Started</h2>
    <h3 id="installation">Installation</h3>
  </main>

  <aside style="width: 250px;">
    <!-- Auto-detects headings from page -->
    <TableOfContents />
  </aside>
</div>`}
				/>

				<Heading level={3} id="manual-headings-usage">Manual Headings</Heading>
				<CodeBlock
					language="svelte"
					code={`<script>
  let headings = [
    { id: 'intro', text: 'Introduction', level: 1 },
    { id: 'setup', text: 'Setup', level: 2 },
    { id: 'config', text: 'Configuration', level: 3 }
  ];
</script>

<TableOfContents {headings} autoDetect={false} />`}
				/>

				<Heading level={3} id="custom-levels">Custom Heading Levels</Heading>
				<CodeBlock
					language="svelte"
					code={`<!-- Only include h2 and h3 headings -->
<TableOfContents levels={[2, 3]} />`}
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
						{ prop: 'autoDetect', type: 'boolean', default: 'true', description: 'Automatically detect headings from page' },
						{ prop: 'headings', type: 'Heading[]', default: '[]', description: 'Manual heading array (when autoDetect is false)' },
						{ prop: 'levels', type: 'number[]', default: '[1, 2, 3]', description: 'Which heading levels to include (1-6)' }
					]}
				/>
			</Group>

			<Group label="Heading Type" id="heading-type">
				<CodeBlock
					language="typescript"
					code={`interface Heading {
  id: string;      // Element ID for linking
  text: string;    // Heading text content
  level: number;   // Heading level (1-6)
}`}
				/>
			</Group>

			<Group label="Styling & Layout" id="styling">
				<Heading level={3} id="recommended-layout">Recommended Layout</Heading>
				<CodeBlock
					language="svelte"
					code={`<div style="display: flex; gap: 2rem;">
  <!-- Main content -->
  <div style="flex: 1; min-width: 0;">
    <YourContent />
  </div>

  <!-- Table of contents sidebar -->
  <aside style="width: 250px; flex-shrink: 0;">
    <TableOfContents />
  </aside>
</div>

<style>
  /* Hide on smaller screens */
  @media (max-width: 1200px) {
    aside {
      display: none;
    }
  }
</style>`}
				/>

				<Heading level={3} id="sticky-behavior">Sticky Behavior</Heading>
				<Text>
					The component uses <code>position: sticky</code> internally, so it will stick to the top
					of the viewport as you scroll. Make sure the parent container has enough height for the
					sticky behavior to work properly.
				</Text>
			</Group>

			<Group label="Features" id="features">
				<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
					<li>
						<Text>📍 Sticky positioning on the right side</Text>
					</li>
					<li>
						<Text>🎯 Auto-detects headings from the page</Text>
					</li>
					<li>
						<Text>📊 Indentation based on heading level</Text>
					</li>
					<li>
						<Text>✨ Highlights active section while scrolling</Text>
					</li>
					<li>
						<Text>🔗 Smooth scroll to sections on click</Text>
					</li>
					<li>
						<Text>⚙️ Customizable heading levels to include</Text>
					</li>
					<li>
						<Text>📱 Responsive (hides on mobile)</Text>
					</li>
					<li>
						<Text>🔄 Automatically updates when content changes</Text>
					</li>
					<li>
						<Text>♿ Accessible with proper ARIA attributes</Text>
					</li>
				</ul>
			</Group>

			<Group label="Best Practices" id="best-practices">
				<Heading level={3} id="heading-ids">Always Add IDs to Headings</Heading>
				<Text>
					For the table of contents to work, your headings must have unique <code>id</code> attributes:
				</Text>
				<CodeBlock
					language="svelte"
					code={`<Heading level={1} id="introduction">Introduction</Heading>
<Heading level={2} id="getting-started">Getting Started</Heading>`}
				/>

				<Heading level={3} id="heading-hierarchy">Maintain Proper Heading Hierarchy</Heading>
				<Text>
					Use heading levels in order (h1, h2, h3) without skipping levels. This is important for
					both accessibility and the visual hierarchy in the table of contents.
				</Text>

				<Heading level={3} id="responsive-design">Consider Mobile Users</Heading>
				<Text>
					On smaller screens, the table of contents is typically hidden. Make sure your content is
					still navigable without it, perhaps with a jump-to-section menu or clear section breaks.
				</Text>
			</Group>

			<Group label="Technical Implementation" id="technical-implementation">
				<Text>
					The component uses several modern web APIs to provide a smooth, performant experience:
				</Text>
				<ul style="margin-left: 1.5rem; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
					<li>
						<Text
							><strong>MutationObserver:</strong> Watches for DOM changes to update the heading list</Text
						>
					</li>
					<li>
						<Text
							><strong>IntersectionObserver:</strong> Efficiently tracks which heading is visible</Text
						>
					</li>
					<li>
						<Text><strong>Smooth Scrolling:</strong> Native browser smooth scroll behavior</Text>
					</li>
					<li>
						<Text><strong>Sticky Positioning:</strong> CSS sticky for fixed sidebar behavior</Text>
					</li>
				</ul>
			</Group>
		</div>

		<!-- Table of Contents Sidebar -->
		<aside class="toc-sidebar">
			<TableOfContents />
		</aside>
	</div>

<style>
	.toc-sidebar {
		width: 250px;
		flex-shrink: 0;
	}

	/* Hide table of contents on smaller screens */
	@media (max-width: 1200px) {
		.toc-sidebar {
			display: none;
		}
	}
</style>
