interface Props {
    id?: string;
    value?: number;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    clearable?: boolean;
    onChange?: (value: number) => void;
}
declare const NumberInput: import("svelte").Component<Props, {}, "">;
type NumberInput = ReturnType<typeof NumberInput>;
export default NumberInput;
