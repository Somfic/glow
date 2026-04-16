<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import Icon from '../icon/Icon.svelte';
	import { FIELD_CONTEXT_KEY, type FieldContext, type FieldLayout, type FieldTier } from './fieldContext.js';

	interface Props {
		/** The field's label. Owns the label — Inputs nested inside should not also set their own label prop. */
		label: string;
		/** Short help text. Renders under the label (row) or under the label cluster (stack). */
		hint?: string;
		/** Required indicator (subtle). */
		required?: boolean;
		/** Disable the entire row visually (the inner control is responsible for its own disabled prop). */
		disabled?: boolean;
		/** Layout. `auto` (default) detects from the wrapped Input's type. */
		layout?: FieldLayout;
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
		hint,
		required = false,
		disabled = false,
		layout = 'auto',
		tier = 'primary',
		reset,
		id,
		children
	}: Props = $props();

	// Inputs rendered as children may register their type here so Field can pick
	// the right layout in `auto` mode and so Input can suppress its own label.
	let registeredType = $state<string | null>(null);

	const ctx: FieldContext = {
		isInField: true,
		setControlType: (type) => {
			registeredType = type;
		}
	};
	setContext(FIELD_CONTEXT_KEY, ctx);

	// Inputs that need vertical breathing — their content doesn't fit in a
	// label-on-the-right row so we stack the control under the label.
	const STACK_TYPES = new Set([
		'textarea',
		'multiselect',
		'radio',
		'color' // color picker swatches are large
	]);

	let resolvedLayout = $derived.by((): 'row' | 'stack' => {
		if (layout !== 'auto') return layout;
		if (registeredType && STACK_TYPES.has(registeredType)) return 'stack';
		return 'row';
	});
</script>

<div
	class="field"
	class:row={resolvedLayout === 'row'}
	class:stack={resolvedLayout === 'stack'}
	class:disabled
	data-tier={tier}
	{id}
>
	<div class="label-cluster">
		<div class="label-line">
			<label class="label" for={id}>
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
		{#if hint}
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
			background: rgba($fg, 0.02);
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

	.field.row {
		flex-direction: row;
		align-items: center;

		.label-cluster {
			flex: 1 1 auto;
			min-width: 0;
		}

		.control {
			flex: 0 0 auto;
			max-width: 60%;
			display: flex;
			justify-content: flex-end;
			align-items: center;
		}
	}

	.field.stack {
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

	.label {
		font-size: var(--glow-field-label-size);
		font-weight: 600;
		color: $text-primary;
		line-height: 1.25;
		cursor: pointer;
		user-select: none;
	}

	.required {
		display: inline-flex;
		color: $primary;
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
		color: $text-muted;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease;

		.field:hover & {
			opacity: 1;
		}

		&:hover {
			color: $text-primary;
			background: rgba($fg, 0.06);
		}
	}

	.hint {
		font-size: var(--glow-field-hint-size);
		color: $text-muted;
		line-height: 1.35;
	}

	.control {
		min-width: 0;
	}
</style>
