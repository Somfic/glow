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
	import type { Command } from '$lib/command-palette/types.js';
	import { toast } from '$lib/toast/toast.svelte.js';
	import { registerShortcut } from '$lib/util/shortcut.svelte.js';

	let open = $state(false);
	let advancedEnabled = $state(false);
	let isOnline = $state(true);
	let hasSelection = $state(false);
	let theme = $state<'dark' | 'light'>('dark');
	let accent = $state<'purple' | 'green' | 'orange' | 'pink' | 'blue'>('purple');
	let density = $state<'compact' | 'comfortable' | 'spacious'>('comfortable');
	let currentBranch = $state('main');

	$effect(() =>
		registerShortcut(' ', () => {
			open = true;
		})
	);

	const teammates = [
		{ id: 'alice', name: 'Alice Becker', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/40?img=47', role: 'Designer' },
		{ id: 'bob', name: 'Bob Chen', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/40?img=12', role: 'Engineer' },
		{ id: 'cleo', name: 'Cleo Diaz', email: 'cleo@example.com', avatar: 'https://i.pravatar.cc/40?img=32', role: 'Product' },
		{ id: 'dani', name: 'Dani Ortiz', email: 'dani@example.com', avatar: 'https://i.pravatar.cc/40?img=23', role: 'Engineer' },
		{ id: 'eli', name: 'Eli Park', email: 'eli@example.com', avatar: 'https://i.pravatar.cc/40?img=15', role: 'Marketing' }
	];

	const projects = [
		{ id: 'glow', name: 'Glow UI', icon: 'Sparkles' as const, repo: 'lucas/glow' },
		{ id: 'spark', name: 'Spark API', icon: 'Zap' as const, repo: 'lucas/spark' },
		{ id: 'forge', name: 'Forge Workflows', icon: 'Hammer' as const, repo: 'lucas/forge' },
		{ id: 'compass', name: 'Compass Docs', icon: 'Compass' as const, repo: 'lucas/compass' },
		{ id: 'beacon', name: 'Beacon Logger', icon: 'RadioTower' as const, repo: 'lucas/beacon' }
	];

	function pick<T extends { name: string; id: string }>(
		items: T[],
		groupId: string,
		toLabel: (item: T) => string,
		toAction: (item: T) => () => void,
		extra: (item: T) => Partial<Command> = () => ({})
	): Command[] {
		return items.map((item) => ({
			id: `${groupId}.${item.id}`,
			label: toLabel(item),
			perform: () => toAction(item)(),
			...extra(item)
		}));
	}

	$effect(() => {
		const off = commands.registerMany([
			// FILE -------------------------------------------------------------
			{
				id: 'file.new',
				label: 'New File',
				description: 'Create a blank document in the current folder',
				group: 'File',
				icon: 'FilePlus',
				shortcut: '⌘N',
				keywords: ['create', 'document', 'blank'],
				perform: () => toast.info('New file created')
			},
			{
				id: 'file.new-from-template',
				label: 'New from Template',
				description: 'Pick a starter template',
				group: 'File',
				icon: 'FileStack',
				keywords: ['scaffold', 'boilerplate'],
				children: [
					{ id: 'file.new.markdown', label: 'Markdown', icon: 'FileText', preview: tplMarkdownPreview, perform: () => toast.info('New markdown file') },
					{ id: 'file.new.svelte', label: 'Svelte component', icon: 'Component', preview: tplSveltePreview, perform: () => toast.info('New Svelte component') },
					{ id: 'file.new.api', label: 'API endpoint', icon: 'Server', preview: tplApiPreview, perform: () => toast.info('New API endpoint') },
					{ id: 'file.new.test', label: 'Test file', icon: 'TestTube', preview: tplTestPreview, perform: () => toast.info('New test file') }
				]
			},
			{
				id: 'file.open',
				label: 'Open File',
				group: 'File',
				icon: 'FolderOpen',
				shortcut: '⌘O',
				perform: () => toast.info('Open file dialog')
			},
			{
				id: 'file.recent',
				label: 'Open Recent',
				description: 'Async-loaded list of recently edited files',
				group: 'File',
				icon: 'Clock',
				badge: 6,
				keywords: ['history', 'last'],
				children: async () => {
					await new Promise((r) => setTimeout(r, 350));
					return [
						{ name: 'README.md', icon: 'FileText' as const, when: '2h ago', preview: readmePreview },
						{ name: 'package.json', icon: 'Braces' as const, when: '5h ago', preview: packagePreview },
						{ name: 'CommandPalette.svelte', icon: 'Component' as const, when: 'yesterday', preview: sveltePreview },
						{ name: 'theme.scss', icon: 'Palette' as const, when: 'yesterday', preview: scssPreview },
						{ name: 'budget-q3.xlsx', icon: 'Sheet' as const, when: '3 days ago' },
						{ name: 'launch-photo.jpg', icon: 'Image' as const, when: 'last week', preview: photoPreview }
					].map((f) => ({
						id: `file.recent.${f.name}`,
						label: f.name,
						description: `Opened ${f.when}`,
						icon: f.icon,
						preview: f.preview,
						perform: () => toast.info(`Opened ${f.name}`)
					}));
				}
			},
			{
				id: 'file.save',
				label: 'Save',
				description: 'Save the current document',
				group: 'File',
				icon: 'Save',
				shortcut: '⌘S',
				perform: () => toast.success('Saved')
			},
			{
				id: 'file.save-as',
				label: 'Save As…',
				group: 'File',
				icon: 'SaveAll',
				shortcut: '⇧⌘S',
				perform: () => toast.info('Save as dialog')
			},
			{
				id: 'file.duplicate',
				label: 'Duplicate File',
				group: 'File',
				icon: 'Copy',
				perform: () => toast.info('File duplicated')
			},
			{
				id: 'file.rename',
				label: 'Rename',
				group: 'File',
				icon: 'PencilLine',
				shortcut: 'F2',
				perform: () => toast.info('Rename prompt')
			},
			{
				id: 'file.delete',
				label: 'Move to Trash',
				group: 'File',
				icon: 'Trash2',
				badge: { icon: 'TriangleAlert', label: 'destructive' },
				perform: () => toast.warning('Moved to trash')
			},

			// EDIT -------------------------------------------------------------
			{
				id: 'edit.undo',
				label: 'Undo',
				group: 'Edit',
				icon: 'Undo',
				shortcut: '⌘Z',
				perform: () => toast.info('Undone')
			},
			{
				id: 'edit.redo',
				label: 'Redo',
				group: 'Edit',
				icon: 'Redo',
				shortcut: '⇧⌘Z',
				perform: () => toast.info('Redone')
			},
			{
				id: 'edit.cut',
				label: 'Cut Selection',
				group: 'Edit',
				icon: 'Scissors',
				shortcut: '⌘X',
				when: () => hasSelection,
				perform: () => toast.info('Cut')
			},
			{
				id: 'edit.copy',
				label: 'Copy Selection',
				group: 'Edit',
				icon: 'Copy',
				shortcut: '⌘C',
				when: () => hasSelection,
				perform: () => toast.info('Copied')
			},
			{
				id: 'edit.paste',
				label: 'Paste',
				group: 'Edit',
				icon: 'ClipboardPaste',
				shortcut: '⌘V',
				perform: () => toast.info('Pasted')
			},
			{
				id: 'edit.find',
				label: 'Find',
				group: 'Edit',
				icon: 'Search',
				shortcut: '⌘F',
				perform: () => toast.info('Find dialog')
			},
			{
				id: 'edit.replace',
				label: 'Find and Replace',
				group: 'Edit',
				icon: 'Replace',
				shortcut: '⌥⌘F',
				perform: () => toast.info('Replace dialog')
			},
			{
				id: 'edit.format',
				label: 'Format Document',
				description: 'Run prettier on the current file',
				group: 'Edit',
				icon: 'Wand',
				shortcut: '⇧⌥F',
				keywords: ['prettier', 'tidy', 'beautify'],
				perform: async () => {
					toast.info('Formatting…');
					await new Promise((r) => setTimeout(r, 500));
					toast.success('Formatted');
				}
			},

			// INSERT -----------------------------------------------------------
			{
				id: 'insert',
				label: 'Insert',
				description: 'Drop a block at the cursor',
				group: 'Edit',
				icon: 'Plus',
				children: [
					{ id: 'insert.heading', label: 'Heading', icon: 'Heading1', perform: () => toast.info('Inserted heading') },
					{ id: 'insert.list', label: 'Bulleted list', icon: 'List', perform: () => toast.info('Inserted list') },
					{ id: 'insert.checkbox', label: 'To-do list', icon: 'ListChecks', perform: () => toast.info('Inserted checklist') },
					{ id: 'insert.code', label: 'Code block', icon: 'Code', perform: () => toast.info('Inserted code') },
					{ id: 'insert.table', label: 'Table', icon: 'Table', perform: () => toast.info('Inserted table') },
					{
						id: 'insert.media',
						label: 'Media',
						icon: 'Image',
						children: [
							{ id: 'insert.media.image', label: 'Image upload', icon: 'Image', perform: () => toast.info('Image uploader') },
							{ id: 'insert.media.video', label: 'Video embed', icon: 'Video', perform: () => toast.info('Video embed') },
							{ id: 'insert.media.audio', label: 'Audio clip', icon: 'AudioLines', perform: () => toast.info('Audio inserted') },
							{ id: 'insert.media.gif', label: 'GIF from giphy', icon: 'Sparkles', perform: () => toast.info('GIF picker') }
						]
					},
					{
						id: 'insert.embed',
						label: 'Embed',
						icon: 'Link',
						description: 'External widgets, iframes, gists…',
						children: [
							{ id: 'insert.embed.youtube', label: 'YouTube video', icon: 'Youtube', perform: () => toast.info('YouTube embed') },
							{ id: 'insert.embed.figma', label: 'Figma frame', icon: 'PenTool', perform: () => toast.info('Figma embed') },
							{ id: 'insert.embed.codepen', label: 'CodePen', icon: 'Code', perform: () => toast.info('CodePen embed') },
							{ id: 'insert.embed.gist', label: 'Gist snippet', icon: 'Github', perform: () => toast.info('Gist embed') }
						]
					}
				]
			},

			// VIEW -------------------------------------------------------------
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
				description: 'Pick a theme preset',
				group: 'View',
				icon: 'Palette',
				keywords: ['theme', 'color', 'preset'],
				children: [
					{ id: 'view.set-theme.dark', label: 'Dark', icon: 'Moon', perform: () => { theme = 'dark'; toast.info('Theme: dark'); } },
					{ id: 'view.set-theme.light', label: 'Light', icon: 'Sun', perform: () => { theme = 'light'; toast.info('Theme: light'); } },
					{
						id: 'view.set-theme.accent',
						label: 'Accent',
						icon: 'Droplet',
						description: `Currently ${accent}`,
						children: ([
							{ id: 'purple', label: 'Purple', icon: 'Droplet' as const },
							{ id: 'green', label: 'Green', icon: 'Leaf' as const },
							{ id: 'orange', label: 'Orange', icon: 'Flame' as const },
							{ id: 'pink', label: 'Pink', icon: 'Heart' as const },
							{ id: 'blue', label: 'Blue', icon: 'Waves' as const }
						]).map((c) => ({
							id: `view.set-theme.accent.${c.id}`,
							label: c.label,
							icon: c.icon,
							perform: () => { accent = c.id as typeof accent; toast.info(`Accent: ${c.label}`); }
						}))
					}
				]
			},
			{
				id: 'view.density',
				label: 'Density',
				description: `Currently ${density}`,
				group: 'View',
				icon: 'Rows3',
				keywords: ['spacing', 'compact'],
				children: ['compact', 'comfortable', 'spacious'].map((d) => ({
					id: `view.density.${d}`,
					label: d.charAt(0).toUpperCase() + d.slice(1),
					icon: d === 'compact' ? ('AlignVerticalJustifyStart' as const) : d === 'spacious' ? ('AlignVerticalJustifyEnd' as const) : ('AlignVerticalJustifyCenter' as const),
					perform: () => { density = d as typeof density; toast.info(`Density: ${d}`); }
				}))
			},
			{
				id: 'view.toggle-sidebar',
				label: 'Toggle Sidebar',
				group: 'View',
				icon: 'PanelLeft',
				shortcut: '⌘B',
				perform: () => toast.info('Sidebar toggled')
			},
			{
				id: 'view.toggle-zen',
				label: 'Zen Mode',
				description: 'Hide all chrome',
				group: 'View',
				icon: 'Sparkles',
				shortcut: '⌃⌘Z',
				perform: () => toast.info('Entered zen mode')
			},
			{
				id: 'view.zoom-in',
				label: 'Zoom In',
				group: 'View',
				icon: 'ZoomIn',
				shortcut: '⌘+',
				perform: () => toast.info('Zoom +10%')
			},
			{
				id: 'view.zoom-out',
				label: 'Zoom Out',
				group: 'View',
				icon: 'ZoomOut',
				shortcut: '⌘-',
				perform: () => toast.info('Zoom -10%')
			},

			// GO ---------------------------------------------------------------
			{
				id: 'go.home',
				label: 'Go to Home',
				group: 'Go',
				icon: 'House',
				shortcut: 'g h',
				perform: () => toast.info('Navigated home')
			},
			{
				id: 'go.inbox',
				label: 'Go to Inbox',
				group: 'Go',
				icon: 'Inbox',
				shortcut: 'g i',
				badge: 12,
				perform: () => toast.info('Navigated to inbox')
			},
			{
				id: 'go.notifications',
				label: 'Go to Notifications',
				group: 'Go',
				icon: 'Bell',
				shortcut: 'g n',
				badge: 3,
				perform: () => toast.info('Navigated to notifications')
			},
			{
				id: 'go.settings',
				label: 'Go to Settings',
				group: 'Go',
				icon: 'Settings',
				shortcut: 'g s',
				perform: () => toast.info('Navigated to settings')
			},
			{
				id: 'go.project',
				label: 'Switch Project',
				description: 'Async-loaded list of projects you have access to',
				group: 'Go',
				icon: 'FolderTree',
				keywords: ['workspace', 'repo'],
				children: async () => {
					await new Promise((r) => setTimeout(r, 450));
					return projects.map((p) => ({
						id: `go.project.${p.id}`,
						label: p.name,
						description: p.repo,
						icon: p.icon,
						perform: () => toast.info(`Switched to ${p.name}`)
					}));
				}
			},

			// PEOPLE -----------------------------------------------------------
			{
				id: 'people.invite',
				label: 'Invite teammate',
				description: 'Pick a person to invite to this workspace',
				group: 'People',
				icon: 'UserPlus',
				keywords: ['add', 'member', 'collaborator'],
				children: teammates.map((t) => ({
					id: `people.invite.${t.id}`,
					label: t.name,
					description: `${t.role} · ${t.email}`,
					image: t.avatar,
					preview: personPreview,
					perform: () => toast.info(`Invited ${t.name}`)
				}))
			},
			{
				id: 'people.message',
				label: 'Send a Message',
				description: 'DM someone in the workspace',
				group: 'People',
				icon: 'MessageCircle',
				when: () => isOnline,
				children: teammates.map((t) => ({
					id: `people.message.${t.id}`,
					label: t.name,
					description: t.email,
					image: t.avatar,
					perform: () => toast.info(`Opened DM with ${t.name}`)
				}))
			},
			{
				id: 'people.assign',
				label: 'Assign Issue',
				description: 'Pick an assignee for the open issue',
				group: 'People',
				icon: 'UserCheck',
				children: teammates.map((t) => ({
					id: `people.assign.${t.id}`,
					label: t.name,
					description: t.role,
					image: t.avatar,
					perform: () => toast.info(`Assigned to ${t.name}`)
				}))
			},

			// GIT --------------------------------------------------------------
			{
				id: 'git.commit',
				label: 'Commit Changes',
				group: 'Git',
				icon: 'GitCommitHorizontal',
				shortcut: '⌘K ⌘C',
				perform: () => toast.success('Changes committed')
			},
			{
				id: 'git.push',
				label: 'Push',
				description: `Push current branch (${currentBranch}) to origin`,
				group: 'Git',
				icon: 'Upload',
				when: () => isOnline,
				perform: async () => {
					toast.info('Pushing…');
					await new Promise((r) => setTimeout(r, 700));
					toast.success(`Pushed ${currentBranch}`);
				}
			},
			{
				id: 'git.pull',
				label: 'Pull',
				group: 'Git',
				icon: 'Download',
				when: () => isOnline,
				perform: async () => {
					toast.info('Pulling…');
					await new Promise((r) => setTimeout(r, 600));
					toast.success('Pulled latest');
				}
			},
			{
				id: 'git.branch',
				label: 'Switch Branch',
				description: `Currently on ${currentBranch}`,
				group: 'Git',
				icon: 'GitBranch',
				keywords: ['checkout'],
				children: async () => {
					await new Promise((r) => setTimeout(r, 500));
					return [
						{ name: 'main', kind: 'protected' },
						{ name: 'feat/command-palette', kind: 'feature' },
						{ name: 'fix/scrollbar-overlap', kind: 'fix' },
						{ name: 'chore/upgrade-deps', kind: 'chore' },
						{ name: 'release/v0.4', kind: 'release' }
					].map((b) => ({
						id: `git.branch.${b.name}`,
						label: b.name,
						icon: 'GitBranch' as const,
						badge: b.kind,
						perform: () => { currentBranch = b.name; toast.info(`Checked out ${b.name}`); }
					}));
				}
			},
			{
				id: 'git.stash',
				label: 'Stash Changes',
				group: 'Git',
				icon: 'Archive',
				perform: () => toast.info('Stashed working changes')
			},

			// WINDOW -----------------------------------------------------------
			{
				id: 'window.split-right',
				label: 'Split Right',
				group: 'Window',
				icon: 'PanelRightOpen',
				shortcut: '⌘\\',
				perform: () => toast.info('Split editor right')
			},
			{
				id: 'window.split-down',
				label: 'Split Down',
				group: 'Window',
				icon: 'PanelBottomOpen',
				shortcut: '⌘K ⌘\\',
				perform: () => toast.info('Split editor down')
			},
			{
				id: 'window.close-tab',
				label: 'Close Tab',
				group: 'Window',
				icon: 'X',
				shortcut: '⌘W',
				perform: () => toast.info('Tab closed')
			},
			{
				id: 'window.reopen-tab',
				label: 'Reopen Closed Tab',
				group: 'Window',
				icon: 'RotateCcw',
				shortcut: '⇧⌘T',
				perform: () => toast.info('Reopened tab')
			},

			// HELP -------------------------------------------------------------
			{
				id: 'help.docs',
				label: 'Open Documentation',
				group: 'Help',
				icon: 'BookOpen',
				keywords: ['manual', 'guide'],
				perform: () => toast.info('Docs opened')
			},
			{
				id: 'help.shortcuts',
				label: 'Keyboard Shortcuts Cheatsheet',
				group: 'Help',
				icon: 'Keyboard',
				shortcut: '⌘/',
				perform: () => toast.info('Shortcuts opened')
			},
			{
				id: 'help.changelog',
				label: 'What’s New',
				description: 'See the latest release notes',
				group: 'Help',
				icon: 'Megaphone',
				badge: { icon: 'Sparkles', label: 'new' },
				perform: () => toast.info('Changelog opened')
			},
			{
				id: 'help.feedback',
				label: 'Send Feedback',
				group: 'Help',
				icon: 'MessageSquareHeart',
				when: () => isOnline,
				perform: () => toast.info('Feedback form opened')
			},

			// ADVANCED ---------------------------------------------------------
			{
				id: 'advanced.reload',
				label: 'Reload Window',
				group: 'Advanced',
				icon: 'RefreshCw',
				shortcut: '⌃⌘R',
				when: () => advancedEnabled,
				perform: () => toast.info('Reloading…')
			},
			{
				id: 'advanced.devtools',
				label: 'Toggle Developer Tools',
				group: 'Advanced',
				icon: 'Bug',
				when: () => advancedEnabled,
				perform: () => toast.info('Devtools toggled')
			},
			{
				id: 'advanced.clear-cache',
				label: 'Clear Local Cache',
				description: 'Wipes IndexedDB + localStorage for this site',
				group: 'Advanced',
				icon: 'Eraser',
				badge: { icon: 'TriangleAlert', label: 'destructive' },
				when: () => advancedEnabled,
				perform: () => toast.warning('Cache cleared')
			},
			{
				id: 'advanced.danger',
				label: 'Reset Everything',
				description: 'Delete every project, file, and setting on this device',
				group: 'Advanced',
				icon: 'TriangleAlert',
				badge: { icon: 'TriangleAlert', label: 'danger' },
				when: () => advancedEnabled,
				perform: async () => {
					toast.info('Resetting…');
					await new Promise((r) => setTimeout(r, 800));
					toast.warning('Everything reset (pretend)');
				}
			}
		]);
		return off;
	});
</script>

{#snippet readmePreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;"># Glow UI

A reactive Svelte 5 component library focused on
high-fidelity primitives, theming, and motion.

## Install
npm install glow

## Quick start
import {'{ Button }'} from 'glow'</pre>
{/snippet}

{#snippet packagePreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">{'{'}
  "name": "glow",
  "version": "0.0.1",
  "type": "module",
  "scripts": {'{'}
    "dev": "vite dev",
    "build": "vite build"
  {'}'},
  "peerDependencies": {'{'}
    "svelte": "^5.0.0"
  {'}'}
{'}'}</pre>
{/snippet}

{#snippet sveltePreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">&lt;script lang="ts"&gt;
  import {'{ Icon }'} from '$lib';
  import {'{ commands }'} from './registry';

  let open = $state(false);
  let query = $state('');
&lt;/script&gt;

&lt;CommandPalette bind:open /&gt;</pre>
{/snippet}

{#snippet scssPreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">$primary: #8B6DED;
$radius: 12px;

$dur-instant: 100ms;
$dur-fast:    150ms;
$dur-base:    220ms;</pre>
{/snippet}

{#snippet photoPreview(_cmd: Command)}
	<img
		src="https://picsum.photos/seed/launch/600/360"
		alt=""
		style="width: 100%; border-radius: 8px; display: block;"
	/>
{/snippet}

{#snippet tplMarkdownPreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">---
title: Untitled
date: 2026-05-05
tags: []
---

# Untitled

Start writing here.</pre>
{/snippet}

{#snippet tplSveltePreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">&lt;script lang="ts"&gt;
  type Props = {'{ label: string }'};
  let {'{ label }'}: Props = $props();
&lt;/script&gt;

&lt;button&gt;{'{label}'}&lt;/button&gt;

&lt;style&gt;
  button {'{ padding: 0.5rem 1rem; }'}
&lt;/style&gt;</pre>
{/snippet}

{#snippet tplApiPreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">import {'{ json }'} from '@sveltejs/kit';
import type {'{ RequestHandler }'} from './$types';

export const GET: RequestHandler = async () =&gt; {'{'}
  return json({'{ ok: true }'});
{'}'};

export const POST: RequestHandler = async ({'{ request }'}) =&gt; {'{'}
  const body = await request.json();
  return json({'{ received: body }'});
{'}'};</pre>
{/snippet}

{#snippet tplTestPreview(_cmd: Command)}
	<pre style="font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; line-height: 1.5; opacity: 0.9; margin: 0;">import {'{ describe, it, expect }'} from 'vitest';

describe('subject', () =&gt; {'{'}
  it('does the thing', () =&gt; {'{'}
    expect(true).toBe(true);
  {'}'});
{'}'});</pre>
{/snippet}

{#snippet personPreview(cmd: Command)}
	{#if cmd.image}
		<div style="display: flex; justify-content: center; padding: 0.5rem 0 1rem;">
			<img src={cmd.image} alt="" style="width: 96px; height: 96px; border-radius: 50%; object-fit: cover;" />
		</div>
	{/if}
	<div style="font-size: 0.85rem; opacity: 0.75; line-height: 1.7;">
		<div>Joined: 14 Mar 2024</div>
		<div>Last active: 2h ago</div>
		<div>Workspaces: 3</div>
	</div>
{/snippet}

<svelte:head><title>Command Palette | Glow UI</title></svelte:head>

<Heading level={1}>Command Palette</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A modular, extendable command launcher. Commands register into a runtime registry and surface
	through a fuzzy-searched, keyboard-driven palette.
</Text>

<Card title="Try it">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Press <Kbd size="sm">Space</Kbd> (or <Kbd size="sm">⌘</Kbd>
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
		<CheckboxInput
			label="Has selection (gates Cut/Copy)"
			bind:checked={hasSelection}
		/>
		<CheckboxInput
			label="Online (gates push/pull/feedback)"
			bind:checked={isOnline}
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
		Mount once at the app root. Spacebar toggles by default; pass <Code>hotkey={'{false}'}</Code> to
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
