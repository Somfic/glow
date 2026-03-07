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
		background: rgba($primary, 0.15);
		color: $primary;
		border-radius: 4px;
		border: 1px solid rgba($primary, 0.3);
		white-space: nowrap;
	}
</style>
