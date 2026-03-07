import type { ToastVariant } from './toast.svelte.js';
type Props = {
    variant: ToastVariant;
    label: string;
    onDismiss?: () => void;
};
declare const Toast: import("svelte").Component<Props, {}, "">;
type Toast = ReturnType<typeof Toast>;
export default Toast;
