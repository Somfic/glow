<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import Button, { type ButtonAction } from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';
	import Media from '../media/Media.svelte';

	// Cards auto-derive their elevation by counting how many Card ancestors
	// they have. The top-level card (depth 1) gets a soft drop-shadow and the
	// full border radius; nested cards (depth 2+) flatten and shrink their
	// radius to nest cleanly. No `elevation` prop needed.
	const CARD_DEPTH_KEY = Symbol.for('glow:card-depth');
	const parentDepth = getContext<number>(CARD_DEPTH_KEY) ?? 0;
	const depth = parentDepth + 1;
	setContext(CARD_DEPTH_KEY, depth);

	type MediaConfig = {
		/** Optional. When omitted, `<Media>` renders its deterministic gradient
		 *  fallback seeded from `alt` — handy for placeholders / mock data. */
		src?: string;
		/** Image shown beneath the main media until it finishes loading
		 *  (e.g. a thumbnail behind a video that's still buffering). */
		fallback?: string;
		alt?: string;
		aspectRatio?: string;
		fit?: 'cover' | 'contain';
		/** Optional progress bar (0–1) drawn at the bottom of the media region. */
		progress?: number;
		// Video playback — only used when `src` resolves to a video.
		autoplay?: boolean;
		muted?: boolean;
		loop?: boolean;
		controls?: boolean;
		poster?: string;
		/** Defer loading/playing until on-screen (default true in `<Media>`). */
		lazy?: boolean;
		/** External priority gate — false pauses the video / blocks loading
		 *  (default true). E.g. set false for a grid behind an open dialog. */
		active?: boolean;
	};

	type Props = {
		/** Header title. Renders in the banded header section (or the toggle button when collapsible). */
		title?: string;
		/** Muted secondary line under the title in the header. */
		subtitle?: string;
		/** Body intro text. Used when no children are passed. */
		description?: string;
		href?: string;
		variant?: 'default' | 'primary' | 'secondary';
		disabled?: boolean;
		icon?: IconProp;
		accentColor?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		/** Override the default header layout. When provided, replaces title/icon/actions. */
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		class?: string;

		// Collapsible (formerly the separate <Disclosure>) — when set, the header
		// becomes a clickable chevron+title and the body animates open/closed.
		collapsible?: boolean;
		open?: boolean;
		defaultOpen?: boolean;
		/** Snippet rendered at the right of the header (e.g. a Pill, count, or Spinner). Renders alongside `actions`. */
		headerExtra?: Snippet;
		/** Right-aligned action buttons in the header. Each is spread into a `<Button>`. */
		actions?: ButtonAction[];
		/** Action buttons in the footer (rendered as a ButtonGroup). Used when no `footer` snippet is provided. */
		footerActions?: ButtonAction[];
		/** Highlights the border (e.g. while streaming). */
		active?: boolean;
		onToggle?: (open: boolean) => void;

		// Media (formerly <MediaCard>).
		/** Image / video for the card. Pass a string URL or a config object. */
		media?: string | MediaConfig;
		/**
		 * `inline` (default): media renders as a banner at the top of the body,
		 * with header/title/footer rendered separately around it.
		 * `overlay`: media fills the whole card; the title/actions/corner slots
		 * are layered on top with a fade gradient. Like a movie-poster card.
		 */
		mediaLayout?: 'inline' | 'overlay';
		/** Corner snippets — only used in `mediaLayout="overlay"`. Show on hover by default. */
		topLeft?: Snippet;
		topRight?: Snippet;
		bottomLeft?: Snippet;
		bottomRight?: Snippet;
		/** Keep the corner snippets visible always, not only on hover. Useful for
		 *  the "currently active" tile in a row of selectable cards. */
		persistentSlots?: boolean;

		// State
		/** Show a loading overlay (with spinner) over the body / media. */
		loading?: boolean;
		/** Selectable card pattern — adds a primary outline. Pair with `onclick`. */
		selected?: boolean;
		/** Action-mode click handler. Renders the card as a button when set (and `href` isn't). */
		onclick?: () => void;
		/** Overlay-only: sample the image and cast a directional coloured glow around the card. */
		glow?: boolean;
	};

	let {
		title,
		subtitle,
		description,
		href,
		variant = 'default',
		disabled = false,
		icon,
		accentColor,
		padding = 'md',
		header,
		footer,
		children,
		class: className = '',
		collapsible = false,
		open = $bindable<boolean | undefined>(undefined),
		defaultOpen = true,
		headerExtra,
		actions,
		footerActions,
		active = false,
		onToggle,
		media,
		mediaLayout = 'inline',
		topLeft,
		topRight,
		bottomLeft,
		bottomRight,
		persistentSlots = false,
		loading = false,
		selected = false,
		onclick,
		glow = false
	}: Props = $props();

	const mediaConfig = $derived<MediaConfig | undefined>(
		typeof media === 'string' ? { src: media } : media
	);
	const isOverlay = $derived(!!mediaConfig && mediaLayout === 'overlay');
	const isClickable = $derived(!disabled && (!!href || !!onclick));

	// Sampled edge colours for the optional ambient glow on overlay cards.
	// We grab a thin strip at each of the four edges of the image and average
	// it, then expose the four averages as CSS variables so the shadow stack
	// can throw a directional, image-derived halo around the card.
	let glowTop = $state('');
	let glowRight = $state('');
	let glowBottom = $state('');
	let glowLeft = $state('');
	$effect(() => {
		if (!glow || !isOverlay || !mediaConfig?.src) {
			glowTop = glowRight = glowBottom = glowLeft = '';
			return;
		}
		const src = mediaConfig.src;
		let cancelled = false;
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			if (cancelled) return;
			try {
				const canvas = document.createElement('canvas');
				const W = 48;
				const H = 48;
				canvas.width = W;
				canvas.height = H;
				const ctx = canvas.getContext('2d', { willReadFrequently: true });
				if (!ctx) return;
				ctx.drawImage(img, 0, 0, W, H);

				const avg = (x: number, y: number, w: number, h: number) => {
					const px = ctx.getImageData(x, y, w, h).data;
					let r = 0;
					let g = 0;
					let b = 0;
					const n = px.length / 4;
					for (let i = 0; i < px.length; i += 4) {
						r += px[i];
						g += px[i + 1];
						b += px[i + 2];
					}
					r /= n;
					g /= n;
					b /= n;
					// Push saturation up and pull lightness down so the glow reads as
					// a punchier, deeper version of the edge tone rather than the
					// muddy average pixel value.
					const max = Math.max(r, g, b);
					const min = Math.min(r, g, b);
					const lN = (max + min) / 510;
					let s = 0;
					let hh = 0;
					if (max !== min) {
						const d = max - min;
						s = lN > 0.5 ? d / (510 - max - min) : d / (max + min);
						if (max === r) hh = ((g - b) / d) % 6;
						else if (max === g) hh = (b - r) / d + 2;
						else hh = (r - g) / d + 4;
						hh *= 60;
						if (hh < 0) hh += 360;
					}
					const sB = Math.min(1, s * 1.7 + 0.2);
					const lB = Math.max(0, Math.min(1, lN * 0.65));
					const c = (1 - Math.abs(2 * lB - 1)) * sB;
					const x2 = c * (1 - Math.abs(((hh / 60) % 2) - 1));
					const m = lB - c / 2;
					let r2 = 0;
					let g2 = 0;
					let b2 = 0;
					if (hh < 60) [r2, g2, b2] = [c, x2, 0];
					else if (hh < 120) [r2, g2, b2] = [x2, c, 0];
					else if (hh < 180) [r2, g2, b2] = [0, c, x2];
					else if (hh < 240) [r2, g2, b2] = [0, x2, c];
					else if (hh < 300) [r2, g2, b2] = [x2, 0, c];
					else [r2, g2, b2] = [c, 0, x2];
					return `rgb(${Math.round((r2 + m) * 255)}, ${Math.round((g2 + m) * 255)}, ${Math.round((b2 + m) * 255)})`;
				};

				const strip = Math.max(2, Math.floor(H * 0.2));
				glowTop = avg(0, 0, W, strip);
				glowBottom = avg(0, H - strip, W, strip);
				glowLeft = avg(0, 0, strip, H);
				glowRight = avg(W - strip, 0, strip, H);
			} catch {
				// CORS or readback failure — leave glow off.
			}
		};
		img.src = src;
		return () => {
			cancelled = true;
		};
	});

	// Sample a vibrant accent from the media image and tint the progress bar
	// with it, so the bar always reads as the colour of the artwork it sits on
	// (falls back to the theme primary on CORS/readback failure or a washed-out
	// image). Only runs when a progress bar is actually drawn.
	let progressAccent = $state('');
	$effect(() => {
		const src = mediaConfig?.src;
		const hasProgress = mediaConfig?.progress != null && mediaConfig.progress > 0;
		if (!src || !hasProgress) {
			progressAccent = '';
			return;
		}
		let cancelled = false;
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			if (cancelled) return;
			try {
				const canvas = document.createElement('canvas');
				canvas.width = 32;
				canvas.height = 32;
				const ctx = canvas.getContext('2d', { willReadFrequently: true });
				if (!ctx) return;
				ctx.drawImage(img, 0, 0, 32, 32);
				const data = ctx.getImageData(0, 0, 32, 32).data;
				let vr = 0;
				let vg = 0;
				let vb = 0;
				let vcount = 0;
				for (let i = 0; i < data.length; i += 4) {
					const br = data[i] + data[i + 1] + data[i + 2];
					const max = Math.max(data[i], data[i + 1], data[i + 2]);
					const min = Math.min(data[i], data[i + 1], data[i + 2]);
					const sat = max > 0 ? (max - min) / max : 0;
					if (sat > 0.2 && br > 80 && br < 600) {
						vr += data[i];
						vg += data[i + 1];
						vb += data[i + 2];
						vcount++;
					}
				}
				progressAccent = vcount
					? `rgb(${Math.round(vr / vcount)}, ${Math.round(vg / vcount)}, ${Math.round(vb / vcount)})`
					: '';
			} catch {
				// CORS or readback failure — leave the bar at the theme primary.
			}
		};
		img.src = src;
		return () => {
			cancelled = true;
		};
	});

// A header band renders whenever there's anything to show there: a header
	// snippet, a title, or actions. Collapsible always shows the header (it's
	// the toggle).
	const hasHeader = $derived(
		collapsible || !!header || !!title || (actions && actions.length > 0)
	);

	const accentStyle = $derived(accentColor
		? `--accent-bg: ${accentColor}1a; --accent-border: ${accentColor}4d;`
		: '');

	// Whether the overlay caption strip will actually render — only then do we
	// reserve the extra 22% of vertical space below the image.
	const hasOverlayCaption = $derived(
		!!title || !!subtitle || (!!actions && actions.length > 0)
	);

	// Combined inline style on the card root: accent tokens + sampled bottom
	// colour for the ambient overlay glow + (in overlay mode with caption) an
	// extended aspect ratio so there's room below the image for the caption.
	const overlayCardAspect = $derived.by(() => {
		if (!isOverlay || !mediaConfig?.aspectRatio) return '';
		const parts = mediaConfig.aspectRatio.split('/');
		const w = parseFloat(parts[0]);
		const h = parseFloat(parts[1] ?? '1');
		if (!w || !h) return '';
		const heightMultiplier = hasOverlayCaption ? 1.22 : 1;
		return `aspect-ratio: ${w} / ${(h * heightMultiplier).toFixed(3)}`;
	});

	const glowStyle = $derived(
		glow && (glowTop || glowBottom || glowLeft || glowRight)
			? `--card-glow-top: ${glowTop}; --card-glow-right: ${glowRight}; --card-glow-bottom: ${glowBottom}; --card-glow-left: ${glowLeft}`
			: ''
	);

	const rootStyle = $derived(
		[accentStyle, overlayCardAspect, glowStyle].filter(Boolean).join('; ')
	);

	// Internal open state for the uncontrolled case. Same trick as before:
	// undefined sentinel keeps `defaultOpen` reactive.
	let internalOpen = $state<boolean | undefined>(undefined);
	const isOpen = $derived(open ?? internalOpen ?? defaultOpen);

	function toggle() {
		if (disabled) return;
		const next = !isOpen;
		if (open !== undefined) open = next;
		else internalOpen = next;
		onToggle?.(next);
	}

	// Body height transition (same recipe as Tabs): bind the inner content's
	// offsetHeight, and animate the wrapper between 0 and that value.
	let bodyHeight = $state(0);
</script>

{#snippet defaultHeader()}
	{#if icon}
		<span class="header-icon" aria-hidden="true">
			<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 14} />
		</span>
	{/if}
	{#if title || subtitle}
		<div class="header-title-cluster">
			{#if title}<span class="header-title">{title}</span>{/if}
			{#if subtitle}<span class="header-subtitle">{subtitle}</span>{/if}
		</div>
	{/if}
	<span class="header-spacer"></span>
	{#if headerExtra}<span class="header-extra">{@render headerExtra()}</span>{/if}
	{#if actions && actions.length > 0}
		<span class="header-actions">
			{#each actions as action}
				<Button {...action} />
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet bodyContent()}
	{#if !hasHeader && icon}
		<!-- Icon-led card with no header band: render the icon as a body-leading
		     hero (the home-page feature-card pattern). -->
		<div class="body-icon"><Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 24} /></div>
	{/if}
	{#if children}
		{@render children()}
	{:else if description}
		<div class="description">{description}</div>
	{/if}
{/snippet}

{#snippet mediaContentRow()}
	<!-- Single content row used by both inline and overlay media layouts:
	     title/subtitle cluster on the left, actions on the right. -->
	{#if title || subtitle || icon}
		<div class="media-row-cluster">
			{#if icon}
				<span class="header-icon" aria-hidden="true">
					<Icon {...resolveIcon(icon)} size={resolveIcon(icon).size ?? 14} />
				</span>
			{/if}
			<div class="header-title-cluster">
				{#if title}<span class="header-title">{title}</span>{/if}
				{#if subtitle}<span class="header-subtitle">{subtitle}</span>{/if}
			</div>
		</div>
	{/if}
	{#if actions && actions.length > 0}
		<div class="media-row-actions">
			{#each actions as action}
				<Button {...action} />
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet body()}
	{#if mediaConfig}
		<!-- Media-led layouts: image + a single content row. No banded headers
		     or footers — that pattern is reserved for non-media cards. -->
		<div class="card-media" class:overlay={isOverlay} style:aspect-ratio={mediaConfig.aspectRatio}>
			<Media
				src={mediaConfig.src}
				fallback={mediaConfig.fallback}
				alt={mediaConfig.alt}
				fit={mediaConfig.fit ?? 'cover'}
				autoplay={mediaConfig.autoplay}
				muted={mediaConfig.muted}
				loop={mediaConfig.loop}
				controls={mediaConfig.controls}
				poster={mediaConfig.poster}
				lazy={mediaConfig.lazy}
				active={mediaConfig.active}
			/>
			{#if mediaConfig.progress != null && mediaConfig.progress > 0}
				<div class="media-progress"><div class="media-progress-fill" style:width="{Math.min(mediaConfig.progress, 1) * 100}%" style:--media-progress-color={progressAccent || undefined}></div></div>
			{/if}
		</div>

		{#if isOverlay}
			<!-- Overlay: corner slots float on the image; the content row is
			     positioned at the bottom on top of the image. -->
			{#if topLeft || topRight}<div class="overlay-band top" aria-hidden="true"></div>{/if}
			{#if bottomLeft || bottomRight}<div class="overlay-band bottom" aria-hidden="true"></div>{/if}
			{#if topLeft}<div class="overlay-slot top-left">{@render topLeft()}</div>{/if}
			{#if topRight}<div class="overlay-slot top-right">{@render topRight()}</div>{/if}
			{#if bottomLeft}<div class="overlay-slot bottom-left">{@render bottomLeft()}</div>{/if}
			{#if bottomRight}<div class="overlay-slot bottom-right">{@render bottomRight()}</div>{/if}

			{#if (title || subtitle || (actions && actions.length > 0))}
				<div class="media-row overlay-row">
					{@render mediaContentRow()}
				</div>
			{/if}
		{:else}
			<!-- Inline: content row sits below the image inside the card body. -->
			{#if (title || subtitle || (actions && actions.length > 0)) || children || description}
				<div class="media-row inline-row padding-{padding}">
					{@render mediaContentRow()}
				</div>
			{/if}
			{#if children || description}
				<div class="card-body padding-{padding}">
					{@render bodyContent()}
				</div>
			{/if}
		{/if}
	{:else}
		<!-- Non-media card: classic header / body / footer bands. -->
		{#if hasHeader}
			{#if collapsible}
				<button
					type="button"
					class="card-header collapsible"
					class:open={isOpen}
					aria-expanded={isOpen}
					{disabled}
					onclick={toggle}
				>
					{#if header}
						{@render header()}
					{:else}
						{@render defaultHeader()}
					{/if}
					<span class="chevron" aria-hidden="true">
						<Icon name="ChevronRight" size={14} />
					</span>
				</button>
			{:else}
				<div class="card-header">
					{#if header}
						{@render header()}
					{:else}
						{@render defaultHeader()}
					{/if}
				</div>
			{/if}
		{/if}

		{#if collapsible}
			<div class="collapsible-wrap" style:height="{isOpen ? bodyHeight : 0}px" aria-hidden={!isOpen}>
				<div class="card-body padding-{padding}" bind:offsetHeight={bodyHeight}>
					{@render bodyContent()}
				</div>
			</div>
		{:else}
			<div class="card-body padding-{padding}">
				{@render bodyContent()}
			</div>
		{/if}

		{#if footer}
			<div class="card-footer">{@render footer()}</div>
		{:else if footerActions && footerActions.length > 0}
			<div class="card-footer card-footer--actions">
				<ButtonGroup>
					{#each footerActions as action}
						<Button {...action} />
					{/each}
				</ButtonGroup>
			</div>
		{/if}
	{/if}

	{#if loading}
		<div class="card-loading-overlay" aria-hidden="true">
			<div class="card-loading-spinner"></div>
		</div>
	{/if}
{/snippet}

{#if href && !collapsible}
	<a
		class={['card sectioned', className].filter(Boolean).join(' ')}
		class:disabled
		class:has-accent={!!accentColor}
		class:active
		class:selected
		class:overlay={isOverlay}
		class:persistent-slots={persistentSlots}
		class:glow={glow && isOverlay}
		data-variant={variant}
		data-depth={depth}
		{href}
		aria-disabled={disabled}
		tabindex={disabled ? -1 : 0}
		style={rootStyle}
	>
		{@render body()}
	</a>
{:else if onclick && !collapsible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<button
		type="button"
		class={['card sectioned', className].filter(Boolean).join(' ')}
		class:disabled
		class:has-accent={!!accentColor}
		class:active
		class:selected
		class:overlay={isOverlay}
		class:persistent-slots={persistentSlots}
		class:glow={glow && isOverlay}
		data-variant={variant}
		data-depth={depth}
		{disabled}
		style={rootStyle}
		onclick={onclick}
	>
		{@render body()}
	</button>
{:else}
	<div
		class={['card sectioned', className].filter(Boolean).join(' ')}
		class:disabled
		class:has-accent={!!accentColor}
		class:active
		class:selected
		class:collapsible
		class:overlay={isOverlay}
		class:persistent-slots={persistentSlots}
		class:glow={glow && isOverlay}
		data-variant={variant}
		data-depth={depth}
		style={rootStyle}
	>
		{@render body()}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.card {
		display: block;
		padding: 1.5rem;
		background: var(--glow-bg-surface);
		border: 1px solid var(--glow-border-color);
		// `--card-radius` exposes the resolved corner radius to descendants
		// (e.g. the overlay caption's blur layer, which has to clip itself
		// because backdrop-filter creates its own stacking context that
		// escapes the parent's `overflow: hidden`).
		--card-radius: #{$radius};
		border-radius: var(--card-radius);
		text-decoration: none;
		transition: border-color $dur-fast $ease-out, background $dur-fast $ease-out, box-shadow $dur-fast $ease-out;
		height: 100%;
		// Allow overlay positioning of corner snippets, loading overlay, etc.
		position: relative;

		// Elevation — auto-derived from nesting depth via the context-driven
		// `data-depth` attribute. Top-level cards float with a soft shadow and
		// full radius; nested cards flatten and shrink their radius so the
		// inner card sits cleanly inside the outer.
		&[data-depth='1']:not(.overlay) {
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08);
		}
		&[data-depth='2'] {
			--card-radius: calc(#{$radius} - 3px);
			box-shadow: none;
		}
		&[data-depth='3'] {
			--card-radius: calc(#{$radius} - 6px);
			box-shadow: none;
		}
		&[data-depth='4'],
		&[data-depth='5'],
		&[data-depth='6'] {
			--card-radius: calc(#{$radius} - 8px);
			box-shadow: none;
		}

		&.sectioned {
			padding: 0;
			overflow: hidden;
			display: flex;
			flex-direction: column;

			.card-body {
				flex: 1 1 auto;
				min-height: 0;
			}

			.card-footer {
				flex: 0 0 auto;
			}
		}

		&.has-accent {
			background: var(--accent-bg);
			border-color: var(--accent-border);
		}

		// Active highlight (streaming, focused, etc.) — used by collapsibles.
		&.active {
			border-color: var(--glow-primary);
		}

		// Selected — distinct outline pattern so it can coexist with active.
		&.selected {
			outline: 2px solid var(--glow-primary);
			outline-offset: 2px;
		}

		// Hover/focus styles for any clickable variant (anchor or button).
		&:is(a, button):hover:not(.disabled):not(.has-accent):not(.overlay) {
			border-color: var(--glow-primary);
			background: rgba($primary, 0.05);
		}

&:is(a, button):focus-visible {
			outline: 2px solid $primary;
			outline-offset: 2px;
		}

		// Action-mode button: strip native button defaults so it reads as a card.
		&:is(button) {
			width: 100%;
			text-align: inherit;
			font: inherit;
			color: inherit;
			cursor: pointer;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}

		&:is(a)[data-variant='secondary']:hover:not(.disabled):not(.has-accent) {
			border-color: var(--glow-secondary);
			background: var(--glow-secondary-hover);
		}
	}

	.card-header,
	.card-footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.card-header {
		border-bottom: 1px solid var(--glow-border-color);
	}

	.header-icon {
		display: inline-flex;
		opacity: 0.85;
	}

	.header-title-cluster {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 0;
	}

	.header-title {
		font-weight: $weight-bold;
		color: var(--glow-text-primary);
		line-height: 1.2;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-subtitle {
		font-size: $text-xs;
		color: var(--glow-text-muted);
		font-weight: $weight-medium;
		line-height: 1.2;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-spacer {
		flex: 1 1 auto;
		min-width: 0;
	}

	.header-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.card-footer {
		border-top: 1px solid var(--glow-border-color);

		&--actions {
			justify-content: flex-end;
		}
	}

	// Collapsible header is a button, but visually matches the regular
	// `.card-header` typography — same padding, background tint, font-size and
	// weight. Only the chevron + interactivity differ.
	.card-header.collapsible {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		border-top: 0;
		border-left: 0;
		border-right: 0;
		font-family: inherit;
		font-size: inherit;
		font-weight: $weight-bold;
		color: var(--glow-text-primary);
		cursor: pointer;
		text-align: left;
		transition: color 0.12s ease, background 0.12s ease, border-color 0.2s ease;

		&:hover:not(:disabled) {
			background: var(--glow-fg-soft);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		// Hide the bottom rule when the body is closed — there's no body to
		// separate from, so the rule looks orphaned.
		&:not(.open) {
			border-bottom-color: transparent;
		}
	}

	.chevron {
		display: inline-flex;
		opacity: 0.7;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		.collapsible.open & {
			transform: rotate(90deg);
		}
	}

	.header-icon {
		display: inline-flex;
		opacity: 0.8;
	}


	.header-extra {
		display: inline-flex;
		align-items: center;
	}

	// Animates between 0 and the body's intrinsic height.
	.collapsible-wrap {
		overflow: hidden;
		transition: height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card-body {
		&.padding-none {
			padding: 0;
		}
		&.padding-sm {
			padding: 0.75rem;
		}
		&.padding-md {
			padding: 1.5rem;
		}
		&.padding-lg {
			padding: 2rem;
		}
	}

	.description {
		font-size: $text-sm;
		color: var(--glow-text-secondary);
	}

	.body-icon {
		margin-bottom: 0.5rem;
		display: flex;
		color: var(--glow-fg);
	}

	// ── Media ────────────────────────────────────────────────────────────────
	.card-media {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: var(--glow-bg-base);

		// Default (inline): image fills its slot at the top of the card.
		// Card.sectioned has overflow: hidden + border-radius, so the image
		// inherits the rounded top corners naturally.

		// Overlay: image fills the card. Anchor at the top so any letterboxing
		// from `fit: 'contain'` falls into the caption strip below.
		// `object-fit` defers to the value set inline by <Media> (driven by the
		// `fit` field on `mediaConfig`), defaulting to `cover` when unspecified.
		&.overlay {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;

			:global(img),
			:global(video) {
				object-position: center top;
			}
		}
	}

	// Overlay-mode card sizing — extended aspect ratio so the image fits at
	// the top via object-fit: contain, and the bottom strip below carries
	// the sampled bottom colour and the frosted caption.
	.card.overlay {
		position: relative;
		padding: 0;
	}

	// Optional ambient glow — four directional shadows, each coloured from the
	// matching edge of the image. Gives the card an image-derived halo that
	// reads as light spilling out of the artwork.
	.card.overlay.glow {
		// Shadow goes on the card itself — a pseudo-element inside would be
		// clipped by `overflow: hidden`. `color-mix` fades the saturated
		// sampled colours so the halo reads as subtle ambient spill.
		transition: box-shadow $dur-base $ease-out;
		box-shadow:
			0 -10px 22px -8px color-mix(in srgb, var(--card-glow-top, transparent) 22%, transparent),
			10px 0 22px -8px color-mix(in srgb, var(--card-glow-right, transparent) 22%, transparent),
			0 10px 22px -8px color-mix(in srgb, var(--card-glow-bottom, transparent) 22%, transparent),
			-10px 0 22px -8px color-mix(in srgb, var(--card-glow-left, transparent) 22%, transparent);
	}

	// Media row — title cluster + actions. Used by both inline (sits below
	// the image inside the card body) and overlay (positioned on top of the
	// image at the bottom).
	.media-row {
		display: flex;
		align-items: center;
		gap: $space-md;
	}

	.media-row-cluster {
		display: flex;
		align-items: center;
		gap: $space-sm;
		flex: 1 1 auto;
		min-width: 0;
	}

	.media-row-actions {
		display: inline-flex;
		align-items: center;
		gap: $space-xs;
		flex-shrink: 0;
	}

	.inline-row {
		// Padding scales with the card-padding prop.
		&.padding-none { padding: 0; }
		&.padding-sm   { padding: $space-sm; }
		&.padding-md   { padding: $space-md; }
		&.padding-lg   { padding: $space-lg; }
	}

	.overlay-row {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 3;
		padding: $space-md;
		color: white;
		// Soft text halo so every glyph reads on busy / light areas of the
		// image, no matter how the gradient lands.
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);

		// Frosted-glass strip beneath the caption. Combines a darkening
		// gradient with a backdrop blur so the image content directly under
		// the text is softly defocused.
		// Bottom corners get the card's resolved `--card-radius` because
		// `backdrop-filter` creates its own stacking context that escapes
		// the parent's `overflow: hidden`, so we have to clip ourselves.
		&::before {
			content: '';
			position: absolute;
			inset: -2rem 0 0 0;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, transparent 100%);
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			mask-image: linear-gradient(to top, black 0%, black 70%, transparent 100%);
			-webkit-mask-image: linear-gradient(to top, black 0%, black 70%, transparent 100%);
			border-bottom-left-radius: var(--card-radius, #{$radius});
			border-bottom-right-radius: var(--card-radius, #{$radius});
			pointer-events: none;
			z-index: -1;
		}

		.header-title { color: white; }
		.header-subtitle { color: rgba(255, 255, 255, 0.85); }
		.header-icon { color: white; }
	}

	.overlay-slot {
		position: absolute;
		z-index: 3;
		// Reveal via transform only — never opacity, because an ancestor with
		// opacity < 1 forces an isolated compositing group and the
		// backdrop-filter on frosted children stops sampling the image during
		// the fade. Instead we park each slot outside its corner of the card;
		// `.card.sectioned { overflow: hidden }` clips them away until hover.
		// After the slide-out completes we flip to `visibility: hidden` so the
		// browser can skip painting the frosted children entirely.
		visibility: hidden;
		transition: transform $dur-base $ease-out, visibility 0s linear $dur-base;

		&.top-left  { top: 0.5rem; left: 0.5rem;
			transform: translateY(calc(-100% - 0.5rem));
		}
		&.top-right { top: 0.5rem; right: 0.5rem;
			transform: translateY(calc(-100% - 0.5rem));
		}
		&.bottom-left  { bottom: 0.5rem; left: 0.5rem;
			transform: translateY(calc(100% + 0.5rem));
		}
		&.bottom-right { bottom: 0.5rem; right: 0.5rem;
			transform: translateY(calc(100% + 0.5rem));
		}

		.card.overlay:hover &,
		.card.overlay:focus-within &,
		.card.overlay.persistent-slots & {
			transform: translateY(0);
			visibility: visible;
			transition: transform $dur-base $ease-out, visibility 0s linear 0s;
		}
	}

	// Shared gradient band rendered once per top/bottom row of slots — keeps
	// the darkening identical whether one or both corner slots are present
	// (instead of two pseudo gradients stacking and doubling the alpha).
	.overlay-band {
		position: absolute;
		left: 0;
		right: 0;
		height: 30%;
		z-index: 2;
		pointer-events: none;
		visibility: hidden;
		transition: transform $dur-base $ease-out, visibility 0s linear $dur-base;

		&.top {
			top: 0;
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
			transform: translateY(-100%);
		}
		&.bottom {
			bottom: 0;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
			transform: translateY(100%);
		}

		.card.overlay:hover &,
		.card.overlay:focus-within &,
		.card.overlay.persistent-slots & {
			transform: translateY(0);
			visibility: visible;
			transition: transform $dur-base $ease-out, visibility 0s linear 0s;
		}
	}

	.media-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: rgba(0, 0, 0, 0.3);
		z-index: 4;
	}

	.media-progress-fill {
		height: 100%;
		// `--media-progress-color` lets a consumer tint the bar (e.g. to the
		// sampled accent of the poster); defaults to the theme primary.
		background: var(--media-progress-color, var(--glow-primary));
		transition: width $dur-base $ease-out, background $dur-base $ease-out;
	}

	// ── Loading overlay ──────────────────────────────────────────────────────
	.card-loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		pointer-events: all;
	}

	.card-loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: card-spin 0.8s linear infinite;
	}

	@keyframes card-spin {
		to { transform: rotate(360deg); }
	}
</style>
