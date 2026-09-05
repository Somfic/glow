<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { DiffLine, DiffLineType, DiffRow } from './diff.js';

	export type DiffViewMode = 'unified' | 'split';

	/**
	 * One run of the change stripe: a kind and how many rows it spans. Declared
	 * out here rather than in the instance script because the snippet that
	 * renders it is typed against it, and markup only sees module scope.
	 */
	interface Stripe {
		type: DiffLineType | 'empty';
		span: number;
	}

	export interface DiffViewProps {
		/** The left-hand side: the file as it was. */
		oldText?: string;
		/** The right-hand side: the file as it is. */
		newText?: string;
		/** One column with `+`/`-`, or the two sides next to each other. */
		mode?: DiffViewMode;
		/** File path in the header. Also infers the language to highlight. */
		filename?: string;
		/** Header tally. Defaults to what the diff itself counted. */
		added?: number;
		removed?: number;
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
		/**
		 * Syntax highlighting, through the same Shiki setup `CodeBlock` uses. Needs
		 * a `language` or a `filename` to infer one from; without either it is a
		 * no-op rather than an error.
		 */
		highlight?: boolean;
		/** Overrides the language inferred from `filename`. */
		language?: string;
		/** Caps the height and scrolls; any CSS length. */
		maxHeight?: string;
		/**
		 * Renders the content of one line, replacing both the highlighting and the
		 * word runs. For consumers who bring their own coloured markup.
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
	import { theme as themeStore } from '../style/theme.svelte.js';
	import { collapse, diffLines, diffStats, toRows, type DiffChunk } from './diff.js';
	import { applySegments, highlightLines, inferLanguageFromFilename } from './highlight.js';

	let {
		oldText = '',
		newText = '',
		mode = 'unified',
		filename,
		added,
		removed,
		oldLabel = 'Before',
		newLabel = 'After',
		context = 3,
		collapsible = true,
		wrap = false,
		words = true,
		lineNumbers = true,
		highlight = true,
		language,
		maxHeight,
		line,
		label,
		class: className,
		style
	}: DiffViewProps = $props();

	let lines = $derived(diffLines(oldText, newText, { words }));
	let stats = $derived(diffStats(lines));
	let addedCount = $derived(added ?? stats.added);
	let removedCount = $derived(removed ?? stats.removed);

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
	// row, and the sticky offsets in the stylesheet are computable without
	// measuring anything.
	let digits = $derived(Math.max(2, String(Math.max(lines.length, 1)).length));

	const signOf = { add: '+', remove: '-', context: ' ' } as const;
	const nameOf = { add: 'Added line', remove: 'Removed line', context: 'Unchanged line' } as const;

	/**
	 * What a screen reader hears in place of the tint. The `+`/`-` glyph is the
	 * sighted non-colour signal; a lone `+` announced out of context is not, so
	 * the row says which side it is on and at what line.
	 */
	function announce(l: DiffLine, side?: number): string {
		return `${nameOf[l.type]} ${side ?? l.oldNumber ?? l.newNumber}:`;
	}

	// --- the change stripe ---------------------------------------------------

	/**
	 * One stripe cell per *run* of changed lines, not per line: three consecutive
	 * additions share a single unbroken bar, which is what makes the stripe read
	 * as a block of change rather than as three ticks. A `null` entry is a row
	 * covered by the `rowspan` of the run above it, so it emits no cell at all.
	 */
	function stripes(kinds: (DiffLineType | 'empty')[]): (Stripe | null)[] {
		const out: (Stripe | null)[] = [];
		for (let i = 0; i < kinds.length; ) {
			const kind = kinds[i];
			if (kind === 'context' || kind === 'empty') {
				out.push({ type: kind, span: 1 });
				i++;
				continue;
			}
			let end = i;
			while (end < kinds.length && kinds[end] === kind) end++;
			out.push({ type: kind, span: end - i });
			for (let j = i + 1; j < end; j++) out.push(null);
			i = end;
		}
		return out;
	}

	function kindsOf(items: (DiffLine | DiffRow)[], side?: 'left' | 'right'): (DiffLineType | 'empty')[] {
		return items.map((item) => {
			if (!side) return (item as DiffLine).type;
			return (item as DiffRow)[side]?.type ?? 'empty';
		});
	}

	// --- syntax highlighting -------------------------------------------------

	let lang = $derived(language ?? (filename ? inferLanguageFromFilename(filename) : undefined));
	// Shiki themes are baked into the markup it returns, so the palette has to be
	// re-fetched when the library's theme flips rather than swapped in CSS.
	let shikiTheme = $derived(themeStore.mode === 'light' ? 'vitesse-light' : 'vitesse-dark');
	let coloured = $state<{ old: string[]; new: string[] }>({ old: [], new: [] });

	$effect(() => {
		if (!highlight || !lang) {
			coloured = { old: [], new: [] };
			return;
		}
		const [before, after, palette] = [oldText, newText, shikiTheme];
		let live = true;
		Promise.all([highlightLines(before, lang, palette), highlightLines(after, lang, palette)]).then(
			([o, n]) => {
				if (live) coloured = { old: o, new: n };
			}
		);
		return () => {
			live = false;
		};
	});

	/**
	 * The coloured markup for one line, or `undefined` while Shiki is still
	 * loading and whenever highlighting is off or failed. Nothing waits on it:
	 * the diff renders its own structure immediately in plain text and gains
	 * colour when it arrives, so there is no unstyled flash and no reflow —
	 * only the same rows, coloured.
	 */
	function markup(l: DiffLine): string | undefined {
		const source = l.type === 'add' ? coloured.new : coloured.old;
		const number = l.type === 'add' ? l.newNumber : l.oldNumber;
		const html = number ? source[number - 1] : undefined;
		return html === undefined ? undefined : applySegments(html, l.segments);
	}
</script>

{#snippet code(l: DiffLine)}
	{@const html = markup(l)}
	{#if line}
		{@render line(l)}
	{:else if html !== undefined}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	{:else if l.segments}
		{#each l.segments as segment, i (i)}<span class="seg" class:changed={segment.changed}
				>{segment.text}</span
			>{/each}
	{:else}{l.content}{/if}
{/snippet}

{#snippet stripe(mark: Stripe | null, side?: string)}
	{#if mark}
		<td class="stripe" data-type={mark.type} data-side={side} rowspan={mark.span} aria-hidden="true"
		></td>
	{/if}
{/snippet}

{#snippet number(value: number | undefined, side: string)}
	<td class="num" data-side={side}>{value ?? ''}</td>
{/snippet}

{#snippet sign(l: DiffLine | undefined)}
	<td class="sign" data-type={l?.type ?? 'empty'}>
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
	{#if filename || addedCount || removedCount}
		<div class="head">
			<span class="head-glyph" aria-hidden="true">&lt;/&gt;</span>
			{#if filename}<span class="filename">{filename}</span>{/if}
			<span class="tally">
				<span class="added">+{addedCount}</span>
				<span class="removed">-{removedCount}</span>
			</span>
		</div>
	{/if}

	<div class="scroller" style:max-height={maxHeight}>
		<table aria-label={label ?? filename ?? 'Diff'}>
			<caption class="visually-hidden">
				{addedCount} added and {removedCount} removed {removedCount === 1 ? 'line' : 'lines'}, shown
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
					<col class="col-stripe" />
					{#if lineNumbers}<col class="col-num" />{/if}
					<col class="col-code" />
					<col class="col-stripe" />
					{#if lineNumbers}<col class="col-num" />{/if}
					<col class="col-code" />
				</colgroup>
				<thead>
					<tr>
						<th scope="col" colspan={lineNumbers ? 3 : 2}>{oldLabel}</th>
						<th scope="col" colspan={lineNumbers ? 3 : 2}>{newLabel}</th>
					</tr>
				</thead>
				<tbody>
					{#each chunks as chunk, ci (ci)}
						{#if chunk.kind === 'gap' && !expanded[gapKey(chunk)]}
							{@render expander(chunk, lineNumbers ? 6 : 4)}
						{:else}
							{@const marksLeft = stripes(kindsOf(chunk.items, 'left'))}
							{@const marksRight = stripes(kindsOf(chunk.items, 'right'))}
							{#each chunk.items as row, i (row)}
								{@const { left, right } = row as DiffRow}
								<tr class="line">
									{@render stripe(marksLeft[i], 'old')}
									{#if lineNumbers}{@render number(left?.oldNumber, 'old')}{/if}
									<td class="code" data-type={left?.type ?? 'empty'}>
										{#if left}<span class="glyph" aria-hidden="true">{signOf[left.type]}</span
											><span class="visually-hidden">{announce(left, left.oldNumber)}</span
											><span class="text">{@render code(left)}</span>{/if}
									</td>
									{@render stripe(marksRight[i], 'new')}
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
							{@render expander(chunk, lineNumbers ? 5 : 3)}
						{:else}
							{@const marks = stripes(kindsOf(chunk.items))}
							{#each chunk.items as item, i (item)}
								{@const l = item as DiffLine}
								<tr class="line">
									{@render stripe(marks[i])}
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
		--glow-diff-line-height: 1.625rem;
		--glow-diff-stripe-width: 4px;
		--glow-diff-gutter: calc(var(--glow-diff-digits) * 1ch + 1rem);
		--glow-diff-sign: calc(1ch + 0.75rem);
		--glow-diff-gutters: calc(2 * var(--glow-diff-gutter) + 2 * var(--glow-diff-stripe-width));

		&.no-numbers {
			--glow-diff-gutters: calc(2 * var(--glow-diff-stripe-width));
		}

		background: var(--glow-bg-surface);
		border: $border;
		border-radius: $radius;
		overflow: hidden;
		font-family: var(--glow-diff-font);
		font-size: $text-sm;
	}

	// A slightly raised surface, so the file path reads as a label on the card
	// rather than as the first line of the file.
	.head {
		display: flex;
		align-items: center;
		gap: $space-sm;
		padding: $space-sm $space-md;
		border-bottom: $border;
		background: var(--glow-surface-2);
		color: $text-secondary;
		line-height: var(--glow-diff-line-height);
	}

	.head-glyph {
		color: $text-muted;
		user-select: none;
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

	// The change stripe, flush against the card's left edge. One cell per run of
	// changed lines (see `stripes()`), so a block of three additions is a single
	// unbroken bar — spanning it with `rowspan` rather than drawing a bar per row
	// is what keeps it unbroken when the row tints stack up behind it.
	.stripe {
		width: var(--glow-diff-stripe-width);
		min-width: var(--glow-diff-stripe-width);
		padding: 0;

		&[data-type='add'] {
			background: var(--glow-diff-add-fg);
		}

		// Hatched rather than solid: a deletion and an addition then differ by
		// texture as well as by hue, which is the same argument as the +/- gutter
		// one step further out. The period is deliberately coarse — a finer hatch
		// aliases into a muddy smear at 1x, where most people will see it.
		&[data-type='remove'] {
			background: repeating-linear-gradient(
				45deg,
				var(--glow-diff-remove-fg) 0 3px,
				transparent 3px 6px
			);
		}
	}

	// In split mode the right pane's stripe doubles as the seam between the two
	// panes, so it carries the hairline even on rows where nothing changed.
	[data-mode='split'] .stripe[data-side='new'] {
		border-left: $border;
	}

	.num {
		width: var(--glow-diff-gutter);
		min-width: var(--glow-diff-gutter);
		padding: 0 0.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		// Noticeably dimmer than the code: the numbers are for finding a line,
		// not for reading.
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
		// The hairline the reference puts between the numbers and the change
		// itself, splitting "where in the file" from "what happened".
		border-left: $border;
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

	.col-stripe {
		width: var(--glow-diff-stripe-width);
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
		.code[data-type='empty'] {
			background: var(--glow-fg-soft);
		}
	}

	// Declared again, and after the row tints: the stripe is the one cell that
	// wants the strong colour rather than the wash, and `.line [data-type]`
	// matches it just as specifically.
	.line .stripe[data-type='add'] {
		background: var(--glow-diff-add-fg);
	}
	.line .stripe[data-type='remove'] {
		background: repeating-linear-gradient(
			45deg,
			var(--glow-diff-remove-fg) 0 3px,
			transparent 3px 6px
		);
	}

	.glyph {
		// Present, but quieter than the code it labels.
		color: $text-muted;
	}

	// Unified carries the sign in its own column, so the colour has to reach it
	// from the row; split's sign sits inside the cell that already knows.
	.sign[data-type='add'] .glyph,
	.code[data-type='add'] .glyph {
		color: var(--glow-diff-add-fg);
	}
	.sign[data-type='remove'] .glyph,
	.code[data-type='remove'] .glyph {
		color: var(--glow-diff-remove-fg);
	}

	.seg.changed,
	.code :global(.seg.changed) {
		border-radius: 3px;
	}

	// `:global`, because the word runs inside a highlighted line are built in
	// `highlight.ts` and inserted with `{@html}`, so they never pass through
	// Svelte's style scoping.
	[data-type='add'] .seg.changed,
	[data-type='add'] :global(.seg.changed) {
		background: var(--glow-diff-add-emphasis);
	}
	[data-type='remove'] .seg.changed,
	[data-type='remove'] :global(.seg.changed) {
		background: var(--glow-diff-remove-emphasis);
	}

	// The gutters stay put while a long line scrolls under them; without this the
	// `+`/`-` — the only signal a colour-blind reader has — scrolls away first.
	// Unified only: the offsets are a sum of fixed column widths, and split's
	// right-hand gutter sits after a code column of unknowable width.
	[data-mode='unified'] {
		.stripe {
			position: sticky;
			left: 0;
			z-index: 1;
		}
		.num[data-side='old'] {
			position: sticky;
			left: var(--glow-diff-stripe-width);
			z-index: 1;
		}
		.num[data-side='new'] {
			position: sticky;
			left: calc(var(--glow-diff-stripe-width) + var(--glow-diff-gutter));
			z-index: 1;
		}
		.sign {
			position: sticky;
			left: calc(var(--glow-diff-stripe-width) + 2 * var(--glow-diff-gutter));
			z-index: 1;
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
