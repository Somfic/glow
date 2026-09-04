<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import { icons, type IconName } from '$lib/icon/types.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	const allNames = Object.keys(icons) as IconName[];

	// The set is ~1600 icons; rendering them all at once is slow enough to be
	// noticeable, so the browser caps what it paints and tells you it did.
	const LIMIT = 96;

	const fillDemo = ['Star', 'Heart', 'Bookmark', 'Bell'] as const;

	let query = $state('');

	const matches = $derived(
		query.trim()
			? allNames.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()))
			: allNames
	);
	const shown = $derived(matches.slice(0, LIMIT));

	function copy(name: string) {
		navigator.clipboard?.writeText(name);
		toast.success(`Copied "${name}"`);
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Icon | Glow UI</title></svelte:head>

<Heading level={1}>Icon</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A thin wrapper over <Link href="https://lucide.dev" external>Lucide</Link>'s icon set —
	{allNames.length} names, all typed as <Code>IconName</Code> so a typo is a compile error rather than
	a blank space. Icons inherit <Code>currentColor</Code> and size in <Code>em</Code>, so they line up
	with the text around them by default.
</Text>

<Card title="Browse" id="browse">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Click an icon to copy its name.
	</Text>
	<Input type="text" bind:value={query} placeholder="Search {allNames.length} icons…" icon="Search" clearable />
	<Text size="sm" variant="secondary" style="margin: 0.75rem 0;">
		{#if matches.length > LIMIT}
			Showing {LIMIT} of {matches.length} matches — narrow the search to see the rest.
		{:else}
			{matches.length} {matches.length === 1 ? 'match' : 'matches'}
		{/if}
	</Text>
	<div class="grid">
		{#each shown as name (name)}
			<button class="cell" onclick={() => copy(name)} title={name}>
				<Icon {name} size={20} />
				<span>{name}</span>
			</button>
		{/each}
	</div>
	{#if matches.length === 0}
		<Text variant="secondary" size="sm">No icon matches "{query}".</Text>
	{/if}
</Card>

<Card title="Size" id="size">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Defaults to <Code>1em</Code> — it scales with the font size of whatever contains it. Pass a number
		for pixels, or any CSS length as a string.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		{#each [12, 16, 20, 24, 32, 48] as size}
			<Flex gap="xs" align="center">
				<Icon name="Sparkles" {size} />
				<Text size="sm" variant="secondary">{size}</Text>
			</Flex>
		{/each}
	</Flex>
	<Text style="margin-top: 1.5rem; font-size: 1.75rem;">
		<Icon name="Flame" /> inherits the text size around it
	</Text>
</Card>

<Card title="Color" id="color">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Without <Code>color</Code> the stroke is <Code>currentColor</Code>, so icons pick up the
		surrounding text colour — including on hover, with a 150ms transition.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		<Icon name="Heart" size={28} />
		<Icon name="Heart" size={28} color="#f43f5e" />
		<Icon name="Heart" size={28} color="#22c55e" />
		<Icon name="Heart" size={28} color="var(--glow-primary)" />
	</Flex>
</Card>

<Card title="Fill" id="fill">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Lucide icons are outlines. <Code>fill</Code> paints the interior with the same colour as the
		stroke — useful for a solid/active state that pairs with the outline resting state.
	</Text>
	<Flex direction="horizontal" gap="lg" align="center">
		{#each fillDemo as name}
			<Flex direction="horizontal" gap="sm" align="center">
				<Icon {name} size={26} color="#f59e0b" />
				<Icon {name} size={26} color="#f59e0b" fill />
			</Flex>
		{/each}
	</Flex>
</Card>

<Card title="The IconProp shorthand" id="icon-prop">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Every component that takes an icon — <Code>Button</Code>, <Code>Pill</Code>,
		<Code>ListItem</Code>, <Code>Sidebar</Code>, <Code>Section</Code> — accepts
		<Code>IconProp</Code>: either a bare name, or the full props object when you need to override size
		or colour. <Code>resolveIcon</Code> normalises the two forms if you're building your own
		icon-taking component.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<!-- Shorthand: just the name -->
<Button label="Save" icon="Save" />

<!-- Full form: override size and colour -->
<Button label="Delete" icon={{ name: 'Trash2', color: '#f43f5e' }} />`}
	/>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Icon, resolveIcon, type IconProp } from 'glow';

  let { icon }: { icon: IconProp } = $props();
</script>

<!-- Accept either form, with your own size default -->
<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 16} />`}
	/>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Icon, type IconName } from 'glow';

  // Typed, so a misspelled name fails at build time
  const status: IconName = 'CircleCheck';
</script>

<Icon name="Search" />
<Icon name="Search" size={20} />
<Icon name="Search" size={20} color="#f43f5e" />
<Icon name="Star" fill color="#f59e0b" />`}
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
			{ prop: 'name', type: 'IconName', default: '—', description: 'Required. A Lucide icon name in PascalCase.' },
			{ prop: 'size', type: 'number | string', default: '1em', description: 'Number → px. Defaults to 1em so it tracks the surrounding font size.' },
			{ prop: 'color', type: 'string', default: 'currentColor', description: 'Any CSS colour, including custom properties.' },
			{ prop: 'fill', type: 'boolean', default: 'false', description: 'Fill the interior with the stroke colour.' }
		]}
	/>
</Card>

<Card title="Exports" id="exports">
	<Table
		variant="simple"
		columns={[
			{ key: 'name', label: 'Export', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ name: 'IconName', type: 'type', description: 'Union of every valid icon name.' },
			{ name: 'IconProps', type: 'type', description: '{ name, size?, color?, fill? } — the full object form.' },
			{ name: 'IconProp', type: 'type', description: 'IconName | IconProps — what icon-taking props accept.' },
			{ name: 'resolveIcon', type: '(icon: IconProp) => IconProps', description: 'Normalises either form into the object form.' }
		]}
	/>
</Card>

<style lang="scss">
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
	}

	.cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 8px;
		background: var(--glow-bg-surface-element);
		color: var(--glow-fg-secondary);
		font-size: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: background 120ms ease, color 120ms ease;

		span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&:hover {
			background: var(--glow-secondary-hover);
			color: var(--glow-fg);
		}
	}
</style>
