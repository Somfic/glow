type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
type Props = {
    position?: Position;
};
declare const ToastContainer: import("svelte").Component<Props, {}, "">;
type ToastContainer = ReturnType<typeof ToastContainer>;
export default ToastContainer;
