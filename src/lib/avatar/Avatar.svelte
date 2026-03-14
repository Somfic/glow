<script lang="ts">
	import { getContext } from 'svelte';
	import { tooltip } from '../tooltip/tooltip.svelte.js';

	type Size = 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		name: string;
		src?: string;
		size?: Size;
		grouped?: boolean;
		onclick?: () => void;
	}

	let {
		name,
		src,
		size: sizeProp,
		grouped = false,
		onclick
	}: Props = $props();

	const groupSize = getContext<Size>('avatar-group-size');
	const size = sizeProp ?? groupSize ?? 'md';

	const sizes: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 64 };

	const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

	function getInitials(name: string): string {
		return name
			.split(/\s+/)
			.map((w) => w[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function hashName(name: string): number {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = (hash << 5) - hash + name.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash);
	}

	const bgColor = $derived(palette[hashName(name) % palette.length]);
	const px = $derived(sizes[size]);
	const initials = $derived(getInitials(name));
	const fontSize = $derived(px * 0.38);

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleError() {
		imageError = true;
		imageLoaded = false;
	}

	$effect(() => {
		void src;
		imageLoaded = false;
		imageError = false;
	});
</script>

<div
	class="avatar"
	class:grouped
	class:clickable={!!onclick}
	style="width: {px}px; height: {px}px; background-color: {!src || imageError ? bgColor : 'transparent'}; font-size: {fontSize}px;"
	use:tooltip={{ content: name, position: 'top', delay: 0, useCursor: false }}
	onclick={onclick}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
>
	{#if src && !imageError}
		<img
			{src}
			alt={name}
			class="avatar-image"
			onload={handleLoad}
			onerror={handleError}
			style:display={imageLoaded ? 'block' : 'none'}
		/>
	{/if}

	{#if !imageLoaded || imageError}
		<span class="avatar-initials">{initials}</span>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: visible;
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		user-select: none;

		transition: transform 0.15s ease;

		&:hover {
			transform: scale(1.15);
			z-index: 10;
		}

		&.clickable {
			cursor: pointer;
		}

		&.grouped {
			box-shadow: 0 0 0 2px $bg-base;
		}
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-initials {
		line-height: 1;
		letter-spacing: 0.02em;
	}
</style>
