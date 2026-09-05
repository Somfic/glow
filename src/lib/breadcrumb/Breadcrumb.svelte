<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';

	export type BreadcrumbItem = {
		label: string;
		/** Omit on the last crumb — the current page is not a link. */
		href?: string;
		icon?: IconProp;
		/** Called instead of navigating, for trails driven by app state rather than URLs. */
		onclick?: (e: MouseEvent) => void;
	};

	/** Argument handed to the `item` snippet for each rendered crumb. */
	export type BreadcrumbItemState = {
		item: BreadcrumbItem;
		/** Index into the original `items` array, not into the visible trail. */
		index: number;
		/** True for the last crumb — the one carrying `aria-current="page"`. */
		current: boolean;
	};
</script>

<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Link from '../typography/Link.svelte';
	import PopoverMenu from '../menu/PopoverMenu.svelte';

	interface Props {
		items: BreadcrumbItem[];
		/**
		 * What sits between two crumbs. An icon name (or `IconProps`) renders
		 * through `<Icon>`; a snippet renders whatever you like — pass one to get
		 * a text separator such as `/`.
		 */
		separator?: IconProp | Snippet;
		/**
		 * Collapse the middle of the trail into a menu when it doesn't fit its
		 * container. Set false to let a long trail wrap instead.
		 */
		collapse?: boolean;
		/**
		 * Collapse whenever there are more than this many crumbs, regardless of
		 * width. Use it when you want the same shape at every viewport; leave it
		 * unset to collapse purely on measured overflow.
		 */
		maxItems?: number;
		/** Crumbs always kept at the head of the trail. */
		itemsBeforeCollapse?: number;
		/** Crumbs always kept at the tail, including the current page. */
		itemsAfterCollapse?: number;
		/** Render a crumb yourself. Receives the item, its index, and whether it is the current page. */
		item?: Snippet<[BreadcrumbItemState]>;
		/** Accessible name of the landmark. Only worth changing if a page has two trails. */
		label?: string;
		class?: string;
	}

	let {
		items,
		separator = 'ChevronRight',
		collapse = true,
		maxItems,
		itemsBeforeCollapse = 1,
		itemsAfterCollapse = 1,
		item: itemSnippet,
		label = 'Breadcrumb',
		class: className
	}: Props = $props();

	let navEl = $state<HTMLElement | null>(null);
	let mirrorEl = $state<HTMLElement | null>(null);
	let menuOpen = $state(false);

	/** Natural width of every crumb, in order, plus the collapsed placeholder. */
	let itemWidths = $state<number[]>([]);
	let ellipsisWidth = $state(0);
	let available = $state(0);

	// Widths come from a hidden mirror of the *full* trail rather than from the
	// rendered list. Measuring the rendered list can't work: the moment it
	// collapses, the widths of the items it dropped are gone, so it could never
	// tell whether they'd fit again once the container grew.
	$effect(() => {
		// Re-measure when the trail itself changes, not only when boxes resize.
		void items;
		void separator;
		if (!navEl || !mirrorEl) return;

		const nav = navEl;
		const mirror = mirrorEl;

		const measure = () => {
			const cells = Array.from(mirror.children) as HTMLElement[];
			itemWidths = cells.slice(0, items.length).map((el) => el.getBoundingClientRect().width);
			ellipsisWidth = cells[items.length]?.getBoundingClientRect().width ?? 0;
			available = nav.clientWidth;
		};

		measure();
		// The mirror is observed too: a late webfont swap changes text metrics
		// without the container ever resizing.
		const observer = new ResizeObserver(measure);
		observer.observe(nav);
		observer.observe(mirror);
		return () => observer.disconnect();
	});

	let keepStart = $derived(Math.max(0, Math.min(itemsBeforeCollapse, items.length)));
	let keepEnd = $derived(Math.max(1, Math.min(itemsAfterCollapse, items.length - keepStart)));

	/** Indices eligible to be folded into the menu, head-first. */
	let candidates = $derived(
		Array.from({ length: Math.max(0, items.length - keepStart - keepEnd) }, (_, i) => keepStart + i)
	);

	function widthOf(hidden: Set<number>): number {
		let total = hidden.size > 0 ? ellipsisWidth : 0;
		for (let i = 0; i < items.length; i++) {
			if (!hidden.has(i)) total += itemWidths[i] ?? 0;
		}
		return total;
	}

	let hidden = $derived.by((): Set<number> => {
		if (candidates.length === 0) return new Set();
		if (maxItems !== undefined) {
			// Count-based: the ellipsis occupies one of the `maxItems` slots.
			if (items.length <= maxItems) return new Set();
			return new Set(candidates.slice(0, items.length - maxItems + 1));
		}
		if (!collapse) return new Set();
		// Before the first measurement, render the whole trail; it collapses on
		// the frame after mount rather than flashing an ellipsis on the server.
		if (!available || itemWidths.length !== items.length) return new Set();
		// Hide the fewest crumbs that make it fit, dropping the shallowest
		// ancestors first — they are the least useful part of a trail.
		for (let k = 0; k <= candidates.length; k++) {
			const set = new Set(candidates.slice(0, k));
			if (widthOf(set) <= available) return set;
		}
		return new Set(candidates);
	});

	let hiddenItems = $derived(items.filter((_, i) => hidden.has(i)));
	let visible = $derived(
		items
			.map((entry, index) => ({ item: entry, index, current: index === items.length - 1 }))
			.filter(({ index }) => !hidden.has(index))
	);
	// The placeholder is keyed to the first *visible* crumb after the folded
	// block, since that is the item the `#each` over the visible trail reaches.
	let collapseAt = $derived(hidden.size > 0 ? Math.max(...hidden) + 1 : -1);

	function isSnippet(value: IconProp | Snippet): value is Snippet {
		return typeof value === 'function';
	}
</script>

{#snippet sep()}
	<span class="separator" aria-hidden="true">
		{#if isSnippet(separator)}
			{@render separator()}
		{:else}
			<Icon {...resolveIcon(separator)} size={resolveIcon(separator).size ?? 14} />
		{/if}
	</span>
{/snippet}

{#snippet crumb(state: BreadcrumbItemState)}
	{#if itemSnippet}
		{@render itemSnippet(state)}
	{:else if state.current || (!state.item.href && !state.item.onclick)}
		<span class="current" aria-current={state.current ? 'page' : undefined}>
			{#if state.item.icon}
				<Icon {...resolveIcon(state.item.icon)} size={resolveIcon(state.item.icon).size ?? 14} />
			{/if}
			{state.item.label}
		</span>
	{:else if state.item.href}
		<Link href={state.item.href} onclick={state.item.onclick} icon={state.item.icon} variant="muted" underline="hover">
			{state.item.label}
		</Link>
	{:else}
		<!-- An href-less crumb is a button, not a bare <a>: an anchor without a
		     destination is not focusable and not operable from the keyboard. -->
		<button type="button" class="crumb-button" onclick={state.item.onclick}>
			{#if state.item.icon}
				<Icon {...resolveIcon(state.item.icon)} size={resolveIcon(state.item.icon).size ?? 14} />
			{/if}
			{state.item.label}
		</button>
	{/if}
{/snippet}

{#snippet ellipsisTrigger()}
	<button
		type="button"
		class="ellipsis"
		aria-label="Show {hiddenItems.length} hidden breadcrumbs"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
	>
		<Icon name="Ellipsis" size={16} />
	</button>
{/snippet}

{#snippet hiddenMenu()}
	{#each hiddenItems as entry (entry.label + (entry.href ?? ''))}
		<!-- Real anchors, not the menu's <button> rows: a crumb folded into the
		     menu should still be middle-clickable and copyable. -->
		<svelte:element
			this={entry.href ? 'a' : 'button'}
			class="menu-link"
			href={entry.href}
			type={entry.href ? undefined : 'button'}
			role="menuitem"
			tabindex={0}
			onclick={(e: MouseEvent) => {
				menuOpen = false;
				entry.onclick?.(e);
			}}
		>
			{#if entry.icon}
				<Icon {...resolveIcon(entry.icon)} size={resolveIcon(entry.icon).size ?? 14} />
			{/if}
			{entry.label}
		</svelte:element>
	{/each}
{/snippet}

<nav
	bind:this={navEl}
	class={['breadcrumb', className].filter(Boolean).join(' ')}
	aria-label={label}
	class:no-collapse={!collapse && maxItems === undefined}
>
	<ol>
		{#each visible as state (state.index)}
			{#if state.index === collapseAt}
				<li class="collapsed">
					{@render sep()}
					<PopoverMenu
						bind:open={menuOpen}
						trigger={ellipsisTrigger}
						items={[{ kind: 'custom', render: hiddenMenu }]}
						fullWidth={false}
						align="left"
					/>
				</li>
			{/if}
			<li>
				{#if state.index > 0}{@render sep()}{/if}
				{@render crumb(state)}
			</li>
		{/each}
	</ol>

	<!-- Measurement mirror: the full trail plus one collapsed placeholder, laid
	     out but never painted and never read out. -->
	<ol class="mirror" bind:this={mirrorEl} aria-hidden="true">
		{#each items as entry, index (index)}
			<li>
				{#if index > 0}{@render sep()}{/if}
				{@render crumb({ item: entry, index, current: index === items.length - 1 })}
			</li>
		{/each}
		<li>
			{@render sep()}
			{@render ellipsisTrigger()}
		</li>
	</ol>
</nav>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.breadcrumb {
		position: relative;
		min-width: 0;
		font-size: $text-sm;
	}

	ol {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		list-style: none;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.no-collapse ol {
		flex-wrap: wrap;
		row-gap: 0.25em;
	}

	li {
		display: flex;
		align-items: center;
		white-space: nowrap;
		flex-shrink: 0;
	}

	// Only the last crumb is allowed to shrink; see `.current` below.
	ol > li:last-child {
		flex-shrink: 1;
		min-width: 0;
	}

	.separator {
		display: inline-flex;
		align-items: center;
		color: var(--glow-text-muted);
		margin: 0 0.4em;
		user-select: none;
	}

	.current {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		color: var(--glow-fg);
		font-weight: $weight-medium;
		// The current page is the one crumb allowed to give up width, so a long
		// title truncates instead of pushing its own ancestors out of the trail.
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.crumb-button {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: var(--glow-text-secondary);
		cursor: pointer;
		border-radius: $radius-xs;
		transition: color var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			color: var(--glow-fg);
			text-decoration: underline;
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}
	}

	// <Popover> wraps its trigger in plain block divs, so the inline-flex button
	// inside sits on a line box and picks up the strut's descender space beneath
	// it — enough to push the dots ~1.4px above the chevrons either side. Making
	// the wrappers flex removes the line box entirely.
	.collapsed :global(.popover),
	.collapsed :global(.popover-trigger) {
		display: flex;
		align-items: center;
	}

	.ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1.6em;
		padding: 0 0.25em;
		border: none;
		border-radius: $radius-sm;
		background: none;
		color: var(--glow-text-muted);
		cursor: pointer;
		transition:
			background var(--glow-dur-fast) var(--glow-ease-out),
			color var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			background: color-mix(in oklab, var(--glow-fg) 8%, transparent);
			color: var(--glow-fg);
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}
	}

	// Laid out for measurement only: out of flow, unpainted, unreachable.
	.mirror {
		position: absolute;
		top: 0;
		left: 0;
		width: max-content;
		visibility: hidden;
		pointer-events: none;
	}

	.menu-link {
		display: flex;
		width: 100%;
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
		align-items: center;
		gap: 0.6em;
		padding: 8px 12px;
		border-radius: $radius-md;
		color: var(--glow-fg);
		font-size: $text-sm;
		text-decoration: none;
		transition: background var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			background: var(--glow-primary-soft);
			color: var(--glow-primary);
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}
	}
</style>
