import type { SelectOption } from './types.js';
interface Props {
    id?: string;
    options: SelectOption[];
    value?: string[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    onChange?: (value: string[]) => void;
}
declare const MultiSelectInput: import("svelte").Component<Props, {}, "">;
type MultiSelectInput = ReturnType<typeof MultiSelectInput>;
export default MultiSelectInput;
