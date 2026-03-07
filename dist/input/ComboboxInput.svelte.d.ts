import type { ComboboxOption } from './types.js';
interface Props {
    id?: string;
    options: ComboboxOption[];
    value?: string | string[];
    placeholder?: string;
    disabled?: boolean;
    multiple?: boolean;
    clearable?: boolean;
    onChange?: (value: string | string[]) => void;
}
declare const ComboboxInput: import("svelte").Component<Props, {}, "">;
type ComboboxInput = ReturnType<typeof ComboboxInput>;
export default ComboboxInput;
