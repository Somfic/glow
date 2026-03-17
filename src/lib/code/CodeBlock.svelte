<script lang="ts">
	import { Button } from '../index.js';
	import { showToast } from '../toast/toast.svelte.js';
	import { highlightCode, inferLanguageFromFilename } from './highlighter.js';
	import { cursor } from '../cursor/cursor.svelte.js';

	let {
		code,
		language,
		label,
		filename,
		showLineNumbers = false,
		shell = false,
		maxHeight
	}: {
		code: string;
		language?: string;
		filename?: string;
		label?: string;
		showLineNumbers?: boolean;
		shell?: boolean;
		maxHeight?: string;
	} = $props();

	let highlightedHtml = $state<string>('');
	let isHighlighting = $state(true);

	// Infer language from filename if not explicitly provided
	let inferredLanguage = $derived(
		language || (filename ? inferLanguageFromFilename(filename) : undefined)
	);

	// Auto-detect shell mode from language
	let isShellMode = $derived(
		shell ||
			inferredLanguage === 'bash' ||
			inferredLanguage === 'sh' ||
			inferredLanguage === 'shell'
	);

	// Get shell commands (split by lines)
	let shellCommands = $derived(isShellMode ? code.trim().split('\n') : []);

	// Highlight code when component mounts or code/language changes
	$effect(() => {
		if (isShellMode) {
			// For shell mode, don't highlight - we'll render manually
			isHighlighting = false;
			return;
		}

		isHighlighting = true;
		highlightCode(code.trim(), inferredLanguage, 'vitesse-dark')
			.then((html) => {
				highlightedHtml = html;
				isHighlighting = false;
			})
			.catch(() => {
				// Fallback to plain code
				highlightedHtml = `<pre><code>${code.trim()}</code></pre>`;
				isHighlighting = false;
			});
	});

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			showToast('Code copied to clipboard', { variant: 'success' });
		} catch (err) {
			showToast('Failed to copy code', { variant: 'error' });
		}
	}

	async function copyLine(line: string) {
		try {
			await navigator.clipboard.writeText(line);
			showToast('Command copied', { variant: 'success' });
		} catch (err) {
			showToast('Failed to copy command', { variant: 'error' });
		}
	}
</script>

<div class="code-block" class:shell-mode={isShellMode}>
	<div class="code-content" style:max-height={maxHeight}>
		{#if !isShellMode}
			<div class="copy-button">
				<Button icon="Copy" variant="ghost" onclick={copyCode} />
			</div>
		{/if}
		{#if isShellMode}
			<div class="shell-content">
				{#each shellCommands as command}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="shell-line"
						use:cursor={{ state: 'copy' }}
						onclick={() => copyLine(command)}
					>
						<span class="shell-prompt">$</span>
						<span class="shell-command">{command}</span>
						<button
							class="shell-copy"
							onclick={(e) => {
								e.stopPropagation();
								copyLine(command);
							}}
							aria-label="Copy command"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{:else if isHighlighting}
			<div class="code-loading">Loading syntax highlighting...</div>
		{:else}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="highlighted-code" tabindex="0">
				{@html highlightedHtml}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.code-block {
		background: $bg-surface;
		border: $border;
		border-radius: $radius;
		overflow: hidden;
		font-family:
			'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Dank Mono', 'Source Code Pro', monospace;
	}

	.copy-button {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		opacity: 0;
		transition: opacity 0.2s;
		z-index: 10;

		.code-block:hover & {
			opacity: 1;
		}
	}

	.code-content {
		position: relative;
		overflow: auto;

		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba($fg, 0.2);
			border-radius: 4px;

			&:hover {
				background: rgba($fg, 0.3);
			}
		}
	}

	.code-loading {
		padding: 1rem;
		color: $text-muted;
		font-size: $text-sm;
		font-style: italic;
	}

	.highlighted-code {
		:global(pre) {
			margin: 0 !important;
			padding: 1rem !important;
			background: transparent !important;
			overflow-x: auto;
		}

		:global(code) {
			font-family:
				'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Dank Mono', 'Source Code Pro', monospace !important;
			font-size: $text-sm !important;
			line-height: 1.6 !important;
			tab-size: 2;
		}

		// Ensure Shiki's colors are visible
		:global(.shiki) {
			background: transparent !important;
		}
	}

	.shell-content {
		padding: 1rem;
		font-family: inherit;
		font-size: $text-sm;
		line-height: 1.8;
	}

	.shell-line {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
		padding: 0.25rem 0;
		position: relative;
		transition: background 0.15s;

		&:last-child {
			margin-bottom: 0;
		}

		&:hover {
			background: rgba($fg, 0.05);
			margin-left: -0.5rem;
			margin-right: -0.5rem;
			padding-left: 0.5rem;
			padding-right: 0.5rem;
			border-radius: 4px;

			.shell-copy {
				opacity: 1;
			}
		}

		&:active {
			background: rgba($fg, 0.1);
		}
	}

	.shell-prompt {
		color: #22c55e;
		font-weight: 700;
		user-select: none;
		flex-shrink: 0;
	}

	.shell-command {
		color: rgba($fg, 0.95);
		flex: 1;
	}

	.shell-copy {
		background: none;
		border: none;
		color: $text-muted;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition:
			opacity 0.15s,
			color 0.15s;
		flex-shrink: 0;

		&:hover {
			color: $text-primary;
		}

		&:active {
			color: $primary;
		}

		svg {
			display: block;
		}
	}
</style>
