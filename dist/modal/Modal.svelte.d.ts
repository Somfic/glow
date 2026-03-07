import type { Snippet } from 'svelte';
import type { IconName } from '../icon/Icon.svelte';
type Action = {
    label: string;
    variant?: 'primary' | 'secondary' | 'ternary';
    onclick: () => void;
};
type $$ComponentProps = {
    title?: string;
    subtitle?: string;
    icon?: IconName;
    actions?: Action[];
    size?: 'small' | 'medium' | 'large' | 'full';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
    children?: Snippet;
};
declare const Modal: import("svelte").Component<$$ComponentProps, {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpenState: () => boolean;
}, "">;
type Modal = ReturnType<typeof Modal>;
export default Modal;
