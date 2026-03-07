<script lang="ts">
	import Icon, { type IconName } from '../icon/Icon.svelte';

	interface BaseProps {
		size?: 'small' | 'medium' | 'large';
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
		label?: string;
		color?: string;
		image?: never;
	}

	type Props = TextProps | ImageProps | IconProps;

	let props: Props = $props();

	let size = $derived(props.size ?? 'medium');
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
	class="pill size-{size}"
	class:image-only={hasImage && !hasLabel}
	class:removable={props.onRemove}
	title={props.label}
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
			<Icon name={props.icon} size={size === 'small' ? 12 : size === 'large' ? 18 : 14} />
		</span>
	{/if}

	{#if hasLabel && (!hasImage || imageError)}
		<span class="pill-label">{props.label}</span>
	{/if}

	{#if props.onRemove}
		<button type="button" class="pill-remove" onclick={handleRemove} aria-label="Remove">
			<Icon name="X" size={size === 'small' ? 10 : size === 'large' ? 14 : 12} />
		</button>
	{/if}
</span>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  background: rgb(32.28295, 29.28295, 46.62705);
  color: #eee;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
}
.size-small {
  padding: 0.2em 0.4em;
  font-size: 0.75rem;
}
.size-medium {
  padding: 0.25em 0.5em;
  font-size: 0.875rem;
}
.size-large {
  padding: 0.35em 0.625em;
  font-size: 1rem;
}
.image-only {
  padding: 0;
  overflow: hidden;
  background: transparent;
}
.image-only.size-small {
  width: 1.5rem;
  height: 1.5rem;
}
.image-only.size-medium {
  width: 2rem;
  height: 2rem;
}
.image-only.size-large {
  width: 2.5rem;
  height: 2.5rem;
}
.pill-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.pill:not(.image-only) .pill-image {
  width: 1.25em;
  height: 1.25em;
  margin-left: -0.125em;
}
.pill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: rgba(238, 238, 238, 0.6);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease, background 0.15s ease;
}
.pill-remove:hover {
  color: #eee;
  background: rgba(238, 238, 238, 0.1);
}
.image-only.removable {
  position: relative;
}
.image-only.removable .pill-remove {
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  opacity: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0 50% 0 50%;
  padding: 0.2em;
}
.image-only.removable:hover .pill-remove {
  opacity: 1;
}
.removable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}</style>
