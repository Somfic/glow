<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { type Snippet } from 'svelte';
	import { type IconName } from '../icon/Icon.svelte';
	import Media from './Media.svelte';
	import Button from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';
	import Pill from '../pill/Pill.svelte';

	type BadgeVariant = 'default' | 'success' | 'warning';

	type Action = {
		icon: IconName;
		label?: string;
		onclick: () => void;
	};

	type Tag = {
		label: string;
		color?: string;
		image?: string;
	};

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

		// Badge (top-left)
		badge,
		badgeVariant = 'default',
		badgeContent,

		// Actions (top-right, hover)
		actions = [],

		// Bottom overlay (default)
		title,
		subtitle,
		tags = [],

		// Bottom overlay (custom snippet)
		bottomContent,

		// Media content (custom snippet - overrides default media rendering)
		mediaContent,

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

		badge?: string;
		badgeVariant?: BadgeVariant;
		badgeContent?: Snippet;

		actions?: Action[];

		title?: string;
		subtitle?: string;
		tags?: Tag[];

		bottomContent?: Snippet;

		mediaContent?: Snippet<[MediaContentProps]>;

		selected?: boolean;
		loading?: boolean;
		disabled?: boolean;

		onclick?: () => void;
		onclickWithProgress?: (progress: number, videoEl?: HTMLVideoElement) => void;
	} = $props();

	let showOverlay = $state(false);
	let hasDefaultBottomContent = $derived(title || subtitle || tags.length > 0);
	let hasBottomContent = $derived(bottomContent || hasDefaultBottomContent);

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
		const progress = isVideo ? getVideoProgress() : 0;
		// Pass the hover video element if it's showing (already loaded), otherwise the preview video
		const activeVideoEl = showHoverVideo ? hoverVideoEl : (previewVideoReady ? videoEl : null);
		onclick?.();
		onclickWithProgress?.(progress, activeVideoEl ?? undefined);
	}

	function handleMouseEnter() {
		showOverlay = true;
		isHovering = true;
		// Reset hover video state when starting to hover
		if (hoverSrc && !hoverVideoReady) {
			// Video will start loading via the template
		}
	}

	function handleMouseLeave() {
		showOverlay = false;
		isHovering = false;
		showHoverVideo = false;
		hoverVideoLoading = false;
		// Keep hoverVideoReady true so we don't reload on next hover
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
				<!-- Poster layer (always shown first, fades out when video ready) -->
				{#if poster}
					<div class="media-layer poster-layer" class:hidden={previewVideoReady || showHoverVideo}>
						<img src={poster} alt="" class="poster" style="object-fit: {fit}" />
						<!-- Loading indicator on poster -->
						{#if previewVideoLoading && !previewVideoReady}
							<div class="poster-loading">
								<div class="spinner"></div>
							</div>
						{/if}
					</div>
				{:else if !shouldLoad || !isInViewport}
					<div class="placeholder video-placeholder">▶</div>
				{/if}
				<!-- For videos: only render when in viewport (lazy loading) -->
				{#if shouldLoad && isInViewport}
					<!-- Preview video (fades in when ready) -->
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
						<!-- Loading indicator for hover video (subtle, corner position) -->
						{#if hoverVideoLoading && !showHoverVideo}
							<div class="video-loading-indicator">
								<div class="spinner-small"></div>
							</div>
						{/if}
					</div>
					<!-- Hover video (loaded on hover, shown when ready) -->
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
				<!-- For images: always render, browser handles lazy loading -->
				<Media {src} {type} {fit} {poster} {autoplay} {muted} {loop} controls={false} />
			{/if}
		{:else if placeholder}
			<div class="placeholder">{placeholder}</div>
		{/if}
	</div>

	<!-- Badge (top-left) -->
	{#if badgeContent && showOverlay}
		<div class="badge-container" transition:fly={{ y: -8, duration: 150 }}>
			{@render badgeContent()}
		</div>
	{:else if badge}
		<div class="badge {badgeVariant}">{badge}</div>
	{/if}

	<!-- Actions (top-right, hover) -->
	{#if actions.length > 0 && showOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="actions"
			onclick={(e) => e.stopPropagation()}
			transition:fly={{ y: -8, duration: 150 }}
		>
			<ButtonGroup>
				{#each actions as action}
					<Button icon={action.icon} label={action.label} onclick={action.onclick} />
				{/each}
			</ButtonGroup>
		</div>
	{/if}

	<!-- Bottom overlay -->
	{#if hasBottomContent && showOverlay}
		<div class="bottom-overlay" transition:fly={{ y: 8, duration: 150 }}>
			{#if bottomContent}
				{@render bottomContent()}
			{:else}
				{#if title || subtitle}
					<div class="text-content">
						{#if title}<span class="title">{title}</span>{/if}
						{#if subtitle}<span class="subtitle">{subtitle}</span>{/if}
					</div>
				{/if}
				{#if tags.length > 0}
					<div class="tags">
						{#each tags as tag}
							{#if tag.image}
								<Pill image={tag.image} label={tag.label} size="small" />
							{:else}
								<Pill label={tag.label} color={tag.color} size="small" />
							{/if}
						{/each}
					</div>
				{/if}
			{/if}
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

	.badge-container {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		max-width: calc(100% - 1rem);
	}

	.badge {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 5;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.75);
		color: white;
		backdrop-filter: blur(4px);

		&.success {
			background: rgba(16, 185, 129, 0.9);
		}

		&.warning {
			background: rgba(245, 158, 11, 0.9);
		}
	}

	.actions {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 10;
	}

	.bottom-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.75rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.text-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.title {
		font-weight: 600;
		font-size: 0.875rem;
		color: white;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.subtitle {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
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
