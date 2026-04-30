<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import Popover from '../popover/Popover.svelte';

	interface Props {
		id?: string;
		/** "HH:MM" in 24-hour clock. Bindable. */
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		/** Earliest selectable time, "HH:MM" 24-hour. */
		min?: string;
		/** Latest selectable time, "HH:MM" 24-hour. */
		max?: string;
		/** Minute granularity in the picker. Default 5. */
		step?: number;
		/** Display format. Defaults to 24-hour. */
		hourFormat?: '12' | '24';
		/** Locale used to format the trigger label. */
		locale?: string;
		onChange?: (value: string) => void;
	}

	let {
		id,
		value = $bindable(''),
		placeholder = 'Select time',
		disabled = false,
		clearable = false,
		min,
		max,
		step = 5,
		hourFormat = '24',
		locale,
		onChange
	}: Props = $props();

	let isOpen = $state(false);

	function parse(t: string | undefined): { h: number; m: number } | null {
		if (!t) return null;
		const m = /^(\d{1,2}):(\d{2})$/.exec(t);
		if (!m) return null;
		const h = Number(m[1]);
		const min = Number(m[2]);
		if (h < 0 || h > 23 || min < 0 || min > 59) return null;
		return { h, m: min };
	}

	function fmtISO(h: number, m: number): string {
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}

	function toMinutes(t: { h: number; m: number }): number {
		return t.h * 60 + t.m;
	}

	const selected = $derived(parse(value));
	const minT = $derived(parse(min));
	const maxT = $derived(parse(max));

	function outOfRange(h: number, m: number): boolean {
		const total = h * 60 + m;
		if (minT && total < toMinutes(minT)) return true;
		if (maxT && total > toMinutes(maxT)) return true;
		return false;
	}

	const triggerText = $derived.by(() => {
		if (!selected) return placeholder;
		// Use Intl on a synthetic Date so locale formatting kicks in.
		const d = new Date();
		d.setHours(selected.h, selected.m, 0, 0);
		return d.toLocaleTimeString(locale, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: hourFormat === '12'
		});
	});

	// Hours displayed in the picker — depends on format.
	const hours = $derived.by(() => {
		if (hourFormat === '12') {
			// 12, 1, 2, ..., 11 — order matters for scrolling.
			return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
		}
		return Array.from({ length: 24 }, (_, i) => i);
	});

	const minutes = $derived(
		Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)
	);

	let pickerHour = $state(0);
	let pickerMinute = $state(0);
	let pickerPM = $state(false);

	// Sync picker state when popover opens — anchor on selection or "now".
	$effect(() => {
		if (!isOpen) return;
		const anchor = selected ?? { h: new Date().getHours(), m: 0 };
		pickerHour = anchor.h;
		pickerMinute = anchor.m;
		pickerPM = anchor.h >= 12;
	});

	// Convert picker state back to 24-hour { h, m }.
	function pickerToISO(): { h: number; m: number } {
		if (hourFormat === '24') {
			return { h: pickerHour, m: pickerMinute };
		}
		// 12-hour mode: pickerHour is 1-12 (or 12 for noon/midnight).
		let h = pickerHour % 12;
		if (pickerPM) h += 12;
		return { h, m: pickerMinute };
	}

	function pickerHourFor(displayHour: number): number {
		// In 24-hour mode displayHour IS the picker value. In 12-hour, the
		// clicked button is 1-12 — store directly.
		return hourFormat === '24' ? displayHour : displayHour;
	}

	function commit() {
		const t = pickerToISO();
		if (outOfRange(t.h, t.m)) return;
		value = fmtISO(t.h, t.m);
		onChange?.(value);
	}

	function pickHour(displayHour: number) {
		pickerHour = pickerHourFor(displayHour);
		commit();
	}

	function pickMinute(m: number) {
		pickerMinute = m;
		commit();
	}

	function setMeridiem(pm: boolean) {
		if (pickerPM === pm) return;
		pickerPM = pm;
		commit();
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		onChange?.('');
	}

	// Highlight which row/column is the active selection in the picker.
	function isHourSelected(displayHour: number): boolean {
		if (hourFormat === '24') return displayHour === pickerHour;
		// 12-hour mode — pickerHour can be 0..23, normalise to 12-hour band.
		const display = pickerHour === 0 || pickerHour === 12 ? 12 : pickerHour % 12;
		return displayHour === display;
	}

	function isHourOutOfRange(displayHour: number): boolean {
		const h =
			hourFormat === '24'
				? displayHour
				: pickerPM
				? displayHour === 12
					? 12
					: displayHour + 12
				: displayHour === 12
				? 0
				: displayHour;
		return outOfRange(h, pickerMinute);
	}

	function isMinuteOutOfRange(m: number): boolean {
		const t = pickerToISO();
		return outOfRange(t.h, m);
	}
</script>

<Popover bind:open={isOpen} {disabled} align="left">
	{#snippet trigger()}
		<button
			{id}
			type="button"
			class="time-trigger"
			class:open={isOpen}
			class:placeholder={!selected}
			{disabled}
		>
			<Icon name="Clock" size={16} />
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
	<div class="time-popover" onmousedown={(e) => e.stopPropagation()}>
		<div class="columns">
			<div class="column" data-label="Hours">
				{#each hours as h}
					<button
						type="button"
						class="cell"
						class:selected={isHourSelected(h)}
						disabled={isHourOutOfRange(h)}
						onclick={() => pickHour(h)}
					>
						{String(h).padStart(2, '0')}
					</button>
				{/each}
			</div>
			<div class="column" data-label="Minutes">
				{#each minutes as m}
					<button
						type="button"
						class="cell"
						class:selected={pickerMinute === m}
						disabled={isMinuteOutOfRange(m)}
						onclick={() => pickMinute(m)}
					>
						{String(m).padStart(2, '0')}
					</button>
				{/each}
			</div>
			{#if hourFormat === '12'}
				<div class="column meridiem">
					<button
						type="button"
						class="cell"
						class:selected={!pickerPM}
						onclick={() => setMeridiem(false)}
					>
						AM
					</button>
					<button
						type="button"
						class="cell"
						class:selected={pickerPM}
						onclick={() => setMeridiem(true)}
					>
						PM
					</button>
				</div>
			{/if}
		</div>
	</div>
</Popover>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.time-trigger {
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

	.time-popover {
		padding: 0.5rem;
	}

	.columns {
		display: flex;
		gap: 0.5rem;
		max-height: 220px;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 3.5rem;
		overflow-y: auto;
		padding: 0.25rem;
		scrollbar-width: thin;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba($fg, 0.15);
			border-radius: 3px;
		}

		&.meridiem {
			min-width: 3rem;
			justify-content: flex-start;
			overflow: hidden;
		}
	}

	.cell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2rem;
		padding: 0 0.5rem;
		font: inherit;
		font-variant-numeric: tabular-nums;
		font-size: $text-sm;
		color: var(--glow-fg);
		background: transparent;
		border: 0;
		border-radius: $radius * 0.5;
		cursor: pointer;
		transition: background-color 0.1s ease, color 0.1s ease;

		&:hover:not(:disabled) {
			background: rgba($fg, 0.06);
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
