<script lang="ts">
	import Icon from '$lib/icon/Icon.svelte';
	import type { ComboboxOption } from './types.js';

	interface Props {
		options: ComboboxOption[];
		value?: string | string[];
		placeholder?: string;
		disabled?: boolean;
		multiple?: boolean;
		onChange?: (value: string | string[]) => void;
	}

	let {
		options,
		value = '',
		placeholder = 'Search...',
		disabled = false,
		multiple = false,
		onChange
	}: Props = $props();

	let inputValue = $state('');
	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let inputElement: HTMLInputElement;

	// For single mode, value is string; for multiple, it's string[]
	let selectedValues = $state<string[]>(
		multiple ? (Array.isArray(value) ? value : []) : value ? [value as string] : []
	);

	$effect(() => {
		if (multiple) {
			selectedValues = Array.isArray(value) ? value : [];
		} else {
			selectedValues = value ? [value as string] : [];
		}
	});

	// Fuzzy search scoring
	function fuzzyScore(query: string, target: string): number {
		const q = query.toLowerCase();
		const t = target.toLowerCase();

		if (t === q) return 1000;
		if (t.startsWith(q)) return 500 + (q.length / t.length) * 100;
		if (t.includes(q)) return 300 + (q.length / t.length) * 100;

		let score = 0;
		let targetIndex = 0;
		let consecutiveBonus = 0;
		let lastMatchIndex = -1;

		for (let i = 0; i < q.length; i++) {
			const char = q[i];
			const foundIndex = t.indexOf(char, targetIndex);

			if (foundIndex === -1) return 0;

			if (foundIndex === lastMatchIndex + 1) {
				consecutiveBonus += 10;
			} else {
				consecutiveBonus = 0;
			}

			if (
				foundIndex === 0 ||
				t[foundIndex - 1] === ' ' ||
				t[foundIndex - 1] === '_' ||
				t[foundIndex - 1] === '-'
			) {
				score += 20;
			}

			score += 10 + consecutiveBonus;
			lastMatchIndex = foundIndex;
			targetIndex = foundIndex + 1;
		}

		score -= (t.length - q.length) * 2;
		return Math.max(score, 1);
	}

	// Filter and sort options based on search
	let filteredOptions = $derived.by(() => {
		const available = options.filter((opt) => !selectedValues.includes(opt.value));

		if (!inputValue) {
			return available.slice(0, 10);
		}

		return available
			.map((opt) => ({
				option: opt,
				score: Math.max(
					fuzzyScore(inputValue, opt.label),
					opt.description ? fuzzyScore(inputValue, opt.description) * 0.5 : 0
				)
			}))
			.filter((item) => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 10)
			.map((item) => item.option);
	});

	function getSelectedOptions(): ComboboxOption[] {
		return selectedValues
			.map((v) => options.find((opt) => opt.value === v))
			.filter((opt): opt is ComboboxOption => opt !== undefined);
	}

	function selectOption(option: ComboboxOption) {
		if (multiple) {
			if (!selectedValues.includes(option.value)) {
				selectedValues = [...selectedValues, option.value];
				onChange?.(selectedValues);
			}
			inputValue = '';
			inputElement?.focus();
		} else {
			selectedValues = [option.value];
			onChange?.(option.value);
			inputValue = '';
			isOpen = false;
		}
		selectedIndex = -1;
	}

	function removeValue(valueToRemove: string) {
		selectedValues = selectedValues.filter((v) => v !== valueToRemove);
		onChange?.(multiple ? selectedValues : '');
		inputElement?.focus();
	}

	function handleInputChange(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
		isOpen = true;
		selectedIndex = -1;
	}

	function handleFocus() {
		isOpen = true;
	}

	function handleBlur() {
		setTimeout(() => {
			isOpen = false;
			selectedIndex = -1;
		}, 150);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			selectedIndex = -1;
		} else if (e.key === 'ArrowDown' && isOpen && filteredOptions.length > 0) {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
		} else if (e.key === 'ArrowUp' && isOpen && filteredOptions.length > 0) {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
				selectOption(filteredOptions[selectedIndex]);
			} else if (filteredOptions.length > 0) {
				selectOption(filteredOptions[0]);
			}
		} else if (
			e.key === 'Backspace' &&
			inputValue === '' &&
			selectedValues.length > 0 &&
			multiple
		) {
			e.preventDefault();
			removeValue(selectedValues[selectedValues.length - 1]);
		}
	}

	function clearAll() {
		selectedValues = [];
		inputValue = '';
		onChange?.(multiple ? [] : '');
		inputElement?.focus();
	}
</script>

<div class="combobox" class:disabled class:open={isOpen} class:multiple>
	<div class="combobox-input-area">
		{#if multiple && selectedValues.length > 0}
			<div class="chips">
				{#each getSelectedOptions() as opt}
					<span class="chip">
						{#if opt.image}
							<img src={opt.image} alt="" class="chip-image" />
						{:else if opt.icon}
							<Icon name={opt.icon} size={12} />
						{/if}
						<span class="chip-label">{opt.label}</span>
						<button type="button" class="chip-remove" onclick={() => removeValue(opt.value)}>
							<Icon name="X" size={12} />
						</button>
					</span>
				{/each}
			</div>
		{/if}
		<div class="input-wrapper">
			{#if !multiple && selectedValues.length > 0 && !isOpen}
				{@const selected = options.find((o) => o.value === selectedValues[0])}
				{#if selected}
					<div class="selected-display">
						{#if selected.image}
							<img src={selected.image} alt="" class="selected-image" />
						{:else if selected.icon}
							<Icon name={selected.icon} size={16} />
						{/if}
						<span>{selected.label}</span>
					</div>
				{/if}
			{/if}
			<input
				type="text"
				bind:this={inputElement}
				value={inputValue}
				{placeholder}
				{disabled}
				class:hidden={!multiple && selectedValues.length > 0 && !isOpen}
				oninput={handleInputChange}
				onfocus={handleFocus}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				autocomplete="off"
			/>
		</div>
		<div class="actions">
			{#if selectedValues.length > 0}
				<button type="button" class="clear-btn" onclick={clearAll} tabindex="-1">
					<Icon name="X" size={16} />
				</button>
			{/if}
			<span class="chevron">
				<Icon name="ChevronDown" size={16} />
			</span>
		</div>
	</div>

	{#if isOpen && filteredOptions.length > 0}
		<div class="dropdown">
			{#each filteredOptions as option, index}
				<button
					type="button"
					class="option"
					class:selected={index === selectedIndex}
					onmousedown={() => selectOption(option)}
				>
					{#if option.image}
						<img src={option.image} alt="" class="option-image" />
					{:else if option.icon}
						<span class="option-icon">
							<Icon name={option.icon} size={16} />
						</span>
					{:else if option.groupType}
						<span class="option-icon group-{option.groupType}">
							{#if option.groupType === 'person'}👤{:else if option.groupType === 'model'}🤖{:else if option.groupType === 'style'}🎨{:else if option.groupType === 'scene'}🏞️{:else}🏷️{/if}
						</span>
					{/if}
					<span class="option-label">{option.label}</span>
					{#if option.description}
						<span class="option-description">{option.description}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.combobox {
		position: relative;
		font-size: 1rem;
	}

	.combobox-input-area {
		display: flex;
		align-items: center;
		gap: 0.5em;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		padding: 0.5em;
		color: $fg;
		min-height: 2.5em;
		flex-wrap: wrap;

		&:focus-within {
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}
	}

	.combobox.disabled .combobox-input-area {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		background: $secondary;
		border-radius: calc($radius - 2px);
		padding: 0.2em 0.4em;
		font-size: 0.875em;
	}

	.chip-image {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		object-fit: cover;
	}

	.chip-label {
		color: $fg;
	}

	.chip-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: rgba($fg, 0.6);
		border-radius: 50%;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
		}
	}

	.input-wrapper {
		flex: 1;
		min-width: 100px;
		position: relative;
		display: flex;
		align-items: center;
	}

	.selected-display {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0 0.5em;
		color: $fg;
	}

	.selected-image {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}

	input {
		width: 100%;
		border: none;
		background: transparent;
		color: $fg;
		font: inherit;
		padding: 0 0.5em;
		outline: none;

		&::placeholder {
			color: rgba($fg, 0.5);
		}

		&:disabled {
			cursor: not-allowed;
		}

		&.hidden {
			position: absolute;
			opacity: 0;
			width: 0;
			padding: 0;
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
	}

	.combobox.open .chevron {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 300px;
		overflow-y: auto;
		background-color: $bg-surface-element;
		border: $border;
		border-radius: $radius;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.625em 0.75em;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		color: $fg;
		font: inherit;
		transition: background-color 0.15s ease;

		&:hover,
		&.selected {
			background-color: $secondary;
		}
	}

	.option-image {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.option-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		border-radius: 50%;
		background: rgba($fg, 0.1);
		flex-shrink: 0;

		&.group-person {
			background: #fce7f3;
		}
		&.group-model {
			background: #dbeafe;
		}
		&.group-style {
			background: #fef3c7;
		}
		&.group-scene {
			background: #d1fae5;
		}
	}

	.option-label {
		font-weight: 500;
		flex-shrink: 0;
	}

	.option-description {
		color: rgba($fg, 0.6);
		font-size: 0.75rem;
		margin-left: auto;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
