<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		level = 2,
		style,
		class: className,
		children
	}: {
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		style?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

{#if level === 1}
	<h1 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h1>
{:else if level === 2}
	<h2 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h2>
{:else if level === 3}
	<h3 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h3>
{:else if level === 4}
	<h4 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h4>
{:else if level === 5}
	<h5 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h5>
{:else}
	<h6 {style} class={['glow-heading', className].filter(Boolean).join(' ')}>{@render children()}</h6>
{/if}

<style lang="scss">
	// The global stylesheet applies prose-style margins to bare h1-h6 (top
	// margin when not first-child, bottom margin to space against following
	// content). Those make sense for markdown/prose blocks, but a `Heading`
	// component used inline in a flex/grid row should never carry them. We
	// reset them on the component itself; consumers can re-apply margin via
	// the `style` / `class` props if they want spacing.
	:global(h1.glow-heading),
	:global(h2.glow-heading),
	:global(h3.glow-heading),
	:global(h4.glow-heading),
	:global(h5.glow-heading),
	:global(h6.glow-heading) {
		margin: 0;
		padding: 0;
		border: none;
	}
</style>
