<script lang="ts">
	import type { ListItem } from './types.js';
	import Icon from '../icon/Icon.svelte';

	let {
		item,
		variant = 'default',
		hoverable = true,
		selected = false,
		onSelect
	}: {
		item: ListItem;
		variant?: 'default' | 'compact' | 'detailed';
		hoverable?: boolean;
		selected?: boolean;
		onSelect?: () => void;
	} = $props();

	function handleClick(e: MouseEvent) {
		if (item.disabled) return;

		if (onSelect) {
			e.preventDefault();
			onSelect();
		} else if (item.onClick) {
			e.preventDefault();
			item.onClick();
		}
	}
</script>

{#if item.href && !item.disabled}
	<a
		href={item.href}
		class="list-item"
		class:hoverable
		class:selected
		class:disabled={item.disabled}
		class:compact={variant === 'compact'}
		class:detailed={variant === 'detailed'}
		onclick={handleClick}
	>
		<div class="list-item-content">
			{#if item.icon}
				<div class="list-item-icon">
					<Icon name={item.icon} size={variant === 'compact' ? 16 : 20} />
				</div>
			{:else if item.avatar}
				<div class="list-item-avatar">
					<img src={item.avatar} alt={item.label} />
				</div>
			{/if}

			<div class="list-item-text">
				<div class="list-item-label">{item.label}</div>
				{#if item.description && variant === 'detailed'}
					<div class="list-item-description">{item.description}</div>
				{/if}
			</div>

			{#if item.badge !== undefined}
				<div class="list-item-badge">{item.badge}</div>
			{/if}
		</div>
	</a>
{:else}
	<div
		class="list-item"
		class:hoverable={hoverable && !item.disabled}
		class:selected
		class:disabled={item.disabled}
		class:clickable={!!item.onClick || !!onSelect}
		class:compact={variant === 'compact'}
		class:detailed={variant === 'detailed'}
		onclick={handleClick}
		role={item.onClick || onSelect ? 'button' : undefined}
		tabindex={item.onClick || onSelect ? 0 : undefined}
		onkeydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && (item.onClick || onSelect)) {
				e.preventDefault();
				handleClick(e as any);
			}
		}}
	>
		<div class="list-item-content">
			{#if item.icon}
				<div class="list-item-icon">
					<Icon name={item.icon} size={variant === 'compact' ? 16 : 20} />
				</div>
			{:else if item.avatar}
				<div class="list-item-avatar">
					<img src={item.avatar} alt={item.label} />
				</div>
			{/if}

			<div class="list-item-text">
				<div class="list-item-label">{item.label}</div>
				{#if item.description && variant === 'detailed'}
					<div class="list-item-description">{item.description}</div>
				{/if}
			</div>

			{#if item.badge !== undefined}
				<div class="list-item-badge">{item.badge}</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.list-item {
		display: block;
		padding: 0.75rem 1rem;
		color: $fg;
		text-decoration: none;
		transition: background-color 0.15s;
		border-radius: $radius;

		&.compact {
			padding: 0.5rem 0.75rem;
		}

		&.detailed {
			padding: 1rem;
		}

		&.hoverable:hover:not(.disabled) {
			background: rgba($fg, 0.05);
		}

		&.selected {
			background: rgba($primary, 0.1);
			color: $primary;
		}

		&.clickable {
			cursor: pointer;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.list-item-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		.compact & {
			gap: 0.5rem;
		}
	}

	.list-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: $text-secondary;

		.selected & {
			color: $primary;
		}
	}

	.list-item-avatar {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		overflow: hidden;

		.detailed & {
			width: 40px;
			height: 40px;
		}

		.compact & {
			width: 24px;
			height: 24px;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.list-item-text {
		flex: 1;
		min-width: 0;
	}

	.list-item-label {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		.compact & {
			font-size: $text-sm;
		}
	}

	.list-item-description {
		font-size: $text-sm;
		color: $text-muted;
		margin-top: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.list-item-badge {
		flex-shrink: 0;
		padding: 0.25rem 0.5rem;
		background: rgba($primary, 0.2);
		color: $primary;
		border-radius: $radius;
		font-size: $text-xs;
		font-weight: 600;

		.compact & {
			padding: 0.125rem 0.375rem;
		}
	}
</style>
