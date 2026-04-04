<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Toast | Glow UI</title></svelte:head>

<Heading level={1}>Toast</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Toast notifications for brief, non-intrusive feedback.
</Text>

<Group label="Variants" id="variants">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Four variants for different message types.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="secondary" onclick={() => toast.info('This is an info toast')}>Info</Button>
		<Button variant="secondary" onclick={() => toast.success('Operation completed successfully')}
			>Success</Button
		>
		<Button variant="secondary" onclick={() => toast.warning('Please check your input')}
			>Warning</Button
		>
		<Button variant="secondary" onclick={() => toast.error('Something went wrong')}>Error</Button>
	</div>
</Group>

<Group label="Custom Duration" id="duration">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Control how long the toast stays visible.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="secondary" onclick={() => toast.info('Gone in 1 second', 1000)}>1s</Button>
		<Button variant="secondary" onclick={() => toast.info('Default 3 seconds')}>3s (default)</Button
		>
		<Button variant="secondary" onclick={() => toast.info('Stays for 10 seconds', 10000)}
			>10s</Button
		>
	</div>
</Group>

<Group label="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { toast } from 'glow-ui';

  // Convenience methods
  toast.info('Informational message');
  toast.success('It worked!');
  toast.warning('Be careful');
  toast.error('Something failed');

  // With custom duration (ms)
  toast.info('Quick message', 1000);

  // Dismiss programmatically
  const id = toast.info('Persistent', 0);
  toast.dismiss(id);
</script>`}
	/>
</Group>

<Group label="ToastContainer Setup" id="setup">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Add the ToastContainer once in your root layout.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script>
  import { ToastContainer } from 'glow-ui';
</script>

<!-- Position options: top-right, top-left, bottom-right, bottom-left, top-center, bottom-center -->
<ToastContainer position="top-right" />`}
	/>
</Group>

<Group label="Toast API" id="api">
	<Table
		variant="simple"
		columns={[
			{ key: 'method', label: 'Method', render: codeCell },
			{ key: 'args', label: 'Arguments', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ method: 'toast.info', args: '(label, duration?)', description: 'Show an info toast' },
			{ method: 'toast.success', args: '(label, duration?)', description: 'Show a success toast' },
			{ method: 'toast.warning', args: '(label, duration?)', description: 'Show a warning toast' },
			{ method: 'toast.error', args: '(label, duration?)', description: 'Show an error toast' },
			{ method: 'toast.dismiss', args: '(id)', description: 'Dismiss a toast by ID' }
		]}
	/>
</Group>

<Group label="ToastContainer Props" id="props">
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
				prop: 'position',
				type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'",
				default: "'top-right'",
				description: 'Where toasts appear on screen'
			}
		]}
	/>
</Group>
