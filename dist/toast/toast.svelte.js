let nextId = 0;
export let toasts = $state([]);
export function showToast(label, options = {}) {
    const { variant = 'info', duration = 3000 } = options;
    const id = nextId++;
    const toast = { id, variant, label, duration };
    toasts.push(toast);
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }
    return id;
}
export function dismissToast(id) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
        toasts.splice(index, 1);
    }
}
// Convenience functions
export const toast = {
    info: (label, duration) => showToast(label, { variant: 'info', duration }),
    success: (label, duration) => showToast(label, { variant: 'success', duration }),
    warning: (label, duration) => showToast(label, { variant: 'warning', duration }),
    error: (label, duration) => showToast(label, { variant: 'error', duration }),
    dismiss: dismissToast,
};
