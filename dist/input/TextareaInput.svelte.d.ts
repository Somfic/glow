interface Props {
    id?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    clearable?: boolean;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}
declare const TextareaInput: import("svelte").Component<Props, {}, "">;
type TextareaInput = ReturnType<typeof TextareaInput>;
export default TextareaInput;
