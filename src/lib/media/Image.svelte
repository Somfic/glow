<script lang="ts">
	import { onDestroy, untrack } from 'svelte';

	let { src, fit }: { src: string; fit?: 'cover' | 'contain' } = $props();

	let activeLayer = $state<0 | 1>(0);
	let layerSrc: [string, string] = $state(['', '']);
	let layerLoaded: [boolean, boolean] = $state([false, false]);
	let initialLoad = $state(true);
	let imageError = $state(false);
	let preloader: HTMLImageElement | null = null;

	function preloadImage(url: string): Promise<void> {
		if (preloader) {
			preloader.onload = null;
			preloader.onerror = null;
			preloader.src = '';
		}
		return new Promise((resolve, reject) => {
			preloader = new Image();
			preloader.onload = () => resolve();
			preloader.onerror = () => reject();
			preloader.src = url;
		});
	}

	$effect(() => {
		const currentSrc = src;
		if (!currentSrc) return;

		untrack(() => {
			imageError = false;

			if (initialLoad) {
				layerSrc[0] = currentSrc;
				preloadImage(currentSrc)
					.then(() => {
						layerLoaded[0] = true;
						initialLoad = false;
						activeLayer = 0;
					})
					.catch(() => {
						imageError = true;
					});
			} else {
				const next = (activeLayer === 0 ? 1 : 0) as 0 | 1;
				preloadImage(currentSrc)
					.then(() => {
						layerSrc[next] = currentSrc;
						layerLoaded[next] = true;
						activeLayer = next;
					})
					.catch(() => {
						imageError = true;
					});
			}
		});
	});

	onDestroy(() => {
		if (preloader) {
			preloader.onload = null;
			preloader.onerror = null;
			preloader.src = '';
			preloader = null;
		}
	});
</script>

<div class="image">
	{#if initialLoad && !imageError}
		<div class="image-placeholder">
			<div class="loading-spinner"></div>
		</div>
	{/if}

	{#each [0, 1] as i}
		<img
			src={layerSrc[i] || undefined}
			alt=""
			class:active={activeLayer === i && layerLoaded[i]}
			style="object-fit: {fit || 'contain'}"
		/>
	{/each}
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
		z-index: 2;
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
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
		transition: opacity 0.4s ease;

		&.active {
			opacity: 1;
		}
	}
</style>
