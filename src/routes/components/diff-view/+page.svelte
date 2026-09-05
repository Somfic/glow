<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import DiffView, { type DiffViewMode } from '$lib/diff-view/DiffView.svelte';

	const before = `export function greet(name) {
	const greeting = 'Hello, ' + name;
	console.log(greeting);
	return greeting;
}

export function farewell(name) {
	return 'Goodbye, ' + name;
}`;

	const after = `export function greet(name: string): string {
	const greeting = \`Hello, \${name}\`;
	console.log(greeting);
	return greeting;
}

export function farewell(name: string): string {
	return \`Goodbye, \${name}\`;
}`;

	// Long enough that three lines of context leave most of it folded.
	const config = Array.from({ length: 30 }, (_, i) => `  setting_${i + 1}: true`);
	const configBefore = ['[server]', ...config, '', '[client]', ...config].join('\n');
	const configAfter = [
		'[server]',
		...config.map((l, i) => (i === 14 ? '  setting_15: false' : l)),
		'',
		'[client]',
		...config.map((l, i) => (i === 3 ? '  setting_4: false' : l))
	].join('\n');

	const longBefore = `const url = 'https://example.com/api/v1/resources?filter=all&sort=created_at&direction=desc&page=1';
const label = 'A single line that runs well past the width of this card, on purpose, so the wrap prop has something to do';`;
	const longAfter = `const url = 'https://example.com/api/v2/resources?filter=active&sort=updated_at&direction=desc&page=1';
const label = 'A single line that runs well past the width of this card, by design, so the wrap prop has something to do';`;

	const rewrite = `function total(items) {
	let sum = 0;
	for (var i = 0; i < items.length; i++) {
		sum = sum + items[i].price;
	}
	return sum;
}`;
	const rewritten = `const total = (items) => items.reduce((sum, item) => sum + item.price, 0);`;

	// A three-line addition run and a two-line deletion run: the stripe beside
	// each has to be one bar, not one per line.
	const stripeBefore = `function open(path) {
	const file = read(path);
	return parse(file);
}`;
	const stripeAfter = `function open(path, options = {}) {
	if (!exists(path)) {
		throw new Error(\`no such file: \${path}\`);
	}
	const file = read(path, options.encoding);
	return parse(file, options);
}`;

	let mode = $state<DiffViewMode>('unified');
	let wrap = $state(false);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Diff View | Glow UI</title></svelte:head>

<Heading level={1}>Diff View</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A code diff, the way a pull request shows one: line numbers on both sides, a <Code>+</Code>/<Code
		>-</Code
	> gutter, a change stripe down the left edge, syntax highlighting, word-level runs inside a changed line, and the unchanged middle
	folded away. The diff itself is a Myers implementation in the library — no dependency for that;
	the colours come from the same Shiki setup <Link href="/components/code">Code Block</Link> uses.
</Text>

<Card title="Unified" id="unified">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default. Both line numbers stay in the gutter, and the sign column carries the meaning that
		the tint carries in colour — it is the signal for anyone the green and red is lost on. Both
		gutters are sticky, so they hold their place when a long line scrolls.
	</Text>
	<DiffView oldText={before} newText={after} filename="src/greet.ts" />
</Card>

<Card title="The change stripe" id="stripe">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The bar down the left edge marks what changed at a glance, before any colour is read: a solid bar
		for an addition, a diagonal hatch for a deletion, so the two differ by texture as well as by hue.
		A run of consecutive lines gets <em>one</em> bar, not one per line — the six added lines below
		share a single unbroken stripe, and the three deleted ones a single hatch.
	</Text>
	<DiffView oldText={stripeBefore} newText={stripeAfter} filename="src/open.ts" />
</Card>

<Card title="Syntax highlighting" id="highlighting">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		On by default when the <Code>filename</Code> gives away a language, or when you pass
		<Code>language</Code> yourself. It is asynchronous, and nothing waits on it: the diff renders its
		own structure immediately and gains colour when Shiki resolves, so there is no unstyled flash and
		no reflow. Turn it off with <Code>highlight={false}</Code>, or replace it entirely with the
		<Code>line</Code> snippet.
	</Text>
	<Flex gap="md">
		<DiffView oldText={before} newText={after} filename="highlighted.ts" collapsible={false} />
		<DiffView
			oldText={before}
			newText={after}
			filename="plain.ts"
			highlight={false}
			collapsible={false}
		/>
	</Flex>
</Card>

<Card title="Split" id="split">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>mode="split"</Code> puts the two files side by side. The halves are cells of one table row,
		so they cannot drift apart vertically, and one scroller moves both of them horizontally.
	</Text>
	<DiffView oldText={before} newText={after} mode="split" filename="src/greet.ts" />
</Card>

<Card title="Switching modes" id="modes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>mode</Code> is a plain prop — the view is yours to drive from wherever the control lives.
	</Text>
	<Flex direction="horizontal" gap="sm" style="margin-bottom: 1rem;">
		<ButtonGroup>
			<Button
				label="Unified"
				variant={mode === 'unified' ? 'primary' : 'secondary'}
				onclick={() => {
					mode = 'unified';
				}}
			/>
			<Button
				label="Split"
				variant={mode === 'split' ? 'primary' : 'secondary'}
				onclick={() => {
					mode = 'split';
				}}
			/>
		</ButtonGroup>
		<Button
			label={wrap ? 'Wrapping' : 'Scrolling'}
			icon={wrap ? 'TextWrap' : 'MoveHorizontal'}
			variant="secondary"
			onclick={() => {
				wrap = !wrap;
			}}
		/>
	</Flex>
	<DiffView oldText={longBefore} newText={longAfter} {mode} {wrap} filename="src/api.ts" />
</Card>

<Card title="Collapsed regions" id="collapse">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Runs of unchanged lines longer than <Code>2 × context</Code> fold into an expander, which reveals
		them in place. A fold of a single line is not offered — the button would be taller than the line
		it hides.
	</Text>
	<DiffView
		oldText={configBefore}
		newText={configAfter}
		filename="config.toml"
		context={2}
		maxHeight="22rem"
	/>
</Card>

<Card title="Word-level highlighting" id="words">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A second diff runs inside each pair of facing lines and darkens only the words that moved. It is
		the expensive half of a diff, so it runs on paired add/remove lines and nowhere else, and it
		gives up when the two lines share less than 40% of their text — highlighting nine tenths of a
		rewritten line says nothing the tint had not already said. The rewrite below is the case it
		declines.
	</Text>
	<Flex gap="md">
		<DiffView oldText={before} newText={after} filename="paired lines" collapsible={false} />
		<DiffView oldText={rewrite} newText={rewritten} filename="a rewrite" collapsible={false} />
	</Flex>
</Card>

<Card title="Long lines" id="wrapping">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>wrap</Code> chooses between a horizontal scroller and wrapped lines. Wrapping keeps the
		whole line visible at the cost of the one-row-per-line rhythm; scrolling keeps the rhythm and the
		sticky gutters.
	</Text>
	<Flex gap="md">
		<DiffView oldText={longBefore} newText={longAfter} filename="scrolling" />
		<DiffView oldText={longBefore} newText={longAfter} filename="wrapping" wrap />
	</Flex>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { DiffView } from 'glow';

  const before = await readFile('a.ts');
  const after = await readFile('b.ts');
<\/script>

<DiffView oldText={before} newText={after} filename="src/greet.ts" />

<!-- Side by side, wrapped, with more context around each change -->
<DiffView {before} {after} mode="split" wrap context={6} />

<!-- The diff on its own, without the component -->
<script lang="ts">
  import { diffLines, diffStats } from 'glow';

  const lines = diffLines(before, after);   // DiffLine[]
  const { added, removed } = diffStats(lines);
<\/script>`}
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
			{ prop: 'oldText', type: 'string', default: "''", description: 'The file as it was.' },
			{ prop: 'newText', type: 'string', default: "''", description: 'The file as it is.' },
			{ prop: 'mode', type: "'unified' | 'split'", default: 'unified', description: 'One column, or the two sides next to each other.' },
			{ prop: 'filename', type: 'string', default: '—', description: 'Shown in the header with the +/- tally.' },
			{ prop: 'oldLabel', type: 'string', default: 'Before', description: 'Left column caption in split mode.' },
			{ prop: 'newLabel', type: 'string', default: 'After', description: 'Right column caption in split mode.' },
			{ prop: 'context', type: 'number', default: '3', description: 'Unchanged lines kept either side of a change.' },
			{ prop: 'collapsible', type: 'boolean', default: 'true', description: 'Fold the unchanged middle behind an expander.' },
			{ prop: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of scrolling them.' },
			{ prop: 'words', type: 'boolean', default: 'true', description: 'Word-level runs inside paired changed lines.' },
			{ prop: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show the two number gutters.' },
			{ prop: 'maxHeight', type: 'string', default: '—', description: 'Caps the height and scrolls.' },
			{ prop: 'line', type: 'Snippet<[DiffLine]>', default: '—', description: 'Renders one line — where pre-highlighted markup goes.' },
			{ prop: 'label', type: 'string', default: 'filename', description: 'aria-label on the table.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">DiffLine</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Field', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'type', type: "'context' | 'add' | 'remove'", description: 'What happened to the line.' },
			{ prop: 'content', type: 'string', description: 'The line itself, without its newline.' },
			{ prop: 'oldNumber', type: 'number', description: 'Line number on the old side; absent on an addition.' },
			{ prop: 'newNumber', type: 'number', description: 'Line number on the new side; absent on a removal.' },
			{ prop: 'segments', type: 'DiffSegment[]', description: 'Word runs, on paired lines that stayed similar.' }
		]}
	/>

	<Text weight="semibold" style="margin: 1.5rem 0 0.5rem;">Functions</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Export', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'diffLines(oldText, newText, opts?)', description: 'The unified line list, numbered on both sides.' },
			{ prop: 'toRows(lines)', description: 'Pairs the list into side-by-side rows.' },
			{ prop: 'collapse(items, changed, context)', description: 'Folds unchanged runs into gaps.' },
			{ prop: 'diffWords(before, after)', description: 'Word runs for one pair of lines.' },
			{ prop: 'diffSequences(a, b, eq?)', description: 'Myers over any two arrays — the primitive under all of it.' },
			{ prop: 'diffStats(lines)', description: 'The added/removed tally.' }
		]}
	/>
</Card>

<Card title="Accessibility" id="accessibility">
	<Flex gap="sm">
		<Text size="sm">
			Colour is never the only signal. Every changed line carries a <Code>+</Code> or
			<Code>-</Code> in the gutter, and the stripe distinguishes by texture as well as by hue — solid
			for an addition, hatched for a deletion. In unified mode the stripe, both gutters and the sign
			column are sticky, so those signals are the last thing to scroll away rather than the first.
		</Text>
		<Text size="sm">
			Each row is announced as "Added line 12:", "Removed line 9:" or "Unchanged line 8:" from
			visually hidden text next to the sign, so a screen reader distinguishes them without seeing
			the tint. The table carries a caption with the tally and the mode.
		</Text>
		<Text size="sm">
			The expander is a real <Code>{'<button>'}</Code> with <Code>aria-expanded</Code>, in the tab
			order, with the library's focus ring.
		</Text>
	</Flex>
</Card>

<Card title="Related" id="related">
	<Flex gap="sm">
		<Text size="sm">
			<Link href="/components/code">Code Block</Link> — one file, syntax highlighted, when there is nothing
			to compare it against.
		</Text>
		<Text size="sm">
			<Link href="/components/table">Table</Link> — for tabular data that is not a file.
		</Text>
		<Text size="sm">
			<Link href="/components/timeline">Timeline</Link> — the review activity that goes above a diff.
		</Text>
	</Flex>
</Card>
