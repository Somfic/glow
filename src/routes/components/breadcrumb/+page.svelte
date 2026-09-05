<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Breadcrumb, { type BreadcrumbItem } from '$lib/breadcrumb/Breadcrumb.svelte';

	const shortTrail: BreadcrumbItem[] = [
		{ label: 'Components', href: '/components' },
		{ label: 'Navigation', href: '/components' },
		{ label: 'Breadcrumb' }
	];

	const deepTrail: BreadcrumbItem[] = [
		{ label: 'Home', href: '/', icon: 'House' },
		{ label: 'Workspace', href: '/components' },
		{ label: 'Engineering', href: '/components' },
		{ label: 'Platform', href: '/components' },
		{ label: 'glow', href: '/components' },
		{ label: 'src', href: '/components' },
		{ label: 'lib', href: '/components' },
		{ label: 'Breadcrumb.svelte' }
	];

	// The current crumb of a file trail is usually app state, not a URL — this
	// demo mirrors that by driving it from a click rather than navigating.
	let picked = $state('Overview');
	const stateTrail: BreadcrumbItem[] = $derived([
		{ label: 'Projects', onclick: () => (picked = 'Projects') },
		{ label: 'Apollo', onclick: () => (picked = 'Apollo') },
		{ label: picked }
	]);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

{#snippet slash()}/{/snippet}

<svelte:head><title>Breadcrumb | Glow UI</title></svelte:head>

<Heading level={1}>Breadcrumb</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	The trail from the root of an app to the page you are on. Items are data, the last one is the
	current page, and when the trail is wider than the space it has, the middle folds into a
	<Link href="/components/popover-menu">popover menu</Link> instead of wrapping or scrolling away.
</Text>

<Card title="A trail" id="basic">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A <Code>{'{ label, href? }'}</Code> per crumb. The last item is rendered as text with
		<Code>aria-current="page"</Code> — a link to where you already are is noise, so it drops the
		<Code>href</Code> even if you pass one.
	</Text>
	<Breadcrumb items={shortTrail} />
</Card>

<Card title="Separators" id="separators">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The default is a chevron via <Code>Icon</Code>. Pass any other icon name, or a snippet for
		something that isn't an icon at all.
	</Text>
	<div class="stack">
		<Breadcrumb items={shortTrail} />
		<Breadcrumb items={shortTrail} separator="ChevronsRight" />
		<Breadcrumb items={shortTrail} separator={slash} />
	</div>
</Card>

<Card title="Icons on crumbs" id="icons">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Each item takes an optional <Code>icon</Code>, which is the usual way to mark the root of the
		trail.
	</Text>
	<Breadcrumb items={deepTrail.slice(0, 4)} />
</Card>

<Card title="Collapsing by count" id="collapse">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>maxItems</Code> collapses at a fixed length whatever the width. The first and last crumbs
		stay put — tune that with <Code>itemsBeforeCollapse</Code> and <Code>itemsAfterCollapse</Code> —
		and everything between them moves into the menu behind the ellipsis, which is a real list of
		links you can middle-click.
	</Text>
	<div class="stack">
		<Breadcrumb items={deepTrail} maxItems={4} />
		<Breadcrumb items={deepTrail} maxItems={5} itemsAfterCollapse={2} />
	</div>
</Card>

<Card title="Collapsing to fit" id="fit">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		With no <Code>maxItems</Code>, the same trail collapses only as far as it has to. All three boxes
		below hold the identical eight-crumb trail; only the width differs.
	</Text>
	<div class="stack">
		<div class="box" style="max-width: 100%;">
			<Breadcrumb items={deepTrail} />
		</div>
		<div class="box" style="max-width: 420px;">
			<Breadcrumb items={deepTrail} />
		</div>
		<div class="box" style="max-width: 260px;">
			<Breadcrumb items={deepTrail} />
		</div>
	</div>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		Shallow ancestors go first, because the crumb next to the current page is the one most likely to
		be clicked.
	</Text>
</Card>

<Card title="Custom crumbs" id="custom">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>item</Code> snippet takes over rendering entirely, and still gets the collapse
		behaviour and the list semantics around it.
	</Text>
	<Breadcrumb items={deepTrail} maxItems={4}>
		{#snippet item({ item, current })}
			{#if current}
				<Pill label={item.label} variant="filled" />
			{:else}
				<Link href={item.href} variant="muted" underline="hover">{item.label}</Link>
			{/if}
		{/snippet}
	</Breadcrumb>
</Card>

<Card title="Trails that aren't URLs" id="callbacks">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		An item with <Code>onclick</Code> and no <Code>href</Code> is a button-shaped crumb, for a trail
		that walks app state — a file tree, a drill-down — rather than the address bar.
	</Text>
	<Breadcrumb items={stateTrail} />
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Current: {picked}
	</Text>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Breadcrumb, type BreadcrumbItem } from 'glow';

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: 'House' },
    { label: 'Issues', href: '/issues' },
    { label: 'ENG-142' }
  ];
<\/script>

<Breadcrumb {items} />

<!-- fixed shape, custom separator -->
<Breadcrumb {items} maxItems={4} separator="Slash" />

<!-- render the crumbs yourself -->
<Breadcrumb {items}>
  {#snippet item({ item, current })}
    {#if current}
      <strong>{item.label}</strong>
    {:else}
      <a href={item.href}>{item.label}</a>
    {/if}
  {/snippet}
</Breadcrumb>`}
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
			{ prop: 'items', type: 'BreadcrumbItem[]', default: '—', description: 'Required. Root first, current page last. Each is { label, href?, icon?, onclick? }.' },
			{ prop: 'separator', type: 'IconProp | Snippet', default: "'ChevronRight'", description: 'Icon name, IconProps, or a snippet for a non-icon separator.' },
			{ prop: 'collapse', type: 'boolean', default: 'true', description: 'Collapse the middle when the trail overflows. False lets it wrap instead.' },
			{ prop: 'maxItems', type: 'number', default: '—', description: 'Collapse past this many crumbs regardless of width. The ellipsis counts as one.' },
			{ prop: 'itemsBeforeCollapse', type: 'number', default: '1', description: 'Crumbs always kept at the head of the trail.' },
			{ prop: 'itemsAfterCollapse', type: 'number', default: '1', description: 'Crumbs always kept at the tail, including the current page.' },
			{ prop: 'item', type: 'Snippet<[BreadcrumbItemState]>', default: '—', description: 'Render a crumb yourself. Gets { item, index, current }.' },
			{ prop: 'label', type: 'string', default: "'Breadcrumb'", description: 'Accessible name of the <nav> landmark.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the <nav>.' }
		]}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		A <Code>{'<nav aria-label="Breadcrumb">'}</Code> wrapping an ordered list, one
		<Code>{'<li>'}</Code> per crumb, and <Code>aria-current="page"</Code> on the last. Separators are
		<Code>aria-hidden</Code>, so a screen reader hears the trail and not a run of chevrons. The
		ellipsis is a real button that names how many crumbs it hides, and the crumbs inside it are
		links with <Code>role="menuitem"</Code>. A crumb with an <Code>onclick</Code> and no
		<Code>href</Code> renders as a <Code>{'<button>'}</Code> rather than a destination-less anchor,
		which would not be focusable.
	</Text>
</Card>

<style lang="scss">
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.box {
		padding: 0.75rem 1rem;
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		overflow: hidden;
	}
</style>
