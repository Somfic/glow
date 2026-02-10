<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { Button } from '../index.js';
	import Hls from 'hls.js';

	export type RelatedMedia = {
		src: string;
		type?: 'image' | 'video';
		alt?: string;
		active?: boolean;
		onClick: () => void;
	};

	let {
		open = false,
		src,
		type = 'image',
		alt = '',
		poster,
		related = [],
		startPosition = 0,
		preloadedVideo,
		onClose
	}: {
		open: boolean;
		src: string;
		type?: 'image' | 'video';
		alt?: string;
		poster?: string;
		related?: RelatedMedia[];
		startPosition?: number; // 0-1 ratio for video start position
		preloadedVideo?: HTMLVideoElement; // Pre-loaded video element to use instead of creating new
		onClose: () => void;
	} = $props();

	let videoElement: HTMLVideoElement | null = null;
	let videoContainer: HTMLDivElement | null = null;
	let hls: Hls | null = null;
	let currentVideoSrc: string | null = null;
	let usingPreloaded = $state(false);

	function handleOverlayClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const tagName = target.tagName.toLowerCase();
		// Don't close if clicking on media, buttons, info slot, or related items
		if (
			tagName === 'img' ||
			tagName === 'video' ||
			tagName === 'button' ||
			target.closest('.lightbox-info') ||
			target.closest('.lightbox-related')
		) {
			return;
		}
		onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function seekToStartPosition() {
		if (videoElement && videoElement.duration && isFinite(videoElement.duration) && startPosition > 0) {
			videoElement.currentTime = videoElement.duration * startPosition;
		}
	}

	function initializeVideo() {
		if (!videoElement || !src) return;

		// Don't reinitialize if src hasn't changed
		if (currentVideoSrc === src) return;
		currentVideoSrc = src;

		if (src.includes('.m3u8') || src.includes('playlist')) {
			if (Hls.isSupported()) {
				if (hls) hls.destroy();
				hls = new Hls({
					debug: false,
					enableWorker: true,
					lowLatencyMode: false
				});
				hls.loadSource(src);
				hls.attachMedia(videoElement);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					seekToStartPosition();
					videoElement?.play().catch(() => {});
				});
			} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
				videoElement.src = src;
				videoElement.onloadedmetadata = () => {
					seekToStartPosition();
					videoElement?.play().catch(() => {});
				};
			}
		} else {
			videoElement.src = src;
			videoElement.onloadedmetadata = () => {
				seekToStartPosition();
				videoElement?.play().catch(() => {});
			};
		}
	}

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});

	// Handle preloaded video - move it into the container
	$effect(() => {
		if (open && type === 'video' && preloadedVideo && videoContainer) {
			// Store playing state before moving
			const wasPlaying = !preloadedVideo.paused;
			const currentTime = preloadedVideo.currentTime;

			// Move the preloaded video into the lightbox
			preloadedVideo.classList.add('lightbox-media');
			preloadedVideo.controls = true;
			videoContainer.appendChild(preloadedVideo);
			videoElement = preloadedVideo;
			usingPreloaded = true;
			currentVideoSrc = src;

			// Ensure video continues at same position
			if (preloadedVideo.currentTime !== currentTime) {
				preloadedVideo.currentTime = currentTime;
			}

			// Resume playing, then unmute (unmuting first can cause pause on some browsers)
			if (wasPlaying || preloadedVideo.paused) {
				preloadedVideo.play().then(() => {
					// Unmute after playback is confirmed
					preloadedVideo.muted = false;
				}).catch(() => {
					// If autoplay fails, at least try to unmute
					preloadedVideo.muted = false;
				});
			} else {
				preloadedVideo.muted = false;
			}
		}
	});

	// When switching to a related item (preloadedVideo becomes undefined), create new video
	$effect(() => {
		if (open && type === 'video' && !preloadedVideo && usingPreloaded && videoContainer) {
			// Remove the old preloaded video from container
			videoContainer.innerHTML = '';
			// Create a new video element for the related item
			const video = document.createElement('video');
			video.controls = true;
			video.autoplay = true;
			video.loop = true;
			video.playsInline = true;
			video.className = 'lightbox-media';
			if (poster) video.poster = poster;
			videoContainer.appendChild(video);
			videoElement = video;
			usingPreloaded = false;
			currentVideoSrc = null;
		}
	});

	$effect(() => {
		// Track src so we reinitialize when switching between related items
		if (open && videoElement && type === 'video' && src && !usingPreloaded) {
			initializeVideo();
		}
	});

	// Reset state when lightbox closes
	$effect(() => {
		if (!open) {
			usingPreloaded = false;
			currentVideoSrc = null;
		}
	});

	onDestroy(() => {
		if (hls) {
			hls.destroy();
			hls = null;
		}
		document.body.style.overflow = '';
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="lightbox-overlay"
		on:click={handleOverlayClick}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div class="lightbox-close">
			<Button icon="X" onclick={onClose} variant="ternary" />
		</div>

		<div class="lightbox-content">
			{#if type === 'image'}
				<img {src} {alt} class="lightbox-media" />
			{:else}
				<div bind:this={videoContainer} class="video-container">
					{#if !preloadedVideo}
						<video
							bind:this={videoElement}
							controls
							autoplay
							loop
							playsinline
							class="lightbox-media"
							{poster}
						>
							<track kind="captions" />
						</video>
					{/if}
				</div>
			{/if}
		</div>

		<div class="lightbox-info">
			<slot />
		</div>

		{#if related.length > 0}
			<div class="lightbox-related">
				{#each related as item (item.src)}
					<button
						class="related-item"
						class:active={item.active}
						on:click={item.onClick}
					>
						<img src={item.src} alt={item.alt || ''} />
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		padding: 2rem;
	}

	.lightbox-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
	}

	.lightbox-content {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		z-index: 5;
		position: relative;
	}

	.lightbox-media {
		max-width: 95vw;
		max-height: 85vh;
		width: auto;
		height: auto;
		border-radius: 12px;
		object-fit: contain;
	}

	.video-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	video.lightbox-media,
	.video-container :global(video) {
		max-width: 95vw;
		max-height: 85vh;
		width: auto;
		height: auto;
		border-radius: 12px;
		object-fit: contain;
		z-index: 10;
		position: relative;
	}

	.lightbox-info {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		color: white;
		max-width: 90vw;

		&:empty {
			display: none;
		}
	}

	.lightbox-related {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		display: flex;
		gap: 0.5rem;
		max-width: calc(100vw - 2rem);
		overflow-x: auto;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		backdrop-filter: blur(10px);

		&::-webkit-scrollbar {
			height: 4px;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.3);
			border-radius: 2px;
		}
	}

	.related-item {
		flex-shrink: 0;
		width: 80px;
		height: 80px;
		border: 2px solid transparent;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		background: none;
		transition: border-color 0.15s ease, transform 0.15s ease;

		&:hover {
			border-color: rgba(255, 255, 255, 0.5);
			transform: scale(1.05);
		}

		&.active {
			border-color: white;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
</style>
