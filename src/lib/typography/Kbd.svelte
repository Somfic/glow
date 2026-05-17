<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		size = 'md',
		style,
		class: className,
		children
	}: {
		size?: 'sm' | 'md';
		style?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<kbd class={['kbd', `size-${size}`, className].filter(Boolean).join(' ')} {style}>
	{@render children()}
</kbd>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		background: rgba($fg, 0.08);
		border: 1px solid rgba($fg, 0.15);
		border-radius: 4px;
		color: rgba($fg, 0.7);
		line-height: 1;
		font-weight: $weight-medium;
	}

	.size-sm {
		min-width: 1.25em;
		height: 1.25em;
		padding: 0 0.3em;
		font-size: 0.7rem;
	}

	.size-md {
		min-width: 1.5em;
		height: 1.5em;
		padding: 0 0.4em;
		font-size: 0.8rem;
	}
</style>
