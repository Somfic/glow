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

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
  color: #eee;
}
h1 {
  font-size: 2.5rem;
}
h2 {
  font-size: 2rem;
}
h3 {
  font-size: 1.75rem;
}
h4 {
  font-size: 1.5rem;
}
h5 {
  font-size: 1.25rem;
}
h6 {
  font-size: 1.125rem;
  color: rgba(238, 238, 238, 0.7);
}</style>
