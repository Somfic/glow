<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { type Snippet } from 'svelte';
	import Media from './Media.svelte';

	type MediaContentProps = {
		isHovering: boolean;
		showOverlay: boolean;
		fit: 'cover' | 'contain';
		shouldLoad: boolean;
	};

	let {
		// Media
		src,
		hoverSrc,
		type = 'auto',
		fit = 'cover',
		poster,
		aspectRatio = '1',
		placeholder,
		autoplay = true,
		muted = true,
		loop = true,
		lazy = false,

		// Corner slots
		topLeft,
		topRight,
		bottomLeft,
		bottomRight,

		// Media content (custom snippet - overrides default media rendering)
		mediaContent,

		// Progress
		progress,

		// State
		selected = false,
		loading = false,
		disabled = false,

		// Interaction
		onclick,
		onclickWithProgress
	}: {
		src?: string;
		hoverSrc?: string;
		type?: 'image' | 'video' | 'auto';
		fit?: 'cover' | 'contain';
		poster?: string;
		aspectRatio?: string;
		placeholder?: string;
		autoplay?: boolean;
		muted?: boolean;
		loop?: boolean;
		lazy?: boolean;

		topLeft?: Snippet;
		topRight?: Snippet;
		bottomLeft?: Snippet;
		bottomRight?: Snippet;

		mediaContent?: Snippet<[MediaContentProps]>;

		progress?: number;

		selected?: boolean;
		loading?: boolean;
		disabled?: boolean;

		onclick?: () => void;
		onclickWithProgress?: (progress: number, videoEl?: HTMLVideoElement) => void;
	} = $props();

	let showOverlay = $state(false);

	// Slot element refs for gradient sizing
	let topLeftEl: HTMLDivElement;
	let topRightEl: HTMLDivElement;
	let bottomLeftEl: HTMLDivElement;
	let bottomRightEl: HTMLDivElement;

	let topGradientHeight = $state(0);
	let bottomGradientHeight = $state(0);

	function updateGradientSizes() {
		const topH = Math.max(topLeftEl?.offsetHeight ?? 0, topRightEl?.offsetHeight ?? 0);
		const bottomH = Math.max(bottomLeftEl?.offsetHeight ?? 0, bottomRightEl?.offsetHeight ?? 0);
		// Slot offset (0.5rem ≈ 8px) + content height + generous fade
		topGradientHeight = topH > 0 ? topH + 48 : 0;
		bottomGradientHeight = bottomH > 0 ? bottomH + 48 : 0;
	}

	$effect(() => {
		if (showOverlay) {
			requestAnimationFrame(updateGradientSizes);
		}
	});

	// Lazy loading state
	let cardEl: HTMLDivElement;
	let isInViewport = $state(false);
	let shouldLoad = $state(false);
	let intersectionObserver: IntersectionObserver | null = null;

	// Initialize viewport state based on lazy prop
	$effect(() => {
		if (!lazy) {
			isInViewport = true;
			shouldLoad = true;
		}
	});

	// Video element reference for time sync
	let videoEl: HTMLVideoElement | null = null;
	let hoverVideoEl: HTMLVideoElement | null = null;
	let previewVideoReady = $state(false);
	let previewVideoLoading = $state(false);
	let hoverVideoReady = $state(false);
	let hoverVideoLoading = $state(false);
	let showHoverVideo = $state(false);
	let isHovering = $state(false);

	function handleVideoReady(video: HTMLVideoElement) {
		videoEl = video;
		previewVideoLoading = true;
	}

	function handleVideoPlaying() {
		previewVideoReady = true;
		previewVideoLoading = false;
	}

	function handleHoverVideoReady(video: HTMLVideoElement) {
		hoverVideoEl = video;
		// Sync time from preview video
		if (videoEl && videoEl.duration > 0 && video.duration > 0) {
			const progress = videoEl.currentTime / videoEl.duration;
			video.currentTime = progress * video.duration;
		}
		hoverVideoReady = true;
		hoverVideoLoading = true;
	}

	function handleHoverVideoPlaying() {
		hoverVideoLoading = false;
		if (isHovering) {
			showHoverVideo = true;
		}
	}

	function getVideoProgress(): number {
		// Prefer hover video if it's showing
		if (showHoverVideo && hoverVideoEl && hoverVideoEl.duration > 0) {
			return hoverVideoEl.currentTime / hoverVideoEl.duration;
		}
		if (videoEl && videoEl.duration > 0) {
			return videoEl.currentTime / videoEl.duration;
		}
		return 0;
	}

	function handleClick() {
		const prog = isVideo ? getVideoProgress() : 0;
		const activeVideoEl = showHoverVideo ? hoverVideoEl : (previewVideoReady ? videoEl : null);
		onclick?.();
		onclickWithProgress?.(prog, activeVideoEl ?? undefined);
	}

	function handleMouseEnter() {
		showOverlay = true;
		isHovering = true;
	}

	function handleMouseLeave() {
		showOverlay = false;
		isHovering = false;
		showHoverVideo = false;
		hoverVideoLoading = false;
	}

	// Detect if this is a video
	const isVideo = $derived.by(() => {
		if (type !== 'auto') return type === 'video';
		if (!src) return false;
		const lower = src.toLowerCase();
		return lower.match(/\.(mp4|webm|mov|m3u8|ogg)(\?|$)/) || lower.includes('playlist');
	});

	// Reset video ready state when src changes
	$effect(() => {
		if (src) {
			previewVideoReady = false;
			previewVideoLoading = false;
		}
	});

	function setupIntersectionObserver(node: HTMLElement) {
		if (!lazy || !('IntersectionObserver' in window)) {
			shouldLoad = true;
			isInViewport = true;
			return;
		}

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					isInViewport = entry.isIntersecting;
					if (entry.isIntersecting) {
						shouldLoad = true;
					}
				});
			},
			{ rootMargin: '100px', threshold: 0.1 }
		);

		intersectionObserver.observe(node);
		return {
			destroy() {
				if (intersectionObserver) intersectionObserver.disconnect();
			}
		};
	}

	onDestroy(() => {
		if (intersectionObserver) {
			intersectionObserver.disconnect();
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={cardEl}
	use:setupIntersectionObserver
	class="card"
	class:clickable={!disabled && (!!onclick || !!onclickWithProgress)}
	class:selected
	class:loading
	class:disabled
	style:aspect-ratio={aspectRatio}
	onclick={disabled ? undefined : handleClick}
	onmouseenter={disabled ? undefined : handleMouseEnter}
	onmouseleave={disabled ? undefined : handleMouseLeave}
>
	<!-- Media -->
	<div class="card-media">
		{#if mediaContent}
			{@render mediaContent({ isHovering, showOverlay, fit, shouldLoad })}
		{:else if src}
			{#if isVideo}
				{#if poster}
					<div class="media-layer poster-layer" class:hidden={previewVideoReady || showHoverVideo}>
						<img src={poster} alt="" class="poster" style="object-fit: {fit}" />
						{#if previewVideoLoading && !previewVideoReady}
							<div class="poster-loading">
								<div class="spinner"></div>
							</div>
						{/if}
					</div>
				{:else if !shouldLoad || !isInViewport}
					<div class="placeholder video-placeholder">▶</div>
				{/if}
				{#if shouldLoad && isInViewport}
					<div class="media-layer video-layer" class:visible={previewVideoReady} class:hidden={showHoverVideo}>
						<Media
							{src}
							{type}
							{fit}
							autoplay={autoplay && isInViewport}
							{muted}
							{loop}
							controls={false}
							onVideoReady={handleVideoReady}
							onVideoPlaying={handleVideoPlaying}
						/>
						{#if hoverVideoLoading && !showHoverVideo}
							<div class="video-loading-indicator">
								<div class="spinner-small"></div>
							</div>
						{/if}
					</div>
					{#if hoverSrc && isHovering}
						<div class="media-layer hover-layer" class:visible={showHoverVideo}>
							<Media
								src={hoverSrc}
								type="video"
								{fit}
								autoplay={true}
								{muted}
								{loop}
								controls={false}
								onVideoReady={handleHoverVideoReady}
								onVideoPlaying={handleHoverVideoPlaying}
							/>
						</div>
					{/if}
				{/if}
			{:else}
				<Media {src} {type} {fit} {poster} {autoplay} {muted} {loop} controls={false} />
			{/if}
		{:else if placeholder}
			<div class="placeholder">{placeholder}</div>
		{/if}
	</div>

	<!-- Hover gradients -->
	{#if (topLeft || topRight) && showOverlay}
		<div class="gradient top-gradient" style:height="{topGradientHeight}px" transition:fly={{ y: -8, duration: 150 }}></div>
	{/if}
	{#if (bottomLeft || bottomRight) && showOverlay}
		<div class="gradient bottom-gradient" style:height="{bottomGradientHeight}px" transition:fly={{ y: 8, duration: 150 }}></div>
	{/if}

	<!-- Corner slots -->
	{#if topLeft && showOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div bind:this={topLeftEl} class="slot top-left" onclick={(e) => e.stopPropagation()} transition:fly={{ y: -8, duration: 150 }}>
			{@render topLeft()}
		</div>
	{/if}

	{#if topRight && showOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div bind:this={topRightEl} class="slot top-right" onclick={(e) => e.stopPropagation()} transition:fly={{ y: -8, duration: 150 }}>
			{@render topRight()}
		</div>
	{/if}

	{#if bottomLeft && showOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div bind:this={bottomLeftEl} class="slot bottom-left" onclick={(e) => e.stopPropagation()} transition:fly={{ y: 8, duration: 150 }}>
			{@render bottomLeft()}
		</div>
	{/if}

	{#if bottomRight && showOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div bind:this={bottomRightEl} class="slot bottom-right" onclick={(e) => e.stopPropagation()} transition:fly={{ y: 8, duration: 150 }}>
			{@render bottomRight()}
		</div>
	{/if}

	<!-- Progress bar -->
	{#if progress != null && progress > 0}
		<div class="progress-bar">
			<div class="progress-fill" style:width="{Math.min(progress, 1) * 100}%"></div>
		</div>
	{/if}

	<!-- Loading overlay -->
	{#if loading}
		<div class="loading-overlay">
			<div class="spinner"></div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.card {
		position: relative;
		border-radius: $radius;
		overflow: hidden;
		background: $bg-surface;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;

		&:hover {
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		}

		&.clickable {
			cursor: pointer;
		}

		&.disabled {
			cursor: not-allowed;

			.card-media {
				opacity: 0.4;
			}

			&:hover {
				box-shadow: none;
			}
		}

		&.selected {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}

		:global(button.ghost) {
			backdrop-filter: blur(6px);
		}
	}

	.card-media {
		position: absolute;
		inset: 0;
	}

	.media-layer {
		position: absolute;
		inset: 0;
		transition: opacity 0.3s ease;

		&.hidden {
			opacity: 0;
		}
	}

	.poster-layer {
		z-index: 1;
	}

	.video-layer {
		opacity: 0;
		z-index: 2;

		&.visible:not(.hidden) {
			opacity: 1;
		}
	}

	.hover-layer {
		opacity: 0;
		z-index: 3;

		&.visible {
			opacity: 1;
		}
	}

	.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, $bg-surface 0%, $bg-surface-element 100%);
		font-size: 3rem;

		&.video-placeholder {
			background: #000;
			color: rgba(255, 255, 255, 0.5);
		}
	}

	.poster {
		width: 100%;
		height: 100%;
		display: block;
	}

	.poster-loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
	}

	.video-loading-indicator {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
	}

	.spinner-small {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.gradient {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 4;
		pointer-events: none;

		&.top-gradient {
			top: 0;
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
		}

		&.bottom-gradient {
			bottom: 0;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
		}
	}

	.slot {
		position: absolute;
		z-index: 5;

		&.top-left {
			top: 0.5rem;
			left: 0.5rem;
		}

		&.top-right {
			top: 0.5rem;
			right: 0.5rem;
		}

		&.bottom-left {
			bottom: 0.5rem;
			left: 0.5rem;
		}

		&.bottom-right {
			bottom: 0.5rem;
			right: 0.5rem;
		}
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: rgba(0, 0, 0, 0.3);
		z-index: 6;
	}

	.progress-fill {
		height: 100%;
		background: $primary;
		border-radius: 0 1.5px 1.5px 0;
		transition: width 0.3s ease;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
