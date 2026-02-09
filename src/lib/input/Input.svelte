<script lang="ts">
	import type { IconName } from '../icon/Icon.svelte';
	import type { SelectOption, ComboboxOption } from './types.js';
	import TextInput from './TextInput.svelte';
	import NumberInput from './NumberInput.svelte';
	import SelectInput from './SelectInput.svelte';
	import MultiSelectInput from './MultiSelectInput.svelte';
	import SegmentedInput from './SegmentedInput.svelte';
	import ComboboxInput from './ComboboxInput.svelte';

	interface BaseProps {
		disabled?: boolean;
	}

	interface TextProps extends BaseProps {
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
	}

	interface NumberProps extends BaseProps {
		type: 'number';
		value?: number;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		onChange?: (value: number) => void;
	}

	interface SelectProps extends BaseProps {
		type: 'select';
		options: SelectOption[];
		value?: string;
		placeholder?: string;
		onChange?: (value: string) => void;
	}

	interface MultiSelectProps extends BaseProps {
		type: 'multiselect';
		options: SelectOption[];
		value?: string[];
		placeholder?: string;
		onChange?: (value: string[]) => void;
	}

	interface SegmentedProps extends BaseProps {
		type: 'segmented';
		options: SelectOption[];
		value?: string;
		onChange?: (value: string) => void;
	}

	interface ComboboxSingleProps extends BaseProps {
		type: 'combobox';
		options: ComboboxOption[];
		value?: string;
		placeholder?: string;
		onChange?: (value: string) => void;
		multiple?: false;
	}

	interface ComboboxMultiProps extends BaseProps {
		type: 'combobox';
		options: ComboboxOption[];
		value?: string[];
		placeholder?: string;
		onChange?: (value: string[]) => void;
		multiple: true;
	}

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
</script>

{#if props.type === 'text'}
	{@const p = props as TextProps}
	<TextInput
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
		options={p.options}
		value={p.value}
		placeholder={p.placeholder}
		disabled={p.disabled}
		onChange={p.onChange}
	/>
{:else if props.type === 'multiselect'}
	{@const p = props as MultiSelectProps}
	<MultiSelectInput
		options={p.options}
		value={p.value}
		placeholder={p.placeholder}
		disabled={p.disabled}
		onChange={p.onChange}
	/>
{:else if props.type === 'segmented'}
	{@const p = props as SegmentedProps}
	<SegmentedInput options={p.options} value={p.value} disabled={p.disabled} onChange={p.onChange} />
{:else if props.type === 'combobox'}
	{@const p = props as ComboboxProps}
	<ComboboxInput
		options={p.options}
		value={p.value}
		placeholder={p.placeholder}
		disabled={p.disabled}
		multiple={p.multiple}
		onChange={(v) => {
			if (p.multiple) {
				(p.onChange as ((value: string[]) => void) | undefined)?.(v as string[]);
			} else {
				(p.onChange as ((value: string) => void) | undefined)?.(v as string);
			}
		}}
	/>
{/if}
