export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type Toast = {
    id: number;
    variant: ToastVariant;
    label: string;
    duration: number;
};
export type ToastOptions = {
    variant?: ToastVariant;
    duration?: number;
};
export declare let toasts: Toast[];
export declare function showToast(label: string, options?: ToastOptions): number;
export declare function dismissToast(id: number): void;
export declare const toast: {
    info: (label: string, duration?: number) => number;
    success: (label: string, duration?: number) => number;
    warning: (label: string, duration?: number) => number;
    error: (label: string, duration?: number) => number;
    dismiss: typeof dismissToast;
};
