<script lang="ts">
	import { onMount } from 'svelte';
	import { createBlob, updateBlob, drawBlob, type Blob } from './blob.js';
	import type { Snippet } from 'svelte';

	let {
		colors = ['#8B6DED', '#FF006E', '#06FFA5', '#FFD60A'],
		intensity = 0.5,
		speed = 1,
		children
	}: {
		colors?: string[];
		intensity?: number; // 0-1, opacity of blobs
		speed?: number; // 0-2, animation speed multiplier
		children?: Snippet;
	} = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D;
	let blobs = $state<Blob[]>([]);
	let rafId: number;

	function initBlobs() {
		const rect = canvas.parentElement?.getBoundingClientRect();
		const width = rect?.width || window.innerWidth;
		const height = rect?.height || window.innerHeight;

		blobs = [
			createBlob(width, height, colors[0]),
			createBlob(width, height, colors[1]),
			createBlob(width, height, colors[2]),
			createBlob(width, height, colors[3]),
			createBlob(width, height, colors[0]),
			createBlob(width, height, colors[2])
		];
	}

	function resizeCanvas() {
		const rect = canvas.parentElement?.getBoundingClientRect();
		if (rect) {
			canvas.width = rect.width;
			canvas.height = rect.height;
		}
	}

	function animate(time: number) {
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update and draw each blob
		blobs = blobs.map((blob) => updateBlob(blob, time * speed, canvas.width, canvas.height));

		blobs.forEach((blob) => drawBlob(ctx, blob, intensity));

		rafId = requestAnimationFrame(animate);
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resizeCanvas();
		initBlobs();

		window.addEventListener('resize', resizeCanvas);

		rafId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(rafId);
		};
	});
</script>

<div class="gradient-mesh" bind:this={container}>
	<canvas bind:this={canvas} class="gradient-canvas"></canvas>
	<div class="gradient-content">
		{@render children?.()}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.gradient-mesh {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.gradient-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		filter: blur(60px);
		opacity: 0.8;
	}

	.gradient-content {
		position: relative;
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.gradient-canvas {
			animation: none !important;
			filter: blur(80px); // More blur when static
		}
	}
</style>
