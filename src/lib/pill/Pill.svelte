<script lang="ts">
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	interface BaseProps {
		onRemove?: () => void;
		variant?: 'filled' | 'outlined';
		/**
		 * Font size of the pill; its height follows. `md` is exactly as tall as an
		 * Input or a md Button, so a pill can sit flush in a row with one. `sm` is
		 * the default because most pills are inline in a table cell, a list row or
		 * a MultiSelect chip, where control height reads as bloat.
		 */
		size?: 'sm' | 'md';
		selected?: boolean;
		href?: string;
		onclick?: (e: MouseEvent) => void;
	}

	interface TextProps extends BaseProps {
		label: string;
		color?: string;
		image?: never;
		icon?: never;
	}

	interface ImageProps extends BaseProps {
		image: string;
		label?: string; // Alt text / tooltip
		color?: never;
		icon?: never;
	}

	interface PillIconProps extends BaseProps {
		icon: IconProp;
		label?: string;
		color?: string;
		image?: never;
	}

	type Props = TextProps | ImageProps | PillIconProps;

	let props: Props = $props();

	let hasImage = $derived('image' in props && props.image);
	let hasIcon = $derived('icon' in props && props.icon);
	let hasLabel = $derived('label' in props && props.label);
	let color = $derived('color' in props ? props.color : undefined);
	let variant = $derived(props.variant ?? 'filled');
	let size = $derived(props.size ?? 'sm');
	// Icons are drawn in px, so they don't ride the `em` scale the rest of the
	// pill is built from and have to be stepped by hand. Both steps run a little
	// ahead of the label — lucide's 2px stroke at 12px reads as a grey smudge
	// next to text this small, and the icon is usually the part being scanned.
	let iconSize = $derived(size === 'md' ? 16 : 14);
	let selected = $derived(props.selected ?? false);

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

	function handleRemove(e: Event) {
		e.stopPropagation();
		props.onRemove?.();
	}
</script>

{#snippet body()}
	{#if hasImage && !imageError}
		<img
			src={props.image}
			alt={props.label ?? ''}
			class="pill-image"
			onload={handleImageLoad}
			onerror={handleImageError}
			style:display={imageLoaded ? 'block' : 'none'}
		/>
	{/if}

	{#if hasIcon && props.icon}
		<span class="pill-icon">
			<Icon {...resolveIcon(props.icon)} size={resolveIcon(props.icon).size ?? iconSize} />
		</span>
	{/if}

	{#if hasLabel}
		<span class="pill-label">{props.label}</span>
	{/if}

	{#if props.onRemove}
		<button type="button" class="pill-remove" onclick={handleRemove} aria-label="Remove">
			<Icon name="X" size={iconSize} />
		</button>
	{/if}
{/snippet}

{#if props.href}
	<a
		class="pill size-{size} variant-{variant} interactive"
		class:image-only={hasImage && !hasLabel}
		class:has-image={hasImage}
		class:removable={props.onRemove}
		class:has-color={!!color}
		class:selected
		href={props.href}
		title={props.label}
		style:--pill-color={color}
	>
		{@render body()}
	</a>
{:else if props.onclick}
	<button
		type="button"
		class="pill size-{size} variant-{variant} interactive"
		class:image-only={hasImage && !hasLabel}
		class:has-image={hasImage}
		class:removable={props.onRemove}
		class:has-color={!!color}
		class:selected
		onclick={props.onclick}
		title={props.label}
		style:--pill-color={color}
	>
		{@render body()}
	</button>
{:else}
	<span
		class="pill size-{size} variant-{variant}"
		class:image-only={hasImage && !hasLabel}
		class:has-image={hasImage}
		class:removable={props.onRemove}
		class:has-color={!!color}
		class:selected
		title={props.label}
		style:--pill-color={color}
	>
		{@render body()}
	</span>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		box-sizing: border-box;
		// The same box every other control is built from (`control-frame`):
		// 1em of line + 0.5em of padding top and bottom + the border. A pill is
		// that box with a capsule radius, which is what lets one sit flush next
		// to an Input or a Button instead of floating in the middle of the row.
		height: calc(2em + 2px);
		padding: 0 0.75em;
		line-height: 1;
		// The same fill an Input or a select trigger uses, so a filled pill reads
		// as the small sibling of the controls around it rather than as a wash of
		// its own weight. An earlier version mixed a flat percentage of --glow-fg,
		// which lands much heavier on the light theme than on the dark one.
		background-color: var(--glow-bg-surface-element);
		color: $text-secondary;
		border: $border;
		border-radius: $radius-full;
		font-weight: $weight-semibold;
		white-space: nowrap;
		transition:
			background-color var(--glow-dur-fast) var(--glow-ease-out),
			border-color var(--glow-dur-fast) var(--glow-ease-out),
			color var(--glow-dur-fast) var(--glow-ease-out);
		letter-spacing: 0.01em;

		&.size-sm {
			font-size: $text-xs;
		}

		&.size-md {
			font-size: $text-base;
		}

		&.has-color {
			background-color: color-mix(in oklch, var(--pill-color) 15%, transparent);
			border-color: color-mix(in oklch, var(--pill-color) 25%, transparent);
			color: color-mix(in oklch, var(--pill-color) 70%, var(--glow-fg));
		}

		&.variant-outlined {
			background-color: $tertiary;

			&.has-color {
				background-color: transparent;
			}
		}

		&.interactive {
			cursor: pointer;
			text-decoration: none;
			font-family: inherit;

			// A state layer rather than a swapped `background`: the wash has to
			// composite over whichever fill is underneath it — the neutral one, a
			// `color` tint, or nothing at all on the outlined variant — and a
			// translucent `background-color` would replace that fill instead.
			// `selected` is excluded because it paints a solid fg-coloured pill,
			// which the layer (mixed for the surface it is nominally on) cannot
			// move; it steps itself, just below.
			&:not(.selected) {
				@include state-layer(var(--glow-bg-surface-element));
			}

			&:hover {
				border-color: var(--glow-border-strong);
			}

			&.has-color:hover {
				border-color: color-mix(in oklch, var(--pill-color) 40%, transparent);
			}

			&:focus-visible {
				outline: none;
				border-color: var(--glow-primary);
				box-shadow: $focus-ring;
			}
		}

		&.selected {
			background-color: var(--glow-fg);
			color: var(--glow-bg-base);
			border-color: var(--glow-fg);

			&.has-color {
				background-color: var(--pill-color);
				border-color: var(--pill-color);
				color: var(--glow-bg-base);
			}

			&.interactive:hover {
				background-color: color-mix(in oklab, var(--glow-fg) 85%, transparent);
				border-color: color-mix(in oklab, var(--glow-fg) 85%, transparent);
			}
		}
	}

	// Image-only pills are the same box squared off into a circle, so a row of
	// avatars lines up with the labelled pills beside them.
	.image-only {
		padding: 0;
		width: calc(2em + 2px);
		overflow: hidden;
		background-color: transparent;
	}

	.pill-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	// For pills with image + label: 1.5em leaves 0.25em of the 2em content box
	// above and below, and the left padding shrinks to match that gap.
	.pill:not(.image-only) .pill-image {
		width: 1.5em;
		height: 1.5em;
		flex-shrink: 0;
	}

	.pill.has-image:not(.image-only) {
		padding-left: 0.25em;
	}

	.pill-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;

		.has-color & {
			opacity: 1;
		}
	}

	// Thicker than lucide's default 2, which thins out against a semibold label
	// at these sizes. A CSS property rather than the attribute because <Icon>
	// deliberately takes no stroke width — it would be one more thing every
	// caller could set inconsistently.
	.pill-icon :global(svg),
	.pill-remove :global(svg) {
		stroke-width: 2.4;
	}

	.pill-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 50%;
		color: $text-muted;
		cursor: pointer;
		padding: 0.15em;
		// Pull back into the pill's own padding so the hit target grows without
		// the pill growing a wider right edge than left.
		margin-right: -0.35em;
		transition:
			background-color var(--glow-dur-fast) var(--glow-ease-out),
			color var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			color: $text-primary;
			background: $tertiary-hover;
		}

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}
	}

	// Removable image-only pills show remove on hover
	.image-only.removable {
		position: relative;

		.pill-remove {
			position: absolute;
			top: 0;
			right: 0;
			margin: 0;
			opacity: 0;
			background: rgba(0, 0, 0, 0.7);
			border-radius: 0 50% 0 50%;
			padding: 0.2em;
			color: white;
		}

		&:hover .pill-remove {
			opacity: 1;
		}
	}

	.removable:hover {
		border-color: var(--glow-border-strong);
	}
</style>
