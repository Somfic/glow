import { type IconName } from '../icon/Icon.svelte';
type Variant = 'primary' | 'secondary' | 'ternary';
type BaseProps = {
    variant?: Variant;
    onclick?: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    image?: string;
    selected?: boolean;
};
type WithIcon = BaseProps & {
    icon: IconName;
    label?: string;
};
type WithLabel = BaseProps & {
    label: string;
    icon?: IconName;
};
type $$ComponentProps = WithIcon | WithLabel;
declare const Button: import("svelte").Component<$$ComponentProps, {}, "">;
type Button = ReturnType<typeof Button>;
export default Button;
