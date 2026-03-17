<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Code | Glow UI</title></svelte:head>

<Heading level={1}>Code</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Components for displaying code with syntax highlighting, line numbers, and copy functionality.
	</Text>

	<Group label="Inline Code" id="inline-code">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Use inline code for short code snippets within text
		</Text>
		<p>
			You can use <Code>inline code</Code> within text, like <Code>const x = 42;</Code> or
			<Code>npm install</Code>.
		</p>
	</Group>

	<Group label="Code Block - JavaScript" id="code-block-javascript">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Full code blocks with syntax highlighting
		</Text>
		<CodeBlock
			language="javascript"
			code={`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55`}
		/>
	</Group>

	<Group label="Code Block with Line Numbers" id="code-block-line-numbers">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Add line numbers for easier reference
		</Text>
		<CodeBlock
			language="typescript"
			showLineNumbers
			code={`interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = (data: Partial<User>): User => {
  return {
    id: Math.random(),
    name: data.name ?? 'Anonymous',
    email: data.email ?? 'no-email@example.com'
  };
};`}
		/>
	</Group>

	<Group label="Auto-detected from Filename" id="code-auto-detected">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Language is automatically detected from file extension
		</Text>
		<CodeBlock
			filename="example.tsx"
			code={`import { Button } from '@/components';

export function Example() {
  return (
    <div>
      <Button onClick={() => alert('Hello!')}>
        Click me
      </Button>
    </div>
  );
}`}
		/>
	</Group>

	<Group label="More Auto-detection Examples" id="code-more-examples">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Supports many languages with automatic detection
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<CodeBlock
				filename="config.json"
				code={`{
  "name": "my-app",
  "version": "1.0.0"
}`}
			/>
			<CodeBlock
				filename="styles.css"
				code={`.button {
  background: #8B6DED;
  border-radius: 8px;
}`}
			/>
			<CodeBlock
				filename="script.py"
				code={`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`}
			/>
		</div>
	</Group>

	<Group label="Shell/Terminal Mode" id="code-shell-terminal">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Special mode for shell commands with copy icon in cursor
		</Text>
		<CodeBlock
			language="bash"
			code={`npm install glow-ui
npm run dev
bun test`}
		/>
	</Group>

	<Group label="Supported Languages" id="code-languages">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Examples of different language syntaxes
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<div>
				<Text weight="semibold" size="sm" style="margin-bottom: 0.5rem;">Svelte</Text>
				<CodeBlock
					language="svelte"
					code={`<script>
  import { Button } from 'glow-ui';
  let count = $state(0);
</script>

<Button onclick={() => count++}>
  Clicked {count} times
</Button>`}
				/>
			</div>

			<div>
				<Text weight="semibold" size="sm" style="margin-bottom: 0.5rem;">Rust</Text>
				<CodeBlock
					language="rust"
					code={`fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}`}
				/>
			</div>

			<div>
				<Text weight="semibold" size="sm" style="margin-bottom: 0.5rem;">Go</Text>
				<CodeBlock
					language="go"
					code={`func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}`}
				/>
			</div>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="inline-usage">Inline Code</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Code } from 'glow-ui';
</script>

<p>Install with <Code>npm install glow-ui</Code></p>`}
		/>

		<Heading level={3} id="code-block-usage">Code Block</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { CodeBlock } from 'glow-ui';
</script>

<!-- With explicit language -->
<CodeBlock
  language="javascript"
  code={\`console.log('Hello!');\`}
/>

<!-- With line numbers -->
<CodeBlock
  language="typescript"
  showLineNumbers
  code={\`const greeting = 'Hello';\`}
/>

<!-- Auto-detect from filename -->
<CodeBlock
  filename="example.tsx"
  code={\`export default () => <div>Hello</div>\`}
/>`}
		/>
	</Group>

	<Group label="CodeBlock Props" id="code-block-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'code', type: 'string', default: 'required', description: 'Code content to display' },
				{ prop: 'language', type: 'string', default: '-', description: 'Language for syntax highlighting' },
				{ prop: 'filename', type: 'string', default: '-', description: 'Filename (auto-detects language)' },
				{ prop: 'showLineNumbers', type: 'boolean', default: 'false', description: 'Show line numbers' }
			]}
		/>
	</Group>

	<Group label="Supported Languages" id="supported-languages-list">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Full list of supported programming languages
		</Text>
		<ul
			style="margin-left: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;"
		>
			<li><Text>JavaScript</Text></li>
			<li><Text>TypeScript</Text></li>
			<li><Text>Svelte</Text></li>
			<li><Text>React (JSX/TSX)</Text></li>
			<li><Text>Python</Text></li>
			<li><Text>Rust</Text></li>
			<li><Text>Go</Text></li>
			<li><Text>Java</Text></li>
			<li><Text>C/C++</Text></li>
			<li><Text>C#</Text></li>
			<li><Text>PHP</Text></li>
			<li><Text>Ruby</Text></li>
			<li><Text>CSS/SCSS</Text></li>
			<li><Text>HTML</Text></li>
			<li><Text>JSON</Text></li>
			<li><Text>YAML</Text></li>
			<li><Text>Bash/Shell</Text></li>
			<li><Text>SQL</Text></li>
		</ul>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🎨 Syntax highlighting for 20+ languages</Text></li>
			<li><Text>📋 Copy icon in cursor when hovering shell commands</Text></li>
			<li><Text>🔢 Optional line numbers</Text></li>
			<li><Text>🎯 Automatic language detection from filename</Text></li>
			<li><Text>💻 Special handling for terminal/shell commands</Text></li>
			<li><Text>🎭 Inline code component for text</Text></li>
			<li><Text>📱 Responsive with horizontal scrolling</Text></li>
			<li><Text>♿ Accessible with proper ARIA attributes</Text></li>
		</ul>
	</Group>
