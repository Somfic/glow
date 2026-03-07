interface Props {
    id?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    showValue?: boolean;
    onChange?: (value: number) => void;
}
declare const RangeInput: import("svelte").Component<Props, {}, "">;
type RangeInput = ReturnType<typeof RangeInput>;
export default RangeInput;
