<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Icon from '../icon/Icon.svelte';
	import Popover from '../popover/Popover.svelte';
	import Calendar, {
		type CalendarDay,
		type CalendarMode,
		type CalendarValue,
		type DateRange
	} from './Calendar.svelte';
	import { parseISO } from './date.js';

	interface Props {
		id?: string;
		/** single: one day. multiple: a set of days. range: a start and an end. */
		mode?: CalendarMode;
		/** Bindable selection, in the shape `mode` implies. See `<Calendar>`. */
		value?: CalendarValue;
		/** Bindable popover state. */
		open?: boolean;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		min?: string;
		max?: string;
		isDateDisabled?: (date: Date) => boolean;
		weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		locale?: string;
		showWeekNumbers?: boolean;
		/** Which edge of the trigger the calendar anchors to. */
		align?: 'left' | 'right' | 'stretch';
		/** Replace the trigger's text. Receives the current value. */
		format?: (value: CalendarValue) => string;
		decoration?: Snippet<[CalendarDay]>;
		onChange?: (value: CalendarValue) => void;
	}

	let {
		id,
		mode = 'single',
		value = $bindable(mode === 'range' ? { start: null, end: null } : mode === 'multiple' ? [] : null),
		open = $bindable(false),
		placeholder = 'Select date',
		disabled = false,
		clearable = false,
		min,
		max,
		isDateDisabled,
		weekStart = 1,
		locale,
		showWeekNumbers = false,
		align = 'left',
		format,
		decoration,
		onChange
	}: Props = $props();

	let panel = $state<HTMLDivElement>();

	const dayFormat = $derived(
		new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
	);

	function label(iso: string | null): string {
		const d = parseISO(iso);
		return d ? dayFormat.format(d) : '';
	}

	const triggerText = $derived.by(() => {
		if (format) return format(value);
		if (mode === 'range') {
			const r = (value ?? {}) as DateRange;
			if (!r.start) return placeholder;
			// A half-made range still shows its start, with the end left as an
			// ellipsis — the trigger should never go blank mid-selection.
			return `${label(r.start)} – ${r.end ? label(r.end) : '…'}`;
		}
		if (mode === 'multiple') {
			const list = (value as string[] | null) ?? [];
			if (list.length === 0) return placeholder;
			if (list.length === 1) return label(list[0]);
			return `${list.length} dates`;
		}
		return typeof value === 'string' && value ? label(value) : placeholder;
	});

	const empty = $derived.by(() => {
		if (mode === 'range') return !((value ?? {}) as DateRange).start;
		if (mode === 'multiple') return ((value as string[] | null) ?? []).length === 0;
		return !value;
	});

	function handleChange(next: CalendarValue) {
		onChange?.(next);
		// Close only once the selection is a complete answer: a single day, or both
		// ends of a range. `multiple` never auto-closes — there is no way to know
		// the user is finished picking.
		if (mode === 'single') open = false;
		else if (mode === 'range' && (next as DateRange)?.end) open = false;
	}

	function clear(e: MouseEvent) {
		// The clear affordance sits inside the trigger, so its click would otherwise
		// bubble up and open the popover we just emptied.
		e.stopPropagation();
		const blank: CalendarValue =
			mode === 'range' ? { start: null, end: null } : mode === 'multiple' ? [] : null;
		value = blank;
		onChange?.(blank);
	}

	// Opening moves focus into the grid, so the whole control is operable from the
	// keyboard without a Tab into a portalled panel that is not a DOM sibling.
	$effect(() => {
		if (!open) return;
		tick().then(() => panel?.querySelector<HTMLElement>('.day[tabindex="0"]')?.focus());
	});
</script>

<Popover bind:open {disabled} {align}>
	{#snippet trigger()}
		<button
			{id}
			type="button"
			class="date-picker-trigger"
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
	<div class="date-picker-panel" bind:this={panel} role="dialog" aria-label="Choose a date" aria-modal="false">
		<Calendar
			{mode}
			bind:value
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

	.date-picker-trigger {
		@include control-frame;
		display: flex;
		align-items: center;
		gap: $space-sm;
		width: 100%;
		background-color: var(--glow-bg-surface-element);
		color: var(--glow-text-primary);
		font: inherit;
		text-align: left;
		cursor: pointer;
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
		padding: 2px;
		border-radius: 999px;
		color: var(--glow-text-secondary);
		cursor: pointer;

		&:hover {
			background: $tertiary-hover;
			color: var(--glow-text-primary);
		}
	}

	.date-picker-panel {
		padding: $space-sm;
	}
</style>
