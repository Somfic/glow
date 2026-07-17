<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import type { SelectOption, ComboboxOption, ComboboxEntry, RadioSelectOption } from './types.js';
	import type { PopoverMenuEntry } from '../menu/PopoverMenu.svelte';
	import Icon, { type IconProp } from '../icon/Icon.svelte';
	import TextInput from './TextInput.svelte';
	import NumberInput from './NumberInput.svelte';
	import TextareaInput from './TextareaInput.svelte';
	import MultiSelectInput from './MultiSelectInput.svelte';
	import RadioInput from './RadioInput.svelte';
	import PopoverMenu from '../menu/PopoverMenu.svelte';
	import CheckboxInput from './CheckboxInput.svelte';
	import ToggleInput from './ToggleInput.svelte';
	import RangeInput from './RangeInput.svelte';
	import PasswordInput from './PasswordInput.svelte';
	import ColorInput from './ColorInput.svelte';
	import DateInput from './DateInput.svelte';
	import TimeInput from './TimeInput.svelte';
	import { FIELD_CONTEXT_KEY, type FieldContext } from '../settings/fieldContext.js';

	type BaseProps = {
		disabled?: boolean;
		label?: string;
		required?: boolean;
		/** Validation error. When set (or inherited from a parent <Field>), the input renders in an error state and shows the message below. */
		error?: string;
	};

	type TextProps = BaseProps & {
		type: 'text';
		value: string;
		placeholder?: string;
		icon?: IconProp;
		loading?: boolean;
		clearable?: boolean;
		autocomplete?: AutoFill;
		prefix?: Snippet;
		suffix?: Snippet;
		shortcut?: string;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
		onKeydown?: (e: KeyboardEvent) => void;
		inputRef?: (el: HTMLInputElement) => void;
	};

	type PasswordProps = BaseProps & {
		type: 'password';
		value: string;
		placeholder?: string;
		clearable?: boolean;
		autocomplete?: AutoFill;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
		onKeydown?: (e: KeyboardEvent) => void;
		inputRef?: (el: HTMLInputElement) => void;
	};

	type NumberProps = BaseProps & {
		type: 'number';
		value?: number;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		clearable?: boolean;
		onChange?: (value: number) => void;
	};

	type TextareaProps = BaseProps & {
		type: 'textarea';
		value?: string;
		placeholder?: string;
		rows?: number;
		clearable?: boolean;
		onChange?: (value: string) => void;
		onFocus?: () => void;
		onBlur?: () => void;
	};

	type MultiSelectProps = BaseProps & {
		type: 'multiselect';
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		clearable?: boolean;
		shortcut?: string;
		onChange?: (value: string[]) => void;
		onSearch?: (query: string) => Promise<SelectOption[]> | SelectOption[];
		searchDebounce?: number;
		maxResults?: number;
		minSearchLength?: number;
	};

	type RadioProps = BaseProps & {
		type: 'radio';
		options: RadioSelectOption<string>[];
		value?: string;
		clearable?: boolean;
		/** Render only each option's icon (label becomes its tooltip). */
		iconOnly?: boolean;
		onChange?: (value: string) => void;
	};

	type SelectProps = BaseProps & {
		type: 'select';
		options: ComboboxEntry[];
		value?: string;
		placeholder?: string;
		clearable?: boolean;
		/** Show the search input. Default true. Set false for short fixed lists. */
		searchable?: boolean;
		/** Leading icon shown in the trigger when no option is selected (or when the selected option has no icon of its own). */
		icon?: IconProp;
		/**
		 * Extra menu entries appended below the option list — use for embedded
		 * toggles, submenus, custom snippets, dividers. Enables the Claude.ai
		 * model-picker pattern through the same `<Input type="select">` API.
		 */
		items?: PopoverMenuEntry[];
		/** Snippet rendered between the option list and any extra `items`. */
		extras?: Snippet;
		/** Trigger/menu alignment relative to the trigger. */
		align?: 'left' | 'right' | 'stretch';
		onChange?: (value: string) => void;
		onSearch?: (query: string) => Promise<ComboboxOption[]> | ComboboxOption[];
		searchDebounce?: number;
		maxResults?: number;
		minSearchLength?: number;
	};

	type CheckboxProps = BaseProps & {
		type: 'checkbox';
		checked?: boolean;
		indeterminate?: boolean;
		checkboxLabel?: string; // Separate from wrapper label
		onChange?: (checked: boolean) => void;
	};

	type ToggleProps = BaseProps & {
		type: 'toggle';
		checked?: boolean;
		toggleLabel?: string; // Separate from wrapper label
		onChange?: (checked: boolean) => void;
	};

	type RangeProps = BaseProps & {
		type: 'range';
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		showValue?: boolean;
		thumb?: 'always' | 'hover';
		onChange?: (value: number) => void;
	};

	type ColorProps = BaseProps & {
		type: 'color';
		value?: string; // hex color
		onChange?: (value: string) => void;
	};

	type DateProps = BaseProps & {
		type: 'date';
		value?: string; // ISO YYYY-MM-DD
		placeholder?: string;
		clearable?: boolean;
		min?: string;
		max?: string;
		locale?: string;
		format?: (date: Date | null) => string;
		onChange?: (value: string) => void;
	};

	type TimeProps = BaseProps & {
		type: 'time';
		value?: string; // "HH:MM" 24-hour
		placeholder?: string;
		clearable?: boolean;
		min?: string;
		max?: string;
		step?: number; // minute granularity
		hourFormat?: '12' | '24';
		locale?: string;
		onChange?: (value: string) => void;
	};

	type Props =
		| TextProps
		| PasswordProps
		| NumberProps
		| TextareaProps
		| MultiSelectProps
		| RadioProps
		| SelectProps
		| CheckboxProps
		| ToggleProps
		| RangeProps
		| ColorProps
		| DateProps
		| TimeProps;

	let props: Props = $props();

	// If this Input is nested inside a <Field>, register our type so Field can
	// pick the right layout in `auto` mode and suppress our own label (Field owns
	// labelling). Outside a Field everything works exactly as before.
	const fieldCtx = getContext<FieldContext | undefined>(FIELD_CONTEXT_KEY);

	// When nested in a Field, adopt Field's control id so its <label for=...>
	// targets the underlying control. Standalone Inputs keep their own id.
	let inputId = $derived(
		fieldCtx?.getControlId() ?? `input-${Math.random().toString(36).slice(2, 11)}`
	);
	$effect(() => {
		fieldCtx?.setControlType(props.type);
	});
	const renderOwnLabel = $derived(!fieldCtx && !!props.label);
	// Inherit error state from a parent Field, but allow per-input override.
	const effectiveError = $derived(props.error ?? fieldCtx?.getError?.());

	function handleLabelClick() {
		// For non-native form controls (multiselect, radio, select), trigger a click
		if (props.type === 'multiselect' || props.type === 'radio' || props.type === 'select') {
			const element = document.getElementById(inputId);
			element?.click();
		}
	}
</script>

<div class="input" class:in-field={!!fieldCtx} class:invalid={!!effectiveError}>
	{#if renderOwnLabel}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<label class="input-label" for={inputId} onclick={handleLabelClick}>
			{props.label}
			{#if props.required}
				<span class="required">
					<Icon name="Asterisk" size={10} />
				</span>
			{/if}
		</label>
	{/if}

	{#if props.type === 'text'}
		{@const p = props as TextProps}
		<TextInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			icon={p.icon}
			loading={p.loading}
			disabled={p.disabled}
			clearable={p.clearable}
			autocomplete={p.autocomplete}
			prefix={p.prefix}
			suffix={p.suffix}
			shortcut={p.shortcut}
			onChange={p.onChange}
			onFocus={p.onFocus}
			onBlur={p.onBlur}
			onKeydown={p.onKeydown}
			inputRef={p.inputRef}
		/>
	{:else if props.type === 'password'}
		{@const p = props as PasswordProps}
		<PasswordInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			clearable={p.clearable}
			autocomplete={p.autocomplete}
			onChange={p.onChange}
			onFocus={p.onFocus}
			onBlur={p.onBlur}
			onKeydown={p.onKeydown}
			inputRef={p.inputRef}
		/>
	{:else if props.type === 'number'}
		{@const p = props as NumberProps}
		<NumberInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			min={p.min}
			max={p.max}
			step={p.step}
			disabled={p.disabled}
			clearable={p.clearable}
			onChange={p.onChange}
		/>
	{:else if props.type === 'multiselect'}
		{@const p = props as MultiSelectProps}
		<MultiSelectInput
			id={inputId}
			options={p.options}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			clearable={p.clearable}
			shortcut={p.shortcut}
			onChange={p.onChange}
			onSearch={p.onSearch}
			searchDebounce={p.searchDebounce}
			maxResults={p.maxResults}
			minSearchLength={p.minSearchLength}
		/>
	{:else if props.type === 'radio'}
		{@const p = props as RadioProps}
		<RadioInput
			id={inputId}
			options={p.options}
			value={p.value}
			disabled={p.disabled}
			clearable={p.clearable}
			iconOnly={p.iconOnly}
			onChange={(v) => p.onChange?.(v ?? '')}
		/>
	{:else if props.type === 'select'}
		{@const p = props as SelectProps}
		<PopoverMenu
			options={p.options}
			items={p.items}
			extras={p.extras}
			value={p.value}
			placeholder={p.placeholder}
			icon={p.icon}
			disabled={p.disabled}
			searchable={p.searchable ?? true}
			align={p.align ?? 'stretch'}
			onChange={p.onChange}
		/>
	{:else if props.type === 'textarea'}
		{@const p = props as TextareaProps}
		<TextareaInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			rows={p.rows}
			disabled={p.disabled}
			clearable={p.clearable}
			onChange={p.onChange}
			onFocus={p.onFocus}
			onBlur={p.onBlur}
		/>
	{:else if props.type === 'checkbox'}
		{@const p = props as CheckboxProps}
		<CheckboxInput
			id={inputId}
			checked={p.checked}
			disabled={p.disabled}
			indeterminate={p.indeterminate}
			label={p.checkboxLabel}
			onChange={p.onChange}
		/>
	{:else if props.type === 'toggle'}
		{@const p = props as ToggleProps}
		<ToggleInput
			id={inputId}
			checked={p.checked}
			disabled={p.disabled}
			label={p.toggleLabel}
			onChange={p.onChange}
		/>
	{:else if props.type === 'range'}
		{@const p = props as RangeProps}
		<RangeInput
			id={inputId}
			value={p.value}
			min={p.min}
			max={p.max}
			step={p.step}
			disabled={p.disabled}
			showValue={p.showValue}
			thumb={p.thumb}
			onChange={p.onChange}
		/>
	{:else if props.type === 'color'}
		{@const p = props as ColorProps}
		<ColorInput id={inputId} value={p.value} disabled={p.disabled} onChange={p.onChange} />
	{:else if props.type === 'date'}
		{@const p = props as DateProps}
		<DateInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			clearable={p.clearable}
			min={p.min}
			max={p.max}
			locale={p.locale}
			format={p.format}
			onChange={p.onChange}
		/>
	{:else if props.type === 'time'}
		{@const p = props as TimeProps}
		<TimeInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			clearable={p.clearable}
			min={p.min}
			max={p.max}
			step={p.step}
			hourFormat={p.hourFormat}
			locale={p.locale}
			onChange={p.onChange}
		/>
	{/if}

	{#if effectiveError && !fieldCtx}
		<span class="input-error" role="alert">
			<Icon name="CircleAlert" size={12} />
			{effectiveError}
		</span>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.input {
		display: flex;
		flex-direction: column;
		gap: 4px;

		// When nested inside a <Field>, drop the wrapper gap and let Field
		// drive layout/spacing. The label is also suppressed at the markup
		// level (Field owns it).
		&.in-field {
			gap: 0;
		}

		// Invalid state — bleeds into the inner control's border via :global.
		// Each specialized input renders its own border, so we target by the
		// shared selectors most use.
		&.invalid {
			:global(input),
			:global(textarea),
			:global(.text-input),
			:global(.number-input),
			:global(.popover-trigger) {
				border-color: var(--glow-color-danger, #ef4444);
			}
		}
	}

	.input-error {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: $text-xs;
		color: var(--glow-color-danger, #ef4444);
		line-height: 1.35;
	}

	.input-label {
		display: inline-flex;
		align-items: center;
		font-weight: $weight-medium;
		margin-left: calc(1rem + $border-width);
		font-size: 0.75rem;
		color: var(--glow-text-muted);
		user-select: none;
		cursor: pointer;

		.required {
			display: inline-flex;
			align-items: center;
			color: var(--glow-primary);
			margin-left: 0.25rem;
		}
	}
</style>
