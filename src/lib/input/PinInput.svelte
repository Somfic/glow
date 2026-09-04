<script lang="ts" module>
	export type PinType = 'numeric' | 'alphanumeric';
</script>

<script lang="ts">
	import { cursor } from '../cursor/cursor.svelte.js';

	interface Props {
		id?: string;
		/** The code so far. Always at most `length` characters of the allowed set. */
		value?: string;
		/** Number of cells. */
		length?: number;
		/** Which characters the field accepts — everything else is stripped, including on paste. */
		type?: PinType;
		/** Render each filled cell as a dot. Visual only: the value itself is untouched. */
		mask?: boolean;
		/** Submitted under this name when the field sits in a `<form>`. */
		name?: string;
		disabled?: boolean;
		readonly?: boolean;
		/** Paints the error state and sets `aria-invalid` — pair it with a message of your own. */
		invalid?: boolean;
		/** Accessible name for the field. */
		label?: string;
		/** Ids of anything describing the field (a hint, an error message). */
		describedBy?: string;
		autofocus?: boolean;
		onChange?: (value: string) => void;
		/** Fires the moment the user fills the last cell. Not fired for programmatic changes. */
		onComplete?: (value: string) => void;
	}

	let {
		id,
		value = $bindable(''),
		length = 6,
		type = 'numeric',
		mask = false,
		name,
		disabled = false,
		readonly = false,
		invalid = false,
		label = 'Verification code',
		describedBy,
		autofocus = false,
		onChange,
		onComplete
	}: Props = $props();

	let field: HTMLInputElement | undefined = $state();
	let cellEls: HTMLElement[] = $state([]);
	let focused = $state(false);
	// Where the browser's caret is, in [0, length]. `length` means "past the last
	// cell", which is where a complete code leaves it.
	let caret = $state(0);
	// Set by pointerdown so the focus handler knows a click is about to decide the
	// caret for itself, and must not jump it to the first empty cell.
	let clicking = false;

	const cells = $derived(Array.from({ length }, (_, i) => i));
	const disallowed = $derived(type === 'numeric' ? /[^0-9]/g : /[^0-9a-zA-Z]/g);
	const editable = $derived(!disabled && !readonly);
	// The cell the caret is painted in. A caret parked past the end belongs to the
	// last cell, not to a cell that does not exist.
	const activeCell = $derived(Math.min(caret, length - 1));

	/** Strip to the allowed set — this is what makes "123-456" a valid paste. */
	function sanitize(raw: string): string {
		return raw.replace(disallowed, '').slice(0, length);
	}

	function setCaret(index: number) {
		const next = Math.max(0, Math.min(length, index));
		caret = next;
		// Select the character under the caret rather than collapsing beside it, so
		// typing into a filled cell replaces that cell instead of pushing the rest
		// of the code along. On the trailing empty position there is nothing to
		// select and this collapses, which is what makes Backspace there fall back
		// to the native "delete the character before me" — the behaviour a
		// segmented field wants anyway.
		field?.setSelectionRange(next, Math.min(next + 1, value.length));
	}

	/** Which cell a pointer at `clientX` is over, or null if it missed them all. */
	function cellAt(clientX: number): number | null {
		for (let i = 0; i < cellEls.length; i++) {
			const rect = cellEls[i]?.getBoundingClientRect();
			if (rect && clientX >= rect.left && clientX <= rect.right) return i;
		}
		return null;
	}

	function commit(next: string) {
		const before = value;
		value = next;
		if (next !== before) onChange?.(next);
		// Complete on the transition into a full code only, so holding a key down
		// on the last cell (or re-typing the same digit) does not re-submit a form.
		if (next.length === length && before.length !== length) onComplete?.(next);
	}

	function handleInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		// One `input` event can carry more than one character: a paste, an iOS SMS
		// autofill, or an IME committing a composition. Reading the element's whole
		// value rather than the event's single `data` is what makes all three land.
		const next = sanitize(el.value);
		const inserted = Math.max(0, next.length - value.length);
		const at = el.selectionStart ?? next.length;
		if (el.value !== next) el.value = next;
		commit(next);
		setCaret(inserted > 1 ? next.length : Math.min(at, next.length));
	}

	function handleKeydown(e: KeyboardEvent) {
		// Arrows and Home/End are driven by hand: the native caret would land
		// wherever the one-character selection collapsed to, which is a cell off
		// from what the user asked for half the time.
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				setCaret(caret - 1);
				break;
			case 'ArrowRight':
				e.preventDefault();
				setCaret(caret + 1);
				break;
			case 'Home':
				e.preventDefault();
				setCaret(0);
				break;
			case 'End':
				e.preventDefault();
				setCaret(value.length);
				break;
		}
	}

	function handleFocus() {
		focused = true;
		// Tabbing in should start where the work is, not where the caret was left.
		if (!clicking) setCaret(value.length);
	}

	function handleBlur() {
		focused = false;
		clicking = false;
	}

	function handlePointerDown() {
		clicking = true;
	}

	function handleClick(e: MouseEvent) {
		clicking = false;
		const hit = cellAt(e.clientX);
		// Clicking a filled cell is a deliberate "fix that one". Clicking anywhere
		// past the code is not, so it lands on the first empty cell instead of
		// stranding the caret in a gap the value cannot have.
		setCaret(hit !== null && hit < value.length ? hit : value.length);
	}

	// The caret also moves for reasons we never see — a drag-select, a
	// context-menu paste, the OS moving it. Mirroring the selection back into
	// state keeps the painted caret honest.
	function syncCaret() {
		if (!field || document.activeElement !== field) return;
		caret = Math.min(field.selectionStart ?? 0, length);
	}

	$effect(() => {
		// An externally assigned `value` (a reset, a restored draft) has to be
		// pushed into the element: it is uncontrolled, so Svelte will not do it.
		const clean = sanitize(value);
		if (clean !== value) value = clean;
		if (field && field.value !== clean) field.value = clean;
	});
</script>

<svelte:document onselectionchange={syncCaret} />

<!--
	One real <input> behind a row of painted cells, rather than N inputs.
	N inputs each announce as an unlabelled one-character field, submit nothing
	on their own, and force every one of paste, undo, IME composition, caret
	movement and iOS one-time-code autofill to be reimplemented — autofill in
	particular only reliably targets a single field. With one input the whole
	code is one form value under one name, screen readers read the field and its
	value the way they read any text input, and the cells are decoration.
-->
<div
	class="pin-input"
	class:disabled
	class:readonly
	class:invalid
	class:focused
	use:cursor={{ state: editable ? 'text' : 'default' }}
>
	<!-- svelte-ignore a11y_autofocus -->
	<input
		{id}
		{name}
		{disabled}
		{readonly}
		class="pin-field"
		type="text"
		bind:this={field}
		aria-label={label}
		aria-invalid={invalid || undefined}
		aria-describedby={describedBy}
		autocomplete="one-time-code"
		inputmode={type === 'numeric' ? 'numeric' : 'text'}
		autocapitalize={type === 'numeric' ? 'off' : 'characters'}
		autocorrect="off"
		spellcheck="false"
		{autofocus}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onfocus={handleFocus}
		onblur={handleBlur}
		onpointerdown={handlePointerDown}
		onclick={handleClick}
	/>
	<div class="pin-cells" aria-hidden="true">
		{#each cells as i (i)}
			<div
				class="pin-cell"
				class:filled={i < value.length}
				class:active={focused && editable && i === activeCell}
				bind:this={cellEls[i]}
			>
				{#if i < value.length}
					<span class="pin-char">{mask ? '•' : value[i]}</span>
				{:else if focused && editable && i === activeCell}
					<span class="pin-caret"></span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.pin-input {
		position: relative;
		display: inline-flex;
	}

	// The field is the whole hit area and the only focusable thing here, but it
	// must not paint: the cells behind it draw the value.
	.pin-field {
		position: absolute;
		inset: 0;
		width: 100%;
		z-index: 1;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		font: inherit;
		color: transparent;
		caret-color: transparent;
		cursor: pointer;

		&:focus {
			outline: none;
		}

		&:disabled {
			cursor: not-allowed;
		}

		// Without this the one-character selection paints a solid highlight block
		// over whichever cell the caret is in.
		&::selection {
			background-color: transparent;
			color: transparent;
		}

		// Chrome paints its autofill background straight onto the input and ignores
		// `background`. Clipping the background to the (transparent) text is the
		// only way to keep an autofilled code from covering the cells with a yellow
		// slab; the long transition is the companion trick for the fade-in.
		&:-webkit-autofill {
			-webkit-text-fill-color: transparent;
			-webkit-background-clip: text;
			background-clip: text;
			transition: background-color var(--glow-dur-glacial) step-end;
		}
	}

	.pin-cells {
		display: inline-flex;
		gap: 0.5em;
	}

	.pin-cell {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25em;
		height: calc(2em + 2px);
		border: $border-strong;
		border-radius: $radius;
		background-color: var(--glow-bg-surface-element);
		color: var(--glow-fg);
		font-size: 1rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		font-weight: $weight-semibold;
		transition:
			border-color var(--glow-dur-fast) var(--glow-ease-out),
			box-shadow var(--glow-dur-fast) var(--glow-ease-out);
	}

	.pin-cell.active {
		border-color: var(--glow-primary);
		box-shadow: $focus-ring;
	}

	.pin-input.invalid .pin-cell {
		border-color: var(--glow-color-danger);
	}

	.pin-input.readonly .pin-cell {
		background-color: transparent;
	}

	.pin-input.disabled .pin-cell {
		@include disabled-control;
	}

	.pin-caret {
		width: 2px;
		height: 1.1em;
		border-radius: 1px;
		background-color: var(--glow-primary);
		// A blink is a loop, so it is written off the token rather than set to it:
		// `--glow-dur-*` collapse to 1ms under reduced motion, which would turn a
		// blink into a strobe. The media query below removes it outright instead.
		animation: pin-caret-blink calc(var(--glow-dur-glacial) * 2) step-end infinite;
	}

	@keyframes pin-caret-blink {
		0%,
		50% {
			opacity: 1;
		}
		50.1%,
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pin-caret {
			animation: none;
			opacity: 1;
		}
	}
</style>
