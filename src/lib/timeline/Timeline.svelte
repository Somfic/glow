<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';

	/** Status colour of an entry's marker and its rail segment. */
	export type TimelineVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

	export type TimelineDensity = 'comfortable' | 'compact';

	export interface TimelineItem {
		/** Stable key for the `{#each}`; falls back to the index. */
		id?: string;
		/** Headline of the entry. */
		title?: string;
		/** Secondary line under the title. */
		description?: string;
		/**
		 * A machine-readable instant — `Date`, or anything `new Date()` parses.
		 * It becomes `<time datetime>`. Pass `timeLabel` for a non-instant like
		 * "2 weeks ago", which gets a plain `<span>` instead: a `<time>` without a
		 * valid `datetime` is worse than no `<time>` at all.
		 */
		timestamp?: Date | string | number;
		/** What the timestamp reads as. Defaults to a short locale rendering. */
		timeLabel?: string;
		/** Marker glyph. Ignored when `avatar` is set. */
		icon?: IconProp;
		/** Marker portrait — takes precedence over `icon`. */
		avatar?: { name: string; src?: string };
		variant?: TimelineVariant;
		/** Per-item escape hatch for the entry body, replacing title/description. */
		body?: Snippet<[TimelineItem]>;
	}

	export interface TimelineProps {
		items: TimelineItem[];
		/**
		 * Compact matches the `[data-density='compact']` rhythm in global.scss and
		 * is inherited from any ancestor that sets it, so a dense panel doesn't
		 * have to pass the prop down.
		 */
		density?: TimelineDensity;
		/** Fallback body snippet for items without their own `body`. */
		children?: Snippet<[TimelineItem]>;
		/** Replaces the whole marker column for every item. */
		marker?: Snippet<[TimelineItem]>;
		/** Accessible name for the list. */
		label?: string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Avatar from '../avatar/Avatar.svelte';

	let {
		items,
		density,
		children,
		marker,
		label,
		class: className,
		style
	}: TimelineProps = $props();

	function toDate(value: Date | string | number): Date | undefined {
		const date = value instanceof Date ? value : new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}

	/** The `datetime` attribute, or undefined when the value isn't a real instant. */
	function machineTime(item: TimelineItem): string | undefined {
		return item.timestamp === undefined ? undefined : toDate(item.timestamp)?.toISOString();
	}

	function humanTime(item: TimelineItem): string | undefined {
		if (item.timeLabel) return item.timeLabel;
		if (item.timestamp === undefined) return undefined;
		const date = toDate(item.timestamp);
		if (!date) return String(item.timestamp);
		return date.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<ol
	class={['timeline', className].filter(Boolean).join(' ')}
	data-density={density}
	aria-label={label}
	{style}
>
	{#each items as item, i (item.id ?? i)}
		<li
			class="entry"
			class:plain={!marker && !item.avatar && !item.icon}
			data-variant={item.variant ?? 'default'}
		>
			<div class="marker" aria-hidden="true">
				{#if marker}
					{@render marker(item)}
				{:else if item.avatar}
					<Avatar name={item.avatar.name} src={item.avatar.src} size="sm" />
				{:else if item.icon}
					<span class="dot dot-icon">
						<Icon {...resolveIcon(item.icon)} size={resolveIcon(item.icon).size ?? '0.9em'} />
					</span>
				{:else}
					<span class="dot"></span>
				{/if}
			</div>

			<div class="content">
				{#if item.body}
					{@render item.body(item)}
				{:else if children}
					{@render children(item)}
				{:else}
					{#if item.title}<div class="title">{item.title}</div>{/if}
					{#if item.description}<div class="description">{item.description}</div>{/if}
				{/if}
			</div>

			{#if humanTime(item)}
				<div class="time">
					{#if machineTime(item)}
						<time datetime={machineTime(item)}>{humanTime(item)}</time>
					{:else}
						<span>{humanTime(item)}</span>
					{/if}
				</div>
			{/if}
		</li>
	{/each}
</ol>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.timeline {
		--timeline-marker: 1.75rem;
		--timeline-gap: 0.875rem;
		--timeline-row-gap: 1.25rem;
		--timeline-rail: 2px;
		--timeline-accent: var(--glow-border-strong);

		// The entry's base typography, and with it the height of one line of body
		// text. Everything vertical is measured against `--timeline-line`: the
		// marker is centred in a box exactly that tall, so it lands on the first
		// line of the entry rather than on the middle of the whole block. Override
		// it if a `body` snippet sets a larger text size than the entry's own.
		--timeline-text: #{$text-sm};
		--timeline-leading: 1.6;
		--timeline-line: calc(var(--timeline-text) * var(--timeline-leading));

		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
	}

	// Compact reads the ancestor attribute as well as the prop, so a panel that
	// already declares its density gets a matching timeline for free.
	:global([data-density='compact']) .timeline,
	.timeline[data-density='compact'] {
		--timeline-marker: 1.5rem;
		--timeline-gap: 0.625rem;
		--timeline-row-gap: 0.75rem;
	}

	.entry {
		// The drawn diameter of the marker, which is the icon circle unless the
		// entry falls back to a bare dot. The rail and the overhang key off this
		// rather than off the column width, so a dot's rail starts under the dot.
		--timeline-glyph: var(--timeline-marker);
		// How far a marker taller than one line of text sticks out past it. Both
		// ends of the list reserve this much, so the first and last markers are
		// not clipped by whatever the list sits in.
		--timeline-overhang: max(0px, calc((var(--timeline-glyph) - var(--timeline-line)) / 2));

		position: relative;
		display: grid;
		grid-template-columns: var(--timeline-marker) minmax(0, 1fr) auto;
		align-items: start;
		column-gap: var(--timeline-gap);
		font-size: var(--timeline-text);
		line-height: var(--timeline-leading);
		// The rail is drawn inside each entry rather than as one line behind the
		// list, so it can end exactly at the last marker. Spacing is padding, not
		// `row-gap`, for the same reason: a gap would leave the rail broken
		// between entries.
		padding-bottom: var(--timeline-row-gap);

		&.plain {
			--timeline-glyph: 0.625rem;
		}

		&:first-child {
			padding-top: var(--timeline-overhang);
		}

		&:last-child {
			padding-bottom: var(--timeline-overhang);
		}

		// Runs from the bottom of this marker to the top of the next one — hence
		// the half-line plus half-marker at each end. The last entry gets none at
		// all: an overshooting tail is the giveaway that a timeline was drawn as
		// a single background line.
		&:not(:last-child)::before {
			content: '';
			position: absolute;
			top: calc((var(--timeline-line) + var(--timeline-glyph)) / 2 + 2px);
			bottom: calc(var(--timeline-overhang) + 2px);
			left: calc((var(--timeline-marker) - var(--timeline-rail)) / 2);
			width: var(--timeline-rail);
			border-radius: var(--timeline-rail);
			background: var(--glow-border-color);
		}
	}

	.entry[data-variant='primary'] { --timeline-accent: var(--glow-primary); }
	.entry[data-variant='success'] { --timeline-accent: var(--glow-color-success); }
	.entry[data-variant='warning'] { --timeline-accent: var(--glow-color-warning); }
	.entry[data-variant='danger']  { --timeline-accent: var(--glow-color-danger); }
	.entry[data-variant='info']    { --timeline-accent: var(--glow-color-info); }

	// One line tall, with the marker centred in it and free to overflow. That is
	// what puts a 28px circle — or an avatar — on the centre of a 22px first line
	// at any density, and what keeps a wrapped title aligned to its first line
	// instead of to the middle of the block.
	.marker {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--timeline-marker);
		height: var(--timeline-line);
	}

	.dot {
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: $radius-full;
		background: var(--timeline-accent);
		transition: background var(--glow-dur-fast) var(--glow-ease-out);
	}

	.dot-icon {
		width: var(--timeline-glyph);
		height: var(--timeline-glyph);
		font-size: $text-sm;
		color: var(--timeline-accent);
		background: color-mix(in oklab, var(--timeline-accent) 14%, var(--glow-bg-surface));
		border: 1px solid color-mix(in oklab, var(--timeline-accent) 45%, transparent);
	}

	.content {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.title {
		font-weight: $weight-semibold;
		color: var(--glow-text-primary);
	}

	.description {
		font-weight: $weight-medium;
		color: var(--glow-text-secondary);
	}

	.time {
		font-size: $text-xs;
		// A length, not a ratio: the time is smaller than the title but has to
		// share its line box, or the column drifts up as the type shrinks.
		line-height: var(--timeline-line);
		color: var(--glow-text-muted);
		white-space: nowrap;
		// A column of times changes every row; proportional digits make it jitter.
		font-variant-numeric: tabular-nums;
	}
</style>
