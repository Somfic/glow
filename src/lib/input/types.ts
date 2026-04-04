import type { IconProp } from '../icon/Icon.svelte';

export type SelectOption = {
	value: string;
	label: string;
};

/** @deprecated Use SelectOption instead */
export type MultiSelectOption = SelectOption;

export type ComboboxOption = {
	value: string;
	label: string;
	icon?: IconProp;
	image?: string;
	description?: string;
	groupType?: string;
};

/**
 * Generic search callback type for server-side search
 */
export type SearchCallback<T> = (query: string) => Promise<T[]> | T[];

/**
 * Common search-related options for select inputs
 */
export interface SearchOptions {
	/** Server-side search callback */
	onSearch?: SearchCallback<any>;
	/** Debounce delay in milliseconds (default: 300) */
	searchDebounce?: number;
	/** Maximum number of results to display (default: 10 for ComboboxInput, unlimited for MultiSelectInput) */
	maxResults?: number;
	/** Minimum characters required before triggering server search (default: 0) */
	minSearchLength?: number;
}
