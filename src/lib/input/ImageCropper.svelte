<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import Cropper from 'cropperjs';
	import 'cropperjs/dist/cropper.css';
	import { Button, ButtonGroup } from '../index.js';

	let {
		src,
		aspectRatio,
		onConfirm,
		onCancel
	}: {
		src: string;
		aspectRatio?: number;
		onConfirm: (blob: Blob) => void;
		onCancel: () => void;
	} = $props();

	let imageElement: HTMLImageElement;
	let cropper: Cropper | null = null;
	let processing = $state(false);

	onMount(() => {
		if (imageElement) {
			cropper = new Cropper(imageElement, {
				aspectRatio: aspectRatio,
				viewMode: 1,
				dragMode: 'move',
				autoCropArea: 1,
				restore: false,
				guides: true,
				center: true,
				highlight: false,
				cropBoxMovable: true,
				cropBoxResizable: true,
				toggleDragModeOnDblclick: false,
				background: false
			});
		}
		document.body.style.overflow = 'hidden';
	});

	onDestroy(() => {
		cropper?.destroy();
		document.body.style.overflow = '';
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		} else if (event.key === 'Enter') {
			handleConfirm();
		}
	}

	async function handleConfirm() {
		if (!cropper || processing) return;
		processing = true;

		try {
			const canvas = cropper.getCroppedCanvas({
				maxWidth: 4096,
				maxHeight: 4096,
				imageSmoothingEnabled: true,
				imageSmoothingQuality: 'high'
			});

			canvas.toBlob(
				(blob) => {
					if (blob) {
						onConfirm(blob);
					}
					processing = false;
				},
				'image/jpeg',
				0.92
			);
		} catch {
			processing = false;
		}
	}

	function handleRotateLeft() {
		cropper?.rotate(-90);
	}

	function handleRotateRight() {
		cropper?.rotate(90);
	}

	function handleReset() {
		cropper?.reset();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="cropper-overlay" role="dialog" aria-modal="true" transition:fade={{ duration: 150 }}>
	<div class="cropper-container">
		<div class="cropper-header">
			<span class="cropper-title">Crop Image</span>
			<Button icon="X" onclick={onCancel} variant="ternary" />
		</div>

		<div class="cropper-content">
			<img bind:this={imageElement} src={src} alt="Crop preview" class="cropper-image" />
		</div>

		<div class="cropper-footer">
			<ButtonGroup>
				<Button icon="RotateCcw" onclick={handleRotateLeft} variant="secondary" />
				<Button icon="RotateCw" onclick={handleRotateRight} variant="secondary" />
				<Button icon="RefreshCw" onclick={handleReset} variant="secondary" />
			</ButtonGroup>

			<ButtonGroup>
				<Button label="Cancel" onclick={onCancel} variant="secondary" />
				<Button
					label="Apply"
					onclick={handleConfirm}
					variant="primary"
					disabled={processing}
				/>
			</ButtonGroup>
		</div>
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.cropper-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.cropper-container {
		background: $bg-surface;
		border-radius: $radius;
		border: $border;
		display: flex;
		flex-direction: column;
		max-width: 90vw;
		max-height: 90vh;
		width: 800px;
		overflow: hidden;
	}

	.cropper-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: $border;
	}

	.cropper-title {
		font-weight: 600;
		color: $fg;
	}

	.cropper-content {
		flex: 1;
		min-height: 0;
		max-height: 60vh;
		background: $bg-base;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.cropper-image {
		display: block;
		max-width: 100%;
		max-height: 100%;
	}

	.cropper-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-top: $border;
		gap: 1rem;
	}

	/* Override cropperjs styles to match glow theme */
	:global(.cropper-container) {
		background: transparent !important;
	}

	:global(.cropper-modal) {
		background: rgba(0, 0, 0, 0.5) !important;
	}

	:global(.cropper-view-box) {
		outline: 2px solid $primary !important;
		outline-color: $primary !important;
	}

	:global(.cropper-line) {
		background-color: $primary !important;
	}

	:global(.cropper-point) {
		background-color: $primary !important;
		width: 10px !important;
		height: 10px !important;
		opacity: 1 !important;
	}

	:global(.cropper-point.point-se) {
		width: 10px !important;
		height: 10px !important;
	}

	:global(.cropper-dashed) {
		border-color: rgba($fg, 0.3) !important;
	}

	:global(.cropper-center) {
		display: none !important;
	}
</style>
