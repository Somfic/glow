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

	// Non-native controls (select / multiselect / radio) don't focus on label
	// click via the browser's `for=` association — synthesise a click instead.
	const NON_NATIVE_LABEL = new Set(['select', 'multiselect', 'radio']);
	function handleLabelClick(e: MouseEvent) {
		if (!registeredType || !NON_NATIVE_LABEL.has(registeredType)) return;
		const el = document.getElementById(controlId);
		if (el && e.target !== el) el.click();
	}
</script>

<div
	class="field"
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
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<label class="label" for={controlId} onclick={handleLabelClick}>
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
		transition: background 0.12s ease;

		&:hover {
			background: rgba($fg, 0.01);
		}

		&.disabled {
			opacity: 0.55;
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
		font-weight: 600;
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
		border-radius: 999px;
		background: transparent;
		color: var(--glow-text-muted);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease;

		.field:hover & {
			opacity: 1;
		}

		&:hover {
			color: var(--glow-text-primary);
			background: rgba($fg, 0.06);
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
		gap: 0.25rem;
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
