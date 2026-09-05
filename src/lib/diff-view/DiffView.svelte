<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { DiffLine, DiffRow } from './diff.js';

	export type DiffViewMode = 'unified' | 'split';

	export interface DiffViewProps {
		/** The left-hand side: the file as it was. */
		oldText?: string;
		/** The right-hand side: the file as it is. */
		newText?: string;
		/** One column with `+`/`-`, or the two sides next to each other. */
		mode?: DiffViewMode;
		/** Shown in the header, with the +/- tally. */
		filename?: string;
		/** Column captions in split mode. */
		oldLabel?: string;
		newLabel?: string;
		/** Unchanged lines kept either side of a change before folding. */
		context?: number;
		/** Fold the unchanged middle of the file away behind an expander. */
		collapsible?: boolean;
		/** Wrap long lines instead of scrolling them horizontally. */
		wrap?: boolean;
		/** Word-level runs inside a changed line. The expensive half of a diff. */
		words?: boolean;
		lineNumbers?: boolean;
		/** Caps the height and scrolls; any CSS length. */
		maxHeight?: string;
		/**
		 * Renders the content of one line. The door left open for syntax
		 * highlighting: hand back your own markup for `line.content` and the
		 * component keeps the gutters, the tints and the word runs it computed.
		 */
		line?: Snippet<[DiffLine]>;
		/** Accessible name for the table. Defaults to the filename. */
		label?: string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import { collapse, diffLines, diffStats, toRows, type DiffChunk } from './diff.js';

	let {
		oldText = '',
		newText = '',
		mode = 'unified',
		filename,
		oldLabel = 'Before',
		newLabel = 'After',
		context = 3,
		collapsible = true,
		wrap = false,
		words = true,
		lineNumbers = true,
		maxHeight,
		line,
		label,
		class: className,
		style
	}: DiffViewProps = $props();

	let lines = $derived(diffLines(oldText, newText, { words }));
	let stats = $derived(diffStats(lines));

	// Effectively "never fold" — one number rather than a second prop that can
	// disagree with `context`.
	let fold = $derived(collapsible ? context : Number.POSITIVE_INFINITY);

	let unified = $derived(collapse(lines, (l) => l.type !== 'context', fold));
	let split = $derived(
		collapse(toRows(lines), (r) => r.left?.type !== 'context' || r.right?.type !== 'context', fold)
	);
	let chunks = $derived<DiffChunk<DiffLine | DiffRow>[]>(mode === 'split' ? split : unified);

	// Keyed by the old-side line number a gap starts at, not by its index in the
	// chunk list: toggling unified/split rebuilds the chunks, and an index would
	// hand an expanded gap's state to whichever fold happened to land there.
	let expanded = $state<Record<number, boolean>>({});
	$effect(() => {
		oldText;
		newText;
		expanded = {};
	});

	function firstLine(item: DiffLine | DiffRow): DiffLine | undefined {
		return 'type' in item ? item : (item.left ?? item.right);
	}

	function gapKey(chunk: DiffChunk<DiffLine | DiffRow>): number {
		return firstLine(chunk.items[0])?.oldNumber ?? -1;
	}

	// The gutters are as wide as the biggest number they will ever hold, in `ch`
	// of the monospace face — so the code column starts at the same x on every
	// row, and the sticky offsets below are computable without measuring.
	let digits = $derived(Math.max(2, String(Math.max(lines.length, 1)).length));

	const signOf = { add: '+', remove: '−', context: ' ' } as const;
	const nameOf = { add: 'Added line', remove: 'Removed line', context: 'Unchanged line' } as const;

	/**
	 * What a screen reader hears in place of the tint. The `+`/`-` glyph is the
	 * sighted non-colour signal; a lone `+` announced out of context is not, so
	 * the row says which side it is on and at what line.
	 */
	function announce(l: DiffLine, side?: number): string {
		return `${nameOf[l.type]} ${side ?? l.oldNumber ?? l.newNumber}:`;
	}
</script>

{#snippet code(l: DiffLine)}
	{#if line}
		{@render line(l)}
	{:else if l.segments}
		{#each l.segments as segment, i (i)}<span class="seg" class:changed={segment.changed}
				>{segment.text}</span
			>{/each}
	{:else}{l.content}{/if}
{/snippet}

{#snippet number(value: number | undefined, side: string)}
	<td class="num" data-side={side}>{value ?? ''}</td>
{/snippet}

{#snippet sign(l: DiffLine | undefined)}
	<td class="sign">
		{#if l}
			<span class="glyph" aria-hidden="true">{signOf[l.type]}</span>
			<span class="visually-hidden">{announce(l)}</span>
		{/if}
	</td>
{/snippet}

{#snippet expander(chunk: DiffChunk<DiffLine | DiffRow>, columns: number)}
	<tr class="gap">
		<td colspan={columns}>
			<button
				type="button"
				class="expand"
				onclick={() => (expanded[gapKey(chunk)] = true)}
				aria-expanded="false"
			>
				<Icon name="ChevronsUpDown" size="1em" />
				<span>Expand {chunk.items.length} unchanged {chunk.items.length === 1 ? 'line' : 'lines'}</span>
			</button>
		</td>
	</tr>
{/snippet}

<div
	class={['diff-view', className].filter(Boolean).join(' ')}
	data-mode={mode}
	class:wrap
	class:no-numbers={!lineNumbers}
	style:--glow-diff-digits={digits}
	{style}
>
	{#if filename || stats.added || stats.removed}
		<div class="head">
			{#if filename}
				<Icon name="FileCode" size="1em" />
				<span class="filename">{filename}</span>
			{/if}
			<span class="tally">
				<span class="added">+{stats.added}</span>
				<span class="removed">−{stats.removed}</span>
			</span>
		</div>
	{/if}

	<div class="scroller" style:max-height={maxHeight}>
		<table aria-label={label ?? filename ?? 'Diff'}>
			<caption class="visually-hidden">
				{stats.added} added and {stats.removed} removed {stats.removed === 1 ? 'line' : 'lines'}, shown
				{mode === 'split' ? 'side by side' : 'as a unified diff'}.
			</caption>
			{#if mode === 'split'}
				<!--
					Split's two code columns have to be told they are equal. Left to
					itself the table gives the wider side everything and squeezes the
					other to one character per line, which only shows up once `wrap` is
					on — with `pre` the overflow hides the mistake.
				-->
				<colgroup>
					{#if lineNumbers}<col class="col-num" />{/if}
					<col class="col-code" />
					{#if lineNumbers}<col class="col-num" />{/if}
					<col class="col-code" />
				</colgroup>
				<thead>
					<tr>
						<th scope="col" colspan={lineNumbers ? 2 : 1}>{oldLabel}</th>
						<th scope="col" colspan={lineNumbers ? 2 : 1}>{newLabel}</th>
					</tr>
				</thead>
				<tbody>
					{#each chunks as chunk, ci (ci)}
						{#if chunk.kind === 'gap' && !expanded[gapKey(chunk)]}
							{@render expander(chunk, lineNumbers ? 4 : 2)}
						{:else}
							{#each chunk.items as row (row)}
								{@const { left, right } = row as DiffRow}
								<tr class="line">
									{#if lineNumbers}{@render number(left?.oldNumber, 'old')}{/if}
									<td class="code" data-type={left?.type ?? 'empty'}>
										{#if left}<span class="glyph" aria-hidden="true">{signOf[left.type]}</span
											><span class="visually-hidden">{announce(left, left.oldNumber)}</span
											><span class="text">{@render code(left)}</span>{/if}
									</td>
									{#if lineNumbers}{@render number(right?.newNumber, 'new')}{/if}
									<td class="code" data-type={right?.type ?? 'empty'}>
										{#if right}<span class="glyph" aria-hidden="true">{signOf[right.type]}</span
											><span class="visually-hidden">{announce(right, right.newNumber)}</span
											><span class="text">{@render code(right)}</span>{/if}
									</td>
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			{:else}
				<tbody>
					{#each chunks as chunk, ci (ci)}
						{#if chunk.kind === 'gap' && !expanded[gapKey(chunk)]}
							{@render expander(chunk, lineNumbers ? 4 : 2)}
						{:else}
							{#each chunk.items as item (item)}
								{@const l = item as DiffLine}
								<tr class="line">
									{#if lineNumbers}
										{@render number(l.oldNumber, 'old')}
										{@render number(l.newNumber, 'new')}
									{/if}
									{@render sign(l)}
									<td class="code" data-type={l.type}><span class="text">{@render code(l)}</span></td>
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			{/if}
		</table>
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.diff-view {
		// One monospace face for numbers, signs and code. Anything else and the
		// gutter stops being a whole number of `ch` wide, which is what the
		// sticky offsets below are measured in.
		--glow-diff-font: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Source Code Pro', monospace;
		// A whole number of device pixels at any root size, so a row never lands
		// on a half pixel and no two columns round apart.
		--glow-diff-line-height: 1.5rem;
		--glow-diff-gutter: calc(var(--glow-diff-digits) * 1ch + 1rem);
		--glow-diff-sign: calc(1ch + 0.75rem);
		--glow-diff-gutters: calc(2 * var(--glow-diff-gutter));

		&.no-numbers {
			--glow-diff-gutters: 0px;
		}

		background: var(--glow-bg-surface);
		border: $border;
		border-radius: $radius;
		overflow: hidden;
		font-family: var(--glow-diff-font);
		font-size: $text-sm;
	}

	.head {
		display: flex;
		align-items: center;
		gap: $space-sm;
		padding: $space-sm $space-md;
		border-bottom: $border;
		background: var(--glow-surface-2);
		color: $text-secondary;
		line-height: var(--glow-diff-line-height);

		:global(svg) {
			// An icon box and a text box share no metrics, so centring is the flex
			// line's job — but the glyph still has to sit on the text's optical
			// centre, which `display: block` inside a 1em box gets right.
			display: block;
			flex-shrink: 0;
		}
	}

	.filename {
		color: $text-primary;
		font-weight: $weight-medium;
	}

	.tally {
		margin-left: auto;
		display: flex;
		gap: $space-sm;
		font-variant-numeric: tabular-nums;

		.added {
			color: var(--glow-diff-add-fg);
		}
		.removed {
			color: var(--glow-diff-remove-fg);
		}
	}

	.scroller {
		overflow: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		// Cells carry their own tint, so a row-level background would paint over
		// the sticky gutters.
		background: var(--glow-bg-surface);
	}

	// Split mode's two column captions. Sticky rather than static so they survive
	// a `maxHeight` scroll, which is when a caption is worth having at all.
	thead th {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: 0 0.5rem;
		text-align: left;
		font-weight: $weight-semibold;
		color: $text-secondary;
		background: var(--glow-surface-2);
		border-bottom: $border;
		line-height: var(--glow-diff-line-height);
	}

	td {
		// Every cell shares one font, one size and one line-height: that is what
		// makes a number and its code line agree on a baseline rather than
		// agreeing by luck.
		font-family: var(--glow-diff-font);
		font-size: $text-sm;
		line-height: var(--glow-diff-line-height);
		padding: 0;
		vertical-align: top;
		border: 0;
	}

	.num {
		width: var(--glow-diff-gutter);
		min-width: var(--glow-diff-gutter);
		padding: 0 0.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: $text-muted;
		background: var(--glow-bg-surface);
		user-select: none;
	}

	.sign {
		width: var(--glow-diff-sign);
		min-width: var(--glow-diff-sign);
		padding: 0 0.25rem 0 0.5rem;
		user-select: none;
		background: var(--glow-bg-surface);
	}

	.code {
		width: 100%;
		padding: 0 0.5rem;
		color: $text-primary;
		// `pre` keeps the leading indentation that a diff is mostly made of. It
		// also has to sit on the cell, not only on the text inside it: split
		// mode's two code columns both want the full width, so a cell left
		// wrapping would break the line away from its own sign glyph.
		white-space: pre;

		.wrap & {
			white-space: pre-wrap;
			// A minified line or a long URL has no break opportunity of its own.
			overflow-wrap: anywhere;
		}
	}

	.col-num {
		width: var(--glow-diff-gutter);
	}

	// Only wrapping needs the columns pinned: a scrolling table sizes itself to
	// its longest line, and `table-layout: fixed` there would clip that line
	// under the next column instead of scrolling it.
	.wrap[data-mode='split'] {
		table {
			table-layout: fixed;
		}

		.col-code {
			width: calc((100% - var(--glow-diff-gutters)) / 2);
		}
	}

	// Split mode puts the sign inside the code cell — a fifth and sixth column
	// for two characters would cost more width than they are worth.
	[data-mode='split'] .code .glyph {
		display: inline-block;
		width: 1ch;
		margin-right: 0.5ch;
		user-select: none;
	}

	.line {
		[data-type='add'] {
			background: var(--glow-diff-add-bg);
		}
		[data-type='remove'] {
			background: var(--glow-diff-remove-bg);
		}
		// The half of a split row with no counterpart. Not tinted with either
		// colour: nothing was added or removed here, the line simply does not
		// exist on this side.
		[data-type='empty'] {
			background: var(--glow-fg-soft);
		}
	}

	.glyph {
		font-weight: $weight-bold;
	}

	// Unified carries the sign in its own column, so the colour has to reach it
	// from the row; split's sign sits inside the cell that already knows.
	[data-mode='unified'] .line:has([data-type='add']) .glyph {
		color: var(--glow-diff-add-fg);
	}
	[data-mode='unified'] .line:has([data-type='remove']) .glyph {
		color: var(--glow-diff-remove-fg);
	}
	.code[data-type='add'] .glyph {
		color: var(--glow-diff-add-fg);
	}
	.code[data-type='remove'] .glyph {
		color: var(--glow-diff-remove-fg);
	}

	.seg.changed {
		border-radius: 3px;

		[data-type='add'] & {
			background: var(--glow-diff-add-emphasis);
		}
		[data-type='remove'] & {
			background: var(--glow-diff-remove-emphasis);
		}
	}

	// The gutters stay put while a long line scrolls under them; without this the
	// `+`/`-` — the only signal a colour-blind reader has — scrolls away first.
	// Unified only: the offsets are a sum of fixed column widths, and split's
	// right-hand gutter sits after a code column of unknowable width.
	[data-mode='unified'] {
		.num[data-side='old'] {
			position: sticky;
			left: 0;
			z-index: 1;
		}
		.num[data-side='new'] {
			position: sticky;
			left: var(--glow-diff-gutter);
			z-index: 1;
		}
		.sign {
			position: sticky;
			left: calc(2 * var(--glow-diff-gutter));
			z-index: 1;
			box-shadow: inset -1px 0 0 var(--glow-border-color);
		}
	}

	.gap td {
		background: var(--glow-surface-2);
		border-top: $border;
		border-bottom: $border;
	}

	.expand {
		display: flex;
		align-items: center;
		gap: $space-sm;
		width: 100%;
		padding: 0 0.75rem;
		// The row is exactly one line tall, like the lines it stands in for, so a
		// fold does not shift the rhythm of the rows around it.
		height: var(--glow-diff-line-height);
		border: 0;
		background: transparent;
		color: $text-secondary;
		font: inherit;
		line-height: var(--glow-diff-line-height);
		cursor: pointer;
		transition: background var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			background: $tertiary-hover;
			color: $text-primary;
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}

		:global(svg) {
			display: block;
			flex-shrink: 0;
		}
	}

	// Kept in the accessibility tree and out of the layout — `display: none`
	// would take the per-line "Added line 12:" prefix out of both.
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
