import type { Snippet } from 'svelte';
import type { IconName } from '../icon/Icon.svelte';

// Virtual List Types
export interface VirtualListProps<T = any> {
	// Data
	items: T[];
	itemHeight: number | ((item: T, index: number) => number);
	renderItem: (item: T, index: number) => any;

	// Infinite scroll
	hasMore?: boolean;
	loading?: boolean;
	onLoadMore?: () => Promise<void> | void;
	threshold?: number; // default: 200px

	// Optional configuration
	overscan?: number; // default: 3 items
	gap?: number; // default: 0
	height?: string | number; // Container height, default: '100%'

	// Custom states
	emptyState?: Snippet;
	loadingState?: Snippet;
	endState?: Snippet;

	// Callbacks
	onScroll?: (scrollTop: number, scrollHeight: number) => void;
	onVisibleRangeChange?: (start: number, end: number) => void;
}

// Table Types
export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T = any> {
	key: string;
	label: string;
	sortable?: boolean;
	width?: string | number;
	align?: 'left' | 'center' | 'right';
	render?: (value: any, row: T, index: number) => any;
	format?: (value: any) => string;
}

export interface TableSort {
	column: string;
	direction: 'asc' | 'desc';
}

export interface TableRowAction {
	icon: IconName;
	label: string;
	onClick: (row: any, index: number) => void;
	variant?: 'default' | 'danger';
}

export interface TableProps<T = any> {
	columns: TableColumn<T>[];
	data: T[];

	// Selection
	selectable?: boolean | 'single' | 'multiple';
	selectedRows?: T[];
	onSelectionChange?: (selected: T[]) => void;

	// Sorting
	sortBy?: TableSort;
	onSort?: (column: string, direction: 'asc' | 'desc') => void;

	// Actions
	rowActions?: TableRowAction[];

	// States
	loading?: boolean;
	emptyState?: Snippet;

	// Styling
	sticky?: boolean; // Sticky header
	hoverable?: boolean;
	layout?: 'table' | 'cards'; // Card layout for mobile/horizontal mode
	variant?: 'default' | 'simple'; // Simple variant for documentation/reference tables

	// Performance
	virtual?: boolean; // Use virtual scrolling for large datasets
	virtualHeight?: string | number; // Height for virtual scrolling container

	// Row key
	getRowKey?: (row: T, index: number) => string | number;

	// Callbacks
	onRowClick?: (row: T, index: number) => void;
}

// List Types
export interface ListItem {
	id: string;
	label: string;
	description?: string;
	icon?: IconName;
	avatar?: string;
	badge?: string | number;
	disabled?: boolean;
	href?: string;
	onClick?: () => void;
}

export interface ListProps {
	items: ListItem[];
	variant?: 'default' | 'compact' | 'detailed';
	divided?: boolean; // Dividers between items
	hoverable?: boolean; // Hover background
	selectable?: boolean;
	selectedId?: string;
	onSelect?: (id: string) => void;
}
