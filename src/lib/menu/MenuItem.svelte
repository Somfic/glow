<script lang="ts" module>
	import type { IconProp } from '../icon/Icon.svelte';

	/**
	 * Shared props for the row primitive used by <PopoverMenu> for both its
	 * value-picker option items and its `kind: 'item'` action entries.
	 */
	export interface MenuItemProps {
		label: string;
		description?: string;
		icon?: IconProp;
		/** Image URL — takes precedence over icon when both are provided. */
		image?: string;
		shortcut?: string;
		selected?: boolean;
		disabled?: boolean;
		danger?: boolean;
		/** Keyboard-highlight (arrow-key navigation). */
		active?: boolean;
		/** Optional trailing snippet — used by submenu rows for the chevron. */
		trailing?: import('svelte').Snippet;
		onclick?: (e: MouseEvent) => void;
		onmousedown?: (e: MouseEvent) => void;
		onmouseenter?: (e: MouseEvent) => void;
		role?: string;
		ariaChecked?: boolean | 'true' | 'false';
	}
</script>

<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';

	let {
		label,
		description,
		icon,
		image,
		shortcut,
		selected = false,
		disabled = false,
		danger = false,
		active = false,
		trailing,
		onclick,
		onmousedown,
		onmouseenter,
		role = 'menuitem',
		ariaChecked
	}: MenuItemProps = $props();
</script>

<button
	type="button"
	class="menu-item"
	class:selected
	class:disabled
	class:danger
	class:active
	class:has-description={!!description}
	{disabled}
	{role}
	aria-checked={ariaChecked}
	{onclick}
	{onmousedown}
	{onmouseenter}
>
	{#if image}
		<img src={image} alt="" class="leading image" />
	{:else if icon}
		<span class="leading icon">
			<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 16} />
		</span>
	{/if}
	<span class="text">
		<span class="label">{label}</span>
		{#if description}
			<span class="description">{description}</span>
		{/if}
	</span>
	{#if shortcut}
		<span class="shortcut">{shortcut}</span>
	{/if}
	{#if trailing}
		<span class="trailing">{@render trailing()}</span>
	{:else if selected}
		<span class="trailing check" aria-hidden="true">
			<Icon name="Check" size={14} />
		</span>
	{/if}
</button>

<style lang="scss">
	@use '../style/theme.scss' as *;

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

		&.has-description {
			padding-top: 10px;
			padding-bottom: 10px;
		}

		&:hover:not(.disabled),
		&.active:not(.disabled) {
			background: rgba($fg, 0.06);
		}

		&.selected {
			color: $primary;
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&.danger {
			color: #ef4444;

			&:hover:not(.disabled),
			&.active:not(.disabled) {
				background: rgba(#ef4444, 0.1);
			}
		}
	}

	.leading {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	.leading.icon {
		opacity: 0.7;

		.danger & {
			opacity: 1;
		}
	}

	.leading.image {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}

	.text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.label {
		line-height: 1.25;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.description {
		font-size: $text-xs;
		color: $text-muted;
		line-height: 1.35;
		font-weight: 400;
	}

	.shortcut {
		font-size: $text-xs;
		color: $text-muted;
		margin-left: auto;
	}

	.trailing {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	.trailing.check {
		color: $primary;
	}
</style>
