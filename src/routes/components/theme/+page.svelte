<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import ThemeProvider, { type ThemeMode } from '$lib/style/ThemeProvider.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Input from '$lib/input/Input.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Spinner from '$lib/spinner/Spinner.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	let mode = $state<ThemeMode>('light');
	let sampleText = $state('Hello');

	const accents: { name: string; primary: string }[] = [
		{ name: 'Spotify', primary: '#1db954' },
		{ name: 'Linear', primary: '#5e6ad2' },
		{ name: 'Steam', primary: '#66c0f4' },
		{ name: 'Danger', primary: '#ef4444' }
	];

	const seedTokens = [
		{ token: '--glow-bg-base', role: 'Page background' },
		{ token: '--glow-bg-surface', role: 'Cards, sidebars, popovers' },
		{ token: '--glow-bg-surface-element', role: 'Inputs and controls on a surface' },
		{ token: '--glow-fg', role: 'Foreground text' },
		{ token: '--glow-primary', role: 'Accent — buttons, active states, focus rings' },
		{ token: '--glow-color-danger', role: 'Destructive' },
		{ token: '--glow-color-success', role: 'Positive' },
		{ token: '--glow-color-warning', role: 'Caution' },
		{ token: '--glow-color-info', role: 'Informational' }
	];
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

{#snippet controls()}
	<Flex gap="md">
		<Flex direction="horizontal" gap="sm" wrap>
			<Button label="Primary" variant="primary" />
			<Button label="Secondary" variant="secondary" />
			<Button label="Ghost" variant="ghost" />
			<Button label="Danger" variant="danger" />
		</Flex>
		<Input type="text" label="Field" bind:value={sampleText} />
		<Flex direction="horizontal" gap="sm" align="center">
			<Pill label="filled" />
			<Pill label="outlined" variant="outlined" />
			<Spinner size={18} />
		</Flex>
	</Flex>
{/snippet}

<svelte:head><title>Theme | Glow UI</title></svelte:head>

<Heading level={1}>Theme</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Every colour in Glow resolves from nine seed tokens. <Code>ThemeProvider</Code> sets those tokens on
	a subtree — so you can run a light panel inside a dark app, or re-accent one section, without
	touching global CSS.
</Text>

<Card title="Light and dark" id="modes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>theme</Code> stamps <Code>data-theme</Code> on the wrapper. Both panels below are inside this
		dark page — the right-hand one just declares itself light.
	</Text>
	<Grid min="260px" gap="md">
		<div class="panel">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;"><Code>theme="dark"</Code></Text>
			<ThemeProvider theme="dark">
				<div class="surface">{@render controls()}</div>
			</ThemeProvider>
		</div>
		<div class="panel">
			<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;"><Code>theme="light"</Code></Text>
			<ThemeProvider theme="light">
				<div class="surface">{@render controls()}</div>
			</ThemeProvider>
		</div>
	</Grid>
</Card>

<Card title="Toggling" id="toggle">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>theme</Code> is reactive — flip it and the whole subtree repaints. There's no transition
		baked in; add one on your own container if you want the change to fade.
	</Text>
	<ButtonGroup>
		<Button label="Dark" selected={mode === 'dark'} onclick={() => (mode = 'dark')} />
		<Button label="Light" selected={mode === 'light'} onclick={() => (mode = 'light')} />
	</ButtonGroup>
	<div style="margin-top: 1rem;">
		<ThemeProvider theme={mode}>
			<div class="surface">{@render controls()}</div>
		</ThemeProvider>
	</div>
</Card>

<Card title="Accent theming" id="tokens">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>tokens</Code> writes arbitrary <Code>--glow-*</Code> overrides onto the wrapper. Because
		hover, active, soft, and secondary variants are all derived from <Code>--glow-primary</Code> with
		<Code>color-mix</Code>, overriding that one value re-accents everything consistently — including
		the contrast-aware label colour on primary buttons.
	</Text>
	<Grid min="240px" gap="md">
		{#each accents as accent (accent.name)}
			<div class="panel">
				<Flex direction="horizontal" gap="sm" align="center" style="margin-bottom: 0.75rem;">
					<span class="swatch" style="background: {accent.primary};"></span>
					<Text size="sm" variant="secondary">{accent.name} — <Code>{accent.primary}</Code></Text>
				</Flex>
				<ThemeProvider tokens={{ '--glow-primary': accent.primary }}>
					<div class="surface">
						<Flex direction="horizontal" gap="sm" wrap>
							<Button label="Primary" variant="primary" />
							<Button label="Secondary" variant="secondary" />
							<Pill label="Pill" />
						</Flex>
					</div>
				</ThemeProvider>
			</div>
		{/each}
	</Grid>
</Card>

<Card title="Combining both" id="combined">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>theme</Code> sets the seeds, <Code>tokens</Code> overrides individual ones on top — so a
		light panel with a custom accent is one component.
	</Text>
	<ThemeProvider theme="light" tokens={{ '--glow-primary': '#1db954' }}>
		<div class="surface">{@render controls()}</div>
	</ThemeProvider>
</Card>

<Card title="Seed tokens" id="seeds">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		These are the values <Code>[data-theme]</Code> sets. Everything else — borders, hovers, soft
		washes, secondary surfaces, text tiers — derives from them, so overriding a seed is usually enough
		and overriding a derived token is usually a mistake.
	</Text>
	<Table
		variant="simple"
		columns={[
			{ key: 'token', label: 'Token', render: codeCell },
			{ key: 'role', label: 'Role' }
		]}
		data={seedTokens}
	/>
</Card>

<Card title="Derived tokens" id="derived">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A sample of what the seeds produce. Read these in your own CSS rather than hard-coding colours —
		then your components follow any theme they're dropped into.
	</Text>
	<CodeBlock
		language="css"
		code={`--glow-border-color:        color-mix(in oklab, var(--glow-bg-base), var(--glow-fg) 16%);
--glow-primary-hover:       color-mix(in oklab, var(--glow-primary), white 15%);
--glow-primary-active:      color-mix(in oklab, var(--glow-primary), black 10%);
--glow-primary-soft:        color-mix(in oklab, var(--glow-primary) 10%, transparent);
--glow-secondary:           color-mix(in oklab, var(--glow-primary) 10%, var(--glow-bg-surface));
--glow-text-secondary:      color-mix(in oklab, var(--glow-fg) 70%, transparent);
--glow-text-muted:          color-mix(in oklab, var(--glow-fg) 50%, transparent);`}
	/>
</Card>

<Card title="Density and motion" id="density">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Two more families of runtime tokens live alongside the colours.
		<Code>data-density</Code> — <Code>compact</Code> or <Code>spacious</Code> — rescales the
		<Link href="/components/settings">Field and Section</Link> rhythm. Motion tokens
		(<Code>--glow-dur-*</Code>, <Code>--glow-ease-*</Code>) are collapsed to 1ms automatically under
		<Code>prefers-reduced-motion</Code>, so components that use them get the accessible behaviour for
		free.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<!-- Density is a plain attribute, not a ThemeProvider prop -->
<div data-density="compact">
  <SettingsSection title="Notifications">
    <Field label="Email" ... />
  </SettingsSection>
</div>

<style>
  .fade {
    transition: opacity var(--glow-dur-fast) var(--glow-ease-out);
  }
</style>`}
	/>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { ThemeProvider, type ThemeMode } from 'glow';

  let theme = $state<ThemeMode>('dark');
</script>

<!-- Whole-app theming -->
<ThemeProvider {theme}>
  <App />
</ThemeProvider>

<!-- Re-accent one subtree -->
<ThemeProvider tokens={{ '--glow-primary': '#1db954' }}>
  <NowPlaying />
</ThemeProvider>`}
	/>
</Card>

<Card title="Global theming" id="global">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>ThemeProvider</Code> is for subtrees. For the whole document, set the attribute on
		<Code>&lt;html&gt;</Code> — that's the same hook the component uses, and it means the page
		background itself follows the theme.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<svelte:html data-theme={theme} />

<!-- or, to override a seed globally -->
<style>
  :root {
    --glow-primary: #1db954;
  }
</style>`}
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
			{ prop: 'theme', type: "'dark' | 'light'", default: 'dark', description: 'Sets data-theme on the wrapper, swapping the seed tokens.' },
			{ prop: 'tokens', type: 'Record<string, string>', default: '—', description: 'Inline --glow-* overrides on the wrapper. Applied on top of theme.' },
			{ prop: 'class', type: 'string', default: '—', description: 'Class on the wrapper div.' },
			{ prop: 'children', type: 'Snippet', default: '—', description: 'Required. The themed subtree.' }
		]}
	/>
</Card>

<Card title="Gotcha: display: contents" id="gotcha">
	<Text variant="secondary" size="sm">
		The wrapper is <Code>display: contents</Code>, so it generates no box of its own — layout is
		unaffected, but it also paints nothing. Custom properties still inherit normally, which is all the
		child components need. If you want the themed region to actually show its background, set
		<Code>background: var(--glow-bg-base)</Code> on an element inside it — that's what the panels on
		this page do.
	</Text>
</Card>

<Card title="In the wild" id="examples">
	<Text size="sm" variant="secondary">
		The <Link href="/examples/spotify">Spotify</Link>,
		<Link href="/examples/steam">Steam</Link>, and <Link href="/examples/spark">Spark</Link> examples
		each wrap themselves in a <Code>ThemeProvider</Code> with a brand accent — same components, three
		different looks.
	</Text>
</Card>

<style lang="scss">
	.panel {
		padding: 0.875rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
	}

	// ThemeProvider is display: contents and paints nothing, so the demo needs
	// an element inside it that actually reads the background token.
	.surface {
		padding: 1rem;
		border-radius: 10px;
		background: var(--glow-bg-base);
		color: var(--glow-fg);
		border: 1px solid var(--glow-border-color);
	}

	.swatch {
		width: 14px;
		height: 14px;
		border-radius: 4px;
		flex: 0 0 auto;
	}
</style>
