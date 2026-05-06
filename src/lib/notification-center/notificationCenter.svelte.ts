import { untrack } from 'svelte';
import { toast } from '../toast/toast.svelte.js';
import type { Notification, NotificationCategory } from './types.js';

export type PushInput = Omit<Notification, 'id' | 'createdAt' | 'read'> & {
	id?: string;
	/** When true, also fires a Toast with the same title + category for ephemeral
	 *  surfacing. The notification still lands in the persistent inbox. */
	mirror?: boolean;
};

let _seq = 0;
function nextId(): string {
	_seq += 1;
	return `n${Date.now().toString(36)}_${_seq.toString(36)}`;
}

/**
 * Reactive registry of notifications. Same shape as `CommandRegistry`:
 *   - all mutations run inside `untrack()` so a calling `$effect` doesn't
 *     read-and-write the same state and trip `effect_update_depth_exceeded`.
 *   - `register` / mutators use atomic array replacement (no in-place splice)
 *     so concurrent reactive readers never observe a hole.
 *
 * Most apps want the default singleton (`notifications`); pass an instance
 * explicitly to `<NotificationCenter registry={...} />` for scoped inboxes
 * (e.g. tests, sub-workspaces).
 */
export class NotificationCenter {
	#items = $state<Notification[]>([]);
	#snoozeTimers = new Map<string, ReturnType<typeof setTimeout>>();

	get notifications(): Notification[] {
		return this.#items;
	}

	/** Newest-first list with currently-snoozed entries filtered out. */
	get visible(): Notification[] {
		const now = Date.now();
		return this.#items.filter(
			(n) => !n.snoozedUntil || n.snoozedUntil <= now
		);
	}

	get unreadCount(): number {
		return this.visible.filter((n) => !n.read).length;
	}

	push = (input: PushInput): string => {
		const { id, mirror, ...rest } = input;
		const finalId = id ?? nextId();
		const notif: Notification = {
			category: 'info',
			...rest,
			id: finalId,
			createdAt: Date.now(),
			read: false
		};
		untrack(() => {
			// Replace if same id already exists, else prepend so newest is first.
			const i = this.#items.findIndex((n) => n.id === finalId);
			if (i >= 0) {
				const next = this.#items.slice();
				next[i] = notif;
				this.#items = next;
			} else {
				this.#items = [notif, ...this.#items];
			}
		});
		if (mirror) {
			const fn = toastFor(notif.category ?? 'info');
			fn(notif.title);
		}
		return finalId;
	};

	dismiss = (id: string): void => {
		this.#clearSnoozeTimer(id);
		untrack(() => {
			this.#items = this.#items.filter((n) => n.id !== id);
		});
	};

	dismissAll = (): void => {
		for (const id of this.#snoozeTimers.keys()) this.#clearSnoozeTimer(id);
		untrack(() => {
			this.#items = [];
		});
	};

	markRead = (id: string): void => {
		untrack(() => this.#patch(id, { read: true }));
	};

	markUnread = (id: string): void => {
		untrack(() => this.#patch(id, { read: false }));
	};

	markAllRead = (): void => {
		untrack(() => {
			this.#items = this.#items.map((n) => (n.read ? n : { ...n, read: true }));
		});
	};

	/** Hide the notification for `ms` and re-mark it unread when it returns. */
	snooze = (id: string, ms: number): void => {
		const until = Date.now() + ms;
		untrack(() => this.#patch(id, { snoozedUntil: until, read: true }));
		this.#clearSnoozeTimer(id);
		const handle = setTimeout(() => {
			untrack(() => this.#patch(id, { snoozedUntil: undefined, read: false }));
			this.#snoozeTimers.delete(id);
		}, ms);
		this.#snoozeTimers.set(id, handle);
	};

	#patch(id: string, patch: Partial<Notification>): void {
		const i = this.#items.findIndex((n) => n.id === id);
		if (i < 0) return;
		const next = this.#items.slice();
		next[i] = { ...next[i], ...patch };
		this.#items = next;
	}

	#clearSnoozeTimer(id: string): void {
		const handle = this.#snoozeTimers.get(id);
		if (handle) {
			clearTimeout(handle);
			this.#snoozeTimers.delete(id);
		}
	}
}

function toastFor(category: NotificationCategory): (label: string) => number {
	switch (category) {
		case 'success':
			return toast.success;
		case 'warning':
			return toast.warning;
		case 'error':
			return toast.error;
		default:
			return toast.info;
	}
}

export function useNotifications(): NotificationCenter {
	return new NotificationCenter();
}

/** App-wide default registry. Most consumers should just import this. */
export const notifications = new NotificationCenter();
