<script lang="ts">
	import Icon from '../icon/Icon.svelte';

	interface Props {
		total: number;
		pageSize?: number;
		page?: number;
		pageSizeOptions?: number[];
	}

	let {
		total,
		pageSize = $bindable(10),
		page = $bindable(1),
		pageSizeOptions
	}: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));

	// Clamp page when total/pageSize changes
	$effect(() => {
		if (page > totalPages) {
			page = totalPages;
		}
	});

	const start = $derived((page - 1) * pageSize + 1);
	const end = $derived(Math.min(page * pageSize, total));
</script>

<div class="pagination">
	<span class="pagination-info">{start}–{end} of {total}</span>

	<div class="pagination-controls">
		<button class="pagination-btn" disabled={page <= 1} onclick={() => (page = 1)}>
			<Icon name="ChevronsLeft" size={14} />
		</button>
		<button class="pagination-btn" disabled={page <= 1} onclick={() => page--}>
			<Icon name="ChevronLeft" size={14} />
		</button>
		<span class="pagination-page">{page} / {totalPages}</span>
		<button class="pagination-btn" disabled={page >= totalPages} onclick={() => page++}>
			<Icon name="ChevronRight" size={14} />
		</button>
		<button class="pagination-btn" disabled={page >= totalPages} onclick={() => (page = totalPages)}>
			<Icon name="ChevronsRight" size={14} />
		</button>
	</div>

	{#if pageSizeOptions && pageSizeOptions.length > 1}
		<select
			class="pagination-size"
			value={pageSize}
			onchange={(e) => {
				pageSize = Number(e.currentTarget.value);
				page = 1;
			}}
		>
			{#each pageSizeOptions as size}
				<option value={size}>{size} / page</option>
			{/each}
		</select>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 1rem;
		font-size: $text-xs;
		color: $text-muted;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.pagination-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: none;
		color: $text-secondary;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;

		&:hover:not(:disabled) {
			background: rgba($fg, 0.08);
			color: $fg;
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}

	.pagination-page {
		min-width: 4em;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.pagination-size {
		padding: 0.25rem 0.5rem;
		border: $border;
		border-radius: 6px;
		background: transparent;
		color: $text-secondary;
		font-size: $text-xs;
		font-family: $font-family;
		cursor: pointer;

		&:focus {
			outline: 1px solid $primary;
		}
	}
</style>
