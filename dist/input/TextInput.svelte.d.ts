import { type IconName } from '../icon/Icon.svelte';
interface Props {
    id?: string;
    value?: string;
    placeholder?: string;
    icon?: IconName;
    disabled?: boolean;
    clearable?: boolean;
    autocomplete?: AutoFill;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeydown?: (e: KeyboardEvent) => void;
    inputRef?: (el: HTMLInputElement) => void;
}
declare const TextInput: import("svelte").Component<Props, {}, "">;
type TextInput = ReturnType<typeof TextInput>;
export default TextInput;
