<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import Spinner from '../spinner/Spinner.svelte';
	import Pill from '../pill/Pill.svelte';
	import type { Command } from './types.js';

	export type CommandRowItem = Command & {
		_path?: Command[];
		_keyId?: string;
	};

	type Props = {
		cmd: CommandRowItem;
		idx: number;
		active: boolean;
		/** Show a spinner in the icon slot. Used by the modal during a Promise-returning perform. */
		loading?: boolean;
		/** Disable interaction without dimming text — paired with `loading` on a sibling row. */
		busy?: boolean;
		/** Tighter padding/font for inline popover usage. */
		compact?: boolean;
		/** Paint the row's active background itself. Modal passes false (its sliding indicator
		 *  handles highlight); popover leaves it true so each row owns its own active bg. */
		paintActive?: boolean;
		onSelect?: () => void;
		onHover?: () => void;
	};

	let {
		cmd,
		idx,
		active,
		loading = false,
		busy = false,
		compact = false,
		paintActive = true,
		onSelect,
		onHover
	}: Props = $props();
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<button
	type="button"
	class="cp-row"
	class:active
	class:loading
	class:compact
	class:paint-active={paintActive}
	data-cp-index={idx}
	disabled={busy}
	onclick={onSelect}
	onmousemove={onHover}
>
	{#if loading}
		<span class="cp-row-icon"><Spinner size={compact ? 12 : 14} /></span>
	{:else if cmd.image}
		<img class="cp-row-image" src={cmd.image} alt="" />
	{:else if cmd.icon}
		{@const ic = resolveIcon(cmd.icon)}
		<span class="cp-row-icon"><Icon {...ic} size={ic.size ?? (compact ? 14 : 16)} /></span>
	{:else}
		<span class="cp-row-icon cp-row-icon-empty"></span>
	{/if}
	<span class="cp-row-text">
		<span class="cp-row-label">{cmd.label}</span>
		{#if cmd.description}
			<span class="cp-row-desc">{cmd.description}</span>
		{/if}
	</span>
	{#if cmd._path && cmd._path.length > 0}
		<span class="cp-row-path">
			{#each cmd._path as crumb, i (crumb.id)}
				{#if i > 0}
					<span class="cp-row-crumb-sep"><Icon name="ChevronRight" size={11} /></span>
				{/if}
				<span class="cp-row-crumb">
					{#if crumb.icon}
						{@const pic = resolveIcon(crumb.icon)}
						<Icon {...pic} size={11} />
					{/if}
					{crumb.label}
				</span>
			{/each}
		</span>
	{/if}
	{#if cmd.badge != null && !loading}
		<span class="cp-row-badge">
			{#if typeof cmd.badge === 'object'}
				<Pill icon={cmd.badge.icon} label={cmd.badge.label} />
			{:else}
				<Pill label={String(cmd.badge)} />
			{/if}
		</span>
	{/if}
	{#if cmd.shortcut && !loading}
		<span class="cp-row-shortcut"><Kbd size="sm">{cmd.shortcut}</Kbd></span>
	{/if}
	{#if cmd.children}
		<span class="cp-row-chevron"><Icon name="ChevronRight" size={compact ? 12 : 14} /></span>
	{/if}
</button>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.cp-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		border-radius: 6px;
		cursor: pointer;
		transition: color var(--glow-dur-instant) $ease-out,
			background var(--glow-dur-instant) $ease-out;

		&.compact {
			gap: 0.5rem;
			padding: 0.35rem 0.55rem;
			border-radius: 5px;
			.cp-row-label {
				font-size: 0.85rem;
			}
			.cp-row-desc {
				font-size: 0.72rem;
			}
		}

		&.active {
			color: var(--glow-primary);

			.cp-row-icon {
				opacity: 1;
			}
		}

		&.paint-active.active {
			background: var(--glow-primary-soft);
		}

		&:disabled {
			cursor: progress;
		}
	}

	.cp-row-icon {
		display: inline-flex;
		flex: 0 0 auto;
		width: 18px;
		justify-content: center;
		opacity: 0.85;
	}

	.cp-row.compact .cp-row-icon {
		width: 16px;
	}

	.cp-row-icon-empty {
		visibility: hidden;
	}

	.cp-row-image {
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}

	.cp-row.compact .cp-row-image {
		width: 16px;
		height: 16px;
	}

	.cp-row-text {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.cp-row-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.cp-row-path {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.cp-row-crumb {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
		background: rgba($fg, 0.08);
		color: rgba($fg, 0.65);
		font-weight: $weight-medium;
	}

	.cp-row-crumb-sep {
		display: inline-flex;
		opacity: 0.4;
	}

	.cp-row.active .cp-row-crumb {
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
	}

	.cp-row-desc {
		font-size: 0.75rem;
		line-height: 1.2;
		color: rgba($fg, 0.55);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cp-row-shortcut {
		flex: 0 0 auto;
	}

	.cp-row-badge {
		flex: 0 0 auto;
		display: inline-flex;
	}

	.cp-row-chevron {
		flex: 0 0 auto;
		display: inline-flex;
		opacity: 0.45;
	}
</style>
