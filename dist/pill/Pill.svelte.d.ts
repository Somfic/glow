import { type IconName } from '../icon/Icon.svelte';
interface BaseProps {
    size?: 'small' | 'medium' | 'large';
    onRemove?: () => void;
}
interface TextProps extends BaseProps {
    label: string;
    color?: string;
    image?: never;
    icon?: never;
}
interface ImageProps extends BaseProps {
    image: string;
    label?: string;
    color?: never;
    icon?: never;
}
interface IconProps extends BaseProps {
    icon: IconName;
    label?: string;
    color?: string;
    image?: never;
}
type Props = TextProps | ImageProps | IconProps;
declare const Pill: import("svelte").Component<Props, {}, "">;
type Pill = ReturnType<typeof Pill>;
export default Pill;
