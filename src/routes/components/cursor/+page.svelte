<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import Input from '$lib/input/Input.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import { tooltip } from '$lib/tooltip/tooltip.svelte.js';
	import { cursor } from '$lib/cursor/cursor.svelte.js';
	import Table from '$lib/data/Table.svelte';

	// Async action for loading demo
	async function simulateAsync() {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		alert('Action completed!');
	}
</script>

<Page
	title="Custom Cursor"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Cursor', href: '/components/cursor' }
	]}
>
	<Heading level={1}>Custom Cursor</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		An innovative custom cursor system that morphs based on context, showing icons, tooltips, and
		loading states directly in the cursor itself.
	</Text>

	<Group label="Interactive Demos" id="demos">
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<Text>
				Watch the white dot cursor transform as you move around! Hover over different elements
				to see the morphing animations. <strong>Click anywhere to see the cursor shrink!</strong>
			</Text>

			<div style="padding: 1.5rem; border: 2px solid #30313c; border-radius: 12px;">
				<Heading level={2} id="cursor-default">Default Dot</Heading>
				<Text variant="secondary">Move your cursor in this area - small white dot</Text>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #8B6DED; border-radius: 12px;">
				<Heading level={2} id="cursor-pointer">Pointer & Icon Mirroring</Heading>
				<Text variant="secondary" size="sm">
					All clickable elements are 32px - buttons with icons mirror them in cursor!
				</Text>
				<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
					<Button label="Regular button" />
					<Button icon="Heart" label="With icon" variant="secondary" />
					<Button icon="Trash" label="Delete" variant="ternary" />
					<Button icon="Info" />
					<Button icon="Volleyball" />
					<a href="#demo">plain link</a>
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #f97316; border-radius: 12px;">
				<Heading level={2} id="cursor-loading">Loading State</Heading>
				<Text variant="secondary" size="sm">Cursor shows spinner during async button actions</Text>
				<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
					<Button label="Click me (2s delay)" onclick={simulateAsync} />
					<Button icon="Download" label="Download" variant="secondary" onclick={simulateAsync} />
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #8B6DED; border-radius: 12px;">
				<Heading level={2} id="cursor-text-selection">Text Selection Line</Heading>
				<Text variant="secondary" size="sm">
					Cursor becomes a vertical white line matching text height for precise selection
				</Text>
				<div
					style="margin-top: 0.75rem; padding: 1rem; background: rgba(139, 109, 237, 0.1); border-radius: 8px;"
				>
					<Text>
						Try selecting this text! Click and drag to highlight, and watch the cursor
						transform into a thin vertical line. The line automatically adjusts to match the
						height of the text you're selecting, making it easier to see exactly where your
						selection boundary is. This works anywhere on the page where text can be selected.
					</Text>
					<div style="margin-top: 1rem;">
						<Text size="xl" weight="bold">Large text has a taller line!</Text>
					</div>
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #22c55e; border-radius: 12px;">
				<Heading level={2} id="cursor-copy">Copy Icon</Heading>
				<Text variant="secondary" size="sm">Hover shell commands to see copy icon in cursor</Text>
				<div style="margin-top: 0.75rem;">
					<CodeBlock
						language="bash"
						code={`npm install glow-ui
bun run dev`}
					/>
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #3b82f6; border-radius: 12px;">
				<Heading level={2} id="cursor-text">Text Cursor</Heading>
				<Input type="text" placeholder="Hover to see text I-beam icon" />
			</div>

			<div style="padding: 1.5rem; border: 2px solid #10b981; border-radius: 12px;">
				<Heading level={2} id="cursor-checkbox">Checkbox States</Heading>
				<Text variant="secondary" size="sm">Cursor shows checked/unchecked state dynamically</Text>
				<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem;">
					<Input type="checkbox" checkboxLabel="Unchecked - hover to see empty square" />
					<Input type="checkbox" checked={true} checkboxLabel="Checked - hover to see check mark" />
					<Input
						type="checkbox"
						indeterminate={true}
						checkboxLabel="Indeterminate - hover to see minus"
					/>
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #8b5cf6; border-radius: 12px;">
				<Heading level={2} id="cursor-toggle">Toggle States</Heading>
				<Text variant="secondary" size="sm">Cursor shows toggle position (left/right)</Text>
				<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem;">
					<Input type="toggle" toggleLabel="Off - hover to see toggle left" />
					<Input type="toggle" checked={true} toggleLabel="On - hover to see toggle right" />
				</div>
			</div>

			<div style="padding: 1.5rem; border: 2px solid #f59e0b; border-radius: 12px;">
				<Heading level={2} id="cursor-tooltip">Tooltip in Cursor</Heading>
				<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
					<button class="demo-btn" use:tooltip={'Tooltip shows inside cursor!'}>
						Hover for tooltip
					</button>
					<button class="demo-btn" use:tooltip={'Cursor expands to show this message'}>
						Another tooltip
					</button>
					<button class="demo-btn" use:tooltip={'✨ Works with emojis too!'}> With emoji </button>
				</div>
			</div>

			<div
				style="padding: 1.5rem; border: 2px solid #ec4899; border-radius: 12px;"
				use:cursor={{ state: 'copy', content: 'Custom content!' }}
			>
				<Heading level={2} id="cursor-custom">Custom Cursor Content</Heading>
				<Text variant="secondary">
					Using <Code>use:cursor</Code> action with custom content
				</Text>
			</div>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			The cursor is automatically initialized and doesn't require manual setup. It responds to
			various interactions throughout the application.
		</Text>

		<Heading level={3} id="custom-cursor-action">Custom Cursor States</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { cursor } from 'glow-ui';
</script>

<!-- Set custom cursor state -->
<div use:cursor={{ state: 'copy', content: 'Copy this!' }}>
  Hover me
</div>

<!-- Different states -->
<div use:cursor={{ state: 'pointer' }}>Clickable</div>
<div use:cursor={{ state: 'text' }}>Selectable</div>
<div use:cursor={{ state: 'loading' }}>Loading</div>`}
		/>

		<Heading level={3} id="automatic-states">Automatic States</Heading>
		<CodeBlock
			language="svelte"
			code={`<!-- These automatically trigger cursor states -->
<button>Pointer state with icon mirroring</button>
<a href="#">Pointer state</a>
<input type="text" /> <!-- Text I-beam -->
<input type="checkbox" /> <!-- Checkbox states -->
<input type="toggle" /> <!-- Toggle states -->

<!-- Async buttons show loading -->
<Button onclick={async () => await save()}>
  Shows spinner in cursor
</Button>`}
		/>
	</Group>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

	<Group label="Cursor States" id="cursor-states">
		<Table
			variant="simple"
			columns={[
				{ key: 'state', label: 'State', render: codeCell },
				{ key: 'trigger', label: 'Trigger' },
				{ key: 'appearance', label: 'Appearance' }
			]}
			data={[
				{ state: 'default', trigger: 'Normal page areas', appearance: 'Small white dot' },
				{ state: 'pointer', trigger: 'Clickable elements', appearance: '32px circle, mirrors button icons' },
				{ state: 'text', trigger: 'Text inputs, contenteditable', appearance: 'I-beam icon' },
				{ state: 'loading', trigger: 'Async button operations', appearance: 'Spinner animation' },
				{ state: 'copy', trigger: 'Shell commands, code blocks', appearance: 'Copy icon' },
				{ state: 'selecting', trigger: 'Text selection in progress', appearance: 'Vertical line matching text height' },
				{ state: 'checkbox', trigger: 'Checkbox inputs', appearance: 'Empty square, checkmark, or minus' },
				{ state: 'toggle', trigger: 'Toggle inputs', appearance: 'Toggle icon (left or right)' }
			]}
		/>
	</Group>

	<Group label="Cursor Action Options" id="cursor-action-options">
		<CodeBlock
			language="typescript"
			code={`interface CursorOptions {
  state?: 'default' | 'pointer' | 'text' | 'loading' | 'copy';
  content?: string; // Optional text content to show
}`}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🎯 Context-aware morphing based on element type</Text></li>
			<li><Text>🎨 Icon mirroring for buttons (32px consistency)</Text></li>
			<li><Text>⏳ Automatic loading state during async operations</Text></li>
			<li><Text>📋 Copy icon for code blocks and shell commands</Text></li>
			<li><Text>📏 Text selection line that adjusts to text height</Text></li>
			<li><Text>☑️ Dynamic checkbox and toggle state indicators</Text></li>
			<li><Text>💬 Tooltip integration inside cursor</Text></li>
			<li><Text>🎭 Smooth transitions between all states</Text></li>
			<li><Text>⚡ Click animation (cursor shrinks)</Text></li>
			<li><Text>🎮 Svelte action for custom cursor states</Text></li>
		</ul>
	</Group>

	<Group label="Technical Details" id="technical-details">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li>
				<Text><strong>Position:</strong> Fixed positioning that follows mouse movement</Text>
			</li>
			<li>
				<Text><strong>Size:</strong> Dynamically changes from 4px to 32px based on state</Text>
			</li>
			<li>
				<Text
					><strong>Performance:</strong> Uses requestAnimationFrame for smooth 60fps animation</Text
				>
			</li>
			<li>
				<Text><strong>Pointer Events:</strong> Set to pointer-events: none to not interfere</Text>
			</li>
			<li>
				<Text><strong>Z-Index:</strong> High z-index (9999) to stay above all content</Text>
			</li>
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
</style>
