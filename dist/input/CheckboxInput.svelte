<script lang="ts">
	import Icon from '../icon/Icon.svelte';

	interface Props {
		id?: string;
		checked?: boolean;
		disabled?: boolean;
		indeterminate?: boolean;
		label?: string;
		onChange?: (checked: boolean) => void;
	}

	let {
		id,
		checked = false,
		disabled = false,
		indeterminate = false,
		label,
		onChange
	}: Props = $props();

	let internalChecked = $state(false);

	$effect(() => {
		internalChecked = checked ?? false;
	});

	function handleChange() {
		if (disabled) return;
		internalChecked = !internalChecked;
		onChange?.(internalChecked);
	}
</script>

<label class="checkbox-wrapper" class:disabled>
	<button
		{id}
		type="button"
		role="checkbox"
		aria-checked={indeterminate ? 'mixed' : internalChecked}
		class="checkbox"
		class:checked={internalChecked}
		class:indeterminate
		{disabled}
		onclick={handleChange}
	>
		<div class="checkbox-box">
			{#if indeterminate}
				<Icon name="Minus" size={14} />
			{:else if internalChecked}
				<Icon name="Check" size={14} />
			{/if}
		</div>
	</button>
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
</label>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.625em;
  padding-left: 1em;
  user-select: none;
}
.checkbox-wrapper.disabled {
  opacity: 0.5;
}
.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
}
.checkbox-label {
  color: #eee;
  font-size: 1rem;
}
.checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid #30313C;
  border-radius: 4px;
  background-color: #1e1f29;
  transition: all 0.15s ease;
  color: white;
}
.checkbox-box :global(svg) {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.15s ease;
}
.checkbox.checked .checkbox-box,
.checkbox.indeterminate .checkbox-box {
  background-color: #8B6DED;
  border-color: #8B6DED;
}
.checkbox.checked .checkbox-box :global(svg),
.checkbox.indeterminate .checkbox-box :global(svg) {
  opacity: 1;
  transform: scale(1);
}
.checkbox:not(.disabled):hover .checkbox-box {
  border-color: #8B6DED;
}
.checkbox:not(.disabled):active .checkbox-box {
  transform: scale(0.95);
}</style>
