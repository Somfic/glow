import type { IconProp } from '../icon/Icon.svelte';

export type ConfirmVariant = 'default' | 'danger';

export type DialogKind = 'confirm' | 'alert' | 'prompt';

export interface ConfirmOptions {
	/** Header line. Defaults to "Are you sure?" for `confirm`. */
	title?: string;
	/** Body copy under the title. */
	message?: string;
	/** Label on the accepting button. */
	confirmLabel?: string;
	/** Label on the dismissing button. */
	cancelLabel?: string;
	/**
	 * `danger` paints the accepting button with Button's danger variant and puts
	 * a warning glyph beside the message. Use it for anything that destroys data.
	 */
	variant?: ConfirmVariant;
	/** Glyph beside the message. Defaults to a warning triangle when `danger`. */
	icon?: IconProp;
}

export type AlertOptions = Omit<ConfirmOptions, 'cancelLabel'>;

export interface PromptOptions extends ConfirmOptions {
	/** Starting value of the field. */
	value?: string;
	placeholder?: string;
	/** Disable the accepting button while the field is empty. */
	required?: boolean;
}

export type DialogRequest = {
	id: number;
	kind: DialogKind;
	options: ConfirmOptions & PromptOptions;
	/** Value the promise settles with when the dialog is dismissed rather than accepted. */
	dismissValue: boolean | string | null | undefined;
	/** Whatever had focus when the dialog was asked for. */
	opener: Element | null;
	settle: (value: never) => void;
};

let nextId = 0;

/**
 * Pending dialogs, oldest first. `<ConfirmDialog>` renders `dialogs[0]` only:
 * two overlapping "are you sure?" scrims is never what the caller meant, so a
 * second request waits its turn instead of stacking.
 */
export const dialogs = $state<DialogRequest[]>([]);

function request<T>(
	kind: DialogKind,
	options: ConfirmOptions & PromptOptions,
	dismissValue: T
): Promise<T> {
	// Prerender and SSR have no dialog host and no user, so a promise here would
	// never settle and would hang whatever awaited it. Answer as if dismissed.
	if (typeof document === 'undefined') return Promise.resolve(dismissValue);

	return new Promise<T>((resolve) => {
		dialogs.push({
			id: nextId++,
			kind,
			options,
			dismissValue: dismissValue as DialogRequest['dismissValue'],
			opener: document.activeElement,
			settle: resolve as DialogRequest['settle']
		});
	});
}

/** Settle the dialog with `id` and drop it from the queue. Called by the host. */
export function settleDialog(id: number, value: boolean | string | null | undefined) {
	const index = dialogs.findIndex((d) => d.id === id);
	if (index === -1) return;
	const [pending] = dialogs.splice(index, 1);
	pending.settle(value as never);

	// Modal restores focus too, but it captures the opener a tick after the
	// click — by which time a <Button> whose handler awaited this promise has
	// already disabled itself and dropped focus to <body>. Capturing at the
	// call site and restoring here is the only version that survives that.
	// Deferred a task because the same button is still disabled at this point:
	// it is re-enabled by the continuation this `settle` just released.
	// Only once the queue is empty, so the restore cannot fight the focus the
	// next dialog is about to place.
	if (dialogs.length === 0 && pending.opener instanceof HTMLElement) {
		const opener = pending.opener;
		setTimeout(() => opener.focus(), 0);
	}
}

const asOptions = <T extends ConfirmOptions>(input: string | T): T =>
	(typeof input === 'string' ? { message: input } : input) as T;

/**
 * A promise-returning replacement for `window.confirm`.
 *
 * ```ts
 * if (await confirm({ title: 'Delete project?', variant: 'danger' })) …
 * ```
 *
 * Resolves `true` when accepted, `false` when cancelled, escaped or dismissed.
 */
export function confirm(options: string | ConfirmOptions = {}): Promise<boolean> {
	return request('confirm', asOptions(options), false);
}

/** A promise-returning `window.alert`. Resolves once the dialog is dismissed. */
export function alert(options: string | AlertOptions = {}): Promise<void> {
	return request('alert', asOptions(options), undefined);
}

/**
 * A promise-returning `window.prompt`. Resolves with the entered string, or
 * `null` if cancelled — including when the field was left empty and submitted.
 */
export function prompt(options: string | PromptOptions = {}): Promise<string | null> {
	return request('prompt', asOptions(options), null);
}

/**
 * Namespaced form, for callers that would rather not shadow the three globals
 * of the same name: `dialog.confirm(…)`.
 */
export const dialog = { confirm, alert, prompt };
