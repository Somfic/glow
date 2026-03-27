<script lang="ts">
	import Icon, { type IconName } from '../icon/Icon.svelte';

	interface BaseProps {
		onRemove?: () => void;
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

	interface IconProps extends BaseProps {
		icon: IconName;
		iconFilled?: boolean;
		label?: string;
		color?: string;
		image?: never;
	}

	type Props = TextProps | ImageProps | IconProps;

	let props: Props = $props();

	let hasImage = $derived('image' in props && props.image);
	let hasIcon = $derived('icon' in props && props.icon);
	let hasLabel = $derived('label' in props && props.label);
	let color = $derived('color' in props ? props.color : undefined);

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

<span
	class="pill"
	class:image-only={hasImage && !hasLabel}
	class:has-image={hasImage}
	class:removable={props.onRemove}
	class:has-color={!!color}
	title={props.label}
	style:--pill-color={color}
>
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
			<Icon name={props.icon} size={14} fill={'iconFilled' in props && props.iconFilled} />
		</span>
	{/if}

	{#if hasLabel}
		<span class="pill-label">{props.label}</span>
	{/if}

	{#if props.onRemove}
		<button type="button" class="pill-remove" onclick={handleRemove} aria-label="Remove">
			<Icon name="X" size={12} />
		</button>
	{/if}
</span>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375em;
		padding: 0.3em 0.75em;
		font-size: 0.8rem;
		background: rgba($fg, 0.06);
		color: rgba($fg, 0.85);
		border: 1px solid rgba($fg, 0.1);
		border-radius: 999px;
		font-weight: 500;
		white-space: nowrap;
		transition: all 0.15s ease;
		letter-spacing: 0.01em;

		&.has-color {
			background: color-mix(in oklch, var(--pill-color) 15%, transparent);
			border-color: color-mix(in oklch, var(--pill-color) 25%, transparent);
			color: color-mix(in oklch, var(--pill-color) 70%, $fg);
		}
	}

	// Image-only pills (circular)
	.image-only {
		padding: 0;
		overflow: hidden;
		background: transparent;
		border: 2px solid rgba($fg, 0.1);
		width: 2.75rem;
		height: 2.75rem;
	}

	.pill-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	// For pills with image + label
	.pill:not(.image-only) .pill-image {
		width: 1.5em;
		height: 1.5em;
		flex-shrink: 0;
	}

	.pill.has-image:not(.image-only) {
		padding-left: 0.2em;
	}

	.pill-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;

		.has-color & {
			opacity: 1;
		}
	}

	.pill-label {
		line-height: 1.2;
	}

	.pill-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 50%;
		color: rgba($fg, 0.4);
		cursor: pointer;
		padding: 0.1em;
		margin-right: -0.2em;
		transition: all 0.15s ease;

		&:hover {
			color: $fg;
			background: rgba($fg, 0.1);
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
		border-color: rgba($fg, 0.2);
	}
</style>
