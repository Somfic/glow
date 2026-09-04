<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<code>
	{@render children()}
</code>

<style lang="scss">
	@use '../style/theme.scss' as *;

	code {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Dank Mono', 'Source Code Pro',
			monospace;
		font-size: 0.875em;
		padding: 0.125rem 0.375rem;
		background: color-mix(in oklab, var(--glow-primary) 15%, transparent);
		color: var(--glow-primary);
		border-radius: 4px;
		border: 1px solid color-mix(in oklab, var(--glow-primary) 30%, transparent);
		white-space: nowrap;
	}
</style>
