<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Page from '$lib/page/Page.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import type { NavItem } from '$lib/page/Navigation.svelte';
	import type { SidebarItem, SidebarGroup } from '$lib/sidebar/Sidebar.svelte';

	const navItems: NavItem[] = [
		{ label: 'Overview', href: '/components/page' },
		{ label: 'Docs', href: '/components' },
		{ label: 'Examples', href: '/examples/form' }
	];

	// Hrefs point at real routes so the demo behaves like real navigation
	// rather than dead links — clicking one leaves this page, as it should.
	const demoSidebar: { title: string; topItems: SidebarItem[]; groups: SidebarGroup[] } = {
		title: 'Acme',
		topItems: [
			{ label: 'Home', href: '/', icon: 'House' },
			{ label: 'Page', href: '/components/page', icon: 'LayoutTemplate' }
		],
		groups: [
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
				items: [{ label: 'Members', href: '/components/avatar', icon: 'Users' }]
			}
		]
	};

	// Every nested demo <Page> also writes <svelte:head><title>. Give them all
	// the title this page sets so whichever one wins, the tab is unchanged.
	const demoTitle = 'Page | Glow UI';
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Page | Glow UI</title></svelte:head>

<Heading level={1}>Page</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	The app shell. <Code>Page</Code> owns the document title, the outer layout mode, and — depending on
	which chrome you hand it — either a top navigation bar or a persistent sidebar.
</Text>

<Card title="Navigation modes" id="modes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Page</Code> has three mutually exclusive shells, and you pick one by which prop you pass
		rather than by naming a mode. All three are rendered live below, each clipped into a bounded
		frame — a real <Code>Page</Code> per demo, not a mock-up.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'chrome', label: 'Pass', render: codeCell },
			{ key: 'result', label: 'You get' }
		]}
		data={[
			{ chrome: 'navItems', result: 'A centred pill navigation bar across the top, with the title on the left.' },
			{ chrome: 'sidebarConfig', result: 'A persistent, collapsible left sidebar. Wins over navItems if you pass both.' },
			{ chrome: 'layout="bare"', result: 'No chrome at all — pins to the viewport and lets children own their scroll regions.' },
			{ chrome: 'nothing', result: 'The top bar still renders, with the title and an empty nav.' }
		]}
	/>
</Card>

<Card title="Top navigation" id="nav-items">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Hand it <Code>navItems</Code> and you get a pill bar. The active item is matched against
		<Code>window.location.pathname</Code>, so "Overview" is lit here — that's the route you're on.
	</Text>
	<div class="frame">
		<Page title={demoTitle} {navItems}>
			<Heading level={3}>Dashboard</Heading>
			<Text variant="secondary">Content renders inside a centred, padded article.</Text>
		</Page>
	</div>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Page } from 'glow';
  import type { NavItem } from 'glow';

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Examples', href: '/examples' }
  ];
<\/script>

<Page title="Dashboard" {navItems}>
  <h1>Dashboard</h1>
</Page>`}
	/>
</Card>

<Card title="Sidebar" id="sidebar">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A <Code>sidebarConfig</Code> makes <Code>Page</Code> render and wire up a
		<Link href="/components/sidebar">Sidebar</Link> for you: collapse state, the content offset that
		tracks it, and the mobile toggle. This is the chrome around the page you're reading — the frame
		below is a second, independent one. Use the chevron in its header to collapse it.
	</Text>
	<div class="frame frame-tall">
		<Page title={demoTitle} sidebarConfig={demoSidebar}>
			<Heading level={3}>Inbox</Heading>
			<Text variant="secondary">
				The content column is offset by the rail's width and follows it when it collapses.
			</Text>
		</Page>
	</div>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Page } from 'glow';
  import type { SidebarItem, SidebarGroup } from 'glow';

  const sidebarConfig = {
    title: 'Acme',
    topItems: [
      { label: 'Home', href: '/', icon: 'House' },
      { label: 'Inbox', href: '/inbox', icon: 'Inbox' }
    ],
    groups: [
      {
        label: 'Workspace',
        items: [
          { label: 'Issues', href: '/issues', icon: 'CircleDot' },
          { label: 'Projects', href: '/projects', icon: 'FolderOpen' }
        ]
      }
    ]
  };
<\/script>

<Page title="Acme" {sidebarConfig}>
  {@render children?.()}
</Page>`}
	/>
	<Text size="sm" variant="secondary">
		<Code>Page</Code> holds the collapse state internally. If you need to persist it across reloads,
		mount <Code>Sidebar</Code> yourself and bind <Code>collapsed</Code> — see the
		<Link href="/components/sidebar">Sidebar</Link> page.
	</Text>
</Card>

<Card title="Bare" id="bare">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>layout="bare"</Code> drops the shell entirely: the page pins to the viewport with
		<Code>position: fixed</Code>, hides its own overflow, and stretches its children to fill it. That
		makes each child responsible for its own scroll region — the pattern behind full-bleed app
		layouts, where a fixed header and independently scrolling panes beat one long document scroll.
	</Text>
	<div class="frame frame-tall">
		<Page title={demoTitle} layout="bare">
			<div class="app">
				<div class="app-bar">
					<Text size="sm" weight="semibold">Acme</Text>
					<Text size="sm" variant="secondary">This header stays put</Text>
				</div>
				<div class="app-body">
					<div class="app-pane">
						<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">Scrolls on its own</Text>
						{#each Array(24) as _, i}
							<Text size="sm">Item {i + 1}</Text>
						{/each}
					</div>
					<div class="app-detail">
						<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">So does this</Text>
						{#each Array(24) as _, i}
							<Text size="sm">Detail line {i + 1}</Text>
						{/each}
					</div>
				</div>
			</div>
		</Page>
	</div>
	<CodeBlock
		language="svelte"
		code={`<Page title="Acme" layout="bare">
  <div class="app">
    <header>...</header>
    <div class="body">
      <aside class="pane">...</aside>   <!-- overflow-y: auto -->
      <main class="detail">...</main>   <!-- overflow-y: auto -->
    </div>
  </div>
</Page>

<style>
  /* Children are stretched to fill the fixed page, so own your scrolling. */
  .app { display: flex; flex-direction: column; min-height: 0; }
  .body { flex: 1; display: flex; min-height: 0; }
  .pane, .detail { overflow-y: auto; }
</style>`}
	/>
	<Text size="sm" variant="secondary">
		Seen full-size in the <Link href="/examples/linear">Linear</Link>,
		<Link href="/examples/spotify">Spotify</Link>, and <Link href="/examples/steam">Steam</Link>
		examples, which the docs layout routes into bare mode.
	</Text>
</Card>

<Card title="No chrome props" id="default">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		With neither <Code>navItems</Code> nor <Code>sidebarConfig</Code>, the top bar still renders —
		just with an empty nav. Fine for a single-page app that only needs its name in the corner.
	</Text>
	<div class="frame frame-short">
		<Page title={demoTitle}>
			<Text variant="secondary">Title bar, no navigation.</Text>
		</Page>
	</div>
</Card>
<Card title="Content width" id="layouts">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Orthogonal to the chrome: <Code>contained</Code> (the default) caps the content column at 1200px
		and centres it, while <Code>full</Code> lets it span whatever width is available. Both frames
		below are the same width, and both use the top-bar chrome.
	</Text>

	<Text size="sm" style="margin-bottom: 0.5rem;"><Code>layout="contained"</Code> — the default</Text>
	<div class="frame frame-short">
		<Page title={demoTitle} layout="contained">
			<div class="fill">content column</div>
		</Page>
	</div>

	<Text size="sm" style="margin: 1.5rem 0 0.5rem;"><Code>layout="full"</Code></Text>
	<div class="frame frame-short">
		<Page title={demoTitle} layout="full">
			<div class="fill">content column</div>
		</Page>
	</div>

	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		The cap applies in sidebar mode too, measured inside the rail's offset rather than across the
		whole viewport. <Code>bare</Code> ignores this prop — it has no content column to cap.
	</Text>
</Card>
<Card title="As a root layout" id="root-layout">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Page</Code> is normally mounted once, in <Code>+layout.svelte</Code>, so every route inherits
		the same shell. Switch chrome per-route by branching on the pathname.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { page } from '$app/state';
  import { Page } from 'glow';

  let { children } = $props();

  // Full-bleed routes want the bare shell; everything else gets the sidebar.
  const bareRoutes = ['/app', '/editor'];
  const isBare = $derived(bareRoutes.some((r) => page.url.pathname.startsWith(r)));
<\/script>

{#if isBare}
  <Page title="My App" layout="bare">{@render children?.()}</Page>
{:else}
  <Page title="My App" {sidebarConfig}>{@render children?.()}</Page>
{/if}`}
	/>
</Card>

<Card title="Scroll position across navigations" id="scroll">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Beside a sidebar the content panel is the scroller, not the document — that is what keeps the
		scrollbar inside the rounded panel. The cost is that a router's scroll handling no longer
		applies to anything: SvelteKit resets <Code>window.scrollY</Code>, which on this layout is
		always <Code>0</Code>, so without the two lines below page two opens at page one's offset.
		Bind <Code>scroller</Code> and hand it to <Code>scrollMemory</Code> to get the document's
		behaviour back — top on a new page, restore on back and forward, anchor on a hash.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { Page, scrollMemory } from 'glow';

  let { children } = $props();

  let scroller = $state<HTMLElement>();
  const scroll = scrollMemory(() => scroller);
  beforeNavigate(scroll.before);
  afterNavigate(scroll.after);
<\/script>

<Page title="My App" {sidebarConfig} bind:scroller>
  {@render children?.()}
</Page>`}
	/>
	<Text variant="secondary" size="sm" style="margin-top: 1rem;">
		It takes a getter rather than the element because the element is bound after the first render,
		and the hooks are registered before it. Nothing is needed for <Code>layout="bare"</Code> or a
		page with no sidebar: those scroll the document, so the router already handles them.
	</Text>
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
			{ prop: 'title', type: 'string', default: '—', description: 'Required. Written to <title> via svelte:head, and shown in the top bar when using navItems.' },
			{ prop: 'layout', type: "'contained' | 'full' | 'bare'", default: 'contained', description: 'Content width strategy. bare drops the shell entirely and fills the viewport.' },
			{ prop: 'navItems', type: 'NavItem[]', default: '—', description: 'Renders the top pill navigation. Ignored when sidebarConfig is set.' },
			{ prop: 'sidebarConfig', type: 'SidebarConfig', default: '—', description: 'Renders a persistent Sidebar and offsets the content for it.' },
			{ prop: 'size', type: "'normal' | 'full'", default: '—', description: 'Deprecated. Use layout instead — normal maps to contained.' },
			{ prop: 'scroller', type: 'HTMLElement', default: '—', description: 'Bindable. The content panel, which is the scroller beside a sidebar. Pass it to scrollMemory so navigation resets the scroll position.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Page content, wrapped in a padded <article>.' }
		]}
	/>
</Card>

<Card title="Types" id="types">
	<CodeBlock
		language="ts"
		code={`type NavItem = {
  label: string;
  href: string;
};

type SidebarConfig = {
  title?: string;
  topItems?: SidebarItem[];
  groups?: SidebarGroup[];
};`}
	/>
</Card>

<style lang="scss">
	// Each demo mounts a real <Page>, which wants 100vh (or position: fixed, for
	// bare) and the document's scroll. `transform` makes the frame a containing
	// block for those fixed descendants — the sidebar rail and the bare shell —
	// so they resolve against the frame instead of the viewport.
	.frame {
		position: relative;
		transform: translate(0);
		height: 300px;
		overflow: hidden;
		border: 1px solid var(--glow-border-color);
		border-radius: 12px;
		background: var(--glow-bg-base);
		margin-bottom: 1rem;

		:global(.page) {
			min-height: 100%;
		}

		// The rail asks for 100vh; here it should fill the frame. Its z-index of
		// 100 is also dropped so a demo can never sit above the real chrome.
		:global(.sidebar) {
			height: 100%;
			z-index: 1;
		}
	}

	.frame-short {
		height: 200px;
		margin-bottom: 0;
	}

	.frame-tall {
		height: 380px;
	}

	.fill {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 80px;
		border: 1px dashed var(--glow-border-strong);
		border-radius: 8px;
		color: var(--glow-fg-secondary);
		font-size: 0.875rem;
	}

	// A miniature app shell for the bare demo: fixed bar, two panes that each
	// own their scrolling. `min-height: 0` at every level is what lets the
	// inner panes actually overflow instead of stretching their parents.
	.app {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.app-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 0 0 auto;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--glow-border-color);
		background: var(--glow-bg-surface);
	}

	.app-body {
		display: flex;
		flex: 1 1 auto;
		min-height: 0;
	}

	.app-pane {
		flex: 0 0 180px;
		min-height: 0;
		overflow-y: auto;
		padding: 0.75rem;
		border-right: 1px solid var(--glow-border-color);
	}

	.app-detail {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding: 0.75rem 1rem;
	}
</style>
