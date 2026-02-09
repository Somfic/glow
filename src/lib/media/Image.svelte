<script lang="ts">
	let { src }: { src: string } = $props();

	let el: HTMLImageElement;
	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleImageError() {
		imageError = true;
		imageLoaded = false;
	}

	// Reset loading state when src changes
	$effect(() => {
		if (src) {
			imageLoaded = false;
			imageError = false;
		}
	});
</script>

<div class="image">
	{#if !imageLoaded && !imageError}
		<div class="image-placeholder">
			<div class="loading-spinner"></div>
		</div>
	{/if}
	<img
		bind:this={el}
		{src}
		alt=""
		onload={handleImageLoad}
		onerror={handleImageError}
		class:loaded={imageLoaded}
		class:error={imageError}
	/>
</div>

<style lang="scss">
	.image {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.image-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f3f4f6;
		min-height: 150px;
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #e5e7eb;
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	img {
		width: 100%;
		height: auto;
		display: block;
		opacity: 0;
		transition: opacity 0.3s ease;

		&.loaded {
			opacity: 1;
		}

		&.error {
			display: none;
		}
	}
</style>
