<script lang="ts">
	import { type Snippet } from 'svelte';
	import Popover from '../popover/Popover.svelte';
	import Icon, { type IconName } from '../icon/Icon.svelte';

	export type DropdownMenuItem = {
		label: string;
		icon?: IconName;
		iconFilled?: boolean;
		shortcut?: string;
		disabled?: boolean;
		danger?: boolean;
		onclick: () => void;
	};
	export type DropdownMenuEntry = DropdownMenuItem | 'divider';

	interface Props {
		items: DropdownMenuEntry[];
		trigger: Snippet;
		align?: 'left' | 'right' | 'stretch';
		offset?: number;
		disabled?: boolean;
		open?: boolean;
	}

	let {
		items,
		trigger,
		align = 'left',
		offset = 4,
		disabled = false,
		open = $bindable(false)
	}: Props = $props();

	let activeIndex = $state(-1);

	const actionItems = $derived(
		items
			.map((item, i) => (item !== 'divider' ? { item, index: i } : null))
			.filter((x): x is { item: DropdownMenuItem; index: number } => x !== null && !x.item.disabled)
	);

	function handleItemClick(item: DropdownMenuItem) {
		if (item.disabled) return;
		open = false;
		activeIndex = -1;
		item.onclick();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const currentPos = actionItems.findIndex((a) => a.index === activeIndex);
			const next = currentPos < actionItems.length - 1 ? currentPos + 1 : 0;
			activeIndex = actionItems[next].index;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const currentPos = actionItems.findIndex((a) => a.index === activeIndex);
			const prev = currentPos > 0 ? currentPos - 1 : actionItems.length - 1;
			activeIndex = actionItems[prev].index;
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			const entry = items[activeIndex];
			if (entry !== 'divider' && !entry.disabled) {
				handleItemClick(entry);
			}
		}
	}

	$effect(() => {
		if (open) {
			activeIndex = -1;
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<Popover {trigger} {align} {offset} {disabled} bind:open>
	{#snippet children()}
		<div class="dropdown-menu" role="menu">
			{#each items as entry, i}
				{#if entry === 'divider'}
					<div class="divider"></div>
				{:else}
					<button
						type="button"
						class="menu-item"
						class:danger={entry.danger}
						class:active={i === activeIndex}
						class:disabled={entry.disabled}
						role="menuitem"
						disabled={entry.disabled}
						onclick={() => handleItemClick(entry)}
						onmouseenter={() => (activeIndex = i)}
					>
						{#if entry.icon}
							<span class="item-icon">
								<Icon name={entry.icon} size={16} fill={entry.iconFilled} />
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
	{/snippet}
</Popover>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.dropdown-menu {
		padding: 4px;
		min-width: 180px;
	}

	.divider {
		height: 1px;
		background: $border-color;
		margin: 4px 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
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
