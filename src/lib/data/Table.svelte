<script lang="ts">
	import type { TableProps, TableColumn, SortDirection } from './types.js';
	import VirtualList from './VirtualList.svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Input from '../input/Input.svelte';
	import Pagination from '../pagination/Pagination.svelte';
	import { fade } from 'svelte/transition';

	let {
		columns,
		data = [],
		selectable = false,
		selectedRows = $bindable([]),
		onSelectionChange,
		sortBy = $bindable(undefined),
		onSort,
		rowActions = [],
		loading = false,
		emptyState,
		sticky = false,
		hoverable = true,
		variant = 'default',
		virtual = false,
		virtualHeight = '500px',
		getRowKey = (row, index) => index,
		onRowClick,
		pageSize = $bindable(undefined),
		page = $bindable(1),
		pageSizeOptions,
		total
	}: TableProps = $props();

	// Simple variant disables interactive features
	const isSimple = $derived(variant === 'simple');
	const effectiveSelectable = $derived(isSimple ? false : selectable);
	const effectiveHoverable = $derived(isSimple ? false : hoverable);
	const effectiveRowActions = $derived(isSimple ? [] : rowActions);

	let selectAllChecked = $state(false);
	let selectAllIndeterminate = $state(false);

	// Update select-all checkbox state
	$effect(() => {
		if (!selectable || data.length === 0) {
			selectAllChecked = false;
			selectAllIndeterminate = false;
			return;
		}

		const selected = selectedRows.length;
		selectAllChecked = selected === data.length && selected > 0;
		selectAllIndeterminate = selected > 0 && selected < data.length;
	});

	// Sorted data
	const sortedData = $derived.by(() => {
		if (!sortBy) return data;

		const currentSort = sortBy;
		return [...data].sort((a, b) => {
			const aVal = a[currentSort.column];
			const bVal = b[currentSort.column];

			if (aVal === bVal) return 0;

			const comparison = aVal > bVal ? 1 : -1;
			return currentSort.direction === 'asc' ? comparison : -comparison;
		});
	});

	// Paginated data — skip slicing when total is provided (server-side pagination)
	const isServerPaginated = $derived(total != null);
	const displayData = $derived.by(() => {
		if (!pageSize || isServerPaginated) return sortedData;
		const start = (page - 1) * pageSize;
		return sortedData.slice(start, start + pageSize);
	});

	// Handle column sort
	function handleSort(column: TableColumn) {
		if (!column.sortable || isSimple) return;

		let newDirection: 'asc' | 'desc' = 'asc';

		if (sortBy?.column === column.key) {
			newDirection = sortBy.direction === 'asc' ? 'desc' : 'asc';
		}

		if (sortBy) {
			sortBy = { column: column.key, direction: newDirection };
		}
		onSort?.(column.key, newDirection);
	}

	// Handle row selection
	function getRowKeyForData(row: any): any {
		const index = sortedData.indexOf(row);
		return getRowKey(row, index >= 0 ? index : data.indexOf(row));
	}

	function isRowSelected(row: any): boolean {
		const key = getRowKeyForData(row);
		return selectedRows.some((r) => getRowKeyForData(r) === key);
	}

	function toggleRowSelection(row: any) {
		const isSelected = isRowSelected(row);
		const key = getRowKeyForData(row);

		if (selectable === 'single') {
			selectedRows = isSelected ? [] : [row];
		} else {
			selectedRows = isSelected
				? selectedRows.filter((r) => getRowKeyForData(r) !== key)
				: [...selectedRows, row];
		}

		onSelectionChange?.(selectedRows);
	}

	function toggleSelectAll() {
		if (selectAllChecked || selectAllIndeterminate) {
			selectedRows = [];
		} else {
			selectedRows = [...data];
		}
		onSelectionChange?.(selectedRows);
	}

	// Get cell value
	function getCellValue(row: any, column: TableColumn) {
		return row[column.key];
	}
</script>

<div class="table-container">
		<table class="table" class:hoverable={effectiveHoverable} class:simple={isSimple}>
		<thead class:sticky>
			<tr>
				{#if effectiveSelectable}
					<th class="table-select-cell">
						{#if effectiveSelectable === 'multiple'}
							<Input
								type="checkbox"
								checked={selectAllChecked}
								indeterminate={selectAllIndeterminate}
								onChange={toggleSelectAll}
							/>
						{/if}
					</th>
				{/if}

				{#each columns as column}
					<th
						class="table-header-cell"
						class:sortable={column.sortable && !isSimple}
						class:sorted={sortBy?.column === column.key}
						style:width={column.width}
						style:text-align={column.align || 'left'}
						onclick={() => handleSort(column)}
					>
						<div class="table-header-content">
							<span>{column.label}</span>
							{#if column.sortable && !isSimple}
								<div class="sort-icon">
									{#if sortBy?.column === column.key}
										<Icon name={sortBy.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
									{:else}
										<Icon name="ChevronsUpDown" size={14} />
									{/if}
								</div>
							{/if}
						</div>
					</th>
				{/each}

				{#if effectiveRowActions.length > 0}
					<th class="table-actions-header"></th>
				{/if}
			</tr>
		</thead>

		{#if loading}
			<tbody>
				<tr>
					<td colspan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)} class="table-loading">
						<div class="spinner"></div>
						<span>Loading...</span>
					</td>
				</tr>
			</tbody>
		{:else if displayData.length === 0}
			<tbody>
				<tr>
					<td colspan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)} class="table-empty">
						{#if emptyState}
							{@render emptyState()}
						{:else}
							<p>No data available</p>
						{/if}
					</td>
				</tr>
			</tbody>
		{:else if virtual && displayData.length > 100}
			<!-- Virtual scrolling for large datasets -->
			<tbody>
				<tr>
					<td colspan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)} style="padding: 0;">
						<VirtualList
							items={displayData}
							itemHeight={variant === 'simple' ? 40 : 52}
							height={virtualHeight}
							renderItem={(row, index) => {
								return `
									<div class="virtual-table-row">
										${selectable ? `<div class="table-cell table-select-cell">
											<input type="checkbox" ${isRowSelected(row) ? 'checked' : ''} />
										</div>` : ''}
										${columns.map((col) => `
											<div class="table-cell" style="width: ${col.width}; text-align: ${col.align || 'left'}">
												${col.render ? col.render(getCellValue(row, col), row, index) : col.format ? col.format(getCellValue(row, col)) : getCellValue(row, col)}
											</div>
										`).join('')}
									</div>
								`;
							}}
						/>
					</td>
				</tr>
			</tbody>
		{:else}
			{#key pageSize ? page : null}
			<tbody in:fade={{ duration: 150 }}>
				{#each displayData as row, index (getRowKey(row, index))}
					<tr
						class="table-row"
						class:selected={isRowSelected(row)}
						onclick={() => !isSimple && onRowClick?.(row, index)}
					>
						{#if effectiveSelectable}
							<td class="table-cell table-select-cell">
								<Input
									type="checkbox"
									checked={isRowSelected(row)}
									onChange={() => toggleRowSelection(row)}
								/>
							</td>
						{/if}

						{#each columns as column}
							<td class="table-cell" style:text-align={column.align || 'left'}>
								{#if column.render}
									{@render column.render(getCellValue(row, column), row, index)}
								{:else if column.format}
									{column.format(getCellValue(row, column))}
								{:else}
									{getCellValue(row, column)}
								{/if}
							</td>
						{/each}

						{#if effectiveRowActions.length > 0}
							<td class="table-cell table-actions-cell">
								<div class="table-actions">
									{#each effectiveRowActions as action}
										<button
											class="action-button"
											class:danger={action.variant === 'danger'}
											onclick={(e) => {
												e.stopPropagation();
												action.onClick(row, index);
											}}
											title={action.label}
										>
											<Icon {...resolveIcon(action.icon)} size={resolveIcon(action.icon).size ?? 16} />
										</button>
									{/each}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
			{/key}
		{/if}
	</table>
	{#if pageSize}
		<div class="table-footer">
			<Pagination total={total ?? sortedData.length} bind:pageSize bind:page {pageSizeOptions} />
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.table-container {
		width: 100%;
		overflow-x: auto;
		border-radius: $radius;
		border: $border;
	}

	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: $text-sm;
		color: $fg;

		th,
		td {
			padding: 0.5rem 0.75rem;
		}

		&.hoverable tbody tr:hover {
			background: rgba($fg, 0.05);
		}

		&.simple {
			thead {
				background: rgba($fg, 0.02);
			}

			th {
				font-size: $text-xs;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: $text-muted;
				font-weight: 600;
			}

			tbody tr {
				border-bottom: 1px solid rgba($border-color, 0.3);

				&:last-child {
					border-bottom: none;
				}
			}
		}
	}

	thead {
		background: $bg-surface-element;
		border-bottom: $border;

		&.sticky {
			position: sticky;
			top: 0;
			z-index: 10;
		}
	}

	.table-header-cell {
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: $text-secondary;
		white-space: nowrap;
		user-select: none;

		&.sortable {
			cursor: pointer;

			&:hover {
				background: rgba($fg, 0.05);
			}
		}

		&.sorted {
			color: $primary;
		}
	}

	.table-header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-icon {
		display: flex;
		align-items: center;
		opacity: 0.5;

		.sorted & {
			opacity: 1;
		}
	}

	.table-row {
		border-bottom: 1px solid rgba($border-color, 0.5);
		transition: background-color 0.15s;

		&.selected {
			background: rgba($primary, 0.1);
		}

		&:last-child {
			border-bottom: none;
		}
	}

	.table-cell {
		padding: 0.75rem 1rem;
		vertical-align: middle;
	}

	.table-select-cell.table-select-cell {
		width: 0;
		text-align: center;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		cursor: pointer;

		:global(.input) {
			gap: 0;
		}
	}

	.table-actions-header {
		width: auto;
	}

	.table-actions-cell {
		width: auto;
		padding-right: 0.5rem;
	}

	.table-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.15s;

		tr:hover & {
			opacity: 1;
		}
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		border-radius: $radius;
		cursor: pointer;
		color: $text-secondary;
		transition: all 0.15s;

		&:hover {
			background: rgba($fg, 0.1);
			color: $fg;
		}

		&.danger:hover {
			background: rgba(#ef4444, 0.1);
			color: #ef4444;
		}
	}

	.table-footer {
		border-top: $border;
	}

	.table-loading,
	.table-empty {
		padding: 3rem;
		text-align: center;
		color: $text-muted;
	}

	.table-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba($primary, 0.3);
		border-top-color: $primary;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

</style>
