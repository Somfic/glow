<script lang="ts">
	interface Props {
		id?: string;
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		onChange?: (checked: boolean) => void;
	}

	let { id, checked = false, disabled = false, label, onChange }: Props = $props();

	let internalChecked = $state(false);

	$effect(() => {
		internalChecked = checked ?? false;
	});

	function handleToggle() {
		if (disabled) return;
		internalChecked = !internalChecked;
		onChange?.(internalChecked);
	}
</script>

<label class="toggle-wrapper" class:disabled>
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={internalChecked}
		aria-label={label || 'Toggle'}
		class="toggle"
		class:checked={internalChecked}
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
		width: 44px;
		height: 24px;
		background-color: rgba($fg, 0.2);
		border: none;
		border-radius: 12px;
		transition: background-color 0.2s ease;
		padding: 0;

		&.checked {
			background-color: $primary;
		}

		&:not(:disabled):hover {
			background-color: rgba($fg, 0.25);

			&.checked {
				background-color: color.scale($primary, $lightness: 10%);
			}
		}
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.toggle.checked .toggle-slider {
		transform: translateX(20px);
	}

	.toggle-label {
		color: $fg;
		font-size: 1rem;
	}
</style>
