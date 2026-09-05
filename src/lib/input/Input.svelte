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
	import type { CalendarDay, CalendarMode, DateRange } from '../calendar/Calendar.svelte';
	import TimeInput from './TimeInput.svelte';
	import RatingInput from './RatingInput.svelte';
	import PinInput, { type PinType } from './PinInput.svelte';
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
		/** Font size of the control; its height and icons follow. */
		size?: 'sm' | 'md' | 'lg';
		/** Fill the available width, every option sharing it equally. */
		fullWidth?: boolean;
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
		/** ISO YYYY-MM-DD; a string[] in multiple mode, a { start, end } in range mode. */
		value?: string | string[] | DateRange;
		placeholder?: string;
		clearable?: boolean;
		min?: string;
		max?: string;
		locale?: string;
		format?: (date: Date | null) => string;
		/** One day, a set of days, or a span. */
		mode?: CalendarMode;
		isDateDisabled?: (date: Date) => boolean;
		/** First column of the calendar. 0 = Sunday, 1 = Monday (default). */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		showWeekNumbers?: boolean;
		/** Extra content in a day cell, under the number. */
		decoration?: Snippet<[CalendarDay]>;
		onChange?: (value: any) => void;
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

	type RatingProps = BaseProps & {
		type: 'rating';
		value?: number;
		/** Number of icons. Default 5. */
		max?: number;
		/** `0.5` for half-icon ratings. Default 1. */
		step?: number;
		/** Icon drawn per unit. Default `'Star'`. */
		icon?: IconProp;
		/** Show the score beside the icons. */
		showValue?: boolean;
		/** Icon size in pixels. Default 20. */
		size?: number;
		/** Render the score without accepting input. */
		readonly?: boolean;
		onChange?: (value: number) => void;
	};

	type PinProps = BaseProps & {
		type: 'pin';
		value?: string;
		/** Number of cells. Default 6. */
		length?: number;
		/** Character set the cells accept. Default `'numeric'`. */
		codeType?: PinType;
		/** Render filled cells as dots. */
		mask?: boolean;
		/** Name the whole code submits under inside a `<form>`. */
		name?: string;
		readonly?: boolean;
		onChange?: (value: string) => void;
		/** Fires when the user fills the last cell. */
		onComplete?: (value: string) => void;
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
		| TimeProps
		| RatingProps
		| PinProps;

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
		// Rating is non-native too, but clicking it would commit whichever icon the
		// pointer happened to be over — focus it and let the arrow keys decide.
		if (props.type === 'rating') {
			document.getElementById(inputId)?.focus();
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
		<!-- `label` goes through as well as being rendered: a field label cannot be
		     associated with a radiogroup by `for`/`id`, so without this the group
		     has no accessible name. -->
		<RadioInput
			id={inputId}
			options={p.options}
			value={p.value}
			disabled={p.disabled}
			clearable={p.clearable}
			iconOnly={p.iconOnly}
			size={p.size}
			fullWidth={p.fullWidth}
			label={p.label}
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
	{:else if props.type === 'rating'}
		{@const p = props as RatingProps}
		<RatingInput
			id={inputId}
			value={p.value}
			max={p.max}
			step={p.step}
			icon={p.icon}
			label={p.label ?? 'Rating'}
			disabled={p.disabled}
			readonly={p.readonly}
			size={p.size}
			showValue={p.showValue}
			onChange={p.onChange}
		/>
	{:else if props.type === 'pin'}
		{@const p = props as PinProps}
		<PinInput
			id={inputId}
			value={p.value}
			length={p.length}
			type={p.codeType}
			mask={p.mask}
			name={p.name}
			label={p.label ?? 'Verification code'}
			disabled={p.disabled}
			readonly={p.readonly}
			invalid={!!effectiveError}
			onChange={p.onChange}
			onComplete={p.onComplete}
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
			mode={p.mode}
			isDateDisabled={p.isDateDisabled}
			weekStart={p.weekStart}
			showWeekNumbers={p.showWeekNumbers}
			decoration={p.decoration}
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
		gap: $space-xs;
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
			margin-left: $space-xs;
		}
	}
</style>
