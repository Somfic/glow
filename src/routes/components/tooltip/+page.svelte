<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import { tooltip } from '$lib/tooltip/tooltip.svelte.js';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Tooltip"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Tooltip', href: '/components/tooltip' }
	]}
>
	<Heading level={1}>Tooltip</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A unique tooltip implementation that displays inside the custom cursor, creating a seamless
		and elegant user experience.
	</Text>

	<Group label="Basic Tooltips" id="basic-tooltips">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Hover over elements to see tooltips appear inside the cursor
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
			<button class="demo-btn" use:tooltip={'This is a tooltip on top'}>Hover me (top)</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on bottom', position: 'bottom' }}
			>
				Hover me (bottom)
			</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on left', position: 'left' }}
			>
				Hover me (left)
			</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on right', position: 'right' }}
			>
				Hover me (right)
			</button>
		</div>
	</Group>

	<Group label="Tooltips on Any Element" id="tooltip-on-any-element">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			The tooltip action works on any HTML element, not just buttons
		</Text>
		<div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
			<span
				class="demo-icon"
				use:tooltip={'Tooltips work on any element!'}
				role="img"
				aria-label="Info"
			>
				ℹ️
			</span>
			<span class="demo-text" use:tooltip={'Even plain text!'}>Hover over this text</span>
			<div
				class="demo-box"
				use:tooltip={'And custom elements too!'}
				role="button"
				tabindex="0"
			>
				Hover me
			</div>
		</div>
	</Group>

	<Group label="Tooltips with Emojis" id="tooltip-with-emojis">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Tooltips support emojis and special characters
		</Text>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<button class="demo-btn" use:tooltip={'Tooltip shows inside cursor!'}>
				Hover for tooltip
			</button>
			<button class="demo-btn" use:tooltip={'Cursor expands to show this message'}>
				Another tooltip
			</button>
			<button class="demo-btn" use:tooltip={'✨ Works with emojis too!'}> With emoji </button>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="simple-string">Simple String Tooltip</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { tooltip } from 'glow-ui';
</script>

<button use:tooltip={'Simple tooltip text'}>
  Hover me
</button>`}
		/>

		<Heading level={3} id="with-options">Tooltip with Options</Heading>
		<CodeBlock
			language="svelte"
			code={`<button use:tooltip={{
  content: 'Tooltip content',
  position: 'bottom'
}}>
  Hover me
</button>`}
		/>

		<Heading level={3} id="on-any-element">On Any Element</Heading>
		<CodeBlock
			language="svelte"
			code={`<span use:tooltip={'Info tooltip'}>
  ℹ️
</span>

<div use:tooltip={'Box tooltip'}>
  Custom element
</div>`}
		/>
	</Group>

	<Group label="Tooltip Options" id="options">
		<Table
			variant="simple"
			columns={[
				{ key: 'option', label: 'Option', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ option: 'content', type: 'string', default: 'required', description: 'Tooltip text content' },
				{ option: 'position', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Tooltip position (Note: renders in cursor)' }
			]}
		/>
	</Group>

	<Group label="How It Works" id="how-it-works">
		<Text>
			Unlike traditional tooltips that float above elements, Glow's tooltip system integrates
			with the custom cursor component. When you hover over an element with a tooltip:
		</Text>
		<ol style="margin-left: 1.5rem; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>The cursor expands to accommodate the tooltip text</Text></li>
			<li><Text>The tooltip content appears inside the cursor itself</Text></li>
			<li><Text>The cursor follows your mouse with the tooltip visible</Text></li>
			<li><Text>When you move away, the cursor returns to its normal state</Text></li>
		</ol>
		<Text style="margin-top: 1rem;">
			This creates a more cohesive and visually interesting experience compared to traditional
			tooltip implementations.
		</Text>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>✨ Unique cursor-integrated design</Text></li>
			<li><Text>🎯 Works on any HTML element via Svelte action</Text></li>
			<li><Text>📝 Simple string or options object API</Text></li>
			<li><Text>🎨 Smooth transitions and animations</Text></li>
			<li><Text>🔤 Full emoji and special character support</Text></li>
			<li><Text>📱 Responsive and mobile-friendly</Text></li>
			<li><Text>♿ Accessible with proper ARIA attributes</Text></li>
		</ul>
	</Group>
</Page>

<style>
	.demo-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #30313c;
		border-radius: 8px;
		background: #1e1f29;
		color: #eee;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.15s;
	}

	.demo-btn:hover {
		background: #2a2b37;
	}

	.demo-icon {
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.demo-text {
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: rgba(139, 109, 237, 0.1);
		cursor: pointer;
		transition: background 0.15s;
	}

	.demo-text:hover {
		background: rgba(139, 109, 237, 0.2);
	}

	.demo-box {
		padding: 1rem 1.5rem;
		border: 2px solid #8b6ded;
		border-radius: 8px;
		background: rgba(139, 109, 237, 0.05);
		cursor: pointer;
		transition: all 0.15s;
	}

	.demo-box:hover {
		background: rgba(139, 109, 237, 0.15);
		border-color: #a78ef0;
	}
</style>
