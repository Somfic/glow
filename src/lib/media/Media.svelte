<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import Hls from 'hls.js';
	import Icon from '../icon/Icon.svelte';
	import Spinner from '../spinner/Spinner.svelte';

	type MediaType = 'image' | 'video' | 'auto';
	type Fit = 'cover' | 'contain';

	type Layer = {
		src: string;
		type: 'image' | 'video';
		loaded: boolean;
	};

	let {
		src,
		type = 'auto',
		fit = 'contain',
		alt = '',
		poster,
		autoplay = false,
		muted = true,
		loop = true,
		controls = false,
		playsinline = true,
		lazy = true,
		startTime = 0,
		onclick,
		onVideoReady,
		onVideoPlaying
	}: {
		src: string;
		type?: MediaType;
		fit?: Fit;
		alt?: string;
		poster?: string;
		autoplay?: boolean;
		muted?: boolean;
		loop?: boolean;
		controls?: boolean;
		playsinline?: boolean;
		lazy?: boolean;
		startTime?: number;
		onclick?: () => void;
		onVideoReady?: (video: HTMLVideoElement) => void;
		onVideoPlaying?: (video: HTMLVideoElement) => void;
	} = $props();

	let layers: [Layer, Layer] = $state([
		{ src: '', type: 'image', loaded: false },
		{ src: '', type: 'image', loaded: false }
	]);
	let activeLayer = $state<0 | 1>(0);
	let initialLoad = $state(true);
	let mediaError = $state(false);
	let videoEls: [HTMLVideoElement | undefined, HTMLVideoElement | undefined] = $state([
		undefined,
		undefined
	]);
	let hlsInstances: [Hls | null, Hls | null] = [null, null];
	let preloader: HTMLImageElement | null = null;

	function resolveType(url: string): 'image' | 'video' {
		if (type !== 'auto') return type;
		if (!url) return 'image';
		const lower = url.toLowerCase();
		if (lower.match(/\.(mp4|webm|mov|m3u8|ogg)(\?|$)/) || lower.includes('playlist')) {
			return 'video';
		}
		return 'image';
	}

	function isHlsSource(url: string): boolean {
		return url.includes('.m3u8') || url.includes('playlist');
	}

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

	function cleanupHls(layerIndex: 0 | 1) {
		if (hlsInstances[layerIndex]) {
			hlsInstances[layerIndex]!.destroy();
			hlsInstances[layerIndex] = null;
		}
	}

	function initializeVideo(layerIndex: 0 | 1) {
		const videoEl = videoEls[layerIndex];
		const layerSrc = layers[layerIndex].src;
		if (!videoEl || !layerSrc) return;

		cleanupHls(layerIndex);

		if (isHlsSource(layerSrc)) {
			if (Hls.isSupported()) {
				const hls = new Hls({
					debug: false,
					enableWorker: true,
					lowLatencyMode: false
				});
				hlsInstances[layerIndex] = hls;
				hls.loadSource(layerSrc);
				hls.attachMedia(videoEl);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					if (autoplay) {
						videoEl.play().catch(() => {});
					}
				});
				hls.on(Hls.Events.ERROR, (_event, data) => {
					if (data.fatal) {
						mediaError = true;
						cleanupHls(layerIndex);
					}
				});
			} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
				videoEl.src = layerSrc;
			}
		} else {
			videoEl.src = layerSrc;
			if (autoplay) {
				videoEl.play().catch(() => {});
			}
		}
	}

	function handleVideoLoaded(layerIndex: 0 | 1) {
		layers[layerIndex].loaded = true;
		activeLayer = layerIndex;
		initialLoad = false;

		const videoEl = videoEls[layerIndex];
		if (videoEl) {
			if (startTime > 0 && videoEl.duration) {
				videoEl.currentTime = startTime * videoEl.duration;
			}
			onVideoReady?.(videoEl);
		}
	}

	function handleVideoPlaying(layerIndex: 0 | 1) {
		const videoEl = videoEls[layerIndex];
		if (videoEl) {
			onVideoPlaying?.(videoEl);
		}
	}

	function handleVideoError(layerIndex: 0 | 1) {
		if (layerIndex === activeLayer || initialLoad) {
			mediaError = true;
		}
	}

	$effect(() => {
		const currentSrc = src;
		if (!currentSrc) return;

		untrack(() => {
			mediaError = false;
			const resolvedType = resolveType(currentSrc);

			if (initialLoad) {
				layers[0] = { src: currentSrc, type: resolvedType, loaded: false };

				if (resolvedType === 'image') {
					preloadImage(currentSrc)
						.then(async () => {
							// Wait for the img element to render in the DOM before activating
							await tick();
							await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
							layers[0].loaded = true;
							initialLoad = false;
							activeLayer = 0;
						})
						.catch(() => {
							mediaError = true;
						});
				}
				// Video: handled by loadeddata event via handleVideoLoaded
			} else {
				const next = (activeLayer === 0 ? 1 : 0) as 0 | 1;

				if (resolvedType === 'image') {
					preloadImage(currentSrc)
						.then(async () => {
							// Set src first so the element renders at opacity 0
							layers[next] = { src: currentSrc, type: 'image', loaded: false };
							// Wait for the DOM to update, then activate to trigger the transition
							await tick();
							await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
							layers[next].loaded = true;
							activeLayer = next;
						})
						.catch(() => {
							mediaError = true;
						});
				} else {
					layers[next] = { src: currentSrc, type: 'video', loaded: false };
					// Video: will be initialized when the video element binds, then loadeddata fires
				}
			}
		});
	});

	// Initialize video elements when they bind
	$effect(() => {
		for (const i of [0, 1] as const) {
			if (videoEls[i] && layers[i].type === 'video' && layers[i].src && !layers[i].loaded) {
				initializeVideo(i);
			}
		}
	});

	onDestroy(() => {
		cleanupHls(0);
		cleanupHls(1);
		if (preloader) {
			preloader.onload = null;
			preloader.onerror = null;
			preloader.src = '';
			preloader = null;
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="media" class:clickable={!!onclick} {onclick}>
	{#if initialLoad && !mediaError}
		<div class="placeholder">
			<Spinner size={24} />
		</div>
	{/if}

	{#if mediaError}
		<div class="error">
			<Icon name="MessageCircleWarning" size={24} />
		</div>
	{/if}

	{#each [0, 1] as i}
		{#if layers[i].type === 'image' && layers[i].src}
			<img
				src={layers[i].src}
				{alt}
				class="layer"
				class:active={activeLayer === i && layers[i].loaded}
				style="object-fit: {fit}"
			/>
		{:else if layers[i].type === 'video' && layers[i].src}
			<video
				bind:this={videoEls[i]}
				{muted}
				{loop}
				{controls}
				{playsinline}
				{poster}
				onloadeddata={() => handleVideoLoaded(i as 0 | 1)}
				onplaying={() => handleVideoPlaying(i as 0 | 1)}
				onerror={() => handleVideoError(i as 0 | 1)}
				class="layer"
				class:active={activeLayer === i && layers[i].loaded}
				style="object-fit: {fit}"
			>
				<track kind="captions" />
			</video>
		{/if}
	{/each}
</div>

<style lang="scss">
	.media {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;

		&.clickable {
			cursor: pointer;
		}
	}

	.placeholder,
	.error {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.1);
		z-index: 2;
	}

	.error {
		color: rgba(255, 255, 255, 0.5);
	}

	.layer {
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
