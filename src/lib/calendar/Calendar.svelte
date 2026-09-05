<script lang="ts" module>
	import type { ISODate, DateRange } from './date.js';

	export type CalendarMode = 'single' | 'multiple' | 'range';

	/** What `value` holds, per mode: an ISO day, a list of them, or a range. */
	export type CalendarValue = ISODate | ISODate[] | DateRange | null;

	/** The state of one day cell, handed to the `decoration` snippet. */
	export interface CalendarDay {
		date: Date;
		iso: ISODate;
		/** Day of month, 1–31. */
		day: number;
		/** False for the leading/trailing days borrowed from the neighbouring months. */
		inMonth: boolean;
		isToday: boolean;
		selected: boolean;
		disabled: boolean;
		/** Range mode: this day is the first / last day of the committed range. */
		rangeStart: boolean;
		rangeEnd: boolean;
		/** Range mode: strictly between the two endpoints. */
		inRange: boolean;
		/** Range mode: inside the range the user is currently pointing at, which is not committed yet. */
		preview: boolean;
	}

	export type { ISODate, DateRange } from './date.js';
</script>

<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import Icon from '../icon/Icon.svelte';
	import {
		addDays,
		addMonths,
		clampDate,
		diffDays,
		endOfMonth,
		isAfter,
		isBefore,
		isSameDay,
		isWithin,
		makeDate,
		parseISO,
		startOfMonth,
		startOfWeek,
		toISO,
		today as todayDate
	} from './date.js';

	interface Props {
		/** single: one day. multiple: a set of days. range: a start and an end. */
		mode?: CalendarMode;
		/**
		 * Bindable selection. Its shape follows `mode` — `'2026-03-04'`,
		 * `['2026-03-04', …]`, or `{ start, end }`. In range mode a half-made
		 * selection is written through as `{ start, end: null }`, so a caller can
		 * see that the user is mid-drag rather than having to guess.
		 */
		value?: CalendarValue;
		/** Bindable displayed month, `YYYY-MM`. Defaults to the month of the selection, else the current month. */
		month?: string;
		/** Earliest selectable day, `YYYY-MM-DD`. */
		min?: string;
		/** Latest selectable day, `YYYY-MM-DD`. */
		max?: string;
		/** Called per day; return true to make it unselectable (weekends, holidays, a booked-out day). */
		isDateDisabled?: (date: Date) => boolean;
		/** First column of the grid. 0 = Sunday, 1 = Monday (default), … 6 = Saturday. */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** BCP-47 tag for the month and weekday names. Defaults to the browser's locale. */
		locale?: string;
		/** Show the ISO-8601 week number as a leading column. */
		showWeekNumbers?: boolean;
		/** Always render six rows so the grid doesn't change height between months. */
		fixedWeeks?: boolean;
		/** Render the ‹‹ / ›› year buttons alongside the month ones. */
		yearNav?: boolean;
		/** Extra content inside a day cell, under the number — an event dot, a price, a badge. */
		decoration?: Snippet<[CalendarDay]>;
		/** Fired after every change, including the half-made `{ start, end: null }` step of a range. */
		onChange?: (value: CalendarValue) => void;
		/** Fired when the displayed month changes, `YYYY-MM`. */
		onMonthChange?: (month: string) => void;
		class?: string;
	}

	let {
		mode = 'single',
		value = $bindable(null),
		month = $bindable(''),
		min,
		max,
		isDateDisabled,
		// Monday, because en-US is the only major locale that starts on Sunday and
		// this library's callers are mostly not it. `Intl` cannot tell us the right
		// answer — `weekInfo` is still not in Safari — so it is a prop, not magic.
		weekStart = 1,
		locale,
		showWeekNumbers = false,
		fixedWeeks = true,
		yearNav = true,
		decoration,
		onChange,
		onMonthChange,
		class: className = ''
	}: Props = $props();

	const today = todayDate();
	const minDate = $derived(parseISO(min));
	const maxDate = $derived(parseISO(max));

	// ── Selection, normalised ────────────────────────────────────────────────
	// One reader per shape, so the rest of the component never branches on `mode`
	// while painting a cell.
	const selectedList = $derived.by((): ISODate[] => {
		if (mode === 'multiple') return Array.isArray(value) ? value : [];
		if (mode === 'single') return typeof value === 'string' ? [value] : [];
		return [];
	});
	const range = $derived.by((): DateRange => {
		if (mode !== 'range' || !value || typeof value === 'string' || Array.isArray(value)) {
			return { start: null, end: null };
		}
		return value;
	});
	const rangeStart = $derived(parseISO(range.start));
	const rangeEnd = $derived(parseISO(range.end));
	/** True between the two clicks of a range selection. */
	const pending = $derived(mode === 'range' && !!rangeStart && !rangeEnd);

	function firstSelected(): Date | null {
		if (mode === 'range') return parseISO(range.start);
		return parseISO(selectedList[0] ?? null);
	}

	// ── The displayed month ──────────────────────────────────────────────────
	let viewAnchor = $state(
		startOfMonth(parseISO(month ? `${month}-01` : null) ?? firstSelected() ?? today)
	);
	const viewKey = $derived(monthKey(viewAnchor));

	function monthKey(d: Date): string {
		return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	// Pull external `month` changes in. `viewKey` is untracked on purpose: reading
	// it as a dependency would make our own navigation re-run this effect and snap
	// the view straight back to the month the parent last saw.
	$effect(() => {
		const m = month;
		if (!m) return;
		untrack(() => {
			if (m === viewKey) return;
			const d = parseISO(`${m}-01`);
			if (d) viewAnchor = startOfMonth(d);
		});
	});

	function showMonth(d: Date) {
		viewAnchor = startOfMonth(d);
		if (month !== viewKey) {
			month = viewKey;
			onMonthChange?.(viewKey);
		}
	}

	// ── Localised labels ─────────────────────────────────────────────────────
	const monthLabel = $derived(
		new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewAnchor)
	);
	const dayLabelFormat = $derived(
		new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
	);

	const weekdays = $derived.by(() => {
		const short = new Intl.DateTimeFormat(locale, { weekday: 'short' });
		const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
		// Any known week works as a source of seven consecutive weekdays; 2024-01-07
		// was a Sunday, so `+ weekStart` lands on the configured first column.
		const sunday = new Date(2024, 0, 7, 12);
		return Array.from({ length: 7 }, (_, i) => {
			const d = addDays(sunday, weekStart + i);
			return { short: short.format(d), long: long.format(d) };
		});
	});

	// ── The grid ─────────────────────────────────────────────────────────────
	let previewISO = $state<string | null>(null);
	const previewDate = $derived(parseISO(previewISO));

	function dayDisabled(d: Date): boolean {
		if (!isWithin(d, minDate, maxDate)) return true;
		return isDateDisabled?.(d) ?? false;
	}

	/** The endpoints of the band to paint: the committed range, or the pending one under the pointer. */
	const band = $derived.by((): { from: Date; to: Date; committed: boolean } | null => {
		if (mode !== 'range' || !rangeStart) return null;
		if (rangeEnd) return { from: rangeStart, to: rangeEnd, committed: true };
		if (!previewDate) return null;
		const [from, to] = isBefore(previewDate, rangeStart)
			? [previewDate, rangeStart]
			: [rangeStart, previewDate];
		return { from, to, committed: false };
	});

	const weeks = $derived.by((): CalendarDay[][] => {
		const first = startOfMonth(viewAnchor);
		const last = endOfMonth(viewAnchor);
		const gridStart = startOfWeek(first, weekStart);
		const leading = diffDays(gridStart, first);
		const rows = fixedWeeks ? 6 : Math.ceil((leading + last.getDate()) / 7);
		const out: CalendarDay[][] = [];

		for (let w = 0; w < rows; w++) {
			const week: CalendarDay[] = [];
			for (let i = 0; i < 7; i++) {
				const date = addDays(gridStart, w * 7 + i);
				const iso = toISO(date);
				const inBand =
					!!band && !isBefore(date, band.from) && !isAfter(date, band.to);
				week.push({
					date,
					iso,
					day: date.getDate(),
					inMonth: date.getMonth() === viewAnchor.getMonth(),
					isToday: isSameDay(date, today),
					selected:
						selectedList.includes(iso) ||
						isSameDay(date, rangeStart) ||
						isSameDay(date, rangeEnd),
					disabled: dayDisabled(date),
					rangeStart: isSameDay(date, band?.from ?? null),
					rangeEnd: isSameDay(date, band?.to ?? null),
					inRange: inBand,
					preview: inBand && !band!.committed
				});
			}
			out.push(week);
		}
		return out;
	});

	/** ISO-8601 week number: the week containing the Thursday of `date`'s Monday-week. */
	function weekNumber(date: Date): number {
		const thursday = addDays(startOfWeek(date, 1), 3);
		const jan1 = makeDate(thursday.getFullYear(), 0, 1);
		return Math.floor(diffDays(jan1, thursday) / 7) + 1;
	}

	// ── Roving tabindex ──────────────────────────────────────────────────────
	// The grid is one tab stop. `focusedISO` is where the arrow keys are; the cell
	// holding it is the only one with tabindex 0.
	let focusedISO = $state<string | null>(null);
	let gridElement = $state<HTMLTableElement>();

	const tabStopISO = $derived.by(() => {
		const inView = (iso: string) => iso.slice(0, 7) === viewKey;
		if (focusedISO && inView(focusedISO)) return focusedISO;
		const sel = firstSelected();
		if (sel && inView(toISO(sel))) return toISO(sel);
		if (monthKey(today) === viewKey) return toISO(today);
		// Nothing to prefer: the first day of the month that is actually selectable.
		const first = startOfMonth(viewAnchor);
		for (let d = first; d.getMonth() === viewAnchor.getMonth(); d = addDays(d, 1)) {
			if (!dayDisabled(d)) return toISO(d);
		}
		return toISO(first);
	});

	async function moveFocus(to: Date) {
		const target = clampDate(to, minDate, maxDate);
		const iso = toISO(target);
		focusedISO = iso;
		// Arrow-keying past the edge of the month follows into the next one, the
		// way a spreadsheet follows a selection off-screen.
		if (monthKey(target) !== viewKey) showMonth(target);
		// Range preview tracks the keyboard too, not just the pointer — otherwise
		// a keyboard user picks the second endpoint blind.
		if (pending) previewISO = iso;
		await tick();
		gridElement?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		const from = parseISO(focusedISO ?? tabStopISO);
		if (!from) return;
		let next: Date | null = null;

		switch (e.key) {
			case 'ArrowLeft': next = addDays(from, -1); break;
			case 'ArrowRight': next = addDays(from, 1); break;
			case 'ArrowUp': next = addDays(from, -7); break;
			case 'ArrowDown': next = addDays(from, 7); break;
			case 'Home': next = startOfWeek(from, weekStart); break;
			case 'End': next = addDays(startOfWeek(from, weekStart), 6); break;
			// Shift widens the jump to a year, which is the only way to reach a
			// distant birth year without 300 PageUps.
			case 'PageUp': next = addMonths(from, e.shiftKey ? -12 : -1); break;
			case 'PageDown': next = addMonths(from, e.shiftKey ? 12 : 1); break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				pick(from);
				return;
			case 'Escape':
				// Abandon a half-made range rather than leaving the caller holding
				// `{ start, end: null }` forever.
				if (pending) {
					e.preventDefault();
					commit({ start: null, end: null });
					previewISO = null;
				}
				return;
			default:
				return;
		}

		e.preventDefault();
		moveFocus(next);
	}

	// ── Selection ────────────────────────────────────────────────────────────
	function commit(next: CalendarValue) {
		value = next;
		onChange?.(next);
	}

	function pick(date: Date) {
		if (dayDisabled(date)) return;
		const iso = toISO(date);
		focusedISO = iso;
		if (!isSameDay(date, viewAnchor) && monthKey(date) !== viewKey) showMonth(date);

		if (mode === 'single') {
			commit(iso);
			return;
		}
		if (mode === 'multiple') {
			const list = selectedList.includes(iso)
				? selectedList.filter((d) => d !== iso)
				: [...selectedList, iso].sort();
			commit(list);
			return;
		}

		// Range. A click either opens a new range, or closes the open one. Closing
		// it *before* the start swaps the endpoints rather than discarding the
		// click: the user pointed at two days and meant the span between them, and
		// restarting there would cost them a third click to say the same thing.
		if (!rangeStart || rangeEnd) {
			commit({ start: iso, end: null });
			previewISO = iso;
		} else if (isBefore(date, rangeStart)) {
			commit({ start: iso, end: range.start });
			previewISO = null;
		} else {
			commit({ start: range.start, end: iso });
			previewISO = null;
		}
	}

	function shift(months: number) {
		showMonth(addMonths(viewAnchor, months));
	}

	// Can't navigate past the bounds — the whole month would be unselectable.
	const prevDisabled = $derived(!!minDate && isBefore(endOfMonth(addMonths(viewAnchor, -1)), minDate));
	const nextDisabled = $derived(!!maxDate && isAfter(startOfMonth(addMonths(viewAnchor, 1)), maxDate));
	const prevYearDisabled = $derived(!!minDate && isBefore(endOfMonth(addMonths(viewAnchor, -12)), minDate));
	const nextYearDisabled = $derived(!!maxDate && isAfter(startOfMonth(addMonths(viewAnchor, 12)), maxDate));
</script>

<div class="calendar {className}">
	<div class="header">
		{#if yearNav}
			<button
				type="button"
				class="nav"
				disabled={prevYearDisabled}
				onclick={() => shift(-12)}
				aria-label="Previous year"
			>
				<Icon name="ChevronsLeft" size={16} />
			</button>
		{/if}
		<button
			type="button"
			class="nav"
			disabled={prevDisabled}
			onclick={() => shift(-1)}
			aria-label="Previous month"
		>
			<Icon name="ChevronLeft" size={16} />
		</button>

		<!-- Polite, not assertive: month navigation is a side effect of the user's
		     own key press, so it should not interrupt them mid-sentence. -->
		<div class="month-label" aria-live="polite">{monthLabel}</div>

		<button
			type="button"
			class="nav"
			disabled={nextDisabled}
			onclick={() => shift(1)}
			aria-label="Next month"
		>
			<Icon name="ChevronRight" size={16} />
		</button>
		{#if yearNav}
			<button
				type="button"
				class="nav"
				disabled={nextYearDisabled}
				onclick={() => shift(12)}
				aria-label="Next year"
			>
				<Icon name="ChevronsRight" size={16} />
			</button>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<table
		bind:this={gridElement}
		class="grid"
		role="grid"
		aria-label={monthLabel}
		aria-multiselectable={mode === 'multiple' ? 'true' : undefined}
		onkeydown={onKeydown}
		onmouseleave={() => (previewISO = pending ? previewISO : null)}
	>
		<thead>
			<tr>
				{#if showWeekNumbers}
					<th class="week-number" scope="col"><span class="sr-only">Week</span></th>
				{/if}
				{#each weekdays as wd}
					<th scope="col" abbr={wd.long}>{wd.short}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week}
				<tr>
					{#if showWeekNumbers}
						<th class="week-number" scope="row">{weekNumber(week[0].date)}</th>
					{/if}
					{#each week as cell}
						<td
							role="gridcell"
							aria-selected={cell.selected}
							class:in-range={cell.inRange}
							class:range-start={cell.rangeStart}
							class:range-end={cell.rangeEnd}
							class:preview={cell.preview}
						>
							<button
								type="button"
								class="day"
								data-iso={cell.iso}
								class:outside={!cell.inMonth}
								class:today={cell.isToday}
								class:selected={cell.selected}
								class:endpoint={cell.rangeStart || cell.rangeEnd}
								tabindex={cell.iso === tabStopISO ? 0 : -1}
								aria-disabled={cell.disabled}
								aria-current={cell.isToday ? 'date' : undefined}
								aria-label={dayLabelFormat.format(cell.date)}
								onclick={() => pick(cell.date)}
								onfocus={() => (focusedISO = cell.iso)}
								onmouseenter={() => pending && (previewISO = cell.iso)}
							>
								<span class="num">{cell.day}</span>
								{#if decoration}
									<span class="decoration">{@render decoration(cell)}</span>
								{/if}
							</button>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.calendar {
		display: inline-flex;
		flex-direction: column;
		gap: $space-sm;
		// The grid is sized off the day cell, so a caller can scale the whole
		// calendar by setting this one custom property.
		--glow-calendar-cell: 2.25rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.month-label {
		flex: 1;
		text-align: center;
		font-family: $font-family-header;
		font-weight: $weight-bold;
		font-size: $text-sm;
		color: var(--glow-text-primary);
		// Longest localised month names ("September 2026") must not resize the
		// header and shove the nav buttons around as the user pages through.
		min-width: 9ch;
	}

	.nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		flex: none;
		border: 0;
		border-radius: 999px;
		background: $tertiary;
		color: var(--glow-text-secondary);
		cursor: pointer;
		transition: background-color var(--glow-dur-instant) var(--glow-ease-out),
			color var(--glow-dur-instant) var(--glow-ease-out);

		&:hover:not(:disabled) {
			background: $tertiary-hover;
			color: var(--glow-text-primary);
		}

		&:active:not(:disabled) {
			background: $tertiary-active;
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}

		&:disabled {
			@include disabled-content;
			cursor: default;
		}
	}

	.grid {
		border-collapse: collapse;
		// Sunday and Saturday abbreviate to different widths in most locales; a
		// fixed layout keeps all seven columns square anyway.
		table-layout: fixed;

		th {
			width: var(--glow-calendar-cell);
			padding: 0 0 $space-xs;
			font-size: $text-xs;
			font-weight: $weight-medium;
			color: var(--glow-text-muted);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		td {
			padding: 1px 0;
		}
	}

	.week-number {
		width: 1.75rem;
		padding-right: $space-xs;
		font-size: $text-xs;
		font-weight: $weight-medium;
		color: var(--glow-text-muted);
		text-align: right;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.day {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		// A hair narrower than its cell, so two selected days side by side read as
		// two days rather than fusing into one lozenge. The range band is painted
		// on the cell instead, so it stays continuous across this gap.
		width: calc(var(--glow-calendar-cell) - 2px);
		height: var(--glow-calendar-cell);
		margin: 0 1px;
		padding: 0;
		border: 0;
		border-radius: $radius * 0.6;
		background: transparent;
		color: var(--glow-text-primary);
		font: inherit;
		font-size: $text-sm;
		line-height: 1;
		cursor: pointer;
		transition: background-color var(--glow-dur-instant) var(--glow-ease-out),
			color var(--glow-dur-instant) var(--glow-ease-out);

		&.outside {
			color: var(--glow-text-muted);
		}

		&:hover:not([aria-disabled='true']) {
			background: $tertiary-hover;
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}

		// Disabled days stay focusable and keep their tabindex: the grid is a
		// single tab stop, and a hole in it would strand arrow-key navigation.
		// `aria-disabled` is the announcement; the click handler is the guard.
		&[aria-disabled='true'] {
			@include disabled-content;
			cursor: default;
		}

		// Today reads as a ring rather than an underline, so it can't collide with
		// whatever the `decoration` snippet parks along the bottom of the cell.
		&.today {
			outline: 1px solid color-mix(in oklab, var(--glow-primary) 60%, transparent);
			outline-offset: -1px;
		}

		&.selected,
		&.endpoint {
			background: var(--glow-primary);
			@include contrast-color(var(--glow-primary), $fallback: white);
			font-weight: $weight-semibold;

			&:hover {
				background: var(--glow-primary-hover);
			}
		}
	}

	// Absolutely placed, so a decorated day's number stays on the same baseline as
	// an undecorated one instead of being nudged up by the extra content.
	.decoration {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0.2rem;
		display: flex;
		justify-content: center;
		line-height: 0;
		pointer-events: none;
	}

	// ── Range band ───────────────────────────────────────────────────────────
	// The band is painted on the cell rather than the button so it runs edge to
	// edge between days; the button keeps its own rounded shape on top.
	td.in-range {
		background: var(--glow-primary-soft-strong);

		&.range-start {
			border-top-left-radius: $radius * 0.6;
			border-bottom-left-radius: $radius * 0.6;
		}

		&.range-end {
			border-top-right-radius: $radius * 0.6;
			border-bottom-right-radius: $radius * 0.6;
		}
	}

	// A pending range is the same band at half strength with a dashed edge, so
	// "this is what you would get" never reads as "this is what you have".
	td.preview {
		background: var(--glow-primary-soft);

		.day.endpoint {
			background: color-mix(in oklab, var(--glow-primary) 65%, transparent);
		}

		&.range-start,
		&.range-end {
			outline: 1px dashed var(--glow-primary);
			outline-offset: -1px;
		}
	}
</style>
