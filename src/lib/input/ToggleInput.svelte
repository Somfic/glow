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
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.toggle {
		position: relative;
		width: 36px;
		height: 20px;
		background-color: rgba($fg, 0.2);
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		padding: 0;

		&.checked {
			background-color: var(--glow-primary);
		}

		&:not(:disabled):hover {
			background-color: rgba($fg, 0.25);

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
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.toggle.checked .toggle-slider {
		transform: translateX(16px);
	}

	.toggle-label {
		color: var(--glow-fg);
		font-size: 1rem;
	}
</style>
