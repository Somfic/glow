<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import { FIELD_CONTEXT_KEY, type FieldContext, type FieldLayout, type FieldTier } from './fieldContext.js';

	interface Props {
		/** The field's label. Owns the label — Inputs nested inside should not also set their own label prop. */
		label: string;
		/** Optional icon rendered to the left of the label. */
		leading?: IconProp;
		/** Short help text. Renders under the label (row) or under the label cluster (stack). */
		hint?: string;
		/** Validation error message. When set, the field renders in an error state and replaces the hint visually. */
		error?: string;
		/** Required indicator (subtle). */
		required?: boolean;
		/** Disable the entire row visually (the inner control is responsible for its own disabled prop). */
		disabled?: boolean;
		/** Layout. `horizontal` (default) puts the control to the right of the label; `vertical` puts it underneath, full width. */
		layout?: FieldLayout;
		/**
		 * Vertical alignment of the control relative to the label-cluster in
		 * `horizontal` layout. `start` (default) keeps the control next to the
		 * label even when a hint/error hangs below. `center` vertically centers
		 * the row — best for compact, single-line key/value lists.
		 */
		align?: 'start' | 'center';
		/**
		 * Visibility tier. `secondary` and `advanced` get muted styling so they
		 * recede when stacked with `primary` rows. `<SettingsShell>` may later
		 * use this to fold tiers into "More" or "Advanced" disclosures.
		 */
		tier?: FieldTier;
		/** Optional reset-to-default affordance. */
		reset?: { onReset: () => void; tooltip?: string };
		/** Stable id for nav anchoring / persistence. */
		id?: string;
		children: Snippet;
	}

	let {
		label,
		leading,
		hint,
		error,
		required = false,
		disabled = false,
		layout = 'horizontal',
		align = 'start',
		tier = 'primary',
		reset,
		id,
		children
	}: Props = $props();

	// Inputs rendered as children register their type here so we can know if
	// the wrapped control is non-native (select / multiselect / radio) and
	// needs a synthetic click on label-click. Layout is NOT influenced by this.
	let registeredType = $state<string | null>(null);

	// Stable id for the inner control. The label's `for` points at this so
	// clicking the label focuses the right element. If the caller provided
	// a Field `id` (used for nav anchoring), we still derive a separate
	// control id to keep the two concerns independent.
	const controlId = `field-${Math.random().toString(36).slice(2, 11)}`;

	const ctx: FieldContext = {
		isInField: true,
		setControlType: (type) => {
			registeredType = type;
		},
		getError: () => error,
		getControlId: () => controlId
	};
	setContext(FIELD_CONTEXT_KEY, ctx);

	let rootEl = $state<HTMLDivElement | null>(null);

	// Types whose control is a button under the hood — a checkbox, a switch, a
	// menu trigger. `for=`/`focus()` does nothing useful on those: a <button> is
	// not a labelable element, so the browser never forwards the label click,
	// and focusing a menu trigger leaves the menu shut. They want a real click.
	const ACTIVATE_ON_CLICK = new Set(['select', 'multiselect', 'checkbox', 'toggle']);

	// HTML's labelable elements: the ones a <label for=…> click is forwarded to
	// by the browser. <button> is on the list, which is what makes a label click
	// already work for our checkbox/toggle/menu triggers — and what made doing
	// it again here toggle them straight back.
	const LABELABLE = new Set(['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea']);

	/**
	 * The element a click on this row should land on.
	 *
	 * `controlId` covers everything that takes an `id`, which is every Input
	 * type but `select` — that one renders a <PopoverMenu>, which has no id prop
	 * — hence the fallback query. The fallback also means a Field wrapped around
	 * something that is not an <Input> at all still behaves, as long as whatever
	 * is inside is focusable.
	 */
	function resolveControl(): HTMLElement | null {
		// A radiogroup is the one control whose `id` is on a container rather
		// than on anything focusable: the group keeps a roving tabstop, and that
		// is the radio a click should land on.
		if (registeredType === 'radio') {
			return rootEl?.querySelector('.control [role="radio"][tabindex="0"]') ?? null;
		}
		const byId = document.getElementById(controlId);
		if (byId) return byId as HTMLElement;
		return (
			rootEl?.querySelector('.control button, .control input, .control textarea, .control [tabindex]') ??
			null
		);
	}

	function forwardToControl() {
		const el = resolveControl();
		if (!el) return;
		if (registeredType && ACTIVATE_ON_CLICK.has(registeredType)) el.click();
		else el.focus();
	}

	/**
	 * The whole row is the control's hit target, not just its label — a settings
	 * row reads as one thing, and the dead space between a label and a control
	 * pinned to the right edge is most of the row.
	 *
	 * Three things are deliberately left alone: a click that already landed in
	 * the control (it handled itself, and re-firing would toggle a checkbox
	 * back), a click on a label the browser will forward natively (same reason —
	 * and `for=` reaches a <button role="switch"> just as it reaches an <input>),
	 * and a click that ends a text selection — dragging across a hint should not
	 * also flip a switch.
	 */
	function handleRowClick(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		if (!target || target.closest('.control, .reset')) return;
		if (target.closest('.label')) {
			// Nothing to forward to (a `select` renders a PopoverMenu, which never
			// takes the id) or not a labelable target (a radiogroup is a div): the
			// browser will do nothing, so we should.
			const forTarget = document.getElementById(controlId);
			if (forTarget && LABELABLE.has(forTarget.tagName.toLowerCase())) return;
		}
		if (!(window.getSelection()?.isCollapsed ?? true)) return;
		forwardToControl();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={rootEl}
	class="field"
	onclick={handleRowClick}
	class:horizontal={layout === 'horizontal'}
	class:vertical={layout === 'vertical'}
	class:align-center={align === 'center'}
	class:disabled
	class:invalid={!!error}
	data-tier={tier}
	{id}
>
	<div class="label-cluster">
		<div class="label-line">
			{#if leading}
				<span class="leading">
					<Icon {...resolveIcon(leading)} size={resolveIcon(leading).size ?? 14} />
				</span>
			{/if}
			<label class="label" for={controlId}>
				{label}
				{#if required}
					<span class="required" aria-label="required">
						<Icon name="Asterisk" size={9} />
					</span>
				{/if}
			</label>
			{#if reset}
				<button
					type="button"
					class="reset"
					onclick={reset.onReset}
					title={reset.tooltip ?? 'Reset to default'}
					aria-label={reset.tooltip ?? 'Reset to default'}
				>
					<Icon name="RotateCcw" size={12} />
				</button>
			{/if}
		</div>
		{#if error}
			<span class="error" role="alert">
				<Icon name="CircleAlert" size={12} />
				{error}
			</span>
		{:else if hint}
			<span class="hint">{hint}</span>
		{/if}
	</div>
	<div class="control">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.field {
		display: flex;
		gap: var(--glow-field-row-gap);
		padding: var(--glow-field-padding-y) var(--glow-field-padding-x);
		border-radius: $radius * 0.6;
		min-width: 0;
		transition: background var(--glow-dur-instant) var(--glow-ease-out);

		&:hover {
			background: color-mix(in oklab, var(--glow-fg) 1%, transparent);
		}

		&.disabled {
			@include disabled-content;
			pointer-events: none;
		}

		&[data-tier='secondary'] {
			.label,
			.hint {
				opacity: 0.85;
			}
		}

		&[data-tier='advanced'] {
			.label,
			.hint {
				opacity: 0.7;
			}
		}
	}

	.field.horizontal {
		flex-direction: row;
		align-items: flex-start;

		.label-cluster {
			// `--glow-field-label-width: 40%` (or any length) on a parent pins
			// the label column so values line up across rows. Defaults to flex.
			flex: 1 1 auto;
			width: var(--glow-field-label-width, auto);
			min-width: 0;
		}

		.control {
			flex: 1 1 auto;
			min-width: 0;
			display: flex;
			justify-content: flex-end;
			align-items: flex-start;
		}

		&.align-center {
			align-items: center;

			.control {
				align-items: center;
			}
		}
	}

	.field.vertical {
		flex-direction: column;
		gap: var(--glow-field-stack-gap);

		.label-cluster {
			width: 100%;
		}

		.control {
			width: 100%;
		}
	}

	.label-cluster {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.label-line {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.leading {
		display: inline-flex;
		align-items: center;
		color: var(--glow-text-secondary);
	}

	.label {
		font-size: var(--glow-field-label-size);
		font-weight: $weight-semibold;
		color: var(--glow-text-primary);
		line-height: 1.25;
		cursor: pointer;
		user-select: none;
	}

	.required {
		display: inline-flex;
		color: var(--glow-primary);
		opacity: 0.85;
	}

	.reset {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: 0;
		border-radius: $radius-full;
		background: transparent;
		color: var(--glow-text-muted);
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--glow-dur-instant) var(--glow-ease-out), color var(--glow-dur-instant) var(--glow-ease-out), background var(--glow-dur-instant) var(--glow-ease-out);

		.field:hover & {
			opacity: 1;
		}

		&:hover {
			color: var(--glow-text-primary);
			background: color-mix(in oklab, var(--glow-fg) 6%, transparent);
		}
	}

	.hint {
		font-size: var(--glow-field-hint-size);
		color: var(--glow-text-muted);
		line-height: 1.35;
	}

	.error {
		display: inline-flex;
		align-items: center;
		gap: $space-xs;
		font-size: var(--glow-field-hint-size);
		color: var(--glow-color-danger, #ef4444);
		line-height: 1.35;
	}

	.field.invalid :global(input),
	.field.invalid :global(textarea),
	.field.invalid :global(.text-input),
	.field.invalid :global(.number-input),
	.field.invalid :global(.popover-trigger) {
		border-color: var(--glow-color-danger, #ef4444);
	}

	.control {
		min-width: 0;
	}
</style>
