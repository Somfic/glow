<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<code>
	{@render children()}
</code>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
code {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", "Dank Mono", "Source Code Pro", monospace;
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  background: rgba(139, 109, 237, 0.15);
  color: #8B6DED;
  border-radius: 4px;
  border: 1px solid rgba(139, 109, 237, 0.3);
  white-space: nowrap;
}</style>
