<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Button from '$lib/button/Button.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import { confirm, alert, prompt } from '$lib/confirm/confirm.svelte.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	let projects = $state(['Aurora', 'Basalt', 'Cinder']);

	async function remove(name: string) {
		const ok = await confirm({
			title: `Delete ${name}?`,
			message: 'The project and everything in it is removed. This cannot be undone.',
			confirmLabel: 'Delete project',
			variant: 'danger'
		});
		if (ok) projects = projects.filter((p) => p !== name);
	}

	async function rename() {
		const name = await prompt({
			title: 'Rename workspace',
			message: 'Pick something your team will recognise.',
			value: 'Acme HQ',
			placeholder: 'Workspace name',
			required: true,
			confirmLabel: 'Rename'
		});
		if (name !== null) toast.success(`Renamed to ${name}`);
	}
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Confirm | Glow UI</title></svelte:head>

<Heading level={1}>Confirm</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	<Code>confirm</Code>, <Code>alert</Code> and <Code>prompt</Code> as promises — the three native
	dialogs, in the library's own chrome, awaited where the decision is actually made.
</Text>

<Card title="Confirm" id="confirm">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Resolves <Code>true</Code> when accepted and <Code>false</Code> for every other way out — Cancel,
		Escape, or a click on the backdrop. Focus opens on the cancelling button.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button
			variant="secondary"
			label="Ask"
			onclick={async () => {
				const ok = await confirm({ message: 'Publish these changes to production?' });
				toast.info(ok ? 'Published' : 'Cancelled');
			}}
		/>
		<Button
			variant="secondary"
			label="Shorthand"
			onclick={async () => {
				toast.info((await confirm('Leave without saving?')) ? 'Left' : 'Stayed');
			}}
		/>
	</div>
</Card>

<Card title="Danger" id="danger">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>variant="danger"</Code> paints the accepting button red and marks the message with a warning
		glyph. Focus still opens on Cancel, so a stray Enter or Space never destroys anything.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		{#each projects as project (project)}
			<Button variant="danger" icon="Trash" label={project} onclick={() => remove(project)} />
		{/each}
		{#if projects.length === 0}
			<Button variant="ghost" label="Restore projects" onclick={() => (projects = ['Aurora', 'Basalt', 'Cinder'])} />
		{/if}
	</div>
</Card>

<Card title="Alert" id="alert">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		One button, and a promise that resolves when the reader dismisses it. Useful for holding a flow
		until the message has actually been seen.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button
			variant="secondary"
			label="Notice"
			onclick={async () => {
				await alert({
					title: 'Export finished',
					message: '1,284 rows written to reports/q3.csv.'
				});
				toast.info('Dismissed');
			}}
		/>
		<Button
			variant="secondary"
			label="Warning"
			onclick={() =>
				alert({
					title: 'Session expiring',
					message: 'You will be signed out in five minutes.',
					variant: 'danger'
				})}
		/>
	</div>
</Card>

<Card title="Prompt" id="prompt">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Resolves with the entered string, or <Code>null</Code> if cancelled. The field takes focus with its
		contents selected, and Enter submits.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="secondary" label="Rename workspace" onclick={rename} />
	</div>
</Card>

<Card title="Queued" id="queued">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Two overlapping scrims is never what a caller meant, so a dialog raised while another is open
		waits its turn. Each promise still settles with its own answer.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button
			variant="secondary"
			label="Ask three things"
			onclick={() => {
				void confirm('First: keep the draft?');
				void prompt({ title: 'Second', message: 'Name the draft.' });
				void alert({ title: 'Third', message: 'That was the last one.' });
			}}
		/>
	</div>
</Card>

<Card title="Usage" id="usage">
	<Heading level={3} id="usage-await">Awaiting an answer</Heading>
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The dialog host lives in <Code>&lt;Root&gt;</Code>, so nothing needs mounting and the three
		helpers can be called from a module, a store, or an event handler — anywhere at all.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { confirm, alert, prompt } from 'glow-ui';

  async function deleteProject(id: string) {
    const ok = await confirm({
      title: 'Delete project?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;

    await api.delete(id);
    await alert('Project deleted.');
  }

  async function rename() {
    const name = await prompt({ title: 'Rename', value: current, required: true });
    if (name !== null) await api.rename(name);
  }
<\/script>`}
	/>

	<Heading level={3} id="usage-namespace">Without shadowing the globals</Heading>
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>confirm</Code>, <Code>alert</Code> and <Code>prompt</Code> are also names on
		<Code>window</Code>. Import the namespace instead if that would be confusing in a file.
	</Text>
	<CodeBlock
		language="ts"
		code={`import { dialog } from 'glow-ui';

if (await dialog.confirm('Discard draft?')) discard();`}
	/>

	<Heading level={3} id="usage-host">Mounting the host yourself</Heading>
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Only needed for an app that does not use <Code>&lt;Root&gt;</Code>. One instance, once.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script>
  import { ConfirmDialog } from 'glow-ui';
<\/script>

<ConfirmDialog />`}
	/>
</Card>

<Card title="API" id="api">
	<Table
		variant="simple"
		columns={[
			{ key: 'method', label: 'Method', render: codeCell },
			{ key: 'returns', label: 'Resolves with', render: codeCell },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{
				method: 'confirm(options)',
				returns: 'Promise<boolean>',
				description: 'true when accepted, false when cancelled, escaped or dismissed'
			},
			{
				method: 'alert(options)',
				returns: 'Promise<void>',
				description: 'Resolves once the single button is pressed or the dialog dismissed'
			},
			{
				method: 'prompt(options)',
				returns: 'Promise<string | null>',
				description: 'The entered string, or null if cancelled'
			},
			{
				method: 'dialog',
				returns: '{ confirm, alert, prompt }',
				description: 'The same three, namespaced'
			}
		]}
	/>
	<Text variant="secondary" size="sm" style="margin-top: 0.75rem;">
		Every helper also takes a bare string in place of the options object — <Code
			>confirm('Are you sure?')</Code
		> sets the message.
	</Text>
</Card>

<Card title="Options" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Option', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{
				prop: 'title',
				type: 'string',
				default: "'Are you sure?' for confirm",
				description: 'Header line'
			},
			{ prop: 'message', type: 'string', default: '-', description: 'Body copy under the title' },
			{
				prop: 'confirmLabel',
				type: 'string',
				default: "'Confirm' / 'OK'",
				description: 'Label on the accepting button'
			},
			{
				prop: 'cancelLabel',
				type: 'string',
				default: "'Cancel'",
				description: 'Label on the dismissing button (not on alert)'
			},
			{
				prop: 'variant',
				type: "'default' | 'danger'",
				default: "'default'",
				description: 'danger uses Button’s danger variant and the --glow-color-danger tokens'
			},
			{
				prop: 'icon',
				type: 'IconProp',
				default: "'TriangleAlert' when danger",
				description: 'Glyph beside the message'
			},
			{
				prop: 'value',
				type: 'string',
				default: "''",
				description: 'prompt only — starting value of the field'
			},
			{
				prop: 'placeholder',
				type: 'string',
				default: '-',
				description: 'prompt only — placeholder for the field'
			},
			{
				prop: 'required',
				type: 'boolean',
				default: 'false',
				description: 'prompt only — disables the accepting button while the field is empty'
			}
		]}
	/>
</Card>

<Card title="Keyboard" id="keyboard">
	<Table
		variant="simple"
		columns={[
			{ key: 'key', label: 'Key', render: codeCell },
			{ key: 'does', label: 'Does' }
		]}
		data={[
			{ key: 'Escape', does: 'Cancels — the promise settles as if dismissed' },
			{
				key: 'Enter',
				does: 'Confirms, unless a button holds focus, in which case the browser activates that button'
			},
			{ key: 'Tab', does: 'Cycles within the dialog; focus returns to the opener on close' }
		]}
	/>
</Card>
