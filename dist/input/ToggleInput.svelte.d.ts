interface Props {
    id?: string;
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    onChange?: (checked: boolean) => void;
}
declare const ToggleInput: import("svelte").Component<Props, {}, "">;
type ToggleInput = ReturnType<typeof ToggleInput>;
export default ToggleInput;
