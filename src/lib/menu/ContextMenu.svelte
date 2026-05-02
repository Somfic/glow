<script lang="ts">
	import type { Snippet } from 'svelte';
	import type {
		PopoverMenuEntry,
		PopoverMenuItem,
		PopoverMenuSubmenu,
		PopoverMenuCommonItem
	} from './PopoverMenu.svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import MenuItem from './MenuItem.svelte';
	import { portal } from '../util/portal.js';
	import { onEscape } from '../util/escapeKey.js';
	import { fly, fade } from 'svelte/transition';

	interface Props {
		items: PopoverMenuEntry[];
		common?: PopoverMenuCommonItem[];
		/**
		 * Wrapper mode — captures right-click on `children` and opens the menu
		 * at the cursor. Omit `children` for headless mode where the consumer
		 * sets `open`, `x`, `y` programmatically.
		 */
		children?: Snippet;
		disabled?: boolean;
		open?: boolean;
		x?: number;
		y?: number;
	}

	let {
		items,
		common,
		children,
		disabled = false,
		open = $bindable(false),
		x = $bindable(0),
		y = $bindable(0)
	}: Props = $props();

	let menuElement = $state<HTMLDivElement>(undefined!);
	let activeIndex = $state(-1);
	let openSubmenuKey = $state<string | null>(null);

	// Render position is decoupled from the bindable x/y inputs so internal
	// flip/clamp doesn't fight the parent's binding via a feedback loop. The
	// effect below seeds these from x/y when the menu opens, then mutates
	// only these to flip the menu into view.
	let renderX = $state(0);
	let renderY = $state(0);
	// Hidden until the first reposition runs so the menu never flashes at the
	// raw cursor position before flipping onto the viewport.
	let positioned = $state(false);

	// Submenu panel position. Portal'd to body so the parent menu's
	// `overflow-y: auto` doesn't clip it horizontally.
	let submenuTrigger = $state<HTMLElement | null>(null);
	let submenuX = $state(0);
	let submenuY = $state(0);
	let submenuPanel = $state<HTMLDivElement | null>(null);
	let submenuPositioned = $state(false);

	function handleContextMenu(e: MouseEvent) {
		if (disabled) return;
		e.preventDefault();
		e.stopPropagation();
		x = e.clientX;
		y = e.clientY;
		open = true;
	}

	function reposition() {
		if (!menuElement) return;
		const margin = 8;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const rect = menuElement.getBoundingClientRect();

		let nextX = x;
		let nextY = y;

		// Horizontal: try right of cursor; flip left if it overflows; clamp.
		if (nextX + rect.width > vw - margin) nextX = nextX - rect.width;
		if (nextX < margin) nextX = margin;
		if (nextX + rect.width > vw - margin) nextX = Math.max(margin, vw - margin - rect.width);

		// Vertical: try below cursor; flip above if it overflows; clamp.
		// CSS max-height + overflow-y handles the case where the menu is
		// taller than the viewport even after flipping.
		if (nextY + rect.height > vh - margin) {
			const flipped = nextY - rect.height;
			nextY = flipped >= margin ? flipped : margin;
		}
		if (nextY < margin) nextY = margin;

		renderX = nextX;
		renderY = nextY;
		positioned = true;
	}

	function positionSubmenu() {
		if (!submenuTrigger || !submenuPanel) return;
		const margin = 8;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const trig = submenuTrigger.getBoundingClientRect();
		const panel = submenuPanel.getBoundingClientRect();

		// Read the parent menu's right edge from the trigger's offset parent
		// so the panel can land flush against it (not just against the row's
		// content box, which is inset by parent padding + border). Falls back
		// to the row's right edge if we can't find the parent rect.
		const parentRect = (submenuTrigger.closest('.context-menu') as HTMLElement | null)
			?.getBoundingClientRect();
		const parentRight = parentRect?.right ?? trig.right;

		// Overlap the parent menu's right edge by 1px so the parent's right
		// border disappears under the panel — the two surfaces read as one
		// continuous shape. The panel covers the parent's right padding and
		// border for the panel's vertical range.
		let nx = parentRight - 1;
		// Align so the panel's first sub-item visually matches the trigger's
		// vertical position (panel-top minus its 6px padding-top).
		let ny = trig.top - 6;

		submenuPanel.style.setProperty('--trigger-height', `${trig.height}px`);

		// Horizontal flip — if there's no room to the right, swing left.
		if (nx + panel.width > vw - margin) {
			const parentLeft = parentRect?.left ?? trig.left;
			const flipped = parentLeft + 1 - panel.width;
			nx = flipped >= margin ? flipped : Math.max(margin, vw - margin - panel.width);
		}
		if (nx < margin) nx = margin;

		// Vertical clamp / flip — keep panel inside the viewport.
		if (ny + panel.height > vh - margin) {
			const flipped = trig.bottom + 6 - panel.height;
			ny = flipped >= margin ? flipped : Math.max(margin, vh - margin - panel.height);
		}
		if (ny < margin) ny = margin;

		submenuX = nx;
		submenuY = ny;
		submenuPositioned = true;
	}

	// Seed render position from cursor, then synchronously flip/clamp once
	// the element is mounted. Re-run on resize.
	$effect(() => {
		if (open && menuElement) {
			positioned = false;
			renderX = x;
			renderY = y;
			// Synchronous measure — element is in the DOM and laid out by the
			// time this effect runs. RAF is also scheduled for safety against
			// async font loads / late-hydrating content shifting the size.
			reposition();
			const id = requestAnimationFrame(reposition);
			const onResize = () => reposition();
			window.addEventListener('resize', onResize);
			return () => {
				cancelAnimationFrame(id);
				window.removeEventListener('resize', onResize);
			};
		}
	});

	// Reposition submenu panel whenever its trigger or panel changes.
	$effect(() => {
		if (openSubmenuKey && submenuTrigger && submenuPanel) {
			submenuPositioned = false;
			positionSubmenu();
			const id = requestAnimationFrame(positionSubmenu);
			return () => cancelAnimationFrame(id);
		}
	});

	function handleItemClick(item: PopoverMenuItem) {
		if (item.disabled) return;
		open = false;
		activeIndex = -1;
		openSubmenuKey = null;
		item.onclick();
	}

	function handleSubmenuItemClick(item: PopoverMenuItem) {
		if (item.disabled) return;
		open = false;
		openSubmenuKey = null;
		item.onclick();
	}

	// The currently-open submenu entry (so we can render its panel once,
	// portal'd, instead of nested inside the parent — which was getting
	// clipped by the parent's overflow-y: auto).
	const activeSubmenu = $derived.by(() => {
		if (!openSubmenuKey) return null;
		const idx = parseInt(openSubmenuKey.slice(4), 10);
		const entry = items[idx];
		return entry !== 'divider' && entry?.kind === 'submenu' ? (entry as PopoverMenuSubmenu) : null;
	});

	const itemEntries = $derived(
		items
			.map((entry, i) =>
				entry !== 'divider' && entry.kind === 'item' ? { item: entry, index: i } : null
			)
			.filter((x): x is { item: PopoverMenuItem; index: number } => x !== null && !x.item.disabled)
	);

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const cur = itemEntries.findIndex((a) => a.index === activeIndex);
			const next = cur < itemEntries.length - 1 ? cur + 1 : 0;
			activeIndex = itemEntries[next]?.index ?? -1;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const cur = itemEntries.findIndex((a) => a.index === activeIndex);
			const prev = cur > 0 ? cur - 1 : itemEntries.length - 1;
			activeIndex = itemEntries[prev]?.index ?? -1;
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			const entry = items[activeIndex];
			if (entry !== 'divider' && entry.kind === 'item' && !entry.disabled) {
				handleItemClick(entry);
			}
		}
	}

	$effect(() => {
		if (open) {
			activeIndex = -1;
			openSubmenuKey = null;
			document.addEventListener('keydown', handleKeydown);

			const cleanupEscape = onEscape(() => { open = false; });
			// Use a class-based check so clicks inside the (portal'd) submenu
			// panel — which is bound only after a submenu opens — count as
			// "inside" the menu and don't close it.
			const onMouseDown = (e: MouseEvent) => {
				const t = e.target as HTMLElement | null;
				if (t?.closest('.context-menu, .submenu-panel')) return;
				open = false;
			};
			document.addEventListener('mousedown', onMouseDown, true);
			const cleanupClickOutside = () => document.removeEventListener('mousedown', onMouseDown, true);

			return () => {
				document.removeEventListener('keydown', handleKeydown);
				cleanupEscape();
				cleanupClickOutside();
			};
		}
	});
</script>

{#snippet submenuArrow()}
	<Icon name="ChevronRight" size={14} />
{/snippet}

{#if children}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="context-menu-zone" oncontextmenu={handleContextMenu}>
		{@render children()}
	</div>
{/if}

{#if open}
	<div
		bind:this={menuElement}
		class="context-menu"
		style="position: fixed; left: {renderX}px; top: {renderY}px; z-index: 10000; visibility: {positioned ? 'visible' : 'hidden'};"
		role="menu"
		use:portal
		in:fly={{ duration: 80, y: -4 }}
		out:fade={{ duration: 100 }}
		onmouseleave={(e) => {
			// Don't collapse the submenu when the mouse moves into its
			// portal'd panel — they're visually one menu even though they're
			// DOM siblings.
			const next = e.relatedTarget as HTMLElement | null;
			if (next?.closest('.submenu-panel')) return;
			openSubmenuKey = null;
		}}
	>
		{#if common && common.length > 0}
			<div class="common-section" role="group">
				{#each common as entry}
					<button
						type="button"
						class="common-item"
						class:danger={entry.danger}
						class:disabled={entry.disabled}
						disabled={entry.disabled}
						title={entry.label}
						onclick={() => {
							if (entry.disabled) return;
							open = false;
							entry.onclick();
						}}
					>
						<Icon {...resolveIcon(entry.icon)} size={resolveIcon(entry.icon).size ?? 16} />
					</button>
				{/each}
			</div>
			<div class="divider"></div>
		{/if}

		{#each items as entry, i (i)}
			{#if entry === 'divider'}
				<div class="divider"></div>
			{:else if entry.kind === 'header'}
				<div class="group-header">{entry.label}</div>
			{:else if entry.kind === 'item'}
				<MenuItem
					label={entry.label}
					description={entry.description}
					icon={entry.icon}
					image={entry.image}
					shortcut={entry.shortcut}
					selected={entry.selected}
					disabled={entry.disabled}
					danger={entry.danger}
					active={i === activeIndex}
					role="menuitem"
					onclick={() => handleItemClick(entry)}
					onmouseenter={() => {
						activeIndex = -1;
						openSubmenuKey = null;
					}}
				/>
			{:else if entry.kind === 'submenu'}
				{@const key = `sub-${i}`}
				<div
					class="submenu-row"
					class:open={openSubmenuKey === key}
					onmouseenter={(e) => {
						activeIndex = -1;
						openSubmenuKey = key;
						submenuTrigger = e.currentTarget as HTMLElement;
					}}
					role="presentation"
				>
					<MenuItem
						label={entry.label}
						description={entry.description}
						icon={entry.icon}
						shortcut={entry.shortcut}
						active={openSubmenuKey === key}
						onclick={(e) => {
							submenuTrigger = (e.currentTarget as HTMLElement).closest('.submenu-row');
							openSubmenuKey = openSubmenuKey === key ? null : key;
						}}
						trailing={submenuArrow}
					/>
				</div>
			{/if}
		{/each}
	</div>

	{#if activeSubmenu}
		<div
			bind:this={submenuPanel}
			class="submenu-panel"
			style="position: fixed; left: {submenuX}px; top: {submenuY}px; z-index: 10001; visibility: {submenuPositioned ? 'visible' : 'hidden'};"
			role="menu"
			use:portal
			in:fly={{ duration: 80, x: -6 }}
			out:fade={{ duration: 100 }}
			onmouseleave={(e) => {
				// Don't close the submenu when the mouse moves back into the
				// parent menu — only close when it leaves the menu cluster
				// entirely.
				const next = e.relatedTarget as HTMLElement | null;
				if (next?.closest('.context-menu')) return;
				openSubmenuKey = null;
			}}
		>
			{#each activeSubmenu.items ?? [] as subEntry, j (j)}
				{#if subEntry === 'divider'}
					<div class="divider"></div>
				{:else if subEntry.kind === 'header'}
					<div class="group-header">{subEntry.label}</div>
				{:else if subEntry.kind === 'item'}
					<MenuItem
						label={subEntry.label}
						description={subEntry.description}
						icon={subEntry.icon}
						image={subEntry.image}
						shortcut={subEntry.shortcut}
						selected={subEntry.selected}
						disabled={subEntry.disabled}
						danger={subEntry.danger}
						role="menuitem"
						onclick={() => handleSubmenuItemClick(subEntry)}
					/>
				{/if}
			{/each}
		</div>
	{/if}
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.context-menu-zone {
		display: contents;
	}

	:global(.context-menu) {
		background-color: color-mix(in oklab, var(--glow-bg-surface-element) 92%, transparent);
		backdrop-filter: blur(20px) saturate(160%);
		-webkit-backdrop-filter: blur(20px) saturate(160%);
		border: $border;
		border-radius: 14px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
		padding: 6px;
		min-width: 240px;
		max-width: calc(100vw - 16px);
		max-height: calc(100vh - 16px);
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.divider {
		height: 1px;
		background: var(--glow-border-color);
		margin: 6px 4px;
	}

	.group-header {
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--glow-text-muted);
		padding: 8px 12px 4px;
	}

	.common-section {
		display: flex;
		gap: 2px;
		padding: 2px;
	}

	.common-item {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 8px;
		border: none;
		border-radius: 8px;
		background: none;
		color: var(--glow-fg);
		cursor: pointer;
		transition: background 0.1s;

		&:hover {
			background: rgba($fg, 0.06);
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;
			&:hover {
				background: none;
			}
		}

		&.danger {
			color: var(--glow-color-danger);
			&:hover {
				background: color-mix(in oklab, var(--glow-color-danger) 10%, transparent);
			}
		}
	}

	.submenu-row {
		position: relative;

		// When this submenu is open, paint the row's hover state with the
		// panel's surface color so the row reads as a continuation of the
		// panel — same trick as a tabs indicator sharing its background
		// with the content panel below.
		&.open :global(.menu-item) {
			background: var(--glow-bg-surface-element);
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}

		// Extend the matched colour into the parent menu's right padding
		// zone so the row's bg meets the panel's left edge with no
		// parent-surface stripe between them. Clipped by the parent menu's
		// overflow at its inner right edge — perfect for filling padding
		// (~6px) without spilling out past the border.
		&.open::after {
			content: '';
			position: absolute;
			top: 0;
			bottom: 0;
			left: 100%;
			width: 12px;
			background: var(--glow-bg-surface-element);
			pointer-events: none;
		}
	}

	// Submenu panel is portaled to body. Sits flush against the parent
	// menu's right edge (overlapping by 1px, see positionSubmenu) and shares
	// its surface color with the active trigger row, so the two surfaces
	// read as one continuous popover.
	//
	// - No left border: parent's right border (under our 1px overlap) and
	//   the panel's right + top + bottom border together draw the unified
	//   outline.
	// - clip-path inset(0 -50px -50px 0): expands the visible bounds rightward
	//   and downward so the box-shadow renders normally there, but clips at
	//   the left edge so the shadow doesn't bleed back over the parent menu
	//   (which is what makes the join read as a seam in the first place).
	:global(.submenu-panel) {
		--trigger-height: 36px;

		position: fixed;
		background-color: var(--glow-bg-surface-element);
		border: $border;
		border-left: 0;
		border-radius: 0 14px 14px 14px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
		clip-path: inset(0 -50px -50px 0);
		padding: 6px;
		min-width: 220px;
		max-width: calc(100vw - 16px);
		max-height: calc(100vh - 16px);
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
</style>
