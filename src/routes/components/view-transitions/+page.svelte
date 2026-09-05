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
	<Code>viewTransition</Code> wraps a SvelteKit navigation in the browser's View Transitions API, so moving
	between routes crossfades instead of cutting. It is a helper for <Code>onNavigate</Code>, not a component:
	one line of wiring, and it declines to do anything at all where the API is missing or the user has asked
	for less motion.
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

<Card title="Usage" id="usage">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Call it from <Code>onNavigate</Code> in the root layout. It returns a promise that resolves once the
		old page has been captured, which is the contract SvelteKit wants — the DOM update is held until then
		— or <Code>undefined</Code>, meaning "just navigate".
	</Text>
	<!-- The closing tag in this sample is escaped as `<\/script>`: unescaped, the
	     HTML parser ends the page's own <script> on it and every import above
	     stops resolving. -->
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
</Card>

<Card title="Persistent chrome" id="persistent-chrome">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		By default the browser snapshots the whole viewport as one group called <Code>root</Code> and
		crossfades it. That fades a persistent sidebar into a near-identical copy of itself: a slight blur or
		flicker on chrome that never actually changed. Give anything that survives the navigation its own
		<Code>view-transition-name</Code> and it becomes its own group, lifted out of <Code>root</Code>.
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
		animates. That is why the selector above is a child combinator: this very site renders a second live
		<Link href="/components/sidebar">Sidebar</Link> inside a card, and a bare <Code>.sidebar</Code> would
		have matched it too.
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
		Where <Code>document.startViewTransition</Code> does not exist — Firefox, older Safari — the helper
		returns <Code>undefined</Code> and SvelteKit navigates as it always has. There is no polyfill and
		deliberately so: a page crossfade is decoration, and decoration is not worth shipping a second
		rendering path to browsers that would only pay for it in bytes.
	</Text>
</Card>

<Card title="Props" id="props">
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
