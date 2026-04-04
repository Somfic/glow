<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import Pill from '../pill/Pill.svelte';
	import Popover from '../popover/Popover.svelte';
	import type { SelectOption } from './types.js';
	import { fuzzyFilter, debounce } from './search-utils.js';

	interface Props {
		id?: string;
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		onChange?: (value: string[]) => void;
		onSearch?: (query: string) => Promise<SelectOption[]> | SelectOption[];
		searchDebounce?: number;
		maxResults?: number;
		minSearchLength?: number;
	}

	let {
		id,
		options,
		value = $bindable<string[]>([]),
		placeholder = 'Select...',
		disabled = false,
		clearable = false,
		onChange,
		onSearch,
		searchDebounce = 300,
		maxResults = 0,
		minSearchLength = 0
	}: Props = $props();
	let isOpen = $state(false);
	let searchQuery = $state('');
	let isLoading = $state(false);
	let searchResults = $state<SelectOption[]>([]);
	let searchInputElement = $state<HTMLInputElement>(undefined!);

	// Determine if we're in server-side search mode
	const isServerSide = $derived(!!onSearch);

	// Show search when there are many options or explicitly enabled
	const shouldShowSearch = $derived(options.length > 5 || isServerSide);

	// Focus search input when dropdown opens
	$effect(() => {
		if (isOpen && shouldShowSearch) {
			setTimeout(() => searchInputElement?.focus(), 50);
		}
		if (!isOpen) {
			searchQuery = '';
		}
	});

	// Server-side search handler with debouncing
	const debouncedSearch = $derived(onSearch
		? debounce(async (query: string) => {
				if (query.length < minSearchLength) {
					searchResults = [];
					isLoading = false;
					return;
				}

				isLoading = true;
				try {
					const results = await Promise.resolve(onSearch(query));
					searchResults = results;
				} catch (error) {
					console.error('Search error:', error);
					searchResults = [];
				} finally {
					isLoading = false;
				}
		  }, searchDebounce)
		: null);

	// Trigger search when query changes (server-side mode)
	$effect(() => {
		if (isServerSide && debouncedSearch) {
			debouncedSearch(searchQuery);
		}
	});

	// Filter options based on search, excluding already selected
	let filteredOptions = $derived.by(() => {
		let source: SelectOption[];

		if (isServerSide) {
			source = searchResults;
		} else {
			source = fuzzyFilter(options, searchQuery, maxResults);
		}

		return source.filter((opt) => !value.includes(opt.value));
	});

	function selectOption(optionValue: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		value = [...value, optionValue];
		onChange?.(value);

		// Keep dropdown open for multiselect
		isOpen = true;
	}

	function getSelectedOptions(): SelectOption[] {
		return value
			.map((v) => options.find((opt) => opt.value === v))
			.filter((opt): opt is SelectOption => opt !== undefined);
	}

	function removeValue(valueToRemove: string) {
		value = value.filter((v) => v !== valueToRemove);
		onChange?.(value);
	}

	function clearAll(e: MouseEvent) {
		e.stopPropagation();
		value = [];
		onChange?.([]);
	}

	function handleSearchInput(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (searchQuery && filteredOptions.length > 0) {
				const first = filteredOptions[0];
				value = [...value, first.value];
				onChange?.(value);
				searchQuery = '';
			} else {
				isOpen = false;
			}
		}
	}
</script>

<Popover bind:open={isOpen} {disabled}>
	{#snippet trigger()}
		<div
			{id}
			class="multiselect-trigger"
			class:open={isOpen}
			role="button"
			tabindex={disabled ? -1 : 0}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					isOpen = !isOpen;
				}
			}}
		>
			{#if value.length > 0}
				<div class="chips">
					{#each getSelectedOptions() as opt}
						<Pill label={opt.label} onRemove={() => removeValue(opt.value)} />
					{/each}
				</div>
			{:else}
				<span class="multiselect-value placeholder">{placeholder}</span>
			{/if}
			<div class="actions">
				{#if clearable && value.length > 0}
					<button type="button" class="clear-btn" onclick={clearAll}>
						<Icon name="X" size={16} />
					</button>
				{/if}
				<span class="chevron">
					<Icon name="ChevronDown" size={16} />
				</span>
			</div>
		</div>
	{/snippet}

	<div class="multiselect-dropdown">
		{#if shouldShowSearch}
			<div class="search-input-wrapper">
				<Icon name="Search" size={14} />
				<input
					type="text"
					class="search-input"
					placeholder="Search..."
					bind:this={searchInputElement}
					value={searchQuery}
					oninput={handleSearchInput}
					onkeydown={handleSearchKeydown}
					onclick={(e) => e.stopPropagation()}
					onmousedown={(e) => e.stopPropagation()}
				/>
			</div>
		{/if}

		{#if isLoading}
			<div class="loading-indicator">
				<span class="loading-spinner"></span>
				<span>Searching...</span>
			</div>
		{:else if filteredOptions.length > 0}
			{#each filteredOptions as option}
				<button
					type="button"
					class="multiselect-option"
					onmousedown={(e) => selectOption(option.value, e)}
				>
					<span>{option.label}</span>
				</button>
			{/each}
		{:else}
			<div class="no-results">No results found</div>
		{/if}
	</div>
</Popover>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.multiselect-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		width: 100%;
		padding: 0.5em 1em;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		color: $fg;
		font: inherit;
		cursor: pointer;
		text-align: left;
		height: 2.5em;
		font-size: 1rem;

		&.open {
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.25em;
		flex-shrink: 0;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.25em;
		cursor: pointer;
		color: rgba($fg, 0.5);
		border-radius: $radius;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.chevron {
		display: flex;
		align-items: center;
		color: rgba($fg, 0.5);
		transition: transform 0.2s ease;
		padding: 0.25em;
		border-radius: $radius;
		cursor: pointer;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.chips {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25em;
		flex: 1;
		overflow: hidden;
		align-items: center;
	}

	.multiselect-trigger.open .chevron {
		transform: rotate(180deg);
	}

	.multiselect-value {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.placeholder {
			color: rgba($fg, 0.5);
		}
	}

	.multiselect-dropdown {
		max-height: 200px;
		overflow-y: auto;
	}

	.multiselect-option {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.5em 1em;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s ease;

		&:hover {
			background-color: $secondary;
		}
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		border-bottom: $border;
		background-color: $bg-surface-element;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		font-size: 0.875rem;
		outline: none;

		&::placeholder {
			color: rgba($fg, 0.5);
		}
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		padding: 1em;
		color: rgba($fg, 0.6);
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba($fg, 0.2);
		border-top-color: $primary;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.no-results {
		padding: 1em;
		text-align: center;
		color: rgba($fg, 0.5);
		font-size: 0.875rem;
	}
</style>
