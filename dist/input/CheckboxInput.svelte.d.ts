interface Props {
    id?: string;
    checked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    label?: string;
    onChange?: (checked: boolean) => void;
}
declare const CheckboxInput: import("svelte").Component<Props, {}, "">;
type CheckboxInput = ReturnType<typeof CheckboxInput>;
export default CheckboxInput;
