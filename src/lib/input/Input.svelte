<script lang="ts">
	import type { IconName } from '../icon/Icon.svelte';
	import type { SelectOption, ComboboxOption } from './types.js';
	import TextInput from './TextInput.svelte';
	import NumberInput from './NumberInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import MultiSelectInput from './MultiSelectInput.svelte';
	import SegmentedInput from './SegmentedInput.svelte';
	import ComboboxInput from './ComboboxInput.svelte';

	type BaseProps = {
		disabled?: boolean;
		label?: string;
	};

	type TextProps = BaseProps & {
		type: 'text';
		value?: string;
		placeholder?: string;
		icon?: IconName;
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
		onChange?: (value: number) => void;
	};

	type SelectProps = BaseProps & {
		type: 'select';
		options: SelectOption[];
		value?: string;
		placeholder?: string;
		onChange?: (value: string) => void;
	};

	type MultiSelectProps = BaseProps & {
		type: 'multiselect';
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		onChange?: (value: string[]) => void;
	};

	type SegmentedProps = BaseProps & {
		type: 'segmented';
		options: SelectOption[];
		value?: string;
		onChange?: (value: string) => void;
	};

	type ComboboxSingleProps = BaseProps & {
		type: 'combobox';
		options: ComboboxOption[];
		value?: string;
		placeholder?: string;
		clearable?: boolean;
		onChange?: (value: string) => void;
		multiple?: false;
	};

	type ComboboxMultiProps = BaseProps & {
		type: 'combobox';
		options: ComboboxOption[];
		value?: string[];
		placeholder?: string;
		clearable?: boolean;
		onChange?: (value: string[]) => void;
		multiple: true;
	};

	type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

	type Props =
		| TextProps
		| NumberProps
		| SelectProps
		| MultiSelectProps
		| SegmentedProps
		| ComboboxSingleProps
		| ComboboxMultiProps;

	let props: Props = $props();

	let inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="input">
	{#if props.label}
		<label class="input-label" for={inputId}>{props.label}</label>
	{/if}

	{#if props.type === 'text'}
		{@const p = props as TextProps}
		<TextInput
			id={inputId}
			value={p.value}
			placeholder={p.placeholder}
			icon={p.icon}
			disabled={p.disabled}
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
			onChange={p.onChange}
		/>
	{:else if props.type === 'select'}
		{@const p = props as SelectProps}
		<SelectInput
			id={inputId}
			options={p.options}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
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
			onChange={p.onChange}
		/>
	{:else if props.type === 'segmented'}
		{@const p = props as SegmentedProps}
		<SegmentedInput
			id={inputId}
			options={p.options}
			value={p.value}
			disabled={p.disabled}
			onChange={p.onChange}
		/>
	{:else if props.type === 'combobox'}
		{@const p = props as ComboboxProps}
		<ComboboxInput
			id={inputId}
			options={p.options}
			value={p.value}
			placeholder={p.placeholder}
			disabled={p.disabled}
			multiple={p.multiple}
			clearable={p.clearable}
			onChange={(v) => {
				if (p.multiple) {
					(p.onChange as ((value: string[]) => void) | undefined)?.(v as string[]);
				} else {
					(p.onChange as ((value: string) => void) | undefined)?.(v as string);
				}
			}}
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

		&.disabled {
			opacity: 0.6;
			pointer-events: none;
		}
	}

	.input-label {
		font-weight: 500;
		margin-left: 0.75rem;
		font-size: 0.75rem;
		color: color.mix($fg, $bg-surface-element, 50%);
	}
</style>
