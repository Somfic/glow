// Date arithmetic for the calendar grid. Deliberately dependency-free: a month
// grid needs a dozen operations, none of which justify shipping a date library
// to every consumer of glow.
//
// Every Date this module makes is anchored at 12:00 local time rather than
// midnight. On a spring-forward DST day midnight may not exist (Brazil, Chile,
// Iran, Lebanon…), and the browser then silently rolls such a Date to 01:00 —
// harmless on its own, but it turns `setDate(d + 1)` chains and same-day
// comparisons into off-by-one bugs that only reproduce in one timezone twice a
// year. Noon is at least 11 hours from any transition.

/** A day in the calendar, as `YYYY-MM-DD`. Timezone-free by construction. */
export type ISODate = string;

/** An inclusive date range. `end` is null while a range selection is half-made. */
export interface DateRange {
	start: ISODate | null;
	end: ISODate | null;
}

export function makeDate(year: number, month: number, day: number): Date {
	return new Date(year, month, day, 12, 0, 0, 0);
}

/** Today, at the same noon anchor every other date in here uses. */
export function today(): Date {
	const now = new Date();
	return makeDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Parse `YYYY-MM-DD` as a *local* day. `new Date(iso)` would parse it as UTC and land on the previous day west of Greenwich. */
export function parseISO(iso: string | null | undefined): Date | null {
	if (!iso) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return null;
	const d = makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return Number.isNaN(d.getTime()) ? null : d;
}

export function toISO(date: Date): ISODate {
	const yyyy = String(date.getFullYear()).padStart(4, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
	if (!a || !b) return false;
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function addDays(date: Date, days: number): Date {
	return makeDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Add months, clamping the day to the target month's length so 31 Jan + 1 month
 * is 28 Feb rather than 3 March. `new Date(y, m + 1, 31)` overflows on its own;
 * `daysInMonth` is what stops it.
 */
export function addMonths(date: Date, months: number): Date {
	const target = date.getMonth() + months;
	const year = date.getFullYear() + Math.floor(target / 12);
	const month = ((target % 12) + 12) % 12;
	return makeDate(year, month, Math.min(date.getDate(), daysInMonth(year, month)));
}

/** Day 0 of the *next* month is the last day of this one — the only month-length rule that needs no leap-year table. */
export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
	return makeDate(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
	return makeDate(
		date.getFullYear(),
		date.getMonth(),
		daysInMonth(date.getFullYear(), date.getMonth())
	);
}

/** The first day of the week `date` falls in, for a week that starts on `weekStart` (0 = Sunday). */
export function startOfWeek(date: Date, weekStart: number): Date {
	const shift = (date.getDay() - weekStart + 7) % 7;
	return addDays(date, -shift);
}

export function isBefore(a: Date, b: Date): boolean {
	return a.getTime() < b.getTime();
}

export function isAfter(a: Date, b: Date): boolean {
	return a.getTime() > b.getTime();
}

/** Inclusive on both ends; `null` bounds are open. */
export function isWithin(date: Date, min: Date | null, max: Date | null): boolean {
	if (min && isBefore(date, min) && !isSameDay(date, min)) return false;
	if (max && isAfter(date, max) && !isSameDay(date, max)) return false;
	return true;
}

export function clampDate(date: Date, min: Date | null, max: Date | null): Date {
	if (min && isBefore(date, min)) return min;
	if (max && isAfter(date, max)) return max;
	return date;
}

/**
 * Whole days from `a` to `b`. Subtracting the timestamps would be off by an hour
 * across a DST boundary — enough to floor a week count to the previous week —
 * so the comparison is done on the calendar fields via `Date.UTC`, which has no
 * offsets to shift.
 */
export function diffDays(a: Date, b: Date): number {
	const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((ub - ua) / 86_400_000);
}
