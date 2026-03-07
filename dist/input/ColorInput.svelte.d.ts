interface Props {
    id?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
}
declare const ColorInput: import("svelte").Component<Props, {}, "">;
type ColorInput = ReturnType<typeof ColorInput>;
export default ColorInput;
