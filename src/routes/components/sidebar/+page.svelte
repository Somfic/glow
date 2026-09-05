<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Sidebar from '$lib/sidebar/Sidebar.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import type { SidebarItem, SidebarGroup } from '$lib/sidebar/Sidebar.svelte';

	const topItems: SidebarItem[] = [
		{ label: 'Home', href: '/', icon: 'House' },
		{ label: 'Sidebar', href: '/components/sidebar', icon: 'PanelLeft' }
	];

	const groups: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Inbox', href: '/components/notification-center', icon: 'Inbox' },
				{ label: 'Issues', href: '/examples/linear', icon: 'CircleDot' },
				{ label: 'Projects', href: '/components/card', icon: 'FolderOpen' }
			]
		},
		{
			label: 'Settings',
			items: [
				{ label: 'Preferences', href: '/components/settings', icon: 'Settings' },
				{ label: 'Members', href: '/components/avatar', icon: 'Users' }
			]
		}
	];

	let collapsed = $state(false);
	let darkCollapsed = $state(false);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Sidebar | Glow UI</title></svelte:head>

<Heading level={1}>Sidebar</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A fixed left navigation rail with grouped links, a collapsible icon-only mode, and a mobile drawer.
	Usually you don't mount it directly — hand a <Code>sidebarConfig</Code> to
	<Link href="/components/page">Page</Link> and it wires this up for you.
</Text>

<Card title="Live sidebar" id="live">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Rendered inside a bounded frame. Use the collapse chevron in the header — or the button below — to
		toggle the rail. Collapsed items keep their icons pinned at the same x and reveal their label as a
		tooltip on hover.
	</Text>
	<div style="margin-bottom: 1rem; display: flex; gap: 0.75rem; align-items: center;">
		<Button
			variant="secondary"
			label={collapsed ? 'Expand' : 'Collapse'}
			icon={collapsed ? 'ChevronsRight' : 'ChevronsLeft'}
			onclick={() => (collapsed = !collapsed)}
		/>
		<Pill
			variant="outlined"
			label={collapsed ? 'collapsed' : 'expanded'}
			color={collapsed ? '#f59e0b' : '#22c55e'}
		/>
	</div>
	<div class="frame">
		<Sidebar title="Acme" {topItems} {groups} bind:collapsed />
		<div class="frame-content" class:collapsed>
			<Text variant="secondary" size="sm">
				Your content sits to the right of the rail. The offset is the sidebar's width — 240px
				expanded, 56px collapsed.
			</Text>
		</div>
	</div>
</Card>

<Card title="Active state" id="active">
	<Text variant="secondary" size="sm">
		The sidebar reads <Code>window.location.pathname</Code> and marks the matching item active — no
		<Code>active</Code> prop to thread through. A parent path counts as active for its children, so
		<Code>/settings</Code> stays lit while you're on <Code>/settings/billing</Code>. In the frame
		above, "Sidebar" is highlighted because that's the route you're on.
	</Text>
</Card>

<Card title="Inverted rail" id="theme">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>theme</Code> pins the rail to one palette while the page keeps its own — the dark-navigation
		/ light-content shell most apps ship. It stamps <Code>data-theme</Code> on the
		<Code>&lt;aside&gt;</Code>, so the whole token recipe re-runs for the rail: foreground, borders,
		muted labels and hover washes invert along with the background, which a single dark-background
		token could not do. Leave it at <Code>auto</Code> and the rail follows the page as before. The
		frame below is pinned <Code>dark</Code>, so it looks the same whichever theme you're reading this
		in.
	</Text>
	<div class="frame frame-spaced">
		<Sidebar title="Acme" {topItems} {groups} theme="dark" bind:collapsed={darkCollapsed} />
		<div class="frame-content" class:collapsed={darkCollapsed}>
			<Text variant="secondary" size="sm">
				The content beside it stays on the page's own theme — nothing about the rail leaks past its
				own subtree.
			</Text>
		</div>
	</div>
	<CodeBlock language="svelte" code={`<Sidebar title="Acme" {topItems} {groups} theme="dark" />

<!-- via Page, which also carries it onto the shell behind the rail -->
<Page title="Acme" sidebarConfig={{ title: 'Acme', topItems, groups, theme: 'dark' }}>
  {@render children?.()}
</Page>`} />
</Card>

<Card title="Usage" id="usage">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Standalone. Note it's <Code>position: fixed</Code> — offset your own content by the rail width.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Sidebar } from 'glow';
  import type { SidebarItem, SidebarGroup } from 'glow';

  const topItems: SidebarItem[] = [
    { label: 'Home', href: '/', icon: 'House' }
  ];

  const groups: SidebarGroup[] = [
    {
      label: 'Workspace',
      items: [
        { label: 'Inbox', href: '/inbox', icon: 'Inbox' },
        { label: 'Issues', href: '/issues', icon: 'CircleDot' }
      ]
    }
  ];

  let collapsed = $state(false);
  let open = $state(false); // mobile drawer
</script>

<Sidebar
  title="Acme"
  {topItems}
  {groups}
  bind:collapsed
  bind:open
  onclose={() => (open = false)}
/>`}
	/>
</Card>

<Card title="Via Page" id="via-page">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The common case — <Code>Page</Code> owns the collapse state, the content offset, and the mobile
		toggle button.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<Page
  title="Acme"
  sidebarConfig={{ title: 'Acme', topItems, groups }}
>
  {@render children?.()}
</Page>`}
	/>
</Card>

<Card title="Extra content" id="children">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The <Code>children</Code> snippet renders at the bottom of the rail — the usual home for a user
		menu, workspace switcher, or version badge.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<Sidebar title="Acme" {topItems} {groups}>
  <Avatar name="Ada Lovelace" size="sm" />
</Sidebar>`}
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
			{ prop: 'title', type: 'string', default: "''", description: 'Shown next to the logo mark in the header. Hidden when collapsed.' },
			{ prop: 'topItems', type: 'SidebarItem[]', default: '[]', description: 'Ungrouped links rendered above the groups.' },
			{ prop: 'groups', type: 'SidebarGroup[]', default: '[]', description: 'Labelled groups of links. The label collapses into a divider in icon-only mode.' },
			{ prop: 'collapsed', type: 'boolean', default: 'false', description: 'Bindable. Icon-only rail (56px) instead of the full 240px.' },
			{ prop: 'open', type: 'boolean', default: 'false', description: 'Bindable. Below 768px the rail slides off-screen; this opens it as a drawer with a backdrop.' },
			{ prop: 'theme', type: "'auto' | 'dark' | 'light'", default: "'auto'", description: 'Pins the rail to one palette regardless of the page theme. Stamps data-theme on the aside, so every derived token inverts with it, not just the background.' },
			{ prop: 'themeToggle', type: 'boolean', default: 'false', description: "Light/dark switch pinned to the bottom of the rail. Writes to Glow's shared theme store — it still switches the page, not the rail." },
			{ prop: 'onclose', type: '() => void', default: '—', description: 'Fired when the mobile backdrop is clicked or an item is picked.' },
			{ prop: 'oncollapse', type: '(collapsed: boolean) => void', default: '—', description: 'Fired when the collapse chevron is used. Handy for persisting the preference.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Rendered at the bottom of the rail.' }
		]}
	/>
</Card>

<Card title="Types" id="types">
	<CodeBlock
		language="ts"
		code={`type SidebarItem = {
  label: string;
  href: string;
  icon?: IconProp;
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

type SidebarTheme = 'auto' | 'dark' | 'light';`}
	/>
</Card>

<style lang="scss">
	// `transform` makes this a containing block for the sidebar's
	// position: fixed, so the demo stays inside the card.
	.frame {
		position: relative;
		transform: translate(0);
		height: 420px;
		overflow: hidden;
		border: 1px solid var(--glow-border-color);
		border-radius: 12px;
		background: var(--glow-bg);

		// The rail asks for 100vh; inside the frame it should fill the frame.
		:global(.sidebar) {
			height: 100%;
			// Below the docs sidebar so nothing about the demo can trap clicks
			// meant for the real chrome.
			z-index: 1;
		}
	}

	.frame-spaced {
		margin-bottom: 1rem;
	}

	.frame-content {
		padding: 1.5rem;
		margin-left: 240px;
		transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);

		&.collapsed {
			margin-left: 56px;
		}
	}
</style>
