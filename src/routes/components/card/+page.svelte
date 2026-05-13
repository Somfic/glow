<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Spinner from '$lib/spinner/Spinner.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';

	let collapsibleOpen = $state(false);
	let streaming = $state(false);
	let streamProgress = $state('Considering trade-offs between caching strategies…');

	function toggleStream() {
		streaming = !streaming;
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Card | Glow UI</title></svelte:head>

<Heading level={1}>Card</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A surface container with optional header, footer, icon, accent, and a collapsible mode. Pair with
	an image-anchored variant via the <code>media</code> prop.
</Text>

<Card title="Basics" id="basics">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <code>title</code> and <code>description</code> for the simplest variant, or supply children
		for arbitrary content.
	</Text>
	<Grid min="260px" gap="md">
		<Card title="Hello" description="A plain Card with title and description props." />
		<Card
			icon="Sparkles"
			title="With icon"
			description="Add a leading icon for visual anchoring."
		/>
		<Card title="Children" description="Slot anything in via children.">
			<Flex gap="sm">
				<Text size="sm">Custom body content goes here.</Text>
				<Flex direction="horizontal" gap="xs"><Pill label="alpha" /> <Pill label="beta" /></Flex>
			</Flex>
		</Card>
	</Grid>
</Card>

<Card title="Title, footer, and actions" id="header-footer">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<code>title</code> renders in the banded header. <code>actions</code> place buttons on the right
		of the header. <code>footer</code> snippet adds a banded section under the body. For a fully
		custom header, pass a <code>header</code> snippet.
	</Text>
	<Grid min="320px" gap="md">
		<Card
			title="Subscription"
			actions={[
				{ icon: 'Settings', tooltip: 'Settings', onclick: () => {} },
				{ icon: 'Ellipsis', tooltip: 'More', onclick: () => {} }
			]}
		>
			<Flex gap="xs">
				<Text>Your plan renews on April 14.</Text>
				<Text size="sm" variant="secondary">$12 / month, billed annually.</Text>
			</Flex>
			{#snippet footer()}
				<Flex direction="horizontal" gap="xs"
					><Button label="Manage" variant="ghost" /><Button
						label="Upgrade"
						variant="primary"
					/></Flex
				>
			{/snippet}
		</Card>

		<Card title="Recent activity" icon="Activity">
			{#snippet headerExtra()}<Pill label="3" />{/snippet}
			<Flex gap="xs">
				<Text size="sm">somfic pushed 4 commits.</Text>
				<Text size="sm">somfic opened pull request #142.</Text>
				<Text size="sm">somfic deployed to production.</Text>
			</Flex>
		</Card>
	</Grid>
</Card>

<Card title="Variants & accent colour" id="variants">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass any hex colour to <code>accentColor</code> for a tinted background and border.
	</Text>
	<Grid min="220px" gap="md">
		<Card title="Default" description="The standard surface card." />
		<Card
			title="Sparkles"
			description="Tinted with #8B6DED."
			accentColor="#8B6DED"
			icon="Sparkles"
		/>
		<Card
			title="Success"
			description="Tinted with #22c55e."
			accentColor="#22c55e"
			icon="CircleCheck"
		/>
		<Card
			title="Warning"
			description="Tinted with #f59e0b."
			accentColor="#f59e0b"
			icon="TriangleAlert"
		/>
	</Grid>
</Card>

<Card title="Padding" id="padding">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<code>padding</code> controls the body padding: <code>none</code>, <code>sm</code>,
		<code>md</code> (default), <code>lg</code>.
	</Text>
	<Grid min="180px" gap="md">
		<Card padding="none"><Text size="sm">none</Text></Card>
		<Card padding="sm"><Text size="sm">sm</Text></Card>
		<Card padding="md"><Text size="sm">md</Text></Card>
		<Card padding="lg"><Text size="sm">lg</Text></Card>
	</Grid>
</Card>

<Card title="Clickable cards" id="clickable">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <code>href</code> to render the card as an anchor with hover and focus styles. Plays well
		with <code>title</code> + <code>description</code> for tile-style navigation grids.
	</Text>
	<Grid min="260px" gap="md">
		<Card
			href="/components/buttons"
			title="Buttons"
			description="Primary, secondary, ghost, danger, outlined, dashed."
		/>
		<Card
			href="/components/inputs"
			title="Inputs"
			description="Every form control: text, number, select, date, time, color."
		/>
		<Card
			href="/examples/spark"
			title="Spark example"
			description="Server-profiler dashboard built end-to-end with glow."
		/>
	</Grid>
</Card>

<Card title="Collapsible" id="collapsible">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Pass <code>collapsible</code> to make the header a clickable toggle. The body height animates smoothly
		between open and closed. Useful for streaming output, long-form details, or accordion-style sections.
	</Text>

	<Flex gap="md">
		<Card collapsible title="What's in this card?" defaultOpen={false}>
			<Text>
				The body is rendered inside an <code>overflow: hidden</code> wrapper whose
				<code>height</code> animates between <code>0</code> and the body's intrinsic size. Same
				recipe powers the <code>Tabs</code> height transition.
			</Text>
		</Card>

		<Card collapsible title="Recent activity" subtitle="last 24 hours" icon="Activity">
			{#snippet headerExtra()}<Pill label="3" />{/snippet}
			<Flex gap="xs">
				<Text size="sm">somfic deployed to production · 2m ago</Text>
				<Text size="sm">somfic merged pull request #142 · 14m ago</Text>
				<Text size="sm">somfic pushed 4 commits to main · 28m ago</Text>
			</Flex>
		</Card>

		<Card collapsible title="Streaming output" active={streaming} padding="sm">
			{#snippet headerExtra()}
				{#if streaming}<Spinner size={14} />{/if}
			{/snippet}
			<Flex gap="sm">
				<Text size="sm" variant="secondary">{streamProgress}</Text>
				<Flex direction="horizontal" gap="xs">
					<Button
						label={streaming ? 'Stop' : 'Start streaming'}
						variant={streaming ? 'danger' : 'primary'}
						icon={streaming ? 'Square' : 'Play'}
						onclick={toggleStream}
					/>
				</Flex>
			</Flex>
		</Card>

		<Card collapsible title="Bind:open from outside" bind:open={collapsibleOpen}>
			<Flex gap="xs">
				<Text size="sm">This card's open state is bound to a parent variable.</Text>
				<Text size="sm" variant="secondary">isOpen = {collapsibleOpen}</Text>
				<Flex direction="horizontal" gap="xs">
					<Button
						label="Toggle externally"
						variant="ghost"
						onclick={() => (collapsibleOpen = !collapsibleOpen)}
					/>
				</Flex>
			</Flex>
		</Card>
	</Flex>
</Card>

<Heading level={2} style="margin-top: 3rem;">Media</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Pass <code>media</code> for an image- or video-led card. Two layouts:
	<code>inline</code> (banner inside the body, header/footer separate) or
	<code>overlay</code> (media fills the surface; title and corner slots layer over it).
</Text>

<Card title="Inline media" subtitle="Image at top, title and actions below">
	<Grid min="280px" gap="md">
		<Card
			title="Dolomites"
			subtitle="Italy"
			media={{
				src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
				aspectRatio: '16 / 9'
			}}
			actions={[{ label: 'Directions', icon: 'Navigation', variant: 'primary', onclick: () => {} }]}
		/>
		<Card
			title="Yosemite"
			subtitle="USA"
			media={{
				src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop',
				aspectRatio: '16 / 9'
			}}
			actions={[{ label: 'Directions', icon: 'Navigation', variant: 'primary', onclick: () => {} }]}
		/>
	</Grid>
</Card>

<Card
	title="Overlay media"
	subtitle="Image fills the card, title and actions layered over the bottom"
>
	<Grid min="280px" gap="md">
		<Card
			title="Dolomites"
			subtitle="Italy"
			mediaLayout="overlay"
			glow
			media={{
				src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
				aspectRatio: '16 / 9'
			}}
			actions={[{ label: 'Directions', icon: 'Navigation', variant: 'ghost', onclick: () => {} }]}
		/>
		<Card
			title="Yosemite"
			subtitle="USA"
			glow
			mediaLayout="overlay"
			media={{
				src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop',
				aspectRatio: '16 / 9'
			}}
			actions={[{ label: 'Directions', icon: 'Navigation', variant: 'ghost', onclick: () => {} }]}
		/>
	</Grid>
</Card>

<Card title="Overlay corner slots" subtitle="Optional badges and buttons that fade in on hover">
	<Grid min="240px" gap="md">
		<Card
			mediaLayout="overlay"
			media={{
				src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
				aspectRatio: '4 / 3'
			}}
		>
			{#snippet topLeft()}<Pill label="New" color="#22c55e" />{/snippet}
			{#snippet topRight()}
				<ButtonGroup>
					<Button icon="Heart" variant="ghost" />
					<Button icon="Trash" variant="ghost" />
				</ButtonGroup>
			{/snippet}
			{#snippet bottomLeft()}
				<p>Karel van Abbr</p>
			{/snippet}
		</Card>
		<Card
			mediaLayout="overlay"
			media={{
				src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
				aspectRatio: '4 / 3',
				progress: 0.65
			}}
		>
			{#snippet bottomRight()}<Pill label="65%" color="#8b5cf6" />{/snippet}
		</Card>
	</Grid>
</Card>

<Card title="Usage" id="usage">
	<Heading level={3}>Plain Card</Heading>
	<CodeBlock
		language="svelte"
		code={`<Card title="Hello" description="Surface container." />

<Card icon="Sparkles" accentColor="#8B6DED">
  {#snippet header()}
    <strong>Custom header</strong>
  {/snippet}
  Body content via children.
  {#snippet footer()}
    <Button label="Save" variant="primary" />
  {/snippet}
</Card>`}
	/>

	<Heading level={3} style="margin-top: 1.5rem;">Collapsible Card</Heading>
	<CodeBlock
		language="svelte"
		code={`<Card collapsible title="Details" defaultOpen={false}>
  <Text>Body slides open and closed with a height animation.</Text>
</Card>

<!-- Externally controlled -->
<script>
  let open = $state(false);
</script>
<Card collapsible title="Controlled" bind:open>
  …
</Card>`}
	/>

	<Heading level={3} style="margin-top: 1.5rem;">Inline media</Heading>
	<CodeBlock
		language="svelte"
		code={`<Card
  title="Mountain ridge"
  media={{ src: '/img.jpg', aspectRatio: '16 / 9' }}
  footerActions={[{ label: 'Save', onclick: () => {} }]}
>
  Body text under the image.
</Card>`}
	/>

	<Heading level={3} style="margin-top: 1.5rem;">Overlay media</Heading>
	<CodeBlock
		language="svelte"
		code={`<Card
  title="Forest"
  mediaLayout="overlay"
  media={{ src: '/img.jpg' }}
  onclick={() => {}}
>
  {#snippet topRight()}<Button icon="Heart" />{/snippet}
</Card>`}
	/>
</Card>

<Card title="Card props" id="card-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{
				prop: 'title',
				type: 'string',
				default: '-',
				description:
					'Title text in the header band (or overlay caption when mediaLayout="overlay").'
			},
			{
				prop: 'subtitle',
				type: 'string',
				default: '-',
				description: 'Muted secondary line under the title.'
			},
			{
				prop: 'description',
				type: 'string',
				default: '-',
				description: 'Body text. Used when no children are passed.'
			},
			{
				prop: 'icon',
				type: 'IconProp',
				default: '-',
				description:
					'Leading icon. Renders in the header next to the title; falls back to a body hero icon when there is no header.'
			},
			{
				prop: 'href',
				type: 'string',
				default: '-',
				description: 'When set, renders an anchor with hover/focus styles.'
			},
			{
				prop: 'onclick',
				type: '() => void',
				default: '-',
				description: "Action mode — renders the card as a button when set (and href isn't)."
			},
			{
				prop: 'variant',
				type: "'default' | 'primary' | 'secondary'",
				default: "'default'",
				description: 'Visual variant.'
			},
			{
				prop: 'accentColor',
				type: 'string (hex)',
				default: '-',
				description: 'Tints background and border. Hex only.'
			},
			{
				prop: 'padding',
				type: "'none' | 'sm' | 'md' | 'lg'",
				default: "'md'",
				description: 'Body padding.'
			},
			{
				prop: 'media',
				type: 'string | { src, alt?, aspectRatio?, fit?, progress? }',
				default: '-',
				description: 'Image or video for the card. Pass URL string or full config.'
			},
			{
				prop: 'mediaLayout',
				type: "'inline' | 'overlay'",
				default: "'inline'",
				description:
					'inline = banner inside body; overlay = media fills the card with title/corner slots layered on top.'
			},
			{
				prop: 'topLeft',
				type: 'Snippet',
				default: '-',
				description: 'Corner slot (overlay layout only). Reveals on hover.'
			},
			{
				prop: 'topRight',
				type: 'Snippet',
				default: '-',
				description: 'Corner slot (overlay layout only).'
			},
			{
				prop: 'bottomLeft',
				type: 'Snippet',
				default: '-',
				description: 'Corner slot (overlay layout only).'
			},
			{
				prop: 'bottomRight',
				type: 'Snippet',
				default: '-',
				description: 'Corner slot (overlay layout only).'
			},
			{
				prop: 'actions',
				type: 'ButtonAction[]',
				default: '-',
				description: 'Right-aligned action buttons in the header.'
			},
			{
				prop: 'footerActions',
				type: 'ButtonAction[]',
				default: '-',
				description: 'Right-aligned action buttons in the footer band.'
			},
			{
				prop: 'headerExtra',
				type: 'Snippet',
				default: '-',
				description: 'Snippet right of the title (Pill, Spinner, etc.). Renders alongside actions.'
			},
			{
				prop: 'header',
				type: 'Snippet',
				default: '-',
				description: 'Replace the default title/icon/actions header layout entirely.'
			},
			{
				prop: 'footer',
				type: 'Snippet',
				default: '-',
				description: 'Banded section below the body.'
			},
			{
				prop: 'collapsible',
				type: 'boolean',
				default: 'false',
				description: 'Header becomes a toggle; body height-animates open/closed.'
			},
			{
				prop: 'open',
				type: 'boolean',
				default: '-',
				description: 'Bindable open state (collapsible mode).'
			},
			{
				prop: 'defaultOpen',
				type: 'boolean',
				default: 'true',
				description: 'Initial open state when uncontrolled.'
			},
			{
				prop: 'loading',
				type: 'boolean',
				default: 'false',
				description: 'Show a loading spinner overlay over the card body.'
			},
			{
				prop: 'selected',
				type: 'boolean',
				default: 'false',
				description: 'Selection outline (for selectable card patterns).'
			},
			{
				prop: 'active',
				type: 'boolean',
				default: 'false',
				description: 'Highlights the border (e.g. while streaming).'
			},
			{
				prop: 'onToggle',
				type: '(open: boolean) => void',
				default: '-',
				description: 'Fires when the user toggles open/closed.'
			},
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disables interactions.' }
		]}
	/>
</Card>

<Card title="MediaCard props" id="mediacard-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'src', type: 'string', default: '-', description: 'Image / media source URL.' },
			{
				prop: 'progress',
				type: 'number',
				default: '-',
				description: '0–1 progress bar at the bottom.'
			},
			{
				prop: 'topLeft',
				type: 'Snippet',
				default: '-',
				description: 'Top-left corner content (revealed on hover).'
			},
			{ prop: 'topRight', type: 'Snippet', default: '-', description: 'Top-right corner.' },
			{ prop: 'bottomLeft', type: 'Snippet', default: '-', description: 'Bottom-left corner.' },
			{ prop: 'bottomRight', type: 'Snippet', default: '-', description: 'Bottom-right corner.' },
			{ prop: 'aspectRatio', type: 'string', default: "'1'", description: 'CSS aspect ratio.' },
			{ prop: 'fit', type: "'cover' | 'contain'", default: "'cover'", description: 'object-fit.' },
			{
				prop: 'selected',
				type: 'boolean',
				default: 'false',
				description: 'Show selection outline.'
			},
			{ prop: 'disabled', type: 'boolean', default: 'false', description: 'Disable interactions.' },
			{ prop: 'onclick', type: '() => void', default: '-', description: 'Click handler.' }
		]}
	/>
</Card>
