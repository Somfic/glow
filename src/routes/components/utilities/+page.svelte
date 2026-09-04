<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Button from '$lib/button/Button.svelte';
	import Modal from '$lib/modal/Modal.svelte';
	import Drawer from '$lib/drawer/Drawer.svelte';
	import Input from '$lib/input/Input.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import { useModal, useDrawer } from '$lib/modal/modal.svelte.js';
	import { registerShortcut } from '$lib/util/shortcut.svelte.js';
	import { trapFocus } from '$lib/util/focusTrap.js';
	import { portal } from '$lib/util/portal.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	const dialog = useModal();
	const panel = useDrawer();

	let shortcutHits = $state(0);
	$effect(() => registerShortcut('g', () => shortcutHits++));

	let trapOpen = $state(false);
	let trapContainer = $state<HTMLDivElement>();

	let portaled = $state(false);
	let name = $state('');
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Utilities | Glow UI</title></svelte:head>

<Heading level={1}>Utilities</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Small, dependency-free primitives the components are built on, exported because apps keep needing
	the same four things: a runed open/close controller, a global shortcut, a focus trap, and a way to
	escape <Code>overflow: hidden</Code>.
</Text>

<Card title="useModal / useDrawer" id="use-modal">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A tiny reactive controller with <Code>open</Code>, <Code>show</Code>, <Code>hide</Code>, and
		<Code>toggle</Code>. It replaces the <Code>bind:this</Code> pattern — no component ref to declare,
		and the methods are pre-bound so you can pass them straight to <Code>onclick</Code>.
		<Code>useDrawer</Code> is the same function under a name that reads right next to a
		<Code>Drawer</Code>.
	</Text>
	<Flex direction="horizontal" gap="md" align="center" wrap>
		<Button variant="secondary" label="Open modal" onclick={dialog.show} />
		<Button variant="secondary" label="Open drawer" onclick={panel.show} />
		<Pill label={`modal: ${dialog.open ? 'open' : 'closed'}`} variant="outlined" />
		<Pill label={`drawer: ${panel.open ? 'open' : 'closed'}`} variant="outlined" />
	</Flex>

	<Modal bind:open={dialog.open} title="Driven by useModal">
		<Text size="sm">
			<Code>dialog.show</Code> opened this. <Code>dialog.open</Code> is bound, so dismissing it any
			other way keeps the controller in sync.
		</Text>
		{#snippet footer()}
			<Button label="Close" onclick={dialog.hide} />
		{/snippet}
	</Modal>

	<Drawer bind:open={panel.open} title="Driven by useDrawer">
		<Text size="sm">Same controller — <Code>Drawer</Code> shares the <Code>open</Code> shape.</Text>
	</Drawer>

	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { useModal, Modal, Button } from 'glow';

  const dialog = useModal();          // useModal(true) starts open
</script>

<Button label="Edit" onclick={dialog.show} />

<Modal bind:open={dialog.open} title="Edit">
  ...
  {#snippet footer()}
    <Button label="Cancel" onclick={dialog.hide} />
  {/snippet}
</Modal>`}
	/>
	<Table
		variant="simple"
		columns={[
			{ key: 'member', label: 'Member', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ member: 'open', type: 'boolean', description: 'Reactive getter/setter. Bind it to the component.' },
			{ member: 'show()', type: '() => void', description: 'Open. Pre-bound — safe to pass by reference.' },
			{ member: 'hide()', type: '() => void', description: 'Close. Pre-bound.' },
			{ member: 'toggle()', type: '() => void', description: 'Flip. Pre-bound.' },
			{ member: 'useModal(initial?)', type: '(boolean) => ModalController', description: 'Factory. Defaults to closed.' },
			{ member: 'useDrawer', type: 'alias of useModal', description: 'Same controller, clearer at the call site.' }
		]}
	/>
</Card>

<Card title="registerShortcut" id="register-shortcut">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A global <Code>keydown</Code> listener that ignores keystrokes typed into inputs, textareas,
		selects, and <Code>contenteditable</Code> — the bug you'd otherwise ship is a hotkey firing while
		someone types. It returns its own cleanup function, so returning it from an
		<Code>$effect</Code> is all the teardown you need.
	</Text>
	<Flex direction="horizontal" gap="md" align="center" wrap>
		<Text size="sm">Press <Kbd>g</Kbd> anywhere on this page:</Text>
		<Pill label={`${shortcutHits} ${shortcutHits === 1 ? 'press' : 'presses'}`} variant="outlined" />
	</Flex>
	<Text size="sm" variant="secondary" style="margin: 0.75rem 0;">
		Now type <Code>g</Code> into this field — the counter stays put.
	</Text>
	<Input type="text" bind:value={name} placeholder="Typing here doesn't trigger it" />
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { registerShortcut } from 'glow';

  let open = $state(false);

  // Cleanup is the effect's return value.
  $effect(() => registerShortcut('k', () => (open = true)));
</script>`}
	/>
	<Text size="sm" variant="secondary">
		<Code>Button</Code> uses this internally for its <Code>shortcut</Code> prop, and
		<Code>CommandPalette</Code> for its open key — so you rarely need it directly.
	</Text>
</Card>

<Card title="trapFocus" id="trap-focus">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Keeps Tab cycling inside a container. It's a plain handler, not an action: call it from
		<Code>onkeydown</Code> with the container element and the event. It only acts on
		<Code>Tab</Code> and skips disabled elements, so wiring it up costs one line.
	</Text>
	<Button variant="secondary" label={trapOpen ? 'Release focus' : 'Trap focus in the box'} onclick={() => (trapOpen = !trapOpen)} />
	{#if trapOpen}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="trap"
			bind:this={trapContainer}
			onkeydown={(e) => trapFocus(trapContainer ?? null, e)}
			role="group"
		>
			<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;">
				Click a button below, then press Tab repeatedly — focus never leaves this box.
			</Text>
			<Flex direction="horizontal" gap="sm" wrap>
				<Button variant="secondary" label="First" onclick={() => toast.info('First')} />
				<Button variant="secondary" label="Second" onclick={() => toast.info('Second')} />
				<Button variant="secondary" label="Disabled" disabled />
				<Button variant="secondary" label="Last" onclick={() => toast.info('Last')} />
			</Flex>
		</div>
	{/if}
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { trapFocus } from 'glow';

  let container = $state<HTMLElement>();
</script>

<div bind:this={container} onkeydown={(e) => trapFocus(container ?? null, e)}>
  <button>First</button>
  <button>Last</button>
</div>`}
	/>
</Card>

<Card title="portal" id="portal">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		A Svelte action that moves its node to <Code>document.body</Code> (or a target you pass) on mount
		and removes it on destroy. That's how overlays escape a scroll container's
		<Code>overflow: hidden</Code> and any ancestor <Code>z-index</Code> stacking.
	</Text>
	<div class="clipper">
		<Text size="sm" variant="secondary" style="margin-bottom: 0.5rem;">
			This box has <Code>overflow: hidden</Code>.
		</Text>
		<Button
			variant="secondary"
			label={portaled ? 'Remove the banner' : 'Show a portaled banner'}
			onclick={() => (portaled = !portaled)}
		/>
		{#if portaled}
			<div class="floater" use:portal>
				<Flex direction="horizontal" gap="md" align="center">
					<Text size="sm">Rendered from inside the clipped box, mounted on <Code>body</Code>.</Text>
					<Button variant="ghost" icon="X" onclick={() => (portaled = false)} />
				</Flex>
			</div>
		{/if}
	</div>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { portal } from 'glow';
</script>

<div use:portal>I live on document.body now</div>

<!-- Or target a specific element -->
<div use:portal={someElement}>...</div>`}
	/>
	<Text size="sm" variant="secondary">
		Portaling breaks DOM ancestry, which breaks naive click-outside checks — a nested popover's
		content ends up as a <em>sibling</em> of its parent's. The module records where each node came
		from and exports <Code>containsThrough(container, target)</Code>, a
		<Code>.contains()</Code> that follows portal origins. <Code>Popover</Code> and
		<Code>PopoverMenu</Code> rely on it to nest correctly.
	</Text>
</Card>

<Card title="sortable" id="sortable">
	<Text variant="secondary" size="sm">
		The drag-to-reorder action is documented on its own page, along with drag handles and
		cross-container groups — see <Link href="/components/sortable">Sortable</Link> and the
		<Link href="/components/tierlist">Tier List</Link> demo.
	</Text>
</Card>

<Card title="tooltip" id="tooltip">
	<Text variant="secondary" size="sm">
		The tooltip action lives on <Link href="/components/tooltip">its own page</Link> — it's an action
		rather than a component so it can attach to anything, including the cursor.
	</Text>
</Card>

<Card title="Exports" id="exports">
	<Table
		variant="simple"
		columns={[
			{ key: 'name', label: 'Export', render: codeCell },
			{ key: 'kind', label: 'Kind' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ name: 'useModal / useDrawer', kind: 'factory', description: 'Reactive open/close controller for Modal and Drawer.' },
			{ name: 'ModalController', kind: 'class', description: 'The controller class, if you want to construct or extend it directly.' },
			{ name: 'registerShortcut', kind: 'function', description: 'Global keydown listener that ignores editable targets. Returns its cleanup.' },
			{ name: 'trapFocus', kind: 'function', description: 'Tab-cycling handler. Call from onkeydown with (container, event).' },
			{ name: 'portal', kind: 'action', description: 'Move a node to body (or a target) on mount; remove on destroy.' },
			{ name: 'sortable', kind: 'action', description: 'Drag-to-reorder, with optional handles and cross-container groups.' },
			{ name: 'tooltip', kind: 'action', description: 'Attach a tooltip to any element.' }
		]}
	/>
</Card>

<style lang="scss">
	.trap {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--glow-primary);
		border-radius: 10px;
		background: var(--glow-primary-soft);
	}

	.clipper {
		position: relative;
		height: 130px;
		padding: 1rem;
		overflow: hidden;
		border: 1px dashed var(--glow-border-strong);
		border-radius: 10px;
	}

	// Portaled to body, so it needs its own fixed positioning.
	.floater {
		position: fixed;
		left: 50%;
		bottom: 1.5rem;
		transform: translateX(-50%);
		z-index: 10000;
		padding: 0.75rem 1rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		border-radius: 10px;
		box-shadow: var(--glow-shadow-lg);
	}
</style>
