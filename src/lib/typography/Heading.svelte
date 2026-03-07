<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		level = 2,
		children
	}: {
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		children: Snippet;
	} = $props();
</script>

{#if level === 1}
	<h1>{@render children()}</h1>
{:else if level === 2}
	<h2>{@render children()}</h2>
{:else if level === 3}
	<h3>{@render children()}</h3>
{:else if level === 4}
	<h4>{@render children()}</h4>
{:else if level === 5}
	<h5>{@render children()}</h5>
{:else}
	<h6>{@render children()}</h6>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	h1, h2, h3, h4, h5, h6 {
		font-weight: 700;
		line-height: 1.2;
		margin: 0;
		color: $text-primary;
	}

	h1 {
		font-size: $h1;
	}

	h2 {
		font-size: $h2;
	}

	h3 {
		font-size: $h3;
	}

	h4 {
		font-size: $h4;
	}

	h5 {
		font-size: $h5;
	}

	h6 {
		font-size: $h6;
		color: $text-secondary;
	}
</style>
