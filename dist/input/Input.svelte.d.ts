import type { IconName } from '../icon/Icon.svelte';
import type { SelectOption, ComboboxOption } from './types.js';
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
    checkboxLabel?: string;
    onChange?: (checked: boolean) => void;
};
type ToggleProps = BaseProps & {
    type: 'toggle';
    checked?: boolean;
    toggleLabel?: string;
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
    value?: string;
    onChange?: (value: string) => void;
};
type Props = TextProps | NumberProps | TextareaProps | MultiSelectProps | RadioProps | SelectProps | CheckboxProps | ToggleProps | RangeProps | ColorProps;
declare const Input: import("svelte").Component<Props, {}, "">;
type Input = ReturnType<typeof Input>;
export default Input;
