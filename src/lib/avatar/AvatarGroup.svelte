<script lang="ts">
	import { setContext } from 'svelte';
	import Avatar from './Avatar.svelte';

	type Size = 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		avatars: { name: string; src?: string }[];
		max?: number;
		size?: Size;
	}

	let { avatars, max, size = 'md' }: Props = $props();

	setContext('avatar-group-size', () => size);

	const sizes: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 64 };

	const visible = $derived(max ? avatars.slice(0, max) : avatars);
	const overflow = $derived(max && avatars.length > max ? avatars.length - max : 0);
	const px = $derived(sizes[size]);
	const overlapMargin = $derived(-(px * 0.3));
	const overflowFontSize = $derived(px * 0.32);
</script>

<div class="avatar-group" style="--overlap: {overlapMargin}px; --gap: {px * 0.15}px;">
	{#each visible as avatar, i}
		<div class="avatar-wrapper" style="z-index: {visible.length - i};">
			<Avatar name={avatar.name} src={avatar.src} {size} grouped />
		</div>
	{/each}

	{#if overflow > 0}
		<div
			class="avatar-overflow"
			style="width: {px}px; height: {px}px; font-size: {overflowFontSize}px; z-index: 0;"
		>
			+{overflow}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.avatar-group {
		display: inline-flex;
		align-items: center;
	}

	.avatar-wrapper {
		margin-left: var(--overlap);
		transition: margin-left 0.25s ease;

		&:first-child {
			margin-left: 0;
		}
	}

	.avatar-group:hover .avatar-wrapper {
		margin-left: var(--gap);

		&:first-child {
			margin-left: 0;
		}
	}

	.avatar-overflow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: $bg-surface-element;
		color: $text-secondary;
		font-weight: 600;
		margin-left: var(--overlap);
		box-shadow: 0 0 0 2px $bg-base;
		flex-shrink: 0;
		transition: margin-left 0.25s ease;
	}

	.avatar-group:hover .avatar-overflow {
		margin-left: var(--gap);
	}
</style>
