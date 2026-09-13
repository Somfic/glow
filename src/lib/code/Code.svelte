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
		// A small Pill's box, down to the type step: 1em of line, 0.5em of
		// padding above and below, plus the border. The size is absolute rather
		// than the `0.875em` this used to scale by, because the two are read
		// side by side — a commit hash next to a pill in the same row — and a
		// relative step made the code taller than the pill in body text and
		// shorter in small text.
		display: inline-flex;
		align-items: center;
		box-sizing: border-box;
		height: calc(2em + 2px);
		line-height: 1;
		font-size: $text-xs;
		padding: 0 0.6em;
		background: color-mix(in oklab, var(--glow-primary) 15%, transparent);
		color: var(--glow-primary);
		border-radius: $radius-xs;
		border: 1px solid color-mix(in oklab, var(--glow-primary) 30%, transparent);
		white-space: nowrap;
	}
</style>
