<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import Hls from 'hls.js';
	import Icon from '../icon/Icon.svelte';
	import Spinner from '../spinner/Spinner.svelte';

	// Palette of gradient stops used as the fallback when no src is provided.
	// Deterministic from `alt` so the same playlist/track always gets the same
	// gradient.
	const gradientPalette: [string, string][] = [
		['#8b6ded', '#b794f4'],
		['#06b6d4', '#3b82f6'],
		['#f59e0b', '#ec4899'],
		['#10b981', '#84cc16'],
		['#f43f5e', '#ec4899'],
		['#a78bfa', '#6366f1'],
		['#1e3a8a', '#4338ca'],
		['#831843', '#db2777'],
		['#7c2d12', '#ea580c'],
		['#14532d', '#65a30d']
	];

	function hashString(s: string): number {
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			h = (h << 5) - h + s.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	function gradientFor(seed: string): string {
		const [a, b] = gradientPalette[hashString(seed || 'default') % gradientPalette.length];
		return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
	}

	type MediaType = 'image' | 'video' | 'auto';
	type Fit = 'cover' | 'contain';

	type Layer = {
		src: string;
		type: 'image' | 'video';
		loaded: boolean;
	};

	let {
		src,
		fallback,
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
		active = true,
		startTime = 0,
		onclick,
		onVideoReady,
		onVideoPlaying
	}: {
		src?: string;
		/** Image URL shown beneath the main layers until `src` finishes loading.
		 *  Useful for showing a thumbnail while a video buffers. The crossfade
		 *  to `src` happens automatically once it's ready. */
		fallback?: string;
		type?: MediaType;
		fit?: Fit;
		alt?: string;
		poster?: string;
		autoplay?: boolean;
		muted?: boolean;
		loop?: boolean;
		controls?: boolean;
		playsinline?: boolean;
		/** Defer loading/playing the heavy `src` (and pause the video) until the
		 *  element is on (or near) screen. The lightweight `fallback` still
		 *  renders so the layout stays populated. Default: true. */
		lazy?: boolean;
		/** External priority gate. When false the video is paused and nothing
		 *  loads/plays, regardless of viewport — flip it false to deprioritise
		 *  background media (e.g. a grid behind an open dialog). Default: true. */
		active?: boolean;
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

	// Viewport / priority gating. `inView` is driven by an IntersectionObserver
	// when `lazy`; otherwise it's pinned true. `canLoad` is the single gate that
	// the load/play logic checks — heavy media only loads & plays when the
	// element is near the viewport AND not externally deprioritised.
	let rootEl: HTMLDivElement | undefined = $state();
	let inView = $state(false);
	let loadedSrc = $state<string | undefined>(undefined);
	let prevActiveLayer = 0;
	const canLoad = $derived(inView && active);

	$effect(() => {
		const el = rootEl;
		const useLazy = lazy;
		if (!el) return;
		if (!useLazy || typeof IntersectionObserver === 'undefined') {
			inView = true;
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) inView = entry.isIntersecting;
			},
			{ rootMargin: '300px' }
		);
		io.observe(el);
		return () => io.disconnect();
	});

	// Pause / clear a layer's video and reset it so the element unmounts. Used
	// to tear down the outgoing layer after a crossfade (and on destroy) so a
	// stale video never keeps playing hidden underneath.
	function releaseLayer(layerIndex: 0 | 1) {
		cleanupHls(layerIndex);
		const videoEl = videoEls[layerIndex];
		if (videoEl) {
			try {
				videoEl.pause();
			} catch {
				/* ignore */
			}
			videoEl.removeAttribute('src');
			try {
				videoEl.load();
			} catch {
				/* ignore */
			}
		}
		layers[layerIndex] = { src: '', type: 'image', loaded: false };
	}

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
		loadedSrc = layers[layerIndex].src;
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
		const gateOpen = canLoad;
		if (!currentSrc) return;
		// Hold off all loading until the element is on-screen and not
		// deprioritised. Re-runs automatically when the gate opens.
		if (!gateOpen) return;

		untrack(() => {
			// Already showing this src — nothing to (re)load. Prevents a
			// redundant crossfade when the gate merely toggles off and back on.
			if (currentSrc === loadedSrc) return;
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
							loadedSrc = currentSrc;
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
							loadedSrc = currentSrc;
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

	// Initialize video elements when they bind (only once the gate is open).
	$effect(() => {
		if (!canLoad) return;
		for (const i of [0, 1] as const) {
			if (videoEls[i] && layers[i].type === 'video' && layers[i].src && !layers[i].loaded) {
				initializeVideo(i);
			}
		}
	});

	// Pause/resume in response to the gate: leaving the viewport or being
	// deprioritised pauses the video (kills decode + most network); returning
	// resumes it when autoplay is on.
	$effect(() => {
		const playing = canLoad;
		const wantAutoplay = autoplay;
		const els = videoEls;
		for (const i of [0, 1] as const) {
			const videoEl = els[i];
			if (!videoEl) continue;
			if (!playing) {
				videoEl.pause();
			} else if (wantAutoplay && layers[i].loaded) {
				videoEl.play().catch(() => {});
			}
		}
	});

	// After a crossfade settles, tear down the now-hidden outgoing layer so a
	// stale video can't keep playing underneath the active one.
	$effect(() => {
		const cur = activeLayer;
		untrack(() => {
			if (cur === prevActiveLayer) return;
			const old = prevActiveLayer as 0 | 1;
			prevActiveLayer = cur;
			setTimeout(() => {
				if (activeLayer !== old && layers[old].src) releaseLayer(old);
			}, 450);
		});
	});

	onDestroy(() => {
		releaseLayer(0);
		releaseLayer(1);
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
<div class="media" class:clickable={!!onclick} {onclick} bind:this={rootEl}>
	{#if !src && !fallback}
		<div class="fallback" style:background={gradientFor(alt)}></div>
	{:else if initialLoad && !mediaError && !fallback}
		<div class="placeholder">
			<Spinner size={24} />
		</div>
	{/if}

	{#if fallback}
		<img src={fallback} {alt} class="fallback-layer" style="object-fit: {fit}" />
	{/if}

	{#if mediaError}
		<div class="error" style:background={gradientFor(alt)}>
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
	.error,
	.fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}

	.placeholder {
		background: rgba(0, 0, 0, 0.1);
	}

	.error {
		color: rgba(255, 255, 255, 0.7);
	}

	.fallback {
		z-index: 1;
	}

	.fallback-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 0;
	}

	.layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
		transition: opacity 0.4s ease;
		z-index: 1;

		&.active {
			opacity: 1;
		}
	}
</style>
