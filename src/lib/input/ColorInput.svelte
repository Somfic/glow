<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import Popover from '../popover/Popover.svelte';

	interface Props {
		id?: string;
		value?: string; // hex color
		disabled?: boolean;
		onChange?: (value: string) => void;
	}

	let { id, value = '#808080', disabled = false, onChange }: Props = $props();

	let isOpen = $state(false);
	let L = $state(0.5); // Lightness (0-1)
	let C = $state(0.1); // Chroma (0-0.4)
	let H = $state(0); // Hue (0-360 degrees)

	let lcPlaneElement: HTMLDivElement;
	let lcCanvasElement: HTMLCanvasElement;

	let isDraggingLC = $state(false);

	// Convert hex to RGB (0-1 range)
	function hexToRgb(hex: string): [number, number, number] | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? [
					parseInt(result[1], 16) / 255,
					parseInt(result[2], 16) / 255,
					parseInt(result[3], 16) / 255
				]
			: null;
	}

	// Convert sRGB to linear RGB
	function srgbToLinear(c: number): number {
		const abs = Math.abs(c);
		if (abs < 0.04045) {
			return c / 12.92;
		}
		return Math.sign(c) * Math.pow((abs + 0.055) / 1.055, 2.4);
	}

	// Convert linear RGB to OKLAB
	function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
		const lr = srgbToLinear(r);
		const lg = srgbToLinear(g);
		const lb = srgbToLinear(b);

		const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
		const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
		const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

		const l_ = Math.cbrt(l);
		const m_ = Math.cbrt(m);
		const s_ = Math.cbrt(s);

		return [
			0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
			1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
			0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
		];
	}

	// Convert OKLAB to OKLCH
	function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
		const C = Math.sqrt(a * a + b * b);
		let H = (Math.atan2(b, a) * 180) / Math.PI;
		if (H < 0) H += 360;
		return [L, C, H];
	}

	// Convert OKLCH to OKLAB
	function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
		const hRad = (H * Math.PI) / 180;
		const a = C * Math.cos(hRad);
		const b = C * Math.sin(hRad);
		return [L, a, b];
	}

	// Convert OKLAB to linear RGB
	function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
		const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
		const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
		const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

		const l = l_ * l_ * l_;
		const m = m_ * m_ * m_;
		const s = s_ * s_ * s_;

		return [
			+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
		];
	}

	// Convert linear RGB to sRGB
	function linearToSrgb(c: number): number {
		const abs = Math.abs(c);
		if (abs > 0.0031308) {
			return Math.sign(c) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
		}
		return 12.92 * c;
	}

	// Convert RGB (0-1) to hex
	function rgbToHex(r: number, g: number, b: number): string {
		const toHex = (n: number) => {
			const clamped = Math.max(0, Math.min(255, Math.round(n * 255)));
			return clamped.toString(16).padStart(2, '0');
		};
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	// Initialize from hex value
	$effect(() => {
		if (value) {
			const rgb = hexToRgb(value);
			if (rgb) {
				const oklab = rgbToOklab(rgb[0], rgb[1], rgb[2]);
				const oklch = oklabToOklch(oklab[0], oklab[1], oklab[2]);
				L = oklch[0];
				C = oklch[1];
				H = oklch[2];
			}
		}
	});

	// Convert current OKLCH to hex
	let hexValue = $derived.by(() => {
		const [lVal, aVal, bVal] = oklchToOklab(L, C, H);
		const [rLinear, gLinear, bLinear] = oklabToRgb(lVal, aVal, bVal);
		const [sr, sg, sb] = [rLinear, gLinear, bLinear].map(linearToSrgb);
		return rgbToHex(sr, sg, sb);
	});

	function handleLChange(newL: number) {
		L = newL;
		onChange?.(hexValue);
	}

	// HC Plane interaction (circular: angle = H, distance = C)
	function handleHCPlaneInteraction(e: MouseEvent) {
		if (!lcPlaneElement) return;

		const rect = lcPlaneElement.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const radius = rect.width / 2;

		const x = e.clientX - centerX;
		const y = e.clientY - centerY;

		// Distance from center = Chroma (0 to 0.4)
		const distance = Math.sqrt(x * x + y * y);
		const clampedDistance = Math.min(distance, radius);

		// Snap to center (C=0) when within 5% of radius for easy gray/black/white selection
		if (clampedDistance < radius * 0.05) {
			C = 0;
		} else {
			C = (clampedDistance / radius) * 0.4;
		}

		// Angle = Hue (top = 0°, clockwise) - only matters when C > 0
		if (C > 0) {
			const angle = Math.atan2(y, x); // -π to π, 0 = right
			const angleDeg = (angle * 180 / Math.PI + 360) % 360; // 0-360°
			// Convert: top (270° in screen coords) = 0° hue, rotate clockwise
			H = (90 - angleDeg + 360) % 360;
		}

		onChange?.(hexValue);
	}

	function handleHCMouseDown(e: MouseEvent) {
		if (disabled) return;
		isDraggingLC = true;
		handleHCPlaneInteraction(e);
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDraggingLC) {
			handleHCPlaneInteraction(e);
		}
	}

	function handleMouseUp() {
		isDraggingLC = false;
	}

	// Derive cursor positions for circular HC plane (angle = H, distance = C)
	let hcCursorX = $derived.by(() => {
		const normalizedChroma = C / 0.4; // 0-1
		// H=0° at top (270° in screen coords), rotate counter-clockwise
		const screenAngle = (90 - H) * Math.PI / 180;
		return 50 + normalizedChroma * 50 * Math.cos(screenAngle);
	});

	let hcCursorY = $derived.by(() => {
		const normalizedChroma = C / 0.4; // 0-1
		const screenAngle = (90 - H) * Math.PI / 180;
		return 50 + normalizedChroma * 50 * Math.sin(screenAngle);
	});

	// Render the HC plane for the current lightness (circular: angle = H, distance = C)
	function renderHCPlane() {
		if (!lcCanvasElement) return;

		const ctx = lcCanvasElement.getContext('2d');
		if (!ctx) return;

		const size = 200;
		const centerX = size / 2;
		const centerY = size / 2;
		const radius = size / 2;

		lcCanvasElement.width = size;
		lcCanvasElement.height = size;

		const imageData = ctx.createImageData(size, size);
		const data = imageData.data;

		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const dx = x - centerX;
				const dy = y - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance <= radius) {
					const index = (y * size + x) * 4;

					// Force pure black at L=0, pure white at L=1
					if (L < 0.01) {
						data[index] = 0;
						data[index + 1] = 0;
						data[index + 2] = 0;
						data[index + 3] = 255;
					} else if (L > 0.99) {
						data[index] = 255;
						data[index + 1] = 255;
						data[index + 2] = 255;
						data[index + 3] = 255;
					} else {
						// Distance from center = Chroma (0 to 0.4)
						const chromaVal = (distance / radius) * 0.4;

						// Angle = Hue (top = 0°, clockwise)
						const angle = Math.atan2(dy, dx);
						const angleDeg = (angle * 180 / Math.PI + 360) % 360;
						const hueVal = (90 - angleDeg + 360) % 360;

						// Convert OKLCH -> OKLAB -> RGB (using current Lightness L)
						const [lVal, aVal, bVal] = oklchToOklab(L, chromaVal, hueVal);
						const [rLinear, gLinear, bLinear] = oklabToRgb(lVal, aVal, bVal);
						const [sr, sg, sb] = [rLinear, gLinear, bLinear].map(linearToSrgb);

						// Clamp to sRGB gamut
						data[index] = Math.max(0, Math.min(255, Math.round(sr * 255)));
						data[index + 1] = Math.max(0, Math.min(255, Math.round(sg * 255)));
						data[index + 2] = Math.max(0, Math.min(255, Math.round(sb * 255)));
						data[index + 3] = 255;
					}
				} else {
					// Transparent outside circle
					const index = (y * size + x) * 4;
					data[index + 3] = 0;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}

	// Render HC plane when opened
	$effect(() => {
		if (isOpen) {
			// Wait for next tick to ensure canvas is mounted
			setTimeout(() => {
				if (lcCanvasElement) {
					renderHCPlane();
				}
			}, 0);
		}
	});

	// Re-render when lightness changes
	$effect(() => {
		L;
		if (isOpen && lcCanvasElement) {
			renderHCPlane();
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:window
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
/>

<Popover bind:open={isOpen} {disabled} align="left">
	{#snippet trigger()}
		<button
			{id}
			type="button"
			class="color-trigger"
			class:open={isOpen}
			{disabled}
		>
			<div class="color-swatch" style="background-color: {hexValue}"></div>
			<span class="hex-value">{hexValue}</span>
			<Icon name="ChevronDown" size={16} />
		</button>
	{/snippet}

	<div
		class="color-popover-content"
		onmousedown={(e) => e.stopPropagation()}
	>
		<div class="picker-container">
			<!-- Hue-Chroma Circular Picker -->
			<div class="picker-wrapper">
				<div
					bind:this={lcPlaneElement}
					class="hc-plane"
					onmousedown={handleHCMouseDown}
					role="button"
					aria-label="Hue and chroma picker"
					tabindex="0"
				>
					<canvas bind:this={lcCanvasElement} class="hc-canvas"></canvas>
					<div class="chroma-rings">
						<div class="chroma-ring" style="width: 25%; height: 25%;"></div>
						<div class="chroma-ring" style="width: 50%; height: 50%;"></div>
						<div class="chroma-ring" style="width: 75%; height: 75%;"></div>
					</div>
					<div class="hc-cursor" style="left: {hcCursorX}%; top: {hcCursorY}%"></div>
				</div>
			</div>

			<!-- Lightness Slider -->
			<div class="lightness-slider">
				<label class="slider-label">Lightness</label>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={L}
					oninput={(e) => handleLChange(Number((e.target as HTMLInputElement).value))}
				/>
			</div>
		</div>
	</div>
</Popover>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.color-trigger {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
		padding: 0.5em 1em;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		color: $fg;
		font: inherit;
		cursor: pointer;
		transition: all 0.15s ease;

		&.open {
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		&:hover:not(:disabled) {
			background-color: rgba($fg, 0.05);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.color-swatch {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: $border;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.hex-value {
		flex: 1;
		font-family: monospace;
		font-size: 0.875rem;
		text-align: left;
	}

	.color-popover-content {
		padding: 1em;
	}

	.picker-container {
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}

	.picker-wrapper {
		position: relative;
		width: 200px;
		height: 200px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	// HC Plane (circular: angle = H, distance = C)
	.hc-plane {
		position: relative;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		overflow: hidden;
		cursor: crosshair;
		user-select: none;
		background: $bg-surface;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

		// Ring overlay to cover pixelated edges
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: 50%;
			border: 4px solid $bg-surface-element;
			pointer-events: none;
		}
	}

	.hc-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.chroma-rings {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.chroma-ring {
		position: absolute;
		border-radius: 50%;
		border: 1px dashed rgba($fg, 0.15);
	}

	.hc-cursor {
		position: absolute;
		width: 16px;
		height: 16px;
		border: 2px solid white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	// Lightness Slider
	.lightness-slider {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		width: 200px;
	}

	.slider-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: rgba($fg, 0.7);
		margin-left: 0.5em;
	}

	input[type='range'] {
		width: 100%;
		height: 24px;
		background: transparent;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;

		// Track
		&::-webkit-slider-runnable-track {
			height: 6px;
			background: linear-gradient(to right, black, white);
			border-radius: 3px;
			border: $border;
		}

		&::-moz-range-track {
			height: 6px;
			background: linear-gradient(to right, black, white);
			border-radius: 3px;
			border: $border;
		}

		// Thumb
		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 18px;
			height: 18px;
			background: white;
			border: 2px solid rgba(0, 0, 0, 0.2);
			border-radius: 50%;
			cursor: pointer;
			transition:
				transform 0.15s ease,
				box-shadow 0.15s ease;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
			margin-top: -6px;

			&:hover {
				transform: scale(1.1);
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
			}

			&:active {
				transform: scale(1.05);
				transition: transform 0.05s ease;
			}
		}

		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: white;
			border: 2px solid rgba(0, 0, 0, 0.2);
			border-radius: 50%;
			cursor: pointer;
			transition:
				transform 0.15s ease,
				box-shadow 0.15s ease;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

			&:hover {
				transform: scale(1.1);
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
			}

			&:active {
				transform: scale(1.05);
				transition: transform 0.05s ease;
			}
		}
	}
</style>
