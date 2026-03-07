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

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.toggle-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.625em;
  padding-left: 1em;
  user-select: none;
}
.toggle-wrapper.disabled {
  opacity: 0.5;
}
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: rgba(238, 238, 238, 0.2);
  border: none;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  padding: 0;
}
.toggle.checked {
  background-color: #8B6DED;
}
.toggle:not(:disabled):hover {
  background-color: rgba(238, 238, 238, 0.25);
}
.toggle:not(:disabled):hover.checked {
  background-color: rgb(150.6, 123.6, 238.8);
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
  color: #eee;
  font-size: 1rem;
}</style>
