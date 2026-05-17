<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import CommandPopover from '$lib/command-palette/CommandPopover.svelte';
	import CommandInput from '$lib/command-palette/CommandInput.svelte';
	import { useCommandRegistry } from '$lib/command-palette/registry.svelte.js';
	import type { Command } from '$lib/command-palette/types.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	// SLASH-COMMANDS DEMO --------------------------------------------------
	// Type `/` at a word boundary to open the popover. Filters as you type.

	const slashRegistry = useCommandRegistry();

	$effect(() =>
		slashRegistry.registerMany([
			{
				id: 'help',
				label: 'help',
				description: 'List all available commands',
				icon: 'CircleQuestionMark',
				perform: () => toast.info('Showed help')
			},
			{
				id: 'invite',
				label: 'invite',
				description: 'Invite someone to this workspace',
				icon: 'UserPlus',
				keywords: ['add', 'member'],
				perform: () => toast.info('Invite flow opened')
			},
			{
				id: 'remind',
				label: 'remind',
				description: 'Set a reminder for later',
				icon: 'Bell',
				perform: () => toast.info('Reminder set')
			},
			{
				id: 'poll',
				label: 'poll',
				description: 'Start a quick poll',
				icon: 'ChartBar',
				perform: () => toast.info('Poll started')
			},
			{
				id: 'gif',
				label: 'gif',
				description: 'Search Giphy and embed',
				icon: 'Sparkles',
				keywords: ['giphy', 'image'],
				perform: () => toast.info('Gif picker')
			},
			{
				id: 'shrug',
				label: 'shrug',
				description: 'Append ¯\\_(ツ)_/¯',
				icon: 'Smile',
				perform: () => toast.info('¯\\_(ツ)_/¯')
			},
			{
				id: 'clear',
				label: 'clear',
				description: 'Wipe this thread',
				icon: 'Trash2',
				perform: () => toast.warning('Thread cleared')
			}
		])
	);

	let messageEl = $state<HTMLInputElement | null>(null);
	let messageValue = $state('');
	let slashStart = $state(-1);
	let slashOpen = $state(false);
	let slashPopover = $state<{ handleKey: (e: KeyboardEvent) => boolean } | null>(null);
	const slashQuery = $derived(slashStart >= 0 ? messageValue.slice(slashStart + 1) : '');

	function evaluateSlash() {
		if (!messageEl) return;
		const caret = messageEl.selectionStart ?? messageValue.length;
		// Walk left from caret to find the opening `/`. Bail if we hit whitespace
		// (slash-commands must be the start of a token).
		let i = caret;
		while (i > 0 && !/\s/.test(messageValue[i - 1]) && messageValue[i - 1] !== '/') i--;
		const ch = messageValue[i - 1];
		if (ch !== '/') {
			slashStart = -1;
			slashOpen = false;
			return;
		}
		const before = i - 2 >= 0 ? messageValue[i - 2] : ' ';
		if (before && !/\s/.test(before)) {
			slashStart = -1;
			slashOpen = false;
			return;
		}
		slashStart = i - 1;
		slashOpen = true;
	}

	function onMessageInput(e: Event) {
		messageValue = (e.currentTarget as HTMLInputElement).value;
		evaluateSlash();
	}

	function onMessageKeydown(e: KeyboardEvent) {
		if (slashOpen && slashPopover?.handleKey(e)) return;
		// Selection finalises on space (commit suggestion or just close)
		if (e.key === ' ') {
			slashOpen = false;
		}
	}

	function onSlashSelect(cmd: Command) {
		const before = messageValue.slice(0, slashStart);
		const afterEnd = slashStart + 1 + slashQuery.length;
		const after = messageValue.slice(afterEnd);
		const insert = `/${cmd.label} `;
		messageValue = before + insert + after;
		const caret = before.length + insert.length;
		queueMicrotask(() => {
			if (!messageEl) return;
			messageEl.focus();
			messageEl.setSelectionRange(caret, caret);
		});
		slashStart = -1;
		slashOpen = false;
		cmd.perform?.({ query: slashQuery, close: () => (slashOpen = false) });
	}

	// TERMINAL DEMO --------------------------------------------------------
	// A "shell prompt" backed by ONE tree-shaped registry. Composed cross-level
	// search means typing `github clone` finds `gh > repo > clone` even though
	// the user didn't say `repo`. On select, the host rewrites the input so
	// matched tokens become the canonical path while args are preserved.

	const shellRegistry = useCommandRegistry();

	$effect(() =>
		shellRegistry.registerMany([
			{
				id: 'git',
				label: 'git',
				description: 'The stupid content tracker',
				icon: 'GitBranch',
				children: [
					{ id: 'git.commit', label: 'commit', description: 'Record changes to the repository', icon: 'GitCommitHorizontal', arg: { type: 'msg', name: 'message' } },
					{ id: 'git.push', label: 'push', description: 'Update remote refs', icon: 'Upload' },
					{ id: 'git.pull', label: 'pull', description: 'Fetch and integrate', icon: 'Download' },
					{ id: 'git.checkout', label: 'checkout', description: 'Switch branches or restore the working tree', icon: 'GitBranch' },
					{ id: 'git.branch', label: 'branch', description: 'List, create, or delete branches', icon: 'GitBranchPlus' },
					{ id: 'git.merge', label: 'merge', description: 'Join two or more development histories', icon: 'GitMerge' },
					{ id: 'git.rebase', label: 'rebase', description: 'Reapply commits on top of another base', icon: 'GitPullRequest' },
					{ id: 'git.log', label: 'log', description: 'Show commit logs', icon: 'History' },
					{ id: 'git.status', label: 'status', description: 'Show the working tree status', icon: 'CircleDot' },
					{ id: 'git.diff', label: 'diff', description: 'Show changes', icon: 'GitCompare' },
					{ id: 'git.stash', label: 'stash', description: 'Stash changes', icon: 'Archive' }
				]
			},
			{
				id: 'gh',
				label: 'gh',
				description: 'GitHub CLI',
				icon: 'Github',
				keywords: ['github'],
				children: [
					{
						id: 'gh.pr',
						label: 'pr',
						description: 'Manage pull requests',
						icon: 'GitPullRequest',
						children: [
							{ id: 'gh.pr.create', label: 'create', description: 'Create a pull request', icon: 'Plus' },
							{ id: 'gh.pr.list', label: 'list', description: 'List pull requests', icon: 'List' },
							{ id: 'gh.pr.checkout', label: 'checkout', description: 'Check out a PR locally', icon: 'GitBranch' },
							{ id: 'gh.pr.merge', label: 'merge', description: 'Merge a PR', icon: 'GitMerge' },
							{ id: 'gh.pr.review', label: 'review', description: 'Review a PR', icon: 'CheckCheck' }
						]
					},
					{
						id: 'gh.repo',
						label: 'repo',
						description: 'Manage repositories',
						icon: 'Github',
						children: [
							{ id: 'gh.repo.clone', label: 'clone', description: 'Clone a repository', icon: 'Download', arg: { type: 'url', name: 'repo' } },
							{ id: 'gh.repo.create', label: 'create', description: 'Create a new repository', icon: 'Plus', arg: { type: 'name', name: 'repo' } },
							{ id: 'gh.repo.fork', label: 'fork', description: 'Create a fork of a repository', icon: 'GitFork', arg: { type: 'url', name: 'repo' } },
							{ id: 'gh.repo.view', label: 'view', description: 'View a repository', icon: 'Eye', arg: { type: 'name', name: 'repo' } },
							{ id: 'gh.repo.list', label: 'list', description: 'List repositories', icon: 'List' }
						]
					},
					{
						id: 'gh.issue',
						label: 'issue',
						description: 'Manage issues',
						icon: 'CircleDot',
						children: [
							{ id: 'gh.issue.create', label: 'create', description: 'Create an issue', icon: 'Plus' },
							{ id: 'gh.issue.list', label: 'list', description: 'List issues', icon: 'List' },
							{ id: 'gh.issue.close', label: 'close', description: 'Close an issue', icon: 'X' }
						]
					},
					{ id: 'gh.auth', label: 'auth', description: 'Authenticate with GitHub', icon: 'KeyRound' }
				]
			},
			{
				id: 'cargo',
				label: 'cargo',
				description: 'Rust package manager',
				icon: 'Boxes',
				children: [
					{ id: 'cargo.build', label: 'build', description: 'Compile a local package and dependencies', icon: 'Hammer' },
					{ id: 'cargo.run', label: 'run', description: 'Build and run a binary or example', icon: 'Play' },
					{ id: 'cargo.test', label: 'test', description: 'Run the tests', icon: 'TestTube' },
					{ id: 'cargo.check', label: 'check', description: 'Quickly check a package and dependencies', icon: 'CircleCheck' },
					{ id: 'cargo.clippy', label: 'clippy', description: 'Lint with Clippy', icon: 'Brush' },
					{ id: 'cargo.fmt', label: 'fmt', description: 'Format with rustfmt', icon: 'Wand' },
					{ id: 'cargo.add', label: 'add', description: 'Add a dependency', icon: 'Plus' },
					{ id: 'cargo.remove', label: 'remove', description: 'Remove a dependency', icon: 'Minus' },
					{ id: 'cargo.update', label: 'update', description: 'Update dependencies', icon: 'RefreshCw' },
					{ id: 'cargo.doc', label: 'doc', description: 'Build the documentation', icon: 'BookOpen' },
					{ id: 'cargo.publish', label: 'publish', description: 'Upload to the registry', icon: 'Send' },
					{ id: 'cargo.install', label: 'install', description: 'Install a Rust binary', icon: 'PackagePlus' }
				]
			},
			{
				id: 'npm',
				label: 'npm',
				description: 'Node package manager',
				icon: 'Package',
				children: [
					{ id: 'npm.install', label: 'install', description: 'Install a package', icon: 'PackagePlus' },
					{ id: 'npm.run', label: 'run', description: 'Run an arbitrary script', icon: 'Play' },
					{ id: 'npm.test', label: 'test', description: 'Test a package', icon: 'TestTube' },
					{ id: 'npm.publish', label: 'publish', description: 'Publish a package', icon: 'Send' },
					{ id: 'npm.init', label: 'init', description: 'Create a package.json', icon: 'FilePlus' },
					{ id: 'npm.audit', label: 'audit', description: 'Run a security audit', icon: 'ShieldCheck' },
					{ id: 'npm.outdated', label: 'outdated', description: 'Check for outdated packages', icon: 'Clock' },
					{ id: 'npm.update', label: 'update', description: 'Update packages', icon: 'RefreshCw' }
				]
			},
			{
				id: 'bun',
				label: 'bun',
				description: 'All-in-one JS runtime + toolkit',
				icon: 'Zap',
				children: [
					{ id: 'bun.install', label: 'install', description: 'Install dependencies', icon: 'PackagePlus' },
					{ id: 'bun.run', label: 'run', description: 'Execute a script or file', icon: 'Play' },
					{ id: 'bun.dev', label: 'dev', description: 'Run the dev script', icon: 'Zap' },
					{ id: 'bun.test', label: 'test', description: 'Run tests with the built-in runner', icon: 'TestTube' },
					{ id: 'bun.build', label: 'build', description: 'Bundle for production', icon: 'Hammer' },
					{ id: 'bun.add', label: 'add', description: 'Add a dependency', icon: 'Plus' },
					{ id: 'bun.remove', label: 'remove', description: 'Remove a dependency', icon: 'Minus' }
				]
			},
			{
				id: 'docker',
				label: 'docker',
				description: 'Container engine',
				icon: 'Container',
				children: [
					{ id: 'docker.build', label: 'build', description: 'Build an image from a Dockerfile', icon: 'Hammer' },
					{ id: 'docker.run', label: 'run', description: 'Create and start a new container', icon: 'Play' },
					{ id: 'docker.ps', label: 'ps', description: 'List containers', icon: 'List' },
					{ id: 'docker.pull', label: 'pull', description: 'Download an image', icon: 'Download' },
					{ id: 'docker.push', label: 'push', description: 'Upload an image', icon: 'Upload' },
					{ id: 'docker.exec', label: 'exec', description: 'Run a command in a running container', icon: 'Terminal' },
					{ id: 'docker.logs', label: 'logs', description: 'Fetch logs from a container', icon: 'ScrollText' }
				]
			},
			{ id: 'ssh', label: 'ssh', description: 'OpenSSH remote login client', icon: 'Terminal' },
			{ id: 'curl', label: 'curl', description: 'Transfer URLs', icon: 'Download' },
			{ id: 'rg', label: 'rg', description: 'ripgrep — recursive grep', icon: 'Search' }
		])
	);

	let shellValue = $state('');

	function onShellSubmit(value: string) {
		toast.info(`ran: ${value}`);
		shellValue = '';
	}

	function onShellArgMissing(cmd: Command, slot: { type: string; name?: string }) {
		toast.warning(`${cmd.label} requires a ${slot.name ?? slot.type}`);
	}
</script>

<svelte:head><title>Command Popover | Glow UI</title></svelte:head>

<Heading level={1}>Command Popover</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	An inline picker anchored to an external input. Same registry + scoring engine as
	<a href="/components/command-palette">Command Palette</a>, different presentation —
	the host owns the input, the popover only renders, filters, and emits
	<Code>onSelect</Code>.
</Text>

<Card title="Slash commands">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Type <Kbd size="sm">/</Kbd> at the start of a word to open the picker. Use
		<Kbd size="sm">↑</Kbd><Kbd size="sm">↓</Kbd> to navigate,
		<Kbd size="sm">Enter</Kbd> to insert, <Kbd size="sm">Esc</Kbd> or
		<Kbd size="sm">Space</Kbd> to dismiss.
	</Text>
	<input
		bind:this={messageEl}
		value={messageValue}
		oninput={onMessageInput}
		onkeydown={onMessageKeydown}
		onfocus={evaluateSlash}
		onclick={evaluateSlash}
		onkeyup={(e) => {
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
				evaluateSlash();
			}
		}}
		placeholder="Write a message — try /help"
		autocomplete="off"
		spellcheck="false"
		class="demo-input"
	/>
	<CommandPopover
		bind:this={slashPopover}
		bind:open={slashOpen}
		registry={slashRegistry}
		query={slashQuery}
		anchor={messageEl!}
		placement="bottom-start"
		emptyText="No matching slash commands"
		onSelect={onSlashSelect}
		onClose={() => {
			slashOpen = false;
			slashStart = -1;
		}}
	/>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Shell autocomplete">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Always-on completion backed by a tree-shaped registry. Cross-level fuzzy
		search means typing <Code>github clone abc</Code> surfaces
		<Code>gh repo clone</Code> — the popover walks the whole tree, not just
		the top level. On select the host rewrites the input so matched tokens
		become canonical names while args are preserved. Try
		<Code>cargo b</Code>, <Code>git ci</Code>, or
		<Code>github pr cre</Code>.
	</Text>
	<div class="shell-prompt">
		<span class="shell-marker">$</span>
		<CommandInput
			bind:value={shellValue}
			registry={shellRegistry}
			placeholder="git, npm, cargo, …"
			onSubmit={onShellSubmit}
			onArgMissing={onShellArgMissing}
		/>
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Wiring">
	<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;">
		The host owns the input and a slice of its value (the query). Forward keydown
		events into the popover's <Code>handleKey</Code> — it returns
		<Code>true</Code> when it consumed the key.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script>
	import { CommandPopover, useCommandRegistry } from 'glow';
	const registry = useCommandRegistry();
	let value = $state('');
	let open = $state(false);
	let inputEl = $state();
	let popover = $state();
<\/script>

<input
	bind:this={inputEl}
	bind:value
	onkeydown={(e) => popover?.handleKey(e)}
/>

<CommandPopover
	bind:this={popover}
	bind:open
	{registry}
	query={value}
	anchor={inputEl}
	onSelect={(cmd) => { /* host handles insertion + perform */ }}
/>`}
	/>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.demo-input {
		width: 100%;
		padding: 0.65rem 0.85rem;
		font-size: 0.95rem;
		font-family: inherit;
		color: var(--glow-fg);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--glow-border-color);
		border-radius: 8px;
		outline: none;
		transition: border-color var(--glow-dur-instant);

		&:focus {
			border-color: var(--glow-primary);
		}
	}

	.shell-prompt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		font-family: ui-monospace, monospace;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid var(--glow-border-color);
		border-radius: 8px;
	}

	.shell-marker {
		color: var(--glow-primary);
		font-weight: $weight-semibold;
	}
</style>
