<script lang="ts">
	import type { TableProps, TableColumn, SortDirection } from './types.js';
	import VirtualList from './VirtualList.svelte';
	import Icon from '../icon/Icon.svelte';
	import Input from '../input/Input.svelte';

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
		layout = 'table',
		variant = 'default',
		virtual = false,
		virtualHeight = '500px',
		getRowKey = (row, index) => index,
		onRowClick
	}: TableProps = $props();

	// Simple variant disables interactive features
	const isSimple = variant === 'simple';
	const effectiveSelectable = isSimple ? false : selectable;
	const effectiveHoverable = isSimple ? false : hoverable;
	const effectiveRowActions = isSimple ? [] : rowActions;

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

		return [...data].sort((a, b) => {
			const aVal = a[sortBy.column];
			const bVal = b[sortBy.column];

			if (aVal === bVal) return 0;

			const comparison = aVal > bVal ? 1 : -1;
			return sortBy.direction === 'asc' ? comparison : -comparison;
		});
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
	function isRowSelected(row: any): boolean {
		return selectedRows.some((r) => getRowKey(r, -1) === getRowKey(row, -1));
	}

	function toggleRowSelection(row: any) {
		const isSelected = isRowSelected(row);

		if (selectable === 'single') {
			selectedRows = isSelected ? [] : [row];
		} else {
			selectedRows = isSelected
				? selectedRows.filter((r) => getRowKey(r, -1) !== getRowKey(row, -1))
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

<div class="table-container" class:card-layout={layout === 'cards'}>
	{#if layout === 'cards'}
		<!-- Card Layout for Mobile/Horizontal Mode -->
		<div class="table-cards">
			{#if loading}
				<div class="table-loading">
					<div class="spinner"></div>
					<span>Loading...</span>
				</div>
			{:else if sortedData.length === 0}
				<div class="table-empty">
					{#if emptyState}
						{@render emptyState()}
					{:else}
						<p>No data available</p>
					{/if}
				</div>
			{:else}
				{#each sortedData as row, index (getRowKey(row, index))}
					<div
						class="table-card"
						class:selected={isRowSelected(row)}
						onclick={() => onRowClick?.(row, index)}
					>
						{#if selectable}
							<div class="table-card-select">
								<Input
									type="checkbox"
									checked={isRowSelected(row)}
									onChange={() => toggleRowSelection(row)}
								/>
							</div>
						{/if}

						<div class="table-card-content">
							{#each columns as column}
								<div class="table-card-field">
									<div class="table-card-label">{column.label}</div>
									<div class="table-card-value">
										{#if column.render}
											{@render column.render(getCellValue(row, column), row, index)}
										{:else if column.format}
											{column.format(getCellValue(row, column))}
										{:else}
											{getCellValue(row, column)}
										{/if}
									</div>
								</div>
							{/each}
						</div>

						{#if rowActions.length > 0}
							<div class="table-card-actions">
								{#each rowActions as action}
									<button
										class="action-button"
										class:danger={action.variant === 'danger'}
										onclick={(e) => {
											e.stopPropagation();
											action.onClick(row, index);
										}}
										title={action.label}
									>
										<Icon name={action.icon} size={16} fill={action.iconFilled} />
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{:else}
		<!-- Table Layout -->
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
		{:else if sortedData.length === 0}
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
		{:else if virtual && sortedData.length > 100}
			<!-- Virtual scrolling for large datasets -->
			<tbody>
				<tr>
					<td colspan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)} style="padding: 0;">
						<VirtualList
							items={sortedData}
							itemHeight={compact ? 40 : 52}
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
			<tbody>
				{#each sortedData as row, index (getRowKey(row, index))}
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
											<Icon name={action.icon} size={16} fill={action.iconFilled} />
										</button>
									{/each}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		{/if}
	</table>
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

		&::-webkit-scrollbar {
			height: 8px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba($fg, 0.2);
			border-radius: 4px;

			&:hover {
				background: rgba($fg, 0.3);
			}
		}
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

	.table-select-cell {
		width: 48px;
		text-align: center;
		padding: 0.25rem 0.75rem;

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

	// Card Layout Styles
	.table-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.table-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		transition: all 0.15s;

		&:hover {
			background: rgba($fg, 0.05);
		}

		&.selected {
			background: rgba($primary, 0.1);
			border-color: $primary;
		}
	}

	.table-card-select {
		display: flex;
		align-items: center;

		:global(.input) {
			gap: 0;
		}
	}

	.table-card-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.table-card-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.table-card-label {
		font-size: $text-xs;
		font-weight: 600;
		color: $text-secondary;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-card-value {
		font-size: $text-sm;
		color: $fg;
	}

	.table-card-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba($border-color, 0.5);
	}

	.card-layout {
		.table-loading,
		.table-empty {
			min-height: 200px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>
