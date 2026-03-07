<script lang="ts">
	import { onDestroy } from 'svelte';
	import Hls from 'hls.js';
	import Icon from '../icon/Icon.svelte';

	type MediaType = 'image' | 'video' | 'auto';
	type Fit = 'cover' | 'contain';

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

	let imageEl = $state<HTMLImageElement | undefined>(undefined);
	let videoEl = $state<HTMLVideoElement | undefined>(undefined);
	let hls: Hls | null = null;
	let loaded = $state(false);
	let error = $state(false);

	// Auto-detect media type from src
	const resolvedType = $derived.by(() => {
		if (type !== 'auto') return type;
		if (!src) return 'image';
		const lower = src.toLowerCase();
		if (lower.match(/\.(mp4|webm|mov|m3u8|ogg)(\?|$)/) || lower.includes('playlist')) {
			return 'video';
		}
		return 'image';
	});

	const isHls = $derived(src && (src.includes('.m3u8') || src.includes('playlist')));

	function handleLoad() {
		loaded = true;
		error = false;
	}

	function handleVideoReady() {
		loaded = true;
		error = false;
		if (videoEl) {
			// Seek to start time if specified
			if (startTime > 0 && videoEl.duration) {
				videoEl.currentTime = startTime * videoEl.duration;
			}
			onVideoReady?.(videoEl);
		}
	}

	function handleVideoPlaying() {
		if (videoEl) {
			onVideoPlaying?.(videoEl);
		}
	}

	function handleError() {
		error = true;
		loaded = false;
	}

	function initializeHls() {
		if (!videoEl || !src || !isHls) return;

		if (Hls.isSupported()) {
			if (hls) hls.destroy();
			hls = new Hls({
				debug: false,
				enableWorker: true,
				lowLatencyMode: false
			});
			hls.loadSource(src);
			hls.attachMedia(videoEl);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				loaded = true;
				if (autoplay) {
					videoEl?.play().catch(() => {});
				}
			});
			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (data.fatal) {
					error = true;
					if (hls) {
						hls.destroy();
						hls = null;
					}
				}
			});
		} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
			// Native HLS support (Safari)
			videoEl.src = src;
		}
	}

	function initializeVideo() {
		if (!videoEl || !src) return;

		if (isHls) {
			initializeHls();
		} else {
			videoEl.src = src;
			if (autoplay) {
				videoEl.play().catch(() => {});
			}
		}
	}

	// Reset state when src changes
	$effect(() => {
		if (src) {
			loaded = false;
			error = false;
		}
	});

	// Initialize video when element is ready
	$effect(() => {
		if (resolvedType === 'video' && videoEl && src) {
			initializeVideo();
		}
	});

	// Cleanup
	onDestroy(() => {
		if (hls) {
			hls.destroy();
			hls = null;
		}
		// Cancel pending image load
		if (imageEl && !loaded) {
			imageEl.src = '';
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="media" class:clickable={!!onclick} {onclick}>
	{#if !loaded && !error}
		<div class="placeholder">
			<div class="spinner"></div>
		</div>
	{/if}

	{#if error}
		<div class="error">
			<Icon name="MessageCircleWarning" size={24} />
		</div>
	{/if}

	{#if resolvedType === 'image'}
		<img
			bind:this={imageEl}
			{src}
			{alt}
			loading={lazy ? 'lazy' : 'eager'}
			onload={handleLoad}
			onerror={handleError}
			class:loaded
			class:error
			style="object-fit: {fit}"
		/>
	{:else}
		<video
			bind:this={videoEl}
			{muted}
			{loop}
			{controls}
			{playsinline}
			{poster}
			onloadeddata={handleVideoReady}
			onplaying={handleVideoPlaying}
			onerror={handleError}
			class:loaded
			class:error
			style="object-fit: {fit}"
		>
			<track kind="captions" />
		</video>
	{/if}
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
	}

	.error {
		color: rgba(255, 255, 255, 0.5);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	img,
	video {
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
		transition: opacity 0.2s ease;

		&.loaded {
			opacity: 1;
		}

		&.error {
			display: none;
		}
	}

</style>
