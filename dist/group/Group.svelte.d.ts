import type { IconName } from '../icon/Icon.svelte';
type ActionLabelProp = {
    label: string;
    icon?: IconName;
};
type ActionIconProp = {
    icon: IconName;
    label?: string;
};
type ActionProp = (ActionLabelProp | ActionIconProp) & {
    onClick: () => void;
};
type IconProps = {
    icon: IconName;
    label?: string;
};
type LabelProps = {
    label: string;
    icon?: IconName;
};
type Props = {
    actions?: ActionProp[];
    headerExtra?: import('svelte').Snippet;
    children?: () => any;
} & (IconProps | LabelProps);
declare const Group: import("svelte").Component<Props, {}, "">;
type Group = ReturnType<typeof Group>;
export default Group;
