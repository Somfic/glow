<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Table from '$lib/data/Table.svelte';
	import Link from '$lib/typography/Link.svelte';

	// Read in an effect, not at module scope: this page is prerendered, so
	// `document` and `matchMedia` only exist once it is running in a browser.
	let supported = $state(false);
	let reduced = $state(false);
	$effect(() => {
		supported = 'startViewTransition' in document;
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = query.matches;
		const update = () => (reduced = query.matches);
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const active = $derived(supported && !reduced);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>View Transitions | Glow UI</title></svelte:head>

<Heading level={1}>View Transitions</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Moving between routes crossfades instead of cutting, and a <Code>Page</Code>'s sidebar stays still
	while it happens. <Code>Root</Code> wires this up, so it is on with no code at all — and it declines
	to do anything where the API is missing or the user has asked for less motion.
</Text>

<Card title="Try it" id="try-it">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		This site is wired up with it. Follow one of these links and watch the content panel — the sidebar
		beside it does not move, flicker or fade.
	</Text>
	<Flex direction="horizontal" gap="md" align="center" wrap>
		<Link href="/components/card">Card</Link>
		<Link href="/components/timeline">Timeline</Link>
		<Link href="/components/charts">Charts</Link>
		<Link href="/">Home, with its shader</Link>
	</Flex>
	<Flex direction="horizontal" gap="sm" align="center" wrap style="margin-top: 1rem;">
		<Pill
			label={supported ? 'API supported' : 'API unsupported'}
			variant={supported ? 'filled' : 'outlined'}
		/>
		<Pill
			label={reduced ? 'prefers-reduced-motion: reduce' : 'motion allowed'}
			variant={reduced ? 'filled' : 'outlined'}
		/>
		<Pill
			label={active ? 'transitions running' : 'transitions skipped'}
			variant="outlined"
		/>
	</Flex>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		{#if active}
			Your browser supports the API and you have not asked for reduced motion, so navigations here run a
			crossfade.
		{:else if !supported}
			Your browser has no <Code>document.startViewTransition</Code> — Firefox and older Safari. Navigation
			is completely untouched: the pages simply swap, exactly as they did before this existed.
		{:else}
			You have <Code>prefers-reduced-motion: reduce</Code> set, so no transition is started.
		{/if}
	</Text>
</Card>

<Card title="Turning it off" id="config">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Root</Code> registers the navigation hook and turns transitions on. Pass
		<Code>transitions={false}</Code> to switch them off for the whole app, or on a single
		<Code>Page</Code> to override the shell it renders.
	</Text>
	<!-- The closing tag in this sample is escaped as `<\/script>`: unescaped, the
	     HTML parser ends the page's own <script> on it, and svelte-check then
	     parses this whole file as raw TypeScript. -->
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { Root, Page } from 'glow';
<\/script>

<!-- on, and named, with nothing to write -->
<Root>
  <Page title="Acme" {sidebarConfig}>{@render children?.()}</Page>
<\/Root>

<!-- off everywhere -->
<Root transitions={false}>…<\/Root>

<!-- on, except for this shell -->
<Root>
  <Page title="Acme" {sidebarConfig} transitions={false}>…<\/Page>
<\/Root>`}
	/>
</Card>

<Card title="Driving it yourself" id="usage">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>viewTransition</Code> is still exported for an app that does not mount <Code>Root</Code>, or
		that wants to decide per navigation. It returns the promise SvelteKit wants — resolving once the old
		page has been captured, with the DOM update held until then — or <Code>undefined</Code>, meaning
		"just navigate".
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { viewTransition } from 'glow';

  onNavigate(viewTransition);
<\/script>`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		<Code>onNavigate</Code> registers on mount, so nothing here runs while a static site is being
		prerendered. Pass <Code>skip</Code> to opt a navigation out — the usual case is a route whose tabs or
		filters live in the URL, where a crossfade on every keystroke is noise.
	</Text>
	<CodeBlock
		language="ts"
		code={`onNavigate((navigation) =>
  viewTransition(navigation, {
    skip: (n) => n.to?.route.id === n.from?.route.id
  })
);`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Doing this alongside <Code>Root</Code> would start two transitions for one navigation. Either mount
		<Code>Root</Code> and leave it alone, or pass <Code>transitions={false}</Code> and drive it here.
	</Text>
</Card>

<Card title="Persistent chrome" id="persistent-chrome">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		By default the browser snapshots the whole viewport as one group called <Code>root</Code> and
		crossfades it. That fades a persistent sidebar into a near-identical copy of itself: a slight blur or
		flicker on chrome that never actually changed. Give anything that survives the navigation its own
		<Code>view-transition-name</Code> and it becomes its own group, lifted out of <Code>root</Code>.
	</Text>
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>Page</Code> already does this for the rail it renders — the snippet below is what you would
		write for chrome of your own, and what <Code>Sidebar</Code>'s
		<Code>viewTransitionName</Code> prop does for a rail you mount yourself.
	</Text>
	<CodeBlock
		language="css"
		code={`.app-shell > .sidebar {
  view-transition-name: app-sidebar;
}

/* Same element on both sides, so there is nothing to animate:
   show the new snapshot immediately. */
::view-transition-old(app-sidebar) { display: none; }
::view-transition-group(app-sidebar),
::view-transition-new(app-sidebar) { animation: none; }`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		A <Code>view-transition-name</Code> must be unique in the document. Two elements sharing one makes
		the browser abandon the transition — the navigation still works, so the only symptom is that nothing
		animates. That is why the selector above is a child combinator, and why a name is a prop rather than
		a stylesheet rule: this very site renders three live <Link href="/components/sidebar">Sidebar</Link>s
		on one page, and a bare <Code>.sidebar</Code> would match all of them. <Code>Page</Code> hands the
		name to the first shell to mount and leaves the rest unnamed.
	</Text>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Because that failure is invisible, <Code>Sidebar</Code> counts the claims on each name and warns in
		development if one is taken twice. Nothing is logged in a production build.
	</Text>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Name only what you have to. Snapshots are painted in the order their names appear, and
		<Code>z-index</Code> does not follow them into the view-transition tree — naming this shell's
		full-viewport background, which sits behind the content at <Code>z-index: -1</Code>, painted it
		<em>over</em> the crossfade and blanked the panel for the length of every navigation. Chrome that
		does not visibly change is better left inside <Code>root</Code>.
	</Text>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		A snapshot is a picture, including a <Code>&lt;canvas&gt;</Code>: a WebGL background such as
		<Link href="/components/glow">Glow</Link> is captured as a still, holds that frame for the length
		of the transition and resumes afterwards. Fine at these durations, and another reason to keep them
		short.
	</Text>
</Card>

<Card title="Reduced motion, and browsers without the API" id="reduced-motion">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A crossfade of the entire viewport is exactly the kind of motion <Code
			>prefers-reduced-motion</Code
		> exists to suppress, so under it <Code>viewTransition</Code> starts no transition at all rather than
		running a 1ms one. This matters more than it looks: these animations come from the browser's own
		stylesheet on the <Code>::view-transition-*</Code> pseudo-elements, so they are not built from
		<Code>--glow-dur-*</Code> and the library's global reduced-motion rule never reaches them. If you
		restyle those pseudo-elements, drive the duration from a token — custom properties inherit into the
		view-transition tree — so the collapse applies there too.
	</Text>
	<CodeBlock
		language="css"
		code={`::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--glow-dur-base);
  animation-timing-function: var(--glow-ease-out);
}`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Glow's stylesheet already carries exactly that, so the crossfade is on the tokens without you doing
		anything — a second line of defence behind refusing to start a transition in the first place. The
		snippet is here for pseudo-elements of your own.
	</Text>
	<Text size="sm" variant="secondary" style="margin-top: 1rem;">
		Where <Code>document.startViewTransition</Code> does not exist — Firefox, older Safari — the helper
		returns <Code>undefined</Code> and SvelteKit navigates as it always has. There is no polyfill and
		deliberately so: a page crossfade is decoration, and decoration is not worth shipping a second
		rendering path to browsers that would only pay for it in bytes.
	</Text>
</Card>

<Card title="Props" id="props">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The component props, first — these are all most apps ever touch.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'on', label: 'On', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'transitions', on: 'Root', type: 'boolean', default: 'true', description: 'Register the navigation hook and name the shell. Off disables both halves.' },
			{ prop: 'transitions', on: 'Page', type: 'boolean', default: 'inherited', description: 'Override Root for this shell. Controls naming only — Root still owns the hook.' },
			{ prop: 'viewTransitionName', on: 'Sidebar', type: 'string | null', default: 'null', description: 'A CSS custom-ident, so any name is allowed and yours may already be targeted by your own rules. Page sets it; a duplicate warns in development.' }
		]}
	/>
	<Text variant="secondary" size="sm" style="margin: 1rem 0;">
		And <Code>viewTransition</Code> itself, for the manual route above.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Argument', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'navigation', type: 'ViewTransitionNavigation', default: '—', description: 'Required. The object onNavigate hands you; only its complete promise is read.' },
			{ prop: 'options.skip', type: 'boolean | ((navigation) => boolean)', default: 'false', description: 'Skip the transition for this navigation and navigate normally.' },
			{ prop: '→ returns', type: 'Promise<void> | undefined', default: '—', description: 'The promise onNavigate should return, or undefined when no transition is started.' }
		]}
	/>
</Card>
