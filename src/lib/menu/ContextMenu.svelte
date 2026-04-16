<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PopoverMenuEntry, PopoverMenuItem, PopoverMenuCommonItem } from './PopoverMenu.svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import { portal } from '../util/portal.js';
	import { onEscape } from '../util/escapeKey.js';
	import { onClickOutside } from '../util/clickOutside.js';
	import { fly, fade } from 'svelte/transition';

	interface Props {
		items: PopoverMenuEntry[];
		common?: PopoverMenuCommonItem[];
		children: Snippet;
		disabled?: boolean;
	}

	let { items, common, children, disabled = false }: Props = $props();

	let open = $state(false);
	let menuElement = $state<HTMLDivElement>(undefined!);
	let menuX = $state(0);
	let menuY = $state(0);
	let activeIndex = $state(-1);

	function handleContextMenu(e: MouseEvent) {
		if (disabled) return;
		e.preventDefault();
		menuX = e.clientX;
		menuY = e.clientY;
		open = true;
	}

	function positionMenu(el: HTMLDivElement) {
		const rect = el.getBoundingClientRect();
		if (menuX + rect.width > window.innerWidth) menuX = menuX - rect.width;
		if (menuY + rect.height > window.innerHeight) menuY = menuY - rect.height;
	}

	function handleItemClick(item: PopoverMenuItem | PopoverMenuCommonItem) {
		if (item.disabled) return;
		open = false;
		activeIndex = -1;
		item.onclick();
	}

	// ContextMenu currently only renders 'divider' and `kind: 'item'` entries;
	// toggle/submenu/custom kinds are silently skipped (use <PopoverMenu> for
	// those richer patterns).
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
			const currentPos = itemEntries.findIndex((a) => a.index === activeIndex);
			const next = currentPos < itemEntries.length - 1 ? currentPos + 1 : 0;
			activeIndex = itemEntries[next].index;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const currentPos = itemEntries.findIndex((a) => a.index === activeIndex);
			const prev = currentPos > 0 ? currentPos - 1 : itemEntries.length - 1;
			activeIndex = itemEntries[prev].index;
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
			document.addEventListener('keydown', handleKeydown);

			const cleanupEscape = onEscape(() => { open = false; });
			const cleanupClickOutside = onClickOutside(
				[menuElement],
				() => { open = false; }
			);

			return () => {
				document.removeEventListener('keydown', handleKeydown);
				cleanupEscape();
				cleanupClickOutside();
			};
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="context-menu-zone" oncontextmenu={handleContextMenu}>
	{@render children()}
</div>

{#if open}
	<div
		bind:this={menuElement}
		class="context-menu"
		style="position: fixed; left: {menuX}px; top: {menuY}px; z-index: 10000;"
		role="menu"
		use:portal
		use:positionMenu
		in:fly={{ duration: 80, y: -4 }}
		out:fade={{ duration: 100 }}
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
						onclick={() => handleItemClick(entry)}
					>
						{#if entry.icon}
							<Icon {...resolveIcon(entry.icon)} size={resolveIcon(entry.icon).size ?? 16} />
						{/if}
					</button>
				{/each}
			</div>
			<div class="divider"></div>
		{/if}
		{#each items as entry, i}
			{#if entry === 'divider'}
				<div class="divider"></div>
			{:else if entry.kind === 'item'}
				<button
					type="button"
					class="menu-item"
					class:danger={entry.danger}
					class:active={i === activeIndex}
					class:disabled={entry.disabled}
					class:selected={entry.selected}
					role="menuitemradio"
					aria-checked={entry.selected ?? false}
					disabled={entry.disabled}
					onclick={() => handleItemClick(entry)}
					onmouseenter={() => (activeIndex = -1)}
				>
					{#if entry.icon}
						<span class="item-icon">
							<Icon {...resolveIcon(entry.icon)} size={resolveIcon(entry.icon).size ?? 16} />
						</span>
					{/if}
					<span class="item-label">{entry.label}</span>
					{#if entry.shortcut}
						<span class="item-shortcut">{entry.shortcut}</span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.context-menu-zone {
		display: contents;
	}

	:global(.context-menu) {
		background-color: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		padding: 4px;
		min-width: 180px;
	}

	.divider {
		height: 1px;
		background: $border-color;
		margin: 4px 0;
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
		color: $fg;
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
			color: #ef4444;
			&:hover {
				background: rgba(#ef4444, 0.1);
			}
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: none;
		color: $fg;
		font-size: $text-sm;
		font-family: $font-family;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;

		&:hover,
		&.active {
			background: rgba($fg, 0.06);
		}

		&.selected {
			background: $secondary;
			color: $primary;
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;

			&:hover,
			&.active {
				background: none;
			}
		}

		&.danger {
			color: #ef4444;

			&:hover,
			&.active {
				background: rgba(#ef4444, 0.1);
			}
		}
	}

	.item-icon {
		display: flex;
		align-items: center;
		opacity: 0.7;

		.danger & {
			opacity: 1;
		}
	}

	.item-label {
		flex: 1;
	}

	.item-shortcut {
		font-size: $text-xs;
		color: $text-muted;
		margin-left: auto;
	}
</style>
