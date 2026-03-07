import type { SelectOption } from './types.js';
interface Props {
    id?: string;
    options: SelectOption[];
    value?: string;
    disabled?: boolean;
    clearable?: boolean;
    onChange?: (value: string) => void;
}
declare const RadioInput: import("svelte").Component<Props, {}, "">;
type RadioInput = ReturnType<typeof RadioInput>;
export default RadioInput;
