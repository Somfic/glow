<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';

	export type PopoverMenuItem = {
		kind: 'item';
		label: string;
		description?: string;
		icon?: IconProp;
		image?: string;
		shortcut?: string;
		selected?: boolean;
		disabled?: boolean;
		danger?: boolean;
		onclick: () => void;
	};

	/** Non-interactive section header. Renders as small uppercase eyebrow text. */
	export type PopoverMenuHeader = {
		kind: 'header';
		label: string;
	};

	export type PopoverMenuToggle = {
		kind: 'toggle';
		label: string;
		description?: string;
		checked: boolean;
		disabled?: boolean;
		onChange: (value: boolean) => void;
	};

	export type PopoverMenuSubmenu = {
		kind: 'submenu';
		label: string;
		description?: string;
		icon?: IconProp;
		/**
		 * Action / mixed entries inside the submenu. Use when the submenu
		 * holds things other than value-picker options.
		 */
		items?: PopoverMenuEntry[];
		/**
		 * Value-picker options inside the submenu. When set, picking an option
		 * updates the parent menu's bound `value` and closes the whole menu —
		 * symmetric with the top-level options + bind:value pattern.
		 */
		options?: import('../input/types.js').ComboboxEntry[];
	};

	export type PopoverMenuCustom = {
		kind: 'custom';
		render: Snippet;
	};

	/**
	 * Tagged union of menu entries. The bare string 'divider' is sugar for a
	 * visual separator so the common case stays terse.
	 */
	export type PopoverMenuEntry =
		| PopoverMenuItem
		| PopoverMenuToggle
		| PopoverMenuSubmenu
		| PopoverMenuCustom
		| PopoverMenuHeader
		| 'divider';

	/** Compact icon-only action shown above the main menu (kept from the old API). */
	export type PopoverMenuCommonItem = {
		label: string;
		icon: IconProp;
		disabled?: boolean;
		danger?: boolean;
		onclick: () => void;
	};
</script>

<script lang="ts">
	import Popover from '../popover/Popover.svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import ToggleInput from '../input/ToggleInput.svelte';
	import { tooltip } from '../tooltip/tooltip.svelte.js';
	import Self from './PopoverMenu.svelte';
	import MenuItem from './MenuItem.svelte';
	import type { ComboboxEntry, ComboboxOption, ComboboxGroup } from '../input/types.js';
	import { fuzzyFilter } from '../input/search-utils.js';

	interface Props {
		common?: PopoverMenuCommonItem[];
		/**
		 * Rich entries (item / toggle / submenu / header / custom / 'divider').
		 * Use this for action menus, mixed-content menus, or anything that
		 * doesn't fit the simple `options + value` shape.
		 */
		items?: PopoverMenuEntry[];
		/**
		 * Value-picker mode. When provided, options are converted to selectable
		 * items internally and `value` tracks the selected option. Cleaner than
		 * writing `items` by hand for the common "pick one of these" case.
		 * Can be combined with `items` (extra items are appended) and `extras`
		 * (snippet rendered below the options).
		 */
		options?: ComboboxEntry[];
		/** The currently selected option value. Bindable. */
		value?: string;
		/** Called when the user picks a different option. */
		onChange?: (value: string) => void;
		/**
		 * Show a search input at the top of the menu when true. Filters the
		 * `options` list via fuzzy match. Defaults to `false` for short lists;
		 * the `Input type="select"` wrapper enables it automatically.
		 */
		searchable?: boolean;
		/** Snippet rendered between the option list and any extra items (e.g. inline toggles, "More models" submenu). */
		extras?: Snippet;
		/**
		 * Custom trigger element. When omitted, an input-style trigger (matching
		 * `<Input type="select">`) is rendered automatically using `value` /
		 * `placeholder` / `icon` — use this mode when the menu is acting as a
		 * value picker. Provide your own snippet for action menus (e.g. kebab).
		 */
		trigger?: Snippet;
		/** Built-in trigger: muted text shown when no value is selected. */
		placeholder?: string;
		/** Built-in trigger: leading icon. */
		icon?: import('../icon/Icon.svelte').IconProp;
		/** Built-in trigger: full-width by default; set false to size to content. */
		fullWidth?: boolean;
		align?: 'left' | 'right' | 'stretch';
		offset?: number;
		disabled?: boolean;
		open?: boolean;
		/** Internal — used when rendered as a submenu so we don't wrap in another Popover. */
		_inline?: boolean;
	}

	let {
		common,
		items: rawItems,
		options,
		value = $bindable<string | undefined>(undefined),
		onChange,
		searchable = false,
		extras,
		trigger,
		placeholder,
		icon: triggerIcon,
		fullWidth = true,
		align = 'left',
		offset = 4,
		disabled = false,
		open = $bindable(false),
		_inline = false
	}: Props = $props();

	let searchQuery = $state('');

	function isComboboxGroup(entry: ComboboxEntry): entry is ComboboxGroup {
		return (entry as ComboboxGroup).kind === 'group';
	}

	/** Flatten ComboboxEntry[] to ComboboxOption[] for filtering / lookup. */
	let flatOptions = $derived.by((): ComboboxOption[] => {
		if (!options) return [];
		const out: ComboboxOption[] = [];
		for (const e of options) {
			if (isComboboxGroup(e)) out.push(...e.options);
			else out.push(e);
		}
		return out;
	});

	/** Convert options (with optional groups) to PopoverMenuEntry[], applying search filtering. */
	function optionsToEntries(): PopoverMenuEntry[] {
		if (!options) return [];
		const filterActive = searchable && searchQuery.trim().length > 0;
		const matches = filterActive
			? new Set(fuzzyFilter(flatOptions, searchQuery).map((o) => o.value))
			: null;

		const out: PopoverMenuEntry[] = [];
		for (const entry of options) {
			if (isComboboxGroup(entry)) {
				const visible = matches
					? entry.options.filter((o) => matches.has(o.value))
					: entry.options;
				if (visible.length === 0) continue;
				// Skip group headers when filtering — flat hits are clearer.
				if (!filterActive) out.push({ kind: 'header', label: entry.label });
				for (const opt of visible) out.push(optionToItem(opt));
			} else {
				if (matches && !matches.has(entry.value)) continue;
				out.push(optionToItem(entry));
			}
		}
		return out;
	}

	function optionToItem(opt: ComboboxOption): PopoverMenuItem {
		return {
			kind: 'item',
			label: opt.label,
			description: opt.description,
			icon: opt.icon,
			image: opt.image,
			selected: value === opt.value,
			onclick: () => selectOption(opt.value)
		};
	}

	function selectOption(v: string) {
		value = v;
		onChange?.(v);
		open = false;
		searchQuery = '';
	}

	let optionEntries = $derived(optionsToEntries());
	let userItems = $derived(rawItems ?? []);
	let hasOptions = $derived(optionEntries.length > 0);
	let hasUserItems = $derived(userItems.length > 0);

	// Empty state copy when options are present but search filtered everything
	// out. (Non-option items are always rendered, so there's no "no results"
	// to show in that case.)
	let showNoResults = $derived(
		searchable && hasOptions === false && options && options.length > 0 && searchQuery.trim() !== ''
	);

	let openSubmenuIndex = $state<string | null>(null);

	function handleItemClick(item: PopoverMenuItem) {
		if (item.disabled) return;
		open = false;
		openSubmenuIndex = null;
		item.onclick();
	}

	function handleToggleRow(t: PopoverMenuToggle) {
		if (t.disabled) return;
		t.onChange(!t.checked);
	}

	function handleSubmenuClick(key: string) {
		openSubmenuIndex = openSubmenuIndex === key ? null : key;
	}

	function handleCommonClick(c: PopoverMenuCommonItem) {
		if (c.disabled) return;
		open = false;
		c.onclick();
	}

	let activeOptionIndex = $state(-1);
	let visibleOptionItems = $derived(
		optionEntries
			.map((e, i) => (e !== 'divider' && e.kind === 'item' ? { item: e, index: i } : null))
			.filter((x): x is { item: PopoverMenuItem; index: number } => x !== null && !x.item.disabled)
	);

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			if (openSubmenuIndex !== null) {
				e.preventDefault();
				openSubmenuIndex = null;
			}
			return;
		}
		if (visibleOptionItems.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const cur = visibleOptionItems.findIndex((v) => v.index === activeOptionIndex);
			const next = cur < visibleOptionItems.length - 1 ? cur + 1 : 0;
			activeOptionIndex = visibleOptionItems[next].index;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const cur = visibleOptionItems.findIndex((v) => v.index === activeOptionIndex);
			const prev = cur > 0 ? cur - 1 : visibleOptionItems.length - 1;
			activeOptionIndex = visibleOptionItems[prev].index;
		} else if (e.key === 'Enter' && activeOptionIndex >= 0) {
			e.preventDefault();
			const target = optionEntries[activeOptionIndex];
			if (target !== 'divider' && target.kind === 'item') {
				handleItemClick(target);
			}
		}
	}

	$effect(() => {
		if (open) {
			activeOptionIndex = -1;
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		} else {
			openSubmenuIndex = null;
			searchQuery = '';
		}
	});

	// Reset highlight when the visible-option list changes (e.g. user types).
	$effect(() => {
		void searchQuery;
		activeOptionIndex = -1;
	});

	// The menu body is the same whether we're inside a Popover or rendered inline
	// as a submenu panel, so it lives in a snippet to be reused.
</script>

{#snippet body()}
	<div class="dropdown-menu" role="menu">
		{#if searchable && options && options.length > 0}
			<div class="search-row">
				<Icon name="Search" size={14} />
				<input
					type="text"
					class="search-input"
					placeholder="Search..."
					bind:value={searchQuery}
					autocomplete="off"
					onkeydown={(e) => e.stopPropagation()}
				/>
			</div>
			<div class="divider"></div>
		{/if}
		{#if common && common.length > 0}
			<div class="common-section" role="group">
				{#each common as entry}
					<button
						type="button"
						class="common-item"
						class:danger={entry.danger}
						class:disabled={entry.disabled}
						disabled={entry.disabled}
						use:tooltip={{ content: entry.label, position: 'bottom' }}
						onclick={() => handleCommonClick(entry)}
					>
						<Icon
							{...resolveIcon(entry.icon)}
							size={resolveIcon(entry.icon).size ?? 16}
						/>
					</button>
				{/each}
			</div>
			<div class="divider"></div>
		{/if}

		{#each optionEntries as entry, i (`opt-${i}`)}
			{@render renderEntry(entry, `opt-${i}`)}
		{/each}

		{#if showNoResults}
			<div class="no-results">No matches</div>
		{/if}

		{#if extras}
			{#if hasOptions}<div class="divider"></div>{/if}
			<div class="extras">{@render extras()}</div>
		{/if}

		{#if hasUserItems}
			{#if hasOptions || extras}<div class="divider"></div>{/if}
			{#each userItems as entry, i (`user-${i}`)}
				{@render renderEntry(entry, `user-${i}`)}
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet renderEntry(entry: PopoverMenuEntry, key: string)}
	{#if entry === 'divider'}
		<div class="divider"></div>
	{:else if entry.kind === 'header'}
		<div class="group-header">{entry.label}</div>
	{:else if entry.kind === 'custom'}
		{@render entry.render()}
	{:else if entry.kind === 'item'}
		{@const isOptionEntry = key.startsWith('opt-')}
		{@const optIndex = isOptionEntry ? parseInt(key.slice(4), 10) : -1}
		<MenuItem
			label={entry.label}
			description={entry.description}
			icon={entry.icon}
			image={entry.image}
			shortcut={entry.shortcut}
			selected={entry.selected}
			disabled={entry.disabled}
			danger={entry.danger}
			active={isOptionEntry && optIndex === activeOptionIndex}
			role="menuitemradio"
			ariaChecked={entry.selected ?? false}
			onclick={() => handleItemClick(entry)}
			onmouseenter={() => {
				if (isOptionEntry) activeOptionIndex = optIndex;
			}}
		/>
	{:else if entry.kind === 'toggle'}
		{@const toggleEntry = entry}
		{#snippet toggleTrailing()}
			<span onclick={(e) => e.stopPropagation()} role="presentation">
				<ToggleInput
					checked={toggleEntry.checked}
					disabled={toggleEntry.disabled}
					onChange={(v) => toggleEntry.onChange(v)}
				/>
			</span>
		{/snippet}
		<MenuItem
			label={entry.label}
			description={entry.description}
			disabled={entry.disabled}
			role="menuitemcheckbox"
			ariaChecked={entry.checked}
			onclick={() => handleToggleRow(toggleEntry)}
			trailing={toggleTrailing}
		/>
	{:else if entry.kind === 'submenu'}
		<div class="submenu-row" class:open={openSubmenuIndex === key}>
			<MenuItem
				label={entry.label}
				description={entry.description}
				icon={entry.icon}
				active={openSubmenuIndex === key}
				onclick={() => handleSubmenuClick(key)}
				trailing={submenuArrow}
			/>
			{#if openSubmenuIndex === key}
				<div class="submenu-panel">
					<Self
						items={entry.items}
						options={entry.options}
						value={value}
						onChange={selectOption}
						_inline
						trigger={emptyTrigger}
						open={true}
					/>
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet emptyTrigger()}
	<span style="display:none"></span>
{/snippet}

{#snippet submenuArrow()}
	<Icon name="ChevronRight" size={14} />
{/snippet}

{#snippet builtInTrigger()}
	{@const selectedOption = options ? flatOptions.find((o) => o.value === value) : undefined}
	{@const triggerLabel = selectedOption?.label ?? value ?? ''}
	<button
		type="button"
		class="builtin-trigger"
		class:open
		class:disabled
		class:full-width={fullWidth}
		{disabled}
	>
		{#if triggerIcon || selectedOption?.icon}
			{@const ic = (selectedOption?.icon ?? triggerIcon)!}
			<span class="builtin-icon">
				<Icon {...resolveIcon(ic)} size={resolveIcon(ic).size ?? 16} />
			</span>
		{:else if selectedOption?.image}
			<img src={selectedOption.image} alt="" class="builtin-image" />
		{/if}
		{#if triggerLabel}
			<span class="builtin-value">{triggerLabel}</span>
		{:else}
			<span class="builtin-placeholder">{placeholder ?? ''}</span>
		{/if}
		<span class="builtin-chevron" aria-hidden="true">
			<Icon name="ChevronDown" size={16} />
		</span>
	</button>
{/snippet}

{#if _inline}
	{@render body()}
{:else}
	<Popover trigger={trigger ?? builtInTrigger} {align} {offset} {disabled} bind:open>
		{#snippet children()}
			{@render body()}
		{/snippet}
	</Popover>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.dropdown-menu {
		padding: 4px;
		min-width: 220px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.divider {
		height: 1px;
		background: $border-color;
		margin: 4px 0;
	}

	.group-header {
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: $text-muted;
		padding: 8px 12px 4px;

		&:not(:first-child) {
			margin-top: 4px;
			border-top: 1px solid rgba($fg, 0.06);
			padding-top: 8px;
		}
	}

	.search-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		color: $text-muted;
	}

	.search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		font-size: $text-sm;
		line-height: 1;
		padding: 0;
		outline: none;

		&::placeholder {
			color: $text-muted;
		}
	}

	.no-results {
		padding: 10px 12px;
		font-size: $text-sm;
		color: $text-muted;
		text-align: center;
	}

	.extras {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.common-section {
		display: flex;
		gap: 2px;
		padding: 2px;
	}

	.common-item {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 8px;
		border: none;
		border-radius: 8px;
		background: none;
		color: $fg;
		cursor: pointer;
		transition: background 0.1s;

		&:hover {
			background: rgba($fg, 0.06);
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;
			&:hover {
				background: none;
			}
		}

		&.danger {
			color: #ef4444;
			&:hover {
				background: rgba(#ef4444, 0.1);
			}
		}
	}

	/* Item, toggle, and submenu-trigger row styling all live in <MenuItem>. */

	// Built-in input-style trigger — uses control-frame so a value-picker
	// PopoverMenu blends with surrounding inputs in a Field/Section column.
	.builtin-trigger {
		@include control-frame;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		background-color: $bg-surface-element;
		color: $fg;
		font-family: $font-family;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;

		&.full-width {
			width: 100%;
		}

		&.open {
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.builtin-icon {
		display: inline-flex;
		align-items: center;
		opacity: 0.8;
		flex-shrink: 0;
	}

	.builtin-value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1;
	}

	.builtin-placeholder {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: $text-muted;
		line-height: 1;
	}

	.builtin-chevron {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: $text-muted;
		transition: transform 0.2s ease;

		.builtin-trigger.open & {
			transform: rotate(180deg);
		}
	}

	.submenu-row {
		position: relative;
	}

	.submenu-panel {
		position: absolute;
		top: -4px;
		left: calc(100% + 4px);
		background: $bg-surface-element;
		border: 1px solid $border-color;
		border-radius: $radius * 0.75;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 1;
	}
</style>
