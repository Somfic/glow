<script lang="ts" module>
	type Block =
		| { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
		| { type: 'paragraph'; text: string }
		| { type: 'list'; ordered: boolean; items: string[] }
		| { type: 'code'; lang?: string; code: string }
		| { type: 'quote'; text: string }
		| { type: 'hr' };

	function parseBlocks(src: string): Block[] {
		const lines = src.split('\n');
		const blocks: Block[] = [];
		let i = 0;

		while (i < lines.length) {
			const line = lines[i];
			const trimmed = line.trim();

			if (trimmed === '') {
				i++;
				continue;
			}

			// Code fence
			const fence = trimmed.match(/^```(\w*)$/);
			if (fence) {
				const lang = fence[1] || undefined;
				const codeLines: string[] = [];
				i++;
				while (i < lines.length && !lines[i].trim().match(/^```$/)) {
					codeLines.push(lines[i]);
					i++;
				}
				i++; // skip closing fence
				blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
				continue;
			}

			// Heading
			const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
			if (heading) {
				blocks.push({
					type: 'heading',
					level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
					text: heading[2]
				});
				i++;
				continue;
			}

			// Horizontal rule
			if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
				blocks.push({ type: 'hr' });
				i++;
				continue;
			}

			// Blockquote
			if (trimmed.startsWith('> ')) {
				const quoteLines: string[] = [];
				while (i < lines.length && lines[i].trim().startsWith('> ')) {
					quoteLines.push(lines[i].trim().slice(2));
					i++;
				}
				blocks.push({ type: 'quote', text: quoteLines.join(' ') });
				continue;
			}

			// Unordered list
			if (/^[-*+]\s+/.test(trimmed)) {
				const items: string[] = [];
				while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
					items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
					i++;
				}
				blocks.push({ type: 'list', ordered: false, items });
				continue;
			}

			// Ordered list
			if (/^\d+\.\s+/.test(trimmed)) {
				const items: string[] = [];
				while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
					items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
					i++;
				}
				blocks.push({ type: 'list', ordered: true, items });
				continue;
			}

			// Paragraph (consume until blank line)
			const paraLines: string[] = [];
			while (
				i < lines.length &&
				lines[i].trim() !== '' &&
				!/^(#{1,6})\s+/.test(lines[i].trim()) &&
				!/^```/.test(lines[i].trim()) &&
				!/^[-*+]\s+/.test(lines[i].trim()) &&
				!/^\d+\.\s+/.test(lines[i].trim()) &&
				!lines[i].trim().startsWith('> ')
			) {
				paraLines.push(lines[i]);
				i++;
			}
			if (paraLines.length > 0) {
				blocks.push({ type: 'paragraph', text: paraLines.join(' ').trim() });
			}
		}

		return blocks;
	}

	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function renderInline(text: string): string {
		// Escape first, then apply formatting on already-escaped text using safe sentinels.
		let html = escapeHtml(text);

		// Inline code (do first so other rules don't touch its contents)
		html = html.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');

		// Links [text](url) — url is already escaped, only allow http/https/relative
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
			const safe = /^(https?:\/\/|\/|#|mailto:)/.test(url) ? url : '#';
			return `<a class="md-link" href="${safe}">${label}</a>`;
		});

		// Bold (**text** or __text__)
		html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

		// Italic (*text* or _text_) — be careful not to match leftovers from bold
		html = html.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
		html = html.replace(/(^|[^_])_([^_\n]+)_([^_]|$)/g, '$1<em>$2</em>$3');

		return html;
	}
</script>

<script lang="ts">
	import CodeBlock from '../code/CodeBlock.svelte';

	let { source, class: className, style }: { source: string; class?: string; style?: string } = $props();

	const blocks = $derived(parseBlocks(source));
</script>

<div class={['markdown', className].filter(Boolean).join(' ')} {style}>
	{#each blocks as block}
		{#if block.type === 'heading'}
			{#if block.level === 1}<h1>{@html renderInline(block.text)}</h1>
			{:else if block.level === 2}<h2>{@html renderInline(block.text)}</h2>
			{:else if block.level === 3}<h3>{@html renderInline(block.text)}</h3>
			{:else if block.level === 4}<h4>{@html renderInline(block.text)}</h4>
			{:else if block.level === 5}<h5>{@html renderInline(block.text)}</h5>
			{:else}<h6>{@html renderInline(block.text)}</h6>{/if}
		{:else if block.type === 'paragraph'}
			<p>{@html renderInline(block.text)}</p>
		{:else if block.type === 'list'}
			{#if block.ordered}
				<ol>
					{#each block.items as item}<li>{@html renderInline(item)}</li>{/each}
				</ol>
			{:else}
				<ul>
					{#each block.items as item}<li>{@html renderInline(item)}</li>{/each}
				</ul>
			{/if}
		{:else if block.type === 'code'}
			<CodeBlock code={block.code} language={block.lang ?? 'text'} />
		{:else if block.type === 'quote'}
			<blockquote>{@html renderInline(block.text)}</blockquote>
		{:else if block.type === 'hr'}
			<hr />
		{/if}
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.markdown {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		line-height: 1.6;

		:global(p) {
			margin: 0;
		}

		:global(ul),
		:global(ol) {
			margin: 0;
			padding-left: 1.5rem;
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}

		:global(blockquote) {
			margin: 0;
			padding: 0.5rem 0 0.5rem 1rem;
			border-left: 3px solid rgba($fg, 0.2);
			color: $text-secondary;
			font-style: italic;
		}

		:global(hr) {
			border: none;
			border-top: 1px solid rgba($fg, 0.1);
			margin: 0;
		}

		:global(.md-code) {
			background: rgba($fg, 0.08);
			padding: 0.1em 0.4em;
			border-radius: 4px;
			font-family: ui-monospace, 'SF Mono', Menlo, monospace;
			font-size: 0.9em;
		}

		:global(.md-link) {
			color: $primary;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
