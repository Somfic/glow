<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Button from '$lib/button/Button.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import CheckboxInput from '$lib/input/CheckboxInput.svelte';
	import CommandPalette from '$lib/command-palette/CommandPalette.svelte';
	import { commands } from '$lib/command-palette/registry.svelte.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	let open = $state(false);
	let advancedEnabled = $state(false);
	let theme = $state<'dark' | 'light'>('dark');

	$effect(() => {
		const off = commands.registerMany([
			{
				id: 'file.new',
				label: 'New File',
				group: 'File',
				icon: 'FilePlus',
				shortcut: '⌘N',
				keywords: ['create', 'document'],
				perform: () => {
					toast.info('New file created');
				}
			},
			{
				id: 'file.open',
				label: 'Open File',
				group: 'File',
				icon: 'FolderOpen',
				shortcut: '⌘O',
				perform: () => {
					toast.info('Open file dialog');
				}
			},
			{
				id: 'file.save',
				label: 'Save',
				description: 'Save the current document',
				group: 'File',
				icon: 'Save',
				shortcut: '⌘S',
				perform: () => {
					toast.success('Saved');
				}
			},
			{
				id: 'view.toggle-theme',
				label: 'Toggle Theme',
				description: `Currently ${theme}`,
				group: 'View',
				icon: 'Sun',
				keywords: ['dark', 'light', 'mode'],
				perform: () => {
					theme = theme === 'dark' ? 'light' : 'dark';
					toast.info(`Switched to ${theme} mode`);
				}
			},
			{
				id: 'view.set-theme',
				label: 'Set Theme',
				description: 'Drill into a sub-list of theme presets',
				group: 'View',
				icon: 'Palette',
				keywords: ['theme', 'color'],
				children: [
					{
						id: 'view.set-theme.dark',
						label: 'Dark',
						icon: 'Moon',
						perform: () => {
							theme = 'dark';
							toast.info('Theme set to dark');
						}
					},
					{
						id: 'view.set-theme.light',
						label: 'Light',
						icon: 'Sun',
						perform: () => {
							theme = 'light';
							toast.info('Theme set to light');
						}
					},
					{
						id: 'view.set-theme.accent',
						label: 'Accent',
						icon: 'Droplet',
						children: [
							{
								id: 'view.set-theme.accent.purple',
								label: 'Purple',
								perform: () => {
									toast.info('Accent: purple');
								}
							},
							{
								id: 'view.set-theme.accent.green',
								label: 'Green',
								perform: () => {
									toast.info('Accent: green');
								}
							},
							{
								id: 'view.set-theme.accent.orange',
								label: 'Orange',
								perform: () => {
									toast.info('Accent: orange');
								}
							}
						]
					}
				]
			},
			{
				id: 'nav.recent',
				label: 'Recent Files',
				description: 'Async-loaded children',
				group: 'Navigation',
				icon: 'Clock',
				badge: 4,
				children: async () => {
					await new Promise((r) => setTimeout(r, 400));
					return ['report.md', 'todo.txt', 'budget.xlsx', 'photo.jpg'].map((name) => ({
						id: `nav.recent.${name}`,
						label: name,
						icon: 'File' as const,
						perform: () => {
							toast.info(`Opened ${name}`);
						}
					}));
				}
			},
			{
				id: 'nav.go-home',
				label: 'Go to Home',
				group: 'Navigation',
				icon: 'House',
				perform: () => {
					toast.info('Navigated home');
				}
			},
			{
				id: 'people.invite',
				label: 'Invite teammate',
				description: 'Pick a person to invite',
				group: 'People',
				icon: 'UserPlus',
				children: [
					{
						id: 'people.invite.alice',
						label: 'Alice Becker',
						description: 'alice@example.com',
						image: 'https://i.pravatar.cc/40?img=47',
						perform: () => {
							toast.info('Invited Alice');
						}
					},
					{
						id: 'people.invite.bob',
						label: 'Bob Chen',
						description: 'bob@example.com',
						image: 'https://i.pravatar.cc/40?img=12',
						perform: () => {
							toast.info('Invited Bob');
						}
					},
					{
						id: 'people.invite.cleo',
						label: 'Cleo Diaz',
						description: 'cleo@example.com',
						image: 'https://i.pravatar.cc/40?img=32',
						perform: () => {
							toast.info('Invited Cleo');
						}
					}
				]
			},
			{
				id: 'nav.go-settings',
				label: 'Go to Settings',
				group: 'Navigation',
				icon: 'Settings',
				perform: () => {
					toast.info('Navigated to settings');
				}
			},
			{
				id: 'task.async',
				label: 'Run Long Task',
				description: 'Demonstrates async commands',
				group: 'Tasks',
				icon: 'Loader',
				perform: async () => {
					toast.info('Working');
					await new Promise((r) => setTimeout(r, 600));
					toast.success('Task complete');
				}
			},
			{
				id: 'advanced.danger',
				label: 'Advanced: Reset Everything',
				description: 'Only visible when advanced mode is on',
				group: 'Advanced',
				icon: 'TriangleAlert',
				badge: { icon: 'TriangleAlert' as const, label: 'danger' },
				when: () => advancedEnabled,
				perform: () => {
					toast.warning('Reset (pretend)');
				}
			}
		]);
		return off;
	});
</script>

<svelte:head><title>Command Palette | Glow UI</title></svelte:head>

<Heading level={1}>Command Palette</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A modular, extendable command launcher. Commands register into a runtime registry and surface
	through a fuzzy-searched, keyboard-driven palette.
</Text>

<Card title="Try it">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Press <Kbd size="sm">⌘</Kbd>
		<Kbd size="sm">K</Kbd> (or <Kbd size="sm">Ctrl</Kbd>
		<Kbd size="sm">K</Kbd>) anywhere on this page, or click the button below. Use
		<Kbd size="sm">↑</Kbd>
		<Kbd size="sm">↓</Kbd> to navigate,
		<Kbd size="sm">Enter</Kbd> to run, <Kbd size="sm">Esc</Kbd> to close.
	</Text>
	<div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
		<Button
			label="Open Palette"
			onclick={() => {
				open = true;
			}}
		/>
		<CheckboxInput
			label="Enable advanced commands (toggles a `when()` predicate)"
			bind:checked={advancedEnabled}
		/>
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Registering commands">
	<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;">
		Anywhere in your app, import the singleton registry and register commands inside an
		<Code>$effect</Code> — the returned thunk unregisters on teardown.
	</Text>
	<CodeBlock
		language="ts"
		code={`import { commands } from 'glow';

$effect(() =>
    commands.register({
        id: 'file.save',
        label: 'Save',
        group: 'File',
        icon: 'Save',
        shortcut: '⌘S',
        keywords: ['write', 'persist'],
        when: () => hasUnsavedChanges,
        perform: async ({ close }) => {
            await save();
            close();
        }
    })
);`}
	/>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Mounting the palette">
	<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;">
		Mount once at the app root. Cmd/Ctrl+K toggles by default; pass <Code>hotkey={'{false}'}</Code> to
		disable.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script>
    import { CommandPalette } from 'glow';
    let open = $state(false);
<\/script>

<CommandPalette bind:open />`}
	/>
</Card>

<CommandPalette bind:open />
