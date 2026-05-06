import type { IconProp } from '../icon/Icon.svelte';

export type NotificationCategory =
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
	| 'mention';

export type NotificationAction = {
	label: string;
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	/** Invoked when clicked. Receives the notification so handlers can dismiss it,
	 *  navigate, etc. without having to capture it via closure. */
	onclick: (n: Notification) => void;
};

export type Notification = {
	/** Stable identifier — used as the registry key. Auto-generated if omitted. */
	id: string;
	title: string;
	body?: string;
	/** Tints the row's left edge and the optional category dot. Defaults to 'info'. */
	category?: NotificationCategory;
	/** Leading icon. Ignored when `image` is set. */
	icon?: IconProp;
	/** Leading avatar URL — circular, takes precedence over `icon`. */
	image?: string;
	/** Grouping key + section header label when `groupBy="source"`
	 *  (e.g. "Comments", "Builds", "Alice Becker"). */
	source?: string;
	/** Optional click-through. When set, clicking the row navigates here. */
	href?: string;
	/** Up to 2 inline action buttons rendered on the row. */
	actions?: NotificationAction[];
	/** Epoch ms; auto-set on push. */
	createdAt: number;
	read: boolean;
	/** Epoch ms; null/undefined until snoozed. While in the future, the row is
	 *  hidden from the visible list. */
	snoozedUntil?: number;
};
