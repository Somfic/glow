<script lang="ts">
	import type { IconName } from '../icon/Icon.svelte';
	import type { SelectOption, ComboboxOption } from './types.js';
	import Icon from '../icon/Icon.svelte';
	import TextInput from './TextInput.svelte';
	import NumberInput from './NumberInput.svelte';
	import TextareaInput from './TextareaInput.svelte';
	import MultiSelectInput from './MultiSelectInput.svelte';
	import RadioInput from './RadioInput.svelte';
	import ComboboxInput from './ComboboxInput.svelte';
	import CheckboxInput from './CheckboxInput.svelte';
	import ToggleInput from './ToggleInput.svelte';
	import RangeInput from './RangeInput.svelte';
	import ColorInput from './ColorInput.svelte';

	type BaseProps = {
		disabled?: boolean;
		label?: string;
		required?: boolean;
	};

	type TextProps = BaseProps & {
		type: 'text';
		value?: string;
		placeholder?: string;
		icon?: IconName;
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
		onChange?: (value: string[]) => void;
	};

	type RadioProps = BaseProps & {
		type: 'radio';
		options: SelectOption[];
		value?: string;
		clearable?: boolean;
		onChange?: (value: string) => void;
	};

	type SelectProps = BaseProps & {
		type: 'select';
		options: ComboboxOption[];
		value?: string;
		placeholder?: string;
		clearable?: boolean;
		onChange?: (value: string) => void;
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
		onChange?: (value: number) => void;
	};

	type ColorProps = BaseProps & {
		type: 'color';
		value?: string; // hex color
		onChange?: (value: string) => void;
	};

	type Props =
		| TextProps
		| NumberProps
		| TextareaProps
		| MultiSelectProps
		| RadioProps
		| SelectProps
		| CheckboxProps
		| ToggleProps
		| RangeProps
		| ColorProps;

	let props: Props = $props();

	let inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

	function handleLabelClick() {
		// For non-native form controls (multiselect, radio, select), trigger a click
		if (props.type === 'multiselect' || props.type === 'radio' || props.type === 'select') {
			const element = document.getElementById(inputId);
			element?.click();
		}
	}
</script>

<div class="input">
	{#if props.label}
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
			onChange={p.onChange}
		/>
	{:else if props.type === 'radio'}
		{@const p = props as RadioProps}
		<RadioInput
			id={inputId}
			options={p.options}
			value={p.value}
			disabled={p.disabled}
			clearable={p.clearable}
			onChange={p.onChange}
		/>
	{:else if props.type === 'select'}
		{@const p = props as SelectProps}
		<ComboboxInput
			id={inputId}
			options={p.options}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			clearable={p.clearable}
			multiple={false}
			onChange={(v) => p.onChange?.(v as string)}
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
			onChange={p.onChange}
		/>
	{:else if props.type === 'color'}
		{@const p = props as ColorProps}
		<ColorInput
			id={inputId}
			value={p.value}
			disabled={p.disabled}
			onChange={p.onChange}
		/>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.input {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.input-label {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		margin-left: calc(1rem + $border-width);
		font-size: 0.75rem;
		color: color.mix($fg, $bg-surface-element, 50%);
		user-select: none;
		cursor: pointer;

		.required {
			display: inline-flex;
			align-items: center;
			color: $primary;
			margin-left: 0.25rem;
		}
	}
</style>
