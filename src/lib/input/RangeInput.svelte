<script lang="ts">
	interface Props {
		id?: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		showValue?: boolean;
		/** When `'hover'`, the thumb is hidden until the user hovers/drags. */
		thumb?: 'always' | 'hover';
		onChange?: (value: number) => void;
	}

	let {
		id,
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		showValue = true,
		thumb = 'hover',
		onChange
	}: Props = $props();

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).valueAsNumber;
		if (!isNaN(val)) {
			value = val;
			onChange?.(val);
		}
	}

	let percentage = $derived(((value - min) / (max - min)) * 100);

	// Click-to-jump should animate; ongoing drag should follow the cursor with
	// no lag. Track pointerdown + pointermove to distinguish the two.
	let pressing = $state(false);
	let isDragging = $state(false);

	function onPointerDown() {
		pressing = true;
	}
	function onPointerMove() {
		if (pressing) isDragging = true;
	}
	function onPointerUp() {
		pressing = false;
		isDragging = false;
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointermove', onPointerMove);
		return () => {
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointermove', onPointerMove);
		};
	});
</script>

<div class="range-input" class:disabled class:thumb-hover={thumb === 'hover'}>
	{#if showValue}
		<span class="range-value">{value}</span>
	{/if}
	<div class="range-container" class:dragging={isDragging}>
		<div class="range-track"></div>
		<div class="range-fill" style:width="{percentage}%"></div>
		<div class="range-thumb" style:left="{percentage}%"></div>
		<input
			{id}
			type="range"
			value={value}
			{min}
			{max}
			{step}
			{disabled}
			oninput={handleInput}
			onpointerdown={onPointerDown}
			style="--percentage: {percentage}%"
		/>
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.range-input {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 0.5em 0.75em;

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.range-container {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		min-height: 18px;
	}

	.range-track,
	.range-fill {
		position: absolute;
		left: 0;
		right: 0;
		height: 6px;
		top: 50%;
		transform: translateY(-50%);
		border-radius: 999px;
		pointer-events: none;
	}

	.range-track {
		background: rgba($fg, 0.15);
	}

	.range-fill {
		right: auto;
		background: var(--glow-primary);
		transition: width 0.12s ease;
	}

	.range-thumb {
		position: absolute;
		top: 50%;
		width: 14px;
		height: 14px;
		background: var(--glow-primary);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		transition:
			left 0.12s ease,
			opacity 0.15s ease,
			transform 0.15s ease;
	}

	// Disable smooth transitions while the user is actively dragging so the
	// fill/thumb stay glued to the cursor.
	.range-container.dragging {
		.range-fill,
		.range-thumb {
			transition-duration: 0s;
		}
	}

input[type='range'] {
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

		&:disabled {
			cursor: not-allowed;
		}

		// Native track is transparent — the visible track/fill are rendered
		// as sibling divs inside .range-container so we can fully control
		// rounding of both the unfilled background and the progress fill.
		&::-webkit-slider-runnable-track {
			height: 6px;
			background: transparent;
		}
		&::-moz-range-track {
			height: 6px;
			background: transparent;
		}
		&::-moz-range-progress {
			background: transparent;
		}

		// Native thumb is invisible — drag/keyboard handled by the input,
		// visuals come from `.range-thumb`.
		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 18px;
			height: 18px;
			background: transparent;
			border: none;
			cursor: pointer;
			margin-top: -6px;
		}
		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: transparent;
			border: none;
			cursor: pointer;
		}
	}

	// Hover-mode thumb: hidden by default, revealed when the row is hovered or
	// the user is actively dragging.
	.range-input.thumb-hover .range-thumb {
		opacity: 0;
	}
	.range-input.thumb-hover:hover .range-thumb,
	.range-input.thumb-hover .range-container.dragging .range-thumb,
	.range-input.thumb-hover .range-container:has(input:focus-visible) .range-thumb {
		opacity: 1;
	}

	.range-value {
		min-width: 3ch;
		text-align: center;
		font-weight: 600;
		color: var(--glow-fg);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		background: var(--glow-secondary);
		padding: 0.4em 0.6em;
		border-radius: 999px;
	}
</style>
