<script lang="ts">
	interface Props {
		id?: string;
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		onChange?: (checked: boolean) => void;
	}

	let { id, checked = $bindable(false), disabled = false, label, onChange }: Props = $props();

	function handleToggle() {
		if (disabled) return;
		checked = !checked;
		onChange?.(checked);
	}
</script>

<label class="toggle-wrapper" class:disabled>
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label || 'Toggle'}
		class="toggle"
		class:checked={checked}
		{disabled}
		onclick={handleToggle}
	>
		<span class="toggle-slider"></span>
	</button>
	{#if label}
		<span class="toggle-label">{label}</span>
	{/if}
</label>

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.toggle-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.625em;
		padding-left: 1em;
		user-select: none;
		cursor: pointer;

		&.disabled {
			@include disabled-content;

			.toggle-label {
				color: var(--glow-fg-disabled);
			}

			// Track and knob both flatten, checked or not — a live accent beside
			// dead text reads as "still interactive".
			.toggle,
			.toggle.checked {
				background-color: var(--glow-bg-disabled);
			}

			.toggle-slider,
			.toggle.checked .toggle-slider {
				background-color: var(--glow-fg-disabled);
				box-shadow: none;
			}
		}
	}

	.toggle {
		position: relative;
		width: 36px;
		height: 20px;
		background-color: color-mix(in oklab, var(--glow-fg) 20%, transparent);
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color var(--glow-dur-base) var(--glow-ease-out);
		padding: 0;

		&.checked {
			background-color: var(--glow-primary);
		}

		&:not(:disabled):hover {
			background-color: color-mix(in oklab, var(--glow-fg) 25%, transparent);

			&.checked {
				background-color: var(--glow-primary-hover);
			}
		}
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		@include contrast-color(var(--glow-bg-surface), $property: background-color, $fallback: white);
		border-radius: 50%;
		transition: transform var(--glow-dur-base) var(--glow-ease-out);
		box-shadow: $shadow-xs;
	}

	.toggle.checked .toggle-slider {
		transform: translateX(16px);
		// Unchecked, the knob keeps its white default against the dim track. Checked,
		// it has to stand off --glow-primary, which may itself be near-white.
		@include contrast-color(var(--glow-primary), $property: background-color, $fallback: white);
	}

	.toggle-label {
		color: var(--glow-fg);
		font-size: 1rem;
	}
</style>
