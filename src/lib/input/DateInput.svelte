<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Icon from '../icon/Icon.svelte';
	import Popover from '../popover/Popover.svelte';
	import Calendar, {
		type CalendarDay,
		type CalendarMode,
		type CalendarValue,
		type DateRange
	} from '../calendar/Calendar.svelte';
	import { parseISO } from '../calendar/date.js';

	interface Props {
		id?: string;
		/**
		 * ISO date string (YYYY-MM-DD). Bindable. In `multiple` mode it is an array
		 * of them, and in `range` mode a `{ start, end }` pair — both still ISO.
		 */
		value?: string | string[] | DateRange;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		/** Earliest selectable date, ISO format (YYYY-MM-DD). */
		min?: string;
		/** Latest selectable date, ISO format (YYYY-MM-DD). */
		max?: string;
		/** Locale used for formatting in the trigger and the calendar header. Defaults to the browser's default. */
		locale?: string;
		/** Override the trigger's date display. Receives a Date or null when no value is selected; in multiple/range mode it formats each date in turn. */
		format?: (date: Date | null) => string;
		/** One day, a set of days, or a span. */
		mode?: CalendarMode;
		/** Called per day; return true to make it unselectable (weekends, holidays, a booked-out day). */
		isDateDisabled?: (date: Date) => boolean;
		/** First column of the calendar. 0 = Sunday, 1 = Monday (default). */
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		/** Show the ISO-8601 week number as a leading column. */
		showWeekNumbers?: boolean;
		/** Extra content inside a day cell, under the number — an event dot, a price, a badge. */
		decoration?: Snippet<[CalendarDay]>;
		/** Which edge of the trigger the calendar anchors to. */
		align?: 'left' | 'right' | 'stretch';
		/** Bindable open state of the calendar popover. */
		open?: boolean;
		/**
		 * `any` rather than the value union: existing callers pass
		 * `(value: string) => void`, and under `strictFunctionTypes` a widened
		 * parameter would make every one of them a type error for no benefit.
		 */
		onChange?: (value: any) => void;
	}

	let {
		id,
		value = $bindable(''),
		placeholder = 'Select date',
		disabled = false,
		clearable = false,
		min,
		max,
		locale,
		format,
		mode = 'single',
		isDateDisabled,
		weekStart = 1,
		showWeekNumbers = false,
		decoration,
		align = 'left',
		open = $bindable(false),
		onChange
	}: Props = $props();

	let triggerElement = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();

	// The grid, the keyboard model and the date arithmetic all live in <Calendar>.
	// This component is the field: a trigger, a popover, and the formatting of
	// whatever was picked.
	const asCalendarValue = $derived.by((): CalendarValue => {
		if (mode === 'range') {
			const r = value as DateRange | undefined;
			return r && typeof r === 'object' && !Array.isArray(r) ? r : { start: null, end: null };
		}
		if (mode === 'multiple') return Array.isArray(value) ? value : [];
		return typeof value === 'string' && value ? value : null;
	});

	const dayFormat = $derived(
		new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
	);

	function label(iso: string | null): string {
		const d = parseISO(iso);
		if (format) return format(d);
		return d ? dayFormat.format(d) : '';
	}

	const empty = $derived.by(() => {
		if (mode === 'range') return !(asCalendarValue as DateRange).start;
		if (mode === 'multiple') return (asCalendarValue as string[]).length === 0;
		return !asCalendarValue;
	});

	const triggerText = $derived.by(() => {
		if (mode === 'range') {
			const r = asCalendarValue as DateRange;
			if (!r.start) return placeholder;
			// A half-made range still shows its start, with the end left as an
			// ellipsis — the trigger should never go blank mid-selection.
			return `${label(r.start)} – ${r.end ? label(r.end) : '…'}`;
		}
		if (mode === 'multiple') {
			const list = asCalendarValue as string[];
			if (list.length === 0) return placeholder;
			return list.length === 1 ? label(list[0]) : `${list.length} dates`;
		}
		// Single mode keeps its original contract: `format` owns the whole string,
		// including what an empty value looks like.
		if (format) return format(parseISO(asCalendarValue as string | null));
		return empty ? placeholder : label(asCalendarValue as string);
	});

	function handleChange(next: CalendarValue) {
		value = (next ?? '') as typeof value;
		onChange?.(value);
		// Close on a complete answer only: one day, or both ends of a range.
		// `multiple` never auto-closes — there is no way to know the user is done.
		if (mode === 'single') open = false;
		else if (mode === 'range' && (next as DateRange)?.end) open = false;
	}

	function clear(e: MouseEvent) {
		// The clear affordance sits inside the trigger, so its click would otherwise
		// bubble up and open the popover we just emptied.
		e.stopPropagation();
		const blank = mode === 'range' ? { start: null, end: null } : mode === 'multiple' ? [] : '';
		value = blank as typeof value;
		onChange?.(value);
	}

	// Opening moves focus into the grid, and closing hands it back to the trigger:
	// the panel is portalled to <body>, so it is not a DOM sibling of the trigger
	// and Tab alone would never reach it or come back.
	let wasOpen = false;
	$effect(() => {
		if (open) {
			wasOpen = true;
			tick().then(() => panel?.querySelector<HTMLElement>('.day[tabindex="0"]')?.focus());
			return;
		}
		// Only after an open we closed — without this, the effect's first run on a
		// page full of date fields would race them all to steal the initial focus.
		if (!wasOpen) return;
		wasOpen = false;
		const active = document.activeElement;
		if (!active || active === document.body || panel?.contains(active)) triggerElement?.focus();
	});
</script>

<Popover bind:open {disabled} {align}>
	{#snippet trigger()}
		<button
			bind:this={triggerElement}
			{id}
			type="button"
			class="date-trigger"
			class:open
			class:placeholder={empty}
			{disabled}
			aria-haspopup="dialog"
			aria-expanded={open}
		>
			<Icon name={mode === 'range' ? 'CalendarRange' : 'Calendar'} size={16} />
			<span class="value-text">{triggerText}</span>
			{#if clearable && !empty && !disabled}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<span class="clear" role="button" tabindex="-1" aria-label="Clear date" onclick={clear}>
					<Icon name="X" size={14} />
				</span>
			{/if}
			<Icon name="ChevronDown" size={14} />
		</button>
	{/snippet}

	<!-- The trigger advertises aria-haspopup="dialog", so the panel has to be one. -->
	<div
		class="date-popover"
		bind:this={panel}
		role="dialog"
		aria-label="Choose a date"
		aria-modal="false"
	>
		<Calendar
			{mode}
			value={asCalendarValue}
			{min}
			{max}
			{isDateDisabled}
			{weekStart}
			{locale}
			{showWeekNumbers}
			{decoration}
			onChange={handleChange}
		/>
	</div>
</Popover>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.date-trigger {
		@include control-frame;
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		background-color: var(--glow-bg-surface-element);
		color: var(--glow-fg);
		font: inherit;
		cursor: pointer;
		text-align: left;
		transition: border-color var(--glow-dur-fast) var(--glow-ease-out),
			box-shadow var(--glow-dur-fast) var(--glow-ease-out);

		&.open,
		&:focus-visible {
			outline: none;
			border-color: var(--glow-primary);
			box-shadow: $focus-ring;
		}

		&:hover:not(:disabled) {
			background-color: var(--glow-state-hover);
		}

		&:disabled {
			@include disabled-control;
		}

		&.placeholder .value-text {
			color: var(--glow-text-muted);
		}

		.value-text {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--glow-text-secondary);
		cursor: pointer;
		border-radius: $radius-full;
		padding: 2px;

		&:hover {
			color: var(--glow-text-primary);
			background: $tertiary-hover;
		}
	}

	.date-popover {
		padding: $space-sm;
	}
</style>
