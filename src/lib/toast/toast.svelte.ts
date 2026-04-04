import type { IconName } from '../icon/Icon.svelte';

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

let nextId = 0;
export let toasts = $state<Toast[]>([]);

export function showToast(label: string, options: ToastOptions = {}) {
	const { variant = 'info', duration = 5000 } = options;

	const id = nextId++;
	const toast: Toast = { id, variant, label, duration };

	toasts.push(toast);

	if (duration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, duration);
	}

	return id;
}

export function dismissToast(id: number) {
	const index = toasts.findIndex(t => t.id === id);
	if (index !== -1) {
		toasts.splice(index, 1);
	}
}

// Convenience functions
export const toast = {
	info: (label: string, duration?: number) => showToast(label, { variant: 'info', duration }),
	success: (label: string, duration?: number) => showToast(label, { variant: 'success', duration }),
	warning: (label: string, duration?: number) => showToast(label, { variant: 'warning', duration }),
	error: (label: string, duration?: number) => showToast(label, { variant: 'error', duration }),
	dismiss: dismissToast,
};
