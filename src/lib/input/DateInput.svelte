<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import Popover from '../popover/Popover.svelte';

	interface Props {
		id?: string;
		/** ISO date string (YYYY-MM-DD). Bindable. */
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		/** Earliest selectable date, ISO format (YYYY-MM-DD). */
		min?: string;
		/** Latest selectable date, ISO format (YYYY-MM-DD). */
		max?: string;
		/** Locale used for formatting in the trigger and the calendar header. Defaults to the browser's default. */
		locale?: string;
		/** Override the trigger's date display. Receives a Date or null when no value is selected. */
		format?: (date: Date | null) => string;
		onChange?: (value: string) => void;
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
		onChange
	}: Props = $props();

	let isOpen = $state(false);

	// Parse YYYY-MM-DD into a local Date (avoiding TZ shifts that `new Date(iso)` can introduce).
	function parseISO(iso: string | undefined): Date | null {
		if (!iso) return null;
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
		if (!m) return null;
		const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		return isNaN(d.getTime()) ? null : d;
	}

	function toISO(d: Date): string {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	// Same calendar day, ignoring time.
	function isSameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	const selected = $derived(parseISO(value));
	const minDate = $derived(parseISO(min));
	const maxDate = $derived(parseISO(max));

	// The month currently being displayed in the calendar (independent of `value`
	// so users can browse without having a selection yet).
	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth());

	// When the popover opens, jump the calendar to the selected month (or today).
	$effect(() => {
		if (!isOpen) return;
		const anchor = selected ?? new Date();
		viewYear = anchor.getFullYear();
		viewMonth = anchor.getMonth();
	});

	const today = new Date();

	const monthLabel = $derived(
		new Date(viewYear, viewMonth, 1).toLocaleDateString(locale, {
			month: 'long',
			year: 'numeric'
		})
	);

	const weekdayLabels = $derived.by(() => {
		const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
		// Anchor on a known Sunday so each weekday name is in the right slot.
		const sunday = new Date(2024, 0, 7);
		const labels: string[] = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(sunday);
			d.setDate(sunday.getDate() + i);
			labels.push(fmt.format(d));
		}
		return labels;
	});

	type Cell = { date: Date; inMonth: boolean; disabled: boolean };

	const cells = $derived.by((): Cell[] => {
		const first = new Date(viewYear, viewMonth, 1);
		const startWeekday = first.getDay(); // 0 = Sunday
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const out: Cell[] = [];

		// Leading days from the previous month.
		for (let i = startWeekday - 1; i >= 0; i--) {
			const d = new Date(viewYear, viewMonth, -i);
			out.push({ date: d, inMonth: false, disabled: outOfRange(d) });
		}
		// Days in the current month.
		for (let day = 1; day <= daysInMonth; day++) {
			const d = new Date(viewYear, viewMonth, day);
			out.push({ date: d, inMonth: true, disabled: outOfRange(d) });
		}
		// Trailing days to fill the final week (always render 6 rows of 7).
		while (out.length < 42) {
			const last = out[out.length - 1].date;
			const next = new Date(last);
			next.setDate(last.getDate() + 1);
			out.push({ date: next, inMonth: false, disabled: outOfRange(next) });
		}
		return out;
	});

	function outOfRange(d: Date): boolean {
		if (minDate && d < minDate) return true;
		if (maxDate && d > maxDate) return true;
		return false;
	}

	function pick(d: Date) {
		if (outOfRange(d)) return;
		value = toISO(d);
		onChange?.(value);
		isOpen = false;
	}

	function shiftMonth(delta: number) {
		const m = viewMonth + delta;
		viewYear = viewYear + Math.floor(m / 12);
		viewMonth = ((m % 12) + 12) % 12;
	}

	function jumpToToday() {
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		onChange?.('');
	}

	const triggerText = $derived.by(() => {
		if (format) return format(selected);
		if (!selected) return placeholder;
		return selected.toLocaleDateString(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	});
</script>

<Popover bind:open={isOpen} {disabled} align="left">
	{#snippet trigger()}
		<button
			{id}
			type="button"
			class="date-trigger"
			class:open={isOpen}
			class:placeholder={!selected}
			{disabled}
		>
			<Icon name="Calendar" size={16} />
			<span class="value-text">{triggerText}</span>
			{#if clearable && selected && !disabled}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<span class="clear" role="button" tabindex="-1" onclick={clear}>
					<Icon name="X" size={14} />
				</span>
			{/if}
			<Icon name="ChevronDown" size={14} />
		</button>
	{/snippet}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="date-popover" onmousedown={(e) => e.stopPropagation()}>
		<div class="header">
			<button type="button" class="nav-btn" onclick={() => shiftMonth(-1)} aria-label="Previous month">
				<Icon name="ChevronLeft" size={16} />
			</button>
			<button type="button" class="month-label" onclick={jumpToToday} title="Jump to today">
				{monthLabel}
			</button>
			<button type="button" class="nav-btn" onclick={() => shiftMonth(1)} aria-label="Next month">
				<Icon name="ChevronRight" size={16} />
			</button>
		</div>

		<div class="grid weekdays" role="row">
			{#each weekdayLabels as wd}
				<span class="weekday">{wd}</span>
			{/each}
		</div>

		<div class="grid days" role="grid">
			{#each cells as cell}
				<button
					type="button"
					class="day"
					class:in-month={cell.inMonth}
					class:today={isSameDay(cell.date, today)}
					class:selected={selected && isSameDay(cell.date, selected)}
					disabled={cell.disabled}
					onclick={() => pick(cell.date)}
				>
					{cell.date.getDate()}
				</button>
			{/each}
		</div>
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
		transition: border-color 0.15s ease, box-shadow 0.15s ease;

		&.open {
			border-color: var(--glow-primary);
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&:hover:not(:disabled) {
			background-color: rgba($fg, 0.05);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&.placeholder .value-text {
			color: rgba($fg, 0.5);
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
		color: rgba($fg, 0.6);
		cursor: pointer;
		border-radius: 999px;
		padding: 2px;

		&:hover {
			color: var(--glow-fg);
			background: rgba($fg, 0.08);
		}
	}

	.date-popover {
		padding: 0.75rem;
		min-width: 280px;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.month-label {
		flex: 1;
		text-align: center;
		font-weight: $weight-bold;
		font-size: $text-sm;
		color: var(--glow-fg);
		background: transparent;
		border: 0;
		padding: 0.25rem 0.5rem;
		border-radius: $radius * 0.4;
		cursor: pointer;

		&:hover {
			background: rgba($fg, 0.06);
		}
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		background: transparent;
		border: 0;
		color: var(--glow-text-secondary);
		cursor: pointer;

		&:hover {
			background: rgba($fg, 0.06);
			color: var(--glow-fg);
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.weekdays {
		margin-bottom: 0.25rem;

		.weekday {
			font-size: $text-xs;
			color: var(--glow-text-muted);
			text-align: center;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0.25rem 0;
		}
	}

	.day {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2rem;
		font: inherit;
		font-size: $text-sm;
		color: rgba($fg, 0.45);
		background: transparent;
		border: 0;
		border-radius: $radius * 0.5;
		cursor: pointer;
		transition: background-color 0.1s ease, color 0.1s ease;

		&.in-month {
			color: var(--glow-fg);
		}

		&:hover:not(:disabled) {
			background: rgba($fg, 0.06);
		}

		&.today {
			outline: 2px solid rgba($primary, 0.45);
		}

		&.selected {
			background: var(--glow-primary);
			color: white;

			&:hover {
				background: var(--glow-primary);
			}
		}

		&:disabled {
			opacity: 0.35;
			cursor: not-allowed;
		}
	}
</style>
