<script lang="ts">
	interface Props {
		id?: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		showValue?: boolean;
		onChange?: (value: number) => void;
	}

	let {
		id,
		value = 0,
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		showValue = true,
		onChange
	}: Props = $props();

	let internalValue = $state(0);

	$effect(() => {
		internalValue = value ?? 0;
	});

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).valueAsNumber;
		if (!isNaN(val)) {
			internalValue = val;
			onChange?.(val);
		}
	}

	let percentage = $derived(((internalValue - min) / (max - min)) * 100);

	// Calculate step dots (excluding the last one)
	let steps = $derived.by(() => {
		const stepCount = Math.floor((max - min) / step) + 1;
		return Array.from({ length: stepCount - 1 }, (_, i) => {
			const value = min + i * step;
			const position = ((value - min) / (max - min)) * 100;
			return position;
		});
	});
</script>

<div class="range-input" class:disabled>
	{#if showValue}
		<span class="range-value">{internalValue}</span>
	{/if}
	<div class="range-container">
		<div class="step-dots">
			{#each steps as position}
				<span class="step-dot" style="left: {position}%"></span>
			{/each}
		</div>
		<input
			{id}
			type="range"
			value={internalValue}
			{min}
			{max}
			{step}
			{disabled}
			oninput={handleInput}
			style="--percentage: {percentage}%"
		/>
	</div>
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.range-input {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.5em 1em;
}
.range-input.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.range-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.step-dots {
  position: absolute;
  left: 9px; /* Half of thumb width (18px) */
  right: 9px; /* Half of thumb width (18px) */
  height: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.range-input:hover .step-dots {
  opacity: 1;
}
.step-dot {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(238, 238, 238, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  top: 50%;
}
input[type=range] {
  width: 100%;
  height: 30px;
  background: transparent;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  z-index: 1;
}
input[type=range]:disabled {
  cursor: not-allowed;
}
input[type=range]::-webkit-slider-runnable-track {
  height: 6px;
  background: linear-gradient(to right, #8B6DED 0%, #8B6DED var(--percentage), rgba(238, 238, 238, 0.15) var(--percentage), rgba(238, 238, 238, 0.15) 100%);
  border-radius: 3px;
}
input[type=range]::-moz-range-track {
  height: 6px;
  background: rgba(238, 238, 238, 0.15);
  border-radius: 3px;
}
input[type=range]::-moz-range-progress {
  height: 6px;
  background: #8B6DED;
  border-radius: 3px;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #8B6DED;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  margin-top: -6px;
}
input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
input[type=range]::-webkit-slider-thumb:active {
  transform: scale(1.05);
  transition: transform 0.05s ease;
}
input[type=range]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #8B6DED;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
input[type=range]::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
input[type=range]::-moz-range-thumb:active {
  transform: scale(1.05);
  transition: transform 0.05s ease;
}
.range-value {
  min-width: 3ch;
  text-align: center;
  font-weight: 600;
  color: #eee;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  background: rgb(32.28295, 29.28295, 46.62705);
  padding: 0.4em 0.6em;
  border-radius: 999px;
}</style>
